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
import { CreateGoalDto } from './dto/create-goal.dto';
import { ListGoalProgressQueryDto } from './dto/list-goal-progress-query.dto';
import { ListGoalsQueryDto } from './dto/list-goals-query.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { GoalsService } from './goals.service';

type AuthenticatedRequest = Request & { user: { sub: string } };

@Controller('goals')
@UseGuards(JwtAuthGuard)
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Get()
  async list(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListGoalsQueryDto,
  ) {
    const result = await this.goalsService.listForUser(request.user.sub, query);
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
    @Body() input: CreateGoalDto,
  ) {
    return this.successResponse(
      await this.goalsService.createForUser(request.user.sub, input),
    );
  }

  @Get('progress')
  async progress(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListGoalProgressQueryDto,
  ) {
    return this.successResponse(
      await this.goalsService.progressForUser(request.user.sub, query),
    );
  }

  @Get(':id')
  async get(@Req() request: AuthenticatedRequest, @Param('id') goalId: string) {
    return this.successResponse(
      await this.goalsService.getForUser(request.user.sub, goalId),
    );
  }

  @Patch(':id')
  async update(
    @Req() request: AuthenticatedRequest,
    @Param('id') goalId: string,
    @Body() input: UpdateGoalDto,
  ) {
    return this.successResponse(
      await this.goalsService.updateForUser(request.user.sub, goalId, input),
    );
  }

  @Delete(':id')
  async delete(
    @Req() request: AuthenticatedRequest,
    @Param('id') goalId: string,
  ) {
    return this.successResponse(
      await this.goalsService.deleteForUser(request.user.sub, goalId),
    );
  }

  private successResponse<T>(data: T) {
    return { data, meta: { timestamp: new Date().toISOString() } };
  }
}
