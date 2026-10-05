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
import { CreateWorkoutDto } from './dto/create-workout.dto';
import { ListWorkoutsQueryDto } from './dto/list-workouts-query.dto';
import { UpdateWorkoutDto } from './dto/update-workout.dto';
import { WorkoutsService } from './workouts.service';

type AuthenticatedRequest = Request & { user: { sub: string } };

@Controller('workouts')
@UseGuards(JwtAuthGuard)
export class WorkoutsController {
  constructor(private readonly workoutsService: WorkoutsService) {}

  @Get()
  async list(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListWorkoutsQueryDto,
  ) {
    const result = await this.workoutsService.listForUser(
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
    @Body() input: CreateWorkoutDto,
  ) {
    return this.successResponse(
      await this.workoutsService.createForUser(request.user.sub, input),
    );
  }

  @Get(':id')
  async get(
    @Req() request: AuthenticatedRequest,
    @Param('id') workoutId: string,
  ) {
    return this.successResponse(
      await this.workoutsService.getForUser(request.user.sub, workoutId),
    );
  }

  @Patch(':id')
  async update(
    @Req() request: AuthenticatedRequest,
    @Param('id') workoutId: string,
    @Body() input: UpdateWorkoutDto,
  ) {
    return this.successResponse(
      await this.workoutsService.updateForUser(
        request.user.sub,
        workoutId,
        input,
      ),
    );
  }

  @Delete(':id')
  async delete(
    @Req() request: AuthenticatedRequest,
    @Param('id') workoutId: string,
  ) {
    return this.successResponse(
      await this.workoutsService.deleteForUser(request.user.sub, workoutId),
    );
  }

  private successResponse<T>(data: T) {
    return {
      data,
      meta: { timestamp: new Date().toISOString() },
    };
  }
}
