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
import { CreateMeasurementDto } from './dto/create-measurement.dto';
import { ListMeasurementsQueryDto } from './dto/list-measurements-query.dto';
import { UpdateMeasurementDto } from './dto/update-measurement.dto';
import { MeasurementsService } from './measurements.service';

type AuthenticatedRequest = Request & { user: { sub: string } };

@Controller('measurements')
@UseGuards(JwtAuthGuard)
export class MeasurementsController {
  constructor(private readonly measurementsService: MeasurementsService) {}

  @Get()
  async list(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListMeasurementsQueryDto,
  ) {
    const result = await this.measurementsService.listForUser(
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
    @Body() input: CreateMeasurementDto,
  ) {
    return this.successResponse(
      await this.measurementsService.createForUser(request.user.sub, input),
    );
  }

  @Get(':id')
  async get(
    @Req() request: AuthenticatedRequest,
    @Param('id') measurementId: string,
  ) {
    return this.successResponse(
      await this.measurementsService.getForUser(
        request.user.sub,
        measurementId,
      ),
    );
  }

  @Patch(':id')
  async update(
    @Req() request: AuthenticatedRequest,
    @Param('id') measurementId: string,
    @Body() input: UpdateMeasurementDto,
  ) {
    return this.successResponse(
      await this.measurementsService.updateForUser(
        request.user.sub,
        measurementId,
        input,
      ),
    );
  }

  @Delete(':id')
  async delete(
    @Req() request: AuthenticatedRequest,
    @Param('id') measurementId: string,
  ) {
    return this.successResponse(
      await this.measurementsService.deleteForUser(
        request.user.sub,
        measurementId,
      ),
    );
  }

  private successResponse<T>(data: T) {
    return { data, meta: { timestamp: new Date().toISOString() } };
  }
}
