import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { WaterController } from './water.controller';
import { WaterService } from './water.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [WaterController],
  providers: [WaterService],
})
export class WaterModule {}
