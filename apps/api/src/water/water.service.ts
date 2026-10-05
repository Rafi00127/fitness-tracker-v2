import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWaterEntryDto } from './dto/create-water-entry.dto';
import { ListWaterQueryDto } from './dto/list-water-query.dto';
import { UpdateWaterEntryDto } from './dto/update-water-entry.dto';

@Injectable()
export class WaterService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(userId: string, query: ListWaterQueryDto) {
    const where: Prisma.WaterEntryWhereInput = {
      userId,
      ...(query.from || query.to
        ? {
            date: {
              ...(query.from && { gte: parseCalendarDate(query.from) }),
              ...(query.to && { lte: parseCalendarDate(query.to) }),
            },
          }
        : {}),
    };
    if (query.from && query.to && query.from > query.to) {
      throw new BadRequestException(
        '"from" must be earlier than or equal to "to"',
      );
    }

    const [items, total, aggregate] = await Promise.all([
      this.prisma.waterEntry.findMany({
        where,
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.waterEntry.count({ where }),
      this.prisma.waterEntry.aggregate({
        where,
        _sum: { amountMl: true },
      }),
    ]);

    return {
      items: items.map(toWaterEntryResponse),
      totalMl: aggregate._sum.amountMl ?? 0,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async createForUser(userId: string, input: CreateWaterEntryDto) {
    try {
      const entry = await this.prisma.waterEntry.create({
        data: {
          userId,
          date: parseCalendarDate(input.date),
          amountMl: input.amountMl,
          notes: input.notes,
        },
      });
      return toWaterEntryResponse(entry);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'A water entry already exists for this date; update it instead',
        );
      }
      throw error;
    }
  }

  async getForUser(userId: string, entryId: string) {
    const entry = await this.prisma.waterEntry.findFirst({
      where: { id: entryId, userId },
    });
    if (!entry) {
      throw new NotFoundException('Water entry not found');
    }
    return toWaterEntryResponse(entry);
  }

  async updateForUser(
    userId: string,
    entryId: string,
    input: UpdateWaterEntryDto,
  ) {
    try {
      const result = await this.prisma.waterEntry.updateMany({
        where: { id: entryId, userId },
        data: {
          ...(input.date !== undefined && {
            date: parseCalendarDate(input.date),
          }),
          ...(input.amountMl !== undefined && { amountMl: input.amountMl }),
          ...(input.notes !== undefined && { notes: input.notes }),
        },
      });
      if (result.count === 0) {
        throw new NotFoundException('Water entry not found');
      }
      return this.getForUser(userId, entryId);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'A water entry already exists for this date',
        );
      }
      throw error;
    }
  }

  async deleteForUser(userId: string, entryId: string) {
    const result = await this.prisma.waterEntry.deleteMany({
      where: { id: entryId, userId },
    });
    if (result.count === 0) {
      throw new NotFoundException('Water entry not found');
    }
    return { success: true };
  }
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

function toWaterEntryResponse(entry: {
  id: string;
  date: Date;
  amountMl: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: entry.id,
    date: entry.date,
    amountMl: entry.amountMl,
    notes: entry.notes,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };
}
