import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Goal, GoalMetric, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { ListGoalProgressQueryDto } from './dto/list-goal-progress-query.dto';
import { ListGoalsQueryDto } from './dto/list-goals-query.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_PROGRESS_DAYS = 365;

@Injectable()
export class GoalsService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(userId: string, query: ListGoalsQueryDto) {
    const where = { userId };
    const [goals, total] = await Promise.all([
      this.prisma.goal.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.goal.count({ where }),
    ]);
    const values = await this.getCurrentValues(userId, goals);

    return {
      items: goals.map((goal) => toGoalResponse(goal, values, new Date())),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async createForUser(userId: string, input: CreateGoalDto) {
    validateTarget(input.metric, input.targetValue);
    const targetDate =
      input.targetDate == null ? null : parseCalendarDate(input.targetDate);
    let startingWeightKg: Prisma.Decimal | null = null;

    if (input.metric === GoalMetric.TARGET_WEIGHT_KG) {
      const baseline = await this.prisma.measurement.findFirst({
        where: { userId, weightKg: { not: null } },
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        select: { weightKg: true },
      });
      if (!baseline?.weightKg) {
        throw new BadRequestException(
          'Record a weight measurement before creating a target-weight goal',
        );
      }
      startingWeightKg = baseline.weightKg;
      if (startingWeightKg.equals(input.targetValue)) {
        throw new BadRequestException(
          'The target weight must differ from the current recorded weight',
        );
      }
    }

    const goal = await this.prisma.goal.create({
      data: {
        userId,
        title: input.title,
        metric: input.metric,
        targetValue: input.targetValue,
        targetDate,
        startingWeightKg,
      },
    });
    const values = await this.getCurrentValues(userId, [goal]);
    return toGoalResponse(goal, values, new Date());
  }

  async getForUser(userId: string, goalId: string) {
    const goal = await this.findOwnedGoal(userId, goalId);
    const values = await this.getCurrentValues(userId, [goal]);
    return toGoalResponse(goal, values, new Date());
  }

  async updateForUser(userId: string, goalId: string, input: UpdateGoalDto) {
    const existing = await this.findOwnedGoal(userId, goalId);
    const targetValue = input.targetValue ?? Number(existing.targetValue);
    validateTarget(existing.metric, targetValue);
    if (
      existing.metric === GoalMetric.TARGET_WEIGHT_KG &&
      existing.startingWeightKg?.equals(targetValue)
    ) {
      throw new BadRequestException(
        'The target weight must differ from the starting recorded weight',
      );
    }

    await this.prisma.goal.updateMany({
      where: { id: goalId, userId },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.targetValue !== undefined && {
          targetValue: input.targetValue,
        }),
        ...(input.targetDate !== undefined && {
          targetDate:
            input.targetDate === null
              ? null
              : parseCalendarDate(input.targetDate),
        }),
      },
    });
    return this.getForUser(userId, goalId);
  }

  async deleteForUser(userId: string, goalId: string) {
    const result = await this.prisma.goal.deleteMany({
      where: { id: goalId, userId },
    });
    if (result.count === 0) {
      throw new NotFoundException('Goal not found');
    }
    return { success: true };
  }

  async progressForUser(userId: string, query: ListGoalProgressQueryDto) {
    const from = parseCalendarDate(query.from);
    const to = parseCalendarDate(query.to);
    if (from > to) {
      throw new BadRequestException(
        '"from" must be earlier than or equal to "to"',
      );
    }
    if (to.getTime() - from.getTime() >= MAX_PROGRESS_DAYS * DAY_MS) {
      throw new BadRequestException('The chart range cannot exceed 365 days');
    }

    const endExclusive = new Date(to.getTime() + DAY_MS);
    const [waterEntries, workouts, measurements] = await Promise.all([
      this.prisma.waterEntry.findMany({
        where: { userId, date: { gte: from, lt: endExclusive } },
        orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
        select: { date: true, amountMl: true },
      }),
      this.prisma.workout.findMany({
        where: { userId, date: { gte: from, lt: endExclusive } },
        orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
        select: { date: true },
      }),
      this.prisma.measurement.findMany({
        where: {
          userId,
          date: { gte: from, lt: endExclusive },
          weightKg: { not: null },
        },
        orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
        select: { date: true, weightKg: true },
      }),
    ]);

    const workoutCounts = new Map<string, number>();
    for (const workout of workouts) {
      const date = workout.date.toISOString().slice(0, 10);
      workoutCounts.set(date, (workoutCounts.get(date) ?? 0) + 1);
    }

    return {
      water: waterEntries.map((entry) => ({
        date: toCalendarDate(entry.date),
        value: entry.amountMl,
      })),
      workouts: [...workoutCounts].map(([date, value]) => ({ date, value })),
      weight: measurements.map((measurement) => ({
        date: toCalendarDate(measurement.date),
        value: decimalToNumber(measurement.weightKg),
      })),
    };
  }

  private async findOwnedGoal(userId: string, goalId: string) {
    const goal = await this.prisma.goal.findFirst({
      where: { id: goalId, userId },
    });
    if (!goal) {
      throw new NotFoundException('Goal not found');
    }
    return goal;
  }

  private async getCurrentValues(userId: string, goals: Goal[]) {
    const metrics = new Set(goals.map((goal) => goal.metric));
    const today = utcMidnight(new Date());
    const weekStart = startOfUtcWeek(today);
    const nextWeek = new Date(weekStart.getTime() + 7 * DAY_MS);
    const [water, workoutCount, measurement] = await Promise.all([
      metrics.has(GoalMetric.DAILY_WATER_ML)
        ? this.prisma.waterEntry.findUnique({
            where: { userId_date: { userId, date: today } },
            select: { amountMl: true },
          })
        : null,
      metrics.has(GoalMetric.WEEKLY_WORKOUTS)
        ? this.prisma.workout.count({
            where: {
              userId,
              date: { gte: weekStart, lt: nextWeek },
            },
          })
        : 0,
      metrics.has(GoalMetric.TARGET_WEIGHT_KG)
        ? this.prisma.measurement.findFirst({
            where: { userId, weightKg: { not: null } },
            orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
            select: { weightKg: true },
          })
        : null,
    ]);

    return {
      [GoalMetric.DAILY_WATER_ML]: water?.amountMl ?? 0,
      [GoalMetric.WEEKLY_WORKOUTS]: workoutCount,
      [GoalMetric.TARGET_WEIGHT_KG]: measurement?.weightKg ?? null,
    };
  }
}

