import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMeasurementDto } from './dto/create-measurement.dto';
import { ListMeasurementsQueryDto } from './dto/list-measurements-query.dto';
import { UpdateMeasurementDto } from './dto/update-measurement.dto';

const metricFields = [
  'weightKg',
  'waistCm',
  'chestCm',
  'hipCm',
  'bicepsCm',
  'bodyFatPercent',
] as const;

@Injectable()
export class MeasurementsService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(userId: string, query: ListMeasurementsQueryDto) {
    const where = this.buildWhere(userId, query.from, query.to);
    const [items, total] = await Promise.all([
      this.prisma.measurement.findMany({
        where,
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.measurement.count({ where }),
    ]);

    return {
      items: items.map(toMeasurementResponse),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async createForUser(userId: string, input: CreateMeasurementDto) {
    const data = toMeasurementData(input);
    assertHasMetric(data);
    const measurement = await this.prisma.measurement.create({
      data: { ...data, userId, date: parseCalendarDate(input.date) },
    });
    return toMeasurementResponse(measurement);
  }

  async getForUser(userId: string, measurementId: string) {
    const measurement = await this.prisma.measurement.findFirst({
      where: { id: measurementId, userId },
    });
    if (!measurement) {
      throw new NotFoundException('Measurement not found');
    }
    return toMeasurementResponse(measurement);
  }

  async updateForUser(
    userId: string,
    measurementId: string,
    input: UpdateMeasurementDto,
  ) {
    const existing = await this.prisma.measurement.findFirst({
      where: { id: measurementId, userId },
    });
    if (!existing) {
      throw new NotFoundException('Measurement not found');
    }

    const data = toMeasurementData(input);
    const merged = {
      ...Object.fromEntries(
        metricFields.map((field) => [field, existing[field]]),
      ),
      ...data,
    };
    assertHasMetric(merged);

    await this.prisma.measurement.updateMany({
      where: { id: measurementId, userId },
      data: {
        ...data,
        ...(input.date !== undefined && {
          date: parseCalendarDate(input.date),
        }),
      },
    });
    return this.getForUser(userId, measurementId);
  }

  async deleteForUser(userId: string, measurementId: string) {
    const result = await this.prisma.measurement.deleteMany({
      where: { id: measurementId, userId },
    });
    if (result.count === 0) {
      throw new NotFoundException('Measurement not found');
    }
    return { success: true };
  }

  private buildWhere(
    userId: string,
    from?: string,
    to?: string,
  ): Prisma.MeasurementWhereInput {
    if (from && to && from > to) {
      throw new BadRequestException(
        '"from" must be earlier than or equal to "to"',
      );
    }
    return {
      userId,
      ...(from || to
        ? {
            date: {
              ...(from && { gte: parseCalendarDate(from) }),
              ...(to && { lte: parseCalendarDate(to) }),
            },
          }
        : {}),
    };
  }
}

function toMeasurementData(input: CreateMeasurementDto | UpdateMeasurementDto) {
  return {
    ...(input.weightKg !== undefined && { weightKg: input.weightKg }),
    ...(input.waistCm !== undefined && { waistCm: input.waistCm }),
    ...(input.chestCm !== undefined && { chestCm: input.chestCm }),
    ...(input.hipCm !== undefined && { hipCm: input.hipCm }),
    ...(input.bicepsCm !== undefined && { bicepsCm: input.bicepsCm }),
    ...(input.bodyFatPercent !== undefined && {
      bodyFatPercent: input.bodyFatPercent,
    }),
    ...(input.notes !== undefined && { notes: input.notes }),
  };
}

function assertHasMetric(
  values: Record<string, unknown>,
): asserts values is Record<(typeof metricFields)[number], unknown> {
  if (
    !metricFields.some(
      (field) => values[field] !== undefined && values[field] !== null,
    )
  ) {
    throw new BadRequestException(
      'At least one measurement value must be provided',
    );
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

function toMeasurementResponse<
  T extends {
    id: string;
    userId: string;
    date: Date;
    weightKg: Prisma.Decimal | null;
    waistCm: Prisma.Decimal | null;
    chestCm: Prisma.Decimal | null;
    hipCm: Prisma.Decimal | null;
    bicepsCm: Prisma.Decimal | null;
    bodyFatPercent: Prisma.Decimal | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
  },
>(measurement: T) {
  return {
    id: measurement.id,
    date: measurement.date,
    weightKg: decimalToNumber(measurement.weightKg),
    waistCm: decimalToNumber(measurement.waistCm),
    chestCm: decimalToNumber(measurement.chestCm),
    hipCm: decimalToNumber(measurement.hipCm),
    bicepsCm: decimalToNumber(measurement.bicepsCm),
    bodyFatPercent: decimalToNumber(measurement.bodyFatPercent),
    notes: measurement.notes,
    createdAt: measurement.createdAt,
    updatedAt: measurement.updatedAt,
  };
}

function decimalToNumber(value: Prisma.Decimal | null): number | null {
  return value === null ? null : Number(value);
}
