import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNutritionEntryDto } from './dto/create-nutrition-entry.dto';
import { ListNutritionQueryDto } from './dto/list-nutrition-query.dto';
import { NutritionSummaryQueryDto } from './dto/nutrition-summary-query.dto';
import { UpdateNutritionEntryDto } from './dto/update-nutrition-entry.dto';

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_RANGE_DAYS = 365;

@Injectable()
export class NutritionService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(userId: string, query: ListNutritionQueryDto) {
    validateOptionalRange(query.from, query.to);
    const where: Prisma.NutritionEntryWhereInput = {
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

    const [entries, total] = await Promise.all([
      this.prisma.nutritionEntry.findMany({
        where,
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.nutritionEntry.count({ where }),
    ]);

    return {
      items: entries.map(toNutritionEntryResponse),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async summaryForUser(userId: string, query: NutritionSummaryQueryDto) {
    const { from, to } = validateRange(query.from, query.to);
    const aggregate = await this.prisma.nutritionEntry.aggregate({
      where: { userId, date: { gte: from, lte: to } },
      _count: {
        _all: true,
        caloriesKcal: true,
        proteinGrams: true,
        carbsGrams: true,
        fatsGrams: true,
      },
      _sum: {
        caloriesKcal: true,
        proteinGrams: true,
        carbsGrams: true,
        fatsGrams: true,
      },
    });

    return {
      entryCount: aggregate._count._all,
      caloriesKcal: {
        recordedEntryCount: aggregate._count.caloriesKcal,
        total: aggregate._sum.caloriesKcal ?? 0,
      },
      proteinGrams: {
        recordedEntryCount: aggregate._count.proteinGrams,
        total: decimalToNumber(aggregate._sum.proteinGrams),
      },
      carbsGrams: {
        recordedEntryCount: aggregate._count.carbsGrams,
        total: decimalToNumber(aggregate._sum.carbsGrams),
      },
      fatsGrams: {
        recordedEntryCount: aggregate._count.fatsGrams,
        total: decimalToNumber(aggregate._sum.fatsGrams),
      },
    };
  }

  async createForUser(userId: string, input: CreateNutritionEntryDto) {
    const entry = await this.prisma.nutritionEntry.create({
      data: {
        userId,
        date: parseCalendarDate(input.date),
        description: input.description,
        caloriesKcal: input.caloriesKcal ?? null,
        proteinGrams: input.proteinGrams ?? null,
        carbsGrams: input.carbsGrams ?? null,
        fatsGrams: input.fatsGrams ?? null,
        notes: input.notes ?? null,
      },
    });
    return toNutritionEntryResponse(entry);
  }

  async getForUser(userId: string, entryId: string) {
    const entry = await this.prisma.nutritionEntry.findFirst({
      where: { id: entryId, userId },
    });
    if (!entry) {
      throw new NotFoundException('Nutrition entry not found');
    }
    return toNutritionEntryResponse(entry);
  }

  async updateForUser(
    userId: string,
    entryId: string,
    input: UpdateNutritionEntryDto,
  ) {
    const result = await this.prisma.nutritionEntry.updateMany({
      where: { id: entryId, userId },
      data: {
        ...(input.date !== undefined && {
          date: parseCalendarDate(input.date),
        }),
        ...(input.description !== undefined && {
          description: input.description,
        }),
        ...(input.caloriesKcal !== undefined && {
          caloriesKcal: input.caloriesKcal,
        }),
        ...(input.proteinGrams !== undefined && {
          proteinGrams: input.proteinGrams,
        }),
        ...(input.carbsGrams !== undefined && {
          carbsGrams: input.carbsGrams,
        }),
        ...(input.fatsGrams !== undefined && { fatsGrams: input.fatsGrams }),
        ...(input.notes !== undefined && { notes: input.notes }),
      },
    });
    if (result.count === 0) {
      throw new NotFoundException('Nutrition entry not found');
    }
    return this.getForUser(userId, entryId);
  }

  async deleteForUser(userId: string, entryId: string) {
    const result = await this.prisma.nutritionEntry.deleteMany({
      where: { id: entryId, userId },
    });
    if (result.count === 0) {
      throw new NotFoundException('Nutrition entry not found');
    }
    return { success: true };
  }
}

function validateOptionalRange(fromValue?: string, toValue?: string): void {
  if (!fromValue || !toValue) {
    if (fromValue) parseCalendarDate(fromValue);
    if (toValue) parseCalendarDate(toValue);
    return;
  }
  validateRange(fromValue, toValue);
}

function validateRange(fromValue: string, toValue: string) {
  const from = parseCalendarDate(fromValue);
  const to = parseCalendarDate(toValue);
  if (from > to) {
    throw new BadRequestException(
      '"from" must be earlier than or equal to "to"',
    );
  }
  if (to.getTime() - from.getTime() >= MAX_RANGE_DAYS * DAY_MS) {
    throw new BadRequestException(
      'The nutrition date range cannot exceed 365 days',
    );
  }
  return { from, to };
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

function decimalToNumber(value: Prisma.Decimal | null): number {
  return value === null ? 0 : Number(value);
}

function toNutritionEntryResponse(entry: {
  id: string;
  date: Date;
  description: string;
  caloriesKcal: number | null;
  proteinGrams: Prisma.Decimal | null;
  carbsGrams: Prisma.Decimal | null;
  fatsGrams: Prisma.Decimal | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: entry.id,
    date: entry.date,
    description: entry.description,
    caloriesKcal: entry.caloriesKcal,
    proteinGrams: nullableDecimalToNumber(entry.proteinGrams),
    carbsGrams: nullableDecimalToNumber(entry.carbsGrams),
    fatsGrams: nullableDecimalToNumber(entry.fatsGrams),
    notes: entry.notes,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };
}

function nullableDecimalToNumber(value: Prisma.Decimal | null): number | null {
  return value === null ? null : Number(value);
}
