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
import { CreateWaterEntryDto } from './dto/create-water-entry.dto';
import { ListWaterQueryDto } from './dto/list-water-query.dto';
import { UpdateWaterEntryDto } from './dto/update-water-entry.dto';
import { WaterService } from './water.service';

type AuthenticatedRequest = Request & { user: { sub: string } };

@Controller('water')
@UseGuards(JwtAuthGuard)
export class WaterController {
  constructor(private readonly waterService: WaterService) {}

  @Get()
  async list(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListWaterQueryDto,
  ) {
    const result = await this.waterService.listForUser(request.user.sub, query);
    return {
      data: result.items,
      meta: {
        timestamp: new Date().toISOString(),
        pagination: result.pagination,
        summary: { totalMl: result.totalMl },
      },
    };
  }

  @Post()
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() input: CreateWaterEntryDto,
  ) {
    return this.successResponse(
      await this.waterService.createForUser(request.user.sub, input),
    );
  }

  @Get(':id')
  async get(
    @Req() request: AuthenticatedRequest,
    @Param('id') entryId: string,
  ) {
    return this.successResponse(
      await this.waterService.getForUser(request.user.sub, entryId),
    );
  }

  @Patch(':id')
  async update(
    @Req() request: AuthenticatedRequest,
    @Param('id') entryId: string,
    @Body() input: UpdateWaterEntryDto,
  ) {
    return this.successResponse(
      await this.waterService.updateForUser(request.user.sub, entryId, input),
    );
  }

  @Delete(':id')
  async delete(
    @Req() request: AuthenticatedRequest,
    @Param('id') entryId: string,
  ) {
    return this.successResponse(
      await this.waterService.deleteForUser(request.user.sub, entryId),
    );
  }

  private successResponse<T>(data: T) {
    return { data, meta: { timestamp: new Date().toISOString() } };
  }
}
