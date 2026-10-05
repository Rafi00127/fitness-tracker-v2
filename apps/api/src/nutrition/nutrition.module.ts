import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { NutritionController } from './nutrition.controller';
import { NutritionService } from './nutrition.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [NutritionController],
  providers: [NutritionService],
})
export class NutritionModule {}
