import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { WorkoutExerciseDto } from './workout-exercise.dto';

export class UpdateWorkoutDto {
  @ValidateIf((_object, value) => value !== undefined)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(1, 120)
  title?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string | null;

  @ValidateIf((_object, value) => value !== undefined)
  @IsArray()
  @ArrayMaxSize(50)
  @ArrayUnique((entry: WorkoutExerciseDto) =>
    entry && typeof entry === 'object' ? entry.exerciseId : entry,
  )
  @ValidateNested({ each: true })
  @Type(() => WorkoutExerciseDto)
  exerciseEntries?: WorkoutExerciseDto[];
}
