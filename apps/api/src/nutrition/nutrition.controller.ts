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
import { CreateNutritionEntryDto } from './dto/create-nutrition-entry.dto';
import { ListNutritionQueryDto } from './dto/list-nutrition-query.dto';
import { NutritionSummaryQueryDto } from './dto/nutrition-summary-query.dto';
import { UpdateNutritionEntryDto } from './dto/update-nutrition-entry.dto';
import { NutritionService } from './nutrition.service';

type AuthenticatedRequest = Request & { user: { sub: string } };

@Controller('nutrition')
@UseGuards(JwtAuthGuard)
export class NutritionController {
  constructor(private readonly nutritionService: NutritionService) {}

  @Get()
  async list(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListNutritionQueryDto,
  ) {
    const result = await this.nutritionService.listForUser(
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

  @Get('summary')
  async summary(
    @Req() request: AuthenticatedRequest,
    @Query() query: NutritionSummaryQueryDto,
  ) {
    return this.successResponse(
      await this.nutritionService.summaryForUser(request.user.sub, query),
    );
  }

  @Post()
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() input: CreateNutritionEntryDto,
  ) {
    return this.successResponse(
      await this.nutritionService.createForUser(request.user.sub, input),
    );
  }

  @Get(':id')
  async get(
    @Req() request: AuthenticatedRequest,
    @Param('id') entryId: string,
  ) {
    return this.successResponse(
      await this.nutritionService.getForUser(request.user.sub, entryId),
    );
  }

  @Patch(':id')
  async update(
    @Req() request: AuthenticatedRequest,
    @Param('id') entryId: string,
    @Body() input: UpdateNutritionEntryDto,
  ) {
    return this.successResponse(
      await this.nutritionService.updateForUser(
        request.user.sub,
        entryId,
        input,
      ),
    );
  }

  @Delete(':id')
  async delete(
    @Req() request: AuthenticatedRequest,
    @Param('id') entryId: string,
  ) {
    return this.successResponse(
      await this.nutritionService.deleteForUser(request.user.sub, entryId),
    );
  }

  private successResponse<T>(data: T) {
    return { data, meta: { timestamp: new Date().toISOString() } };
  }
}
