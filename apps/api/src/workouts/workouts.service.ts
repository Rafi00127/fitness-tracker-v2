import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkoutDto } from './dto/create-workout.dto';
import { ListWorkoutsQueryDto } from './dto/list-workouts-query.dto';
import { UpdateWorkoutDto } from './dto/update-workout.dto';
import { WorkoutExerciseDto } from './dto/workout-exercise.dto';

const workoutInclude = {
  exerciseEntries: {
    include: {
      exercise: { select: { id: true, name: true, category: true } },
    },
    orderBy: { createdAt: 'asc' },
  },
} satisfies Prisma.WorkoutInclude;

@Injectable()
export class WorkoutsService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(userId: string, query: ListWorkoutsQueryDto) {
    const from = query.from ? new Date(query.from) : undefined;
    const to = query.to ? new Date(query.to) : undefined;
    if (from && to && from > to) {
      throw new BadRequestException(
        '"from" must be earlier than or equal to "to"',
      );
    }

    const where: Prisma.WorkoutWhereInput = {
      userId,
      ...(from || to
        ? {
            date: {
              ...(from && { gte: from }),
              ...(to && { lte: to }),
            },
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.workout.findMany({
        where,
        include: workoutInclude,
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.workout.count({ where }),
    ]);

    return {
      items: items.map(toWorkoutResponse),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async createForUser(userId: string, input: CreateWorkoutDto) {
    return this.prisma.$transaction(async (transaction) => {
      await this.assertExercisesBelongToUser(
        transaction,
        userId,
        input.exerciseEntries ?? [],
      );

      const workout = await transaction.workout.create({
        data: {
          userId,
          title: input.title,
          date: new Date(input.date),
          durationMinutes: input.durationMinutes,
          notes: input.notes,
          exerciseEntries: {
            create: (input.exerciseEntries ?? []).map(toEntryCreate),
          },
        },
        include: workoutInclude,
      });

      return toWorkoutResponse(workout);
    });
  }

  async getForUser(userId: string, workoutId: string) {
    const workout = await this.prisma.workout.findFirst({
      where: { id: workoutId, userId },
      include: workoutInclude,
    });
    if (!workout) {
      throw new NotFoundException('Workout not found');
    }

    return toWorkoutResponse(workout);
  }

  async updateForUser(
    userId: string,
    workoutId: string,
    input: UpdateWorkoutDto,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const existing = await transaction.workout.findFirst({
        where: { id: workoutId, userId },
        select: { id: true },
      });
      if (!existing) {
        throw new NotFoundException('Workout not found');
      }

      if (input.exerciseEntries !== undefined) {
        await this.assertExercisesBelongToUser(
          transaction,
          userId,
          input.exerciseEntries,
        );
        await transaction.workoutExercise.deleteMany({
          where: { workoutId },
        });
      }

      const workout = await transaction.workout.update({
        where: { id: workoutId },
        data: {
          ...(input.title !== undefined && { title: input.title }),
          ...(input.date !== undefined && { date: new Date(input.date) }),
          ...(input.durationMinutes !== undefined && {
            durationMinutes: input.durationMinutes,
          }),
          ...(input.notes !== undefined && { notes: input.notes }),
          ...(input.exerciseEntries !== undefined && {
            exerciseEntries: {
              create: input.exerciseEntries.map(toEntryCreate),
            },
          }),
        },
        include: workoutInclude,
      });

      return toWorkoutResponse(workout);
    });
  }

  async deleteForUser(userId: string, workoutId: string) {
    const result = await this.prisma.workout.deleteMany({
      where: { id: workoutId, userId },
    });
    if (result.count === 0) {
      throw new NotFoundException('Workout not found');
    }

    return { success: true };
  }

  private async assertExercisesBelongToUser(
    transaction: Prisma.TransactionClient,
    userId: string,
    entries: WorkoutExerciseDto[],
  ) {
    if (entries.length === 0) {
      return;
    }

    const exerciseIds = entries.map((entry) => entry.exerciseId);
    const exercises = await transaction.exercise.findMany({
      where: { id: { in: exerciseIds }, userId },
      select: { id: true },
    });

    if (exercises.length !== exerciseIds.length) {
      throw new BadRequestException(
        'Every workout exercise must belong to the authenticated user',
      );
    }
  }
}

function toEntryCreate(entry: WorkoutExerciseDto) {
  return {
    exerciseId: entry.exerciseId,
    sets: entry.sets,
    reps: entry.reps,
    weight: entry.weight,
    durationSeconds: entry.durationSeconds,
    notes: entry.notes,
  };
}

function toWorkoutResponse<
  T extends Prisma.WorkoutGetPayload<{ include: typeof workoutInclude }>,
>(workout: T) {
  return {
    id: workout.id,
    title: workout.title,
    date: workout.date,
    durationMinutes: workout.durationMinutes,
    notes: workout.notes,
    createdAt: workout.createdAt,
    updatedAt: workout.updatedAt,
    exerciseEntries: workout.exerciseEntries.map((entry) => ({
      id: entry.id,
      exerciseId: entry.exerciseId,
      exercise: entry.exercise,
      sets: entry.sets,
      reps: entry.reps,
      weight: entry.weight === null ? null : Number(entry.weight),
      durationSeconds: entry.durationSeconds,
      notes: entry.notes,
    })),
  };
}