function validateTarget(metric: GoalMetric, target: number): void {
  if (
    metric === GoalMetric.DAILY_WATER_ML &&
    (!Number.isInteger(target) || target > 100000)
  ) {
    throw new BadRequestException(
      'Daily water target must be a whole number from 1 through 100000 ml',
    );
  }
  if (
    metric === GoalMetric.WEEKLY_WORKOUTS &&
    (!Number.isInteger(target) || target > 7)
  ) {
    throw new BadRequestException(
      'Weekly workout target must be a whole number from 1 through 7',
    );
  }
  if (metric === GoalMetric.TARGET_WEIGHT_KG && target > 9999.99) {
    throw new BadRequestException('Target weight must not exceed 9999.99 kg');
  }
}

function toGoalResponse(
  goal: Goal,
  values: Record<GoalMetric, number | Prisma.Decimal | null>,
  now: Date,
) {
  const targetValue = decimalToNumber(goal.targetValue) ?? 0;
  const startingWeightKg = decimalToNumber(goal.startingWeightKg);
  const currentValue =
    goal.metric === GoalMetric.TARGET_WEIGHT_KG
      ? (decimalToNumber(values[goal.metric] as Prisma.Decimal | null) ??
        startingWeightKg)
      : Number(values[goal.metric]);
  let progressPercent: number | null = null;
  let isComplete = false;

  if (currentValue !== null) {
    if (goal.metric === GoalMetric.TARGET_WEIGHT_KG) {
      if (startingWeightKg !== null && startingWeightKg !== targetValue) {
        const delta = startingWeightKg - targetValue;
        progressPercent = ((startingWeightKg - currentValue) / delta) * 100;
        isComplete =
          delta > 0 ? currentValue <= targetValue : currentValue >= targetValue;
      }
    } else {
      progressPercent = (currentValue / targetValue) * 100;
      isComplete = currentValue >= targetValue;
    }
  }

  const today = utcMidnight(now);
  const overdue =
    !isComplete && goal.targetDate !== null && goal.targetDate < today;
  const status = isComplete ? 'COMPLETED' : overdue ? 'OVERDUE' : 'ACTIVE';

  return {
    id: goal.id,
    title: goal.title,
    metric: goal.metric,
    targetValue,
    targetDate: goal.targetDate,
    startingWeightKg,
    currentValue,
    progressPercent:
      progressPercent === null
        ? null
        : Math.round(Math.max(0, Math.min(100, progressPercent)) * 100) / 100,
    status,
    createdAt: goal.createdAt,
    updatedAt: goal.updatedAt,
  };
}

function decimalToNumber(value: Prisma.Decimal | null): number | null {
  return value === null ? null : Number(value);
}

function parseCalendarDate(value: string): Date {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    throw new BadRequestException(
      'Date must be a valid YYYY-MM-DD calendar date',
    );
  }
  return date;
}

function toCalendarDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function utcMidnight(value: Date): Date {
  return new Date(
    Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()),
  );
}

function startOfUtcWeek(value: Date): Date {
  const midnight = utcMidnight(value);
  const daysSinceMonday = (midnight.getUTCDay() + 6) % 7;
  return new Date(midnight.getTime() - daysSinceMonday * DAY_MS);
}
