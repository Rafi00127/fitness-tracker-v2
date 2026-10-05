import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { ListExercisesQueryDto } from './dto/list-exercises-query.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { ExercisesService } from './exercises.service';

type AuthenticatedRequest = Request & { user: { sub: string } };

@Controller('exercises')
@UseGuards(JwtAuthGuard)
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  @Get()
  async list(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListExercisesQueryDto,
  ) {
    const result = await this.exercisesService.listForUser(
      request.user.sub,
      query,
    );

    return {
      data: result.items,
      meta: {
        timestamp: new Date().toISOString(),
        pagination: result.pagination,
      },
    };
  }

  @Post()
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() input: CreateExerciseDto,
  ) {
    return this.successResponse(
      await this.exercisesService.createForUser(request.user.sub, input),
    );
  }

  @Get(':id')
  async get(
    @Req() request: AuthenticatedRequest,
    @Param('id') exerciseId: string,
  ) {
    return this.successResponse(
      await this.exercisesService.getForUser(request.user.sub, exerciseId),
    );
  }

  @Patch(':id')
  async update(
    @Req() request: AuthenticatedRequest,
    @Param('id') exerciseId: string,
    @Body() input: UpdateExerciseDto,
  ) {
    return this.successResponse(
      await this.exercisesService.updateForUser(
        request.user.sub,
        exerciseId,
        input,
      ),
    );
  }

  @Delete(':id')
  async delete(
    @Req() request: AuthenticatedRequest,
    @Param('id') exerciseId: string,
  ) {
    return this.successResponse(
      await this.exercisesService.deleteForUser(request.user.sub, exerciseId),
    );
  }

  private successResponse<T>(data: T) {
    return {
      data,
      meta: { timestamp: new Date().toISOString() },
    };
  }
}
