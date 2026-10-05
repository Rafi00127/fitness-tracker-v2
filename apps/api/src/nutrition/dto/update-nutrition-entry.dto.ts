import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  MinLength,
  Min,
} from 'class-validator';
import { CreateNutritionEntryDto } from './create-nutrition-entry.dto';

function transformOptionalNumber(value: unknown): unknown {
  if (value === null || value === '') return null;
  return typeof value === 'string' ? Number(value) : value;
}

export class UpdateNutritionEntryDto implements Partial<CreateNutritionEntryDto> {
  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  description?: string;

  @IsOptional()
  @Transform(({ value }) => transformOptionalNumber(value))
  @IsInt()
  @Min(0)
  @Max(10000)
  caloriesKcal?: number | null;

  @IsOptional()
  @Transform(({ value }) => transformOptionalNumber(value))
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1000)
  proteinGrams?: number | null;

  @IsOptional()
  @Transform(({ value }) => transformOptionalNumber(value))
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1000)
  carbsGrams?: number | null;

  @IsOptional()
  @Transform(({ value }) => transformOptionalNumber(value))
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1000)
  fatsGrams?: number | null;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() || null : value,
  )
  @IsString()
  @MaxLength(1000)
  notes?: string | null;
}
