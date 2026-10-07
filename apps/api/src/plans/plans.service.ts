import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { CreatePlanItemDto } from './dto/create-plan-item.dto';
import { ListPlanItemsQueryDto } from './dto/list-plan-items-query.dto';
import { ListPlansQueryDto } from './dto/list-plans-query.dto';
import { PlanScheduleQueryDto } from './dto/plan-schedule-query.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { UpdatePlanItemDto } from './dto/update-plan-item.dto';

const planItemInclude = {
  workout: {
    select: { id: true, title: true, date: true, durationMinutes: true },
  },
} satisfies Prisma.PlanItemInclude;

const planInclude = {
  items: {
    include: planItemInclude,
    orderBy: [{ scheduledDate: 'asc' }, { createdAt: 'asc' }],
  },
} satisfies Prisma.PlanInclude;

@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(userId: string, query: ListPlansQueryDto) {
    const where: Prisma.PlanWhereInput = { userId };
    const [plans, total] = await Promise.all([
      this.prisma.plan.findMany({
        where,
        include: { _count: { select: { items: true } } },
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.plan.count({ where }),
    ]);

    return {
      items: plans.map((plan) => ({
        id: plan.id,
        name: plan.name,
        description: plan.description,
        startDate: plan.startDate,
        endDate: plan.endDate,
        itemCount: plan._count.items,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,
      })),
      pagination: pagination(query, total),
    };
  }

  async createForUser(userId: string, input: CreatePlanDto) {
    const startDate = parseOptionalDate(input.startDate);
    const endDate = parseOptionalDate(input.endDate);
    validatePlanDates(startDate, endDate);
    const plan = await this.prisma.plan.create({
      data: {
        userId,
        name: input.name,
        description: input.description ?? null,
        startDate,
        endDate,
      },
      include: planInclude,
    });
    return toPlanResponse(plan);
  }

  async getForUser(userId: string, planId: string) {
    const plan = await this.prisma.plan.findFirst({
      where: { id: planId, userId },
      include: planInclude,
    });
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }
    return toPlanResponse(plan);
  }

  async updateForUser(userId: string, planId: string, input: UpdatePlanDto) {
    return this.prisma.$transaction(async (transaction) => {
      const existing = await transaction.plan.findFirst({
        where: { id: planId, userId },
        select: { id: true, startDate: true, endDate: true },
      });
      if (!existing) {
        throw new NotFoundException('Plan not found');
      }

      const startDate =
        input.startDate === undefined
          ? existing.startDate
          : parseOptionalDate(input.startDate);
      const endDate =
        input.endDate === undefined
          ? existing.endDate
          : parseOptionalDate(input.endDate);
      validatePlanDates(startDate, endDate);
      await assertItemsWithinPlanDates(transaction, planId, startDate, endDate);

      const plan = await transaction.plan.update({
        where: { id: planId },
        data: {
          ...(input.name !== undefined && { name: input.name }),
          ...(input.description !== undefined && {
            description: input.description,
          }),
          ...(input.startDate !== undefined && { startDate }),
          ...(input.endDate !== undefined && { endDate }),
        },
        include: planInclude,
      });
      return toPlanResponse(plan);
    });
  }

  async deleteForUser(userId: string, planId: string) {
    const result = await this.prisma.plan.deleteMany({
      where: { id: planId, userId },
    });
    if (result.count === 0) {
      throw new NotFoundException('Plan not found');
    }
    return { success: true };
  }

  async listItemsForUser(
    userId: string,
    planId: string,
    query: ListPlanItemsQueryDto,
  ) {
    await this.assertPlanExists(userId, planId);
    const where: Prisma.PlanItemWhereInput = { planId };
    const [items, total] = await Promise.all([
      this.prisma.planItem.findMany({
        where,
        include: planItemInclude,
        orderBy: [{ scheduledDate: 'asc' }, { createdAt: 'asc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.planItem.count({ where }),
    ]);
    return {
      items: items.map(toPlanItemResponse),
      pagination: pagination(query, total),
    };
  }

  async createItemForUser(
    userId: string,
    planId: string,
    input: CreatePlanItemDto,
  ) {
    const scheduledDate = parseCalendarDate(input.scheduledDate);
    const plan = await this.prisma.plan.findFirst({
      where: { id: planId, userId },
      select: { id: true, startDate: true, endDate: true },
    });
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }
    assertDateWithinPlan(scheduledDate, plan.startDate, plan.endDate);
    const item = await this.prisma.planItem.create({
      data: {
        planId,
        title: input.title,
        scheduledDate,
        notes: input.notes ?? null,
      },
      include: planItemInclude,
    });
    return toPlanItemResponse(item);
  }

  async updateItemForUser(
    userId: string,
    planId: string,
    itemId: string,
    input: UpdatePlanItemDto,
  ) {
    try {
      return await this.prisma.$transaction(async (transaction) => {
        const existing = await transaction.planItem.findFirst({
          where: { id: itemId, planId, plan: { userId } },
          include: { plan: { select: { startDate: true, endDate: true } } },
        });
        if (!existing) {
          throw new NotFoundException('Scheduled session not found');
        }

        const scheduledDate =
          input.scheduledDate === undefined
            ? existing.scheduledDate
            : parseCalendarDate(input.scheduledDate);
        assertDateWithinPlan(
          scheduledDate,
          existing.plan.startDate,
          existing.plan.endDate,
        );

        const workoutId =
          input.workoutId === undefined ? existing.workoutId : input.workoutId;
        if (input.completed === false && workoutId !== null) {
          throw new BadRequestException(
            'Unlink the logged workout before marking this session incomplete',
          );
        }
        if (input.workoutId && input.workoutId !== existing.workoutId) {
          const workout = await transaction.workout.findFirst({
            where: { id: input.workoutId, userId },
            select: { id: true },
          });
          if (!workout) {
            throw new BadRequestException(
              'The linked workout must belong to the authenticated user',
            );
          }
        }

        const completedAt =
          input.completed === false
            ? null
            : (input.completed === true && existing.completedAt === null) ||
                (input.workoutId !== undefined &&
                  input.workoutId !== null &&
                  existing.completedAt === null)
              ? new Date()
              : undefined;

        const item = await transaction.planItem.update({
          where: { id: itemId },
          data: {
            ...(input.title !== undefined && { title: input.title }),
            ...(input.scheduledDate !== undefined && { scheduledDate }),
            ...(input.notes !== undefined && { notes: input.notes }),
            ...(input.workoutId !== undefined && {
              workoutId: input.workoutId,
            }),
            ...(completedAt !== undefined && { completedAt }),
          },
          include: planItemInclude,
        });
        return toPlanItemResponse(item);
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'This logged workout is already linked to a scheduled session',
        );
      }
      throw error;
    }
  }

  async deleteItemForUser(userId: string, planId: string, itemId: string) {
    const result = await this.prisma.planItem.deleteMany({
      where: { id: itemId, planId, plan: { userId } },
    });
    if (result.count === 0) {
      throw new NotFoundException('Scheduled session not found');
    }
    return { success: true };
  }

  async scheduleForUser(userId: string, query: PlanScheduleQueryDto) {
    const today = utcToday();
    const date = query.view === 'upcoming' ? { gte: today } : { lt: today };
    const where: Prisma.PlanItemWhereInput = {
      plan: { userId },
      scheduledDate: date,
    };
    const [items, total] = await Promise.all([
      this.prisma.planItem.findMany({
        where,
        include: {
          ...planItemInclude,
          plan: { select: { id: true, name: true } },
        },
        orderBy:
          query.view === 'upcoming'
            ? [{ scheduledDate: 'asc' }, { createdAt: 'asc' }]
            : [{ scheduledDate: 'desc' }, { createdAt: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.planItem.count({ where }),
    ]);
    return {
      items: items.map((item) => ({
        ...toPlanItemResponse(item),
        plan: item.plan,
      })),
      pagination: pagination(query, total),
    };
  }

  private async assertPlanExists(userId: string, planId: string) {
    const plan = await this.prisma.plan.findFirst({
      where: { id: planId, userId },
      select: { id: true },
    });
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }
  }
}

function pagination(query: { page: number; limit: number }, total: number) {
  return {
    page: query.page,
    limit: query.limit,
    total,
    totalPages: Math.ceil(total / query.limit),
  };
}

function parseOptionalDate(value?: string | null): Date | null {
  return value == null ? null : parseCalendarDate(value);
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

function validatePlanDates(startDate: Date | null, endDate: Date | null) {
  if (startDate && endDate && startDate > endDate) {
    throw new BadRequestException(
      'Plan startDate must be earlier than or equal to endDate',
    );
  }
}

function assertDateWithinPlan(
  date: Date,
  startDate: Date | null,
  endDate: Date | null,
) {
  if ((startDate && date < startDate) || (endDate && date > endDate)) {
    throw new BadRequestException(
      'Scheduled session date must fall within the plan date bounds',
    );
  }
}

async function assertItemsWithinPlanDates(
  transaction: Prisma.TransactionClient,
  planId: string,
  startDate: Date | null,
  endDate: Date | null,
) {
  const outsideBounds: Prisma.PlanItemWhereInput[] = [];
  if (startDate) outsideBounds.push({ scheduledDate: { lt: startDate } });
  if (endDate) outsideBounds.push({ scheduledDate: { gt: endDate } });
  if (
    outsideBounds.length > 0 &&
    (await transaction.planItem.count({
      where: { planId, OR: outsideBounds },
    })) > 0
  ) {
    throw new BadRequestException(
      'Plan date bounds cannot exclude existing scheduled sessions',
    );
  }
}

function utcToday(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

function toPlanResponse<
  T extends Prisma.PlanGetPayload<{ include: typeof planInclude }>,
>(plan: T) {
  return {
    id: plan.id,
    name: plan.name,
    description: plan.description,
    startDate: plan.startDate,
    endDate: plan.endDate,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
    items: plan.items.map(toPlanItemResponse),
  };
}

function toPlanItemResponse<
  T extends Prisma.PlanItemGetPayload<{ include: typeof planItemInclude }>,
>(item: T) {
  return {
    id: item.id,
    planId: item.planId,
    title: item.title,
    scheduledDate: item.scheduledDate,
    notes: item.notes,
    workoutId: item.workoutId,
    completed: item.completedAt !== null,
    completedAt: item.completedAt,
    workout: item.workout,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}
