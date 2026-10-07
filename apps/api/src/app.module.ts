import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ExercisesModule } from './exercises/exercises.module';
import { ProfilesModule } from './profiles/profiles.module';
import { PrismaModule } from './prisma/prisma.module';
import { WorkoutsModule } from './workouts/workouts.module';
import { MeasurementsModule } from './measurements/measurements.module';
import { WaterModule } from './water/water.module';
import { GoalsModule } from './goals/goals.module';
import { NutritionModule } from './nutrition/nutrition.module';
import { PlansModule } from './plans/plans.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ProfilesModule,
    DashboardModule,
    ExercisesModule,
    WorkoutsModule,
    WaterModule,
    MeasurementsModule,
    GoalsModule,
    NutritionModule,
    PlansModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
