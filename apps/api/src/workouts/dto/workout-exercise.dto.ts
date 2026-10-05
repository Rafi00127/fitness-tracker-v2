import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class WorkoutExerciseDto {
  @IsString()
  @Length(1, 191)
  exerciseId!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  sets?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  reps?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(99999.99)
  weight?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationSeconds?: number | null;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() || null : value,
  )
  @IsString()
  @MaxLength(1000)
  notes?: string | null;
}
