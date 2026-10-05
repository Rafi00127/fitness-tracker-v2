import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { ListExercisesQueryDto } from './dto/list-exercises-query.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';

@Injectable()
export class ExercisesService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(userId: string, query: ListExercisesQueryDto) {
    const where: Prisma.ExerciseWhereInput = {
      userId,
      ...(query.q && {
        OR: [
          { name: { contains: query.q, mode: 'insensitive' } },
          { category: { contains: query.q, mode: 'insensitive' } },
        ],
      }),
    };
    const [items, total] = await Promise.all([
      this.prisma.exercise.findMany({
        where,
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.exercise.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async createForUser(userId: string, input: CreateExerciseDto) {
    return this.prisma.exercise.create({
      data: {
        userId,
        name: input.name,
        category: input.category,
        notes: input.notes,
      },
    });
  }

  async getForUser(userId: string, exerciseId: string) {
    const exercise = await this.prisma.exercise.findFirst({
      where: { id: exerciseId, userId },
    });
    if (!exercise) {
      throw new NotFoundException('Exercise not found');
    }

    return exercise;
  }

  async updateForUser(
    userId: string,
    exerciseId: string,
    input: UpdateExerciseDto,
  ) {
    const existing = await this.prisma.exercise.findFirst({
      where: { id: exerciseId, userId },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Exercise not found');
    }

    return this.prisma.exercise.update({
      where: { id: exerciseId },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.category !== undefined && { category: input.category }),
        ...(input.notes !== undefined && { notes: input.notes }),
      },
    });
  }

  async deleteForUser(userId: string, exerciseId: string) {
    try {
      const result = await this.prisma.exercise.deleteMany({
        where: { id: exerciseId, userId },
      });
      if (result.count === 0) {
        throw new NotFoundException('Exercise not found');
      }
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new ConflictException(
            'Exercise is used by a workout and cannot be deleted',
          );
        }
      }

      throw error;
    }

    return { success: true };
  }
}
