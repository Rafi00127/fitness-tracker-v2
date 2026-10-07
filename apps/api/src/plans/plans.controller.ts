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
import { CreatePlanDto } from './dto/create-plan.dto';
import { CreatePlanItemDto } from './dto/create-plan-item.dto';
import { ListPlanItemsQueryDto } from './dto/list-plan-items-query.dto';
import { ListPlansQueryDto } from './dto/list-plans-query.dto';
import { PlanScheduleQueryDto } from './dto/plan-schedule-query.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { UpdatePlanItemDto } from './dto/update-plan-item.dto';
import { PlansService } from './plans.service';

type AuthenticatedRequest = Request & { user: { sub: string } };

@Controller('plans')
@UseGuards(JwtAuthGuard)
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get('schedule')
  async schedule(
    @Req() request: AuthenticatedRequest,
    @Query() query: PlanScheduleQueryDto,
  ) {
    const result = await this.plansService.scheduleForUser(
      request.user.sub,
      query,
    );
    return this.listResponse(result);
  }

  @Get()
  async list(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListPlansQueryDto,
  ) {
    return this.listResponse(
      await this.plansService.listForUser(request.user.sub, query),
    );
  }

  @Post()
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() input: CreatePlanDto,
  ) {
    return this.successResponse(
      await this.plansService.createForUser(request.user.sub, input),
    );
  }

  @Get(':planId/items')
  async listItems(
    @Req() request: AuthenticatedRequest,
    @Param('planId') planId: string,
    @Query() query: ListPlanItemsQueryDto,
  ) {
    return this.listResponse(
      await this.plansService.listItemsForUser(request.user.sub, planId, query),
    );
  }

  @Post(':planId/items')
  async createItem(
    @Req() request: AuthenticatedRequest,
    @Param('planId') planId: string,
    @Body() input: CreatePlanItemDto,
  ) {
    return this.successResponse(
      await this.plansService.createItemForUser(
        request.user.sub,
        planId,
        input,
      ),
    );
  }

  @Patch(':planId/items/:itemId')
  async updateItem(
    @Req() request: AuthenticatedRequest,
    @Param('planId') planId: string,
    @Param('itemId') itemId: string,
    @Body() input: UpdatePlanItemDto,
  ) {
    return this.successResponse(
      await this.plansService.updateItemForUser(
        request.user.sub,
        planId,
        itemId,
        input,
      ),
    );
  }

  @Delete(':planId/items/:itemId')
  async deleteItem(
    @Req() request: AuthenticatedRequest,
    @Param('planId') planId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.successResponse(
      await this.plansService.deleteItemForUser(
        request.user.sub,
        planId,
        itemId,
      ),
    );
  }

  @Get(':planId')
  async get(
    @Req() request: AuthenticatedRequest,
    @Param('planId') planId: string,
  ) {
    return this.successResponse(
      await this.plansService.getForUser(request.user.sub, planId),
    );
  }

  @Patch(':planId')
  async update(
    @Req() request: AuthenticatedRequest,
    @Param('planId') planId: string,
    @Body() input: UpdatePlanDto,
  ) {
    return this.successResponse(
      await this.plansService.updateForUser(request.user.sub, planId, input),
    );
  }

  @Delete(':planId')
  async delete(
    @Req() request: AuthenticatedRequest,
    @Param('planId') planId: string,
  ) {
    return this.successResponse(
      await this.plansService.deleteForUser(request.user.sub, planId),
    );
  }

  private successResponse<T>(data: T) {
    return { data, meta: { timestamp: new Date().toISOString() } };
  }

  private listResponse<T>(result: {
    items: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }) {
    return {
      data: result.items,
      meta: {
        timestamp: new Date().toISOString(),
        pagination: result.pagination,
      },
    };
  }
}
