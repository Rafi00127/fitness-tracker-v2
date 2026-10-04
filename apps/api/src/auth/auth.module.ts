import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthController } from './auth.controller';
import {
  ACCESS_TOKEN_TTL,
  AUTH_CONFIGURATION,
  loadAuthConfiguration,
} from './auth.constants';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      useFactory: () => {
        const configuration = loadAuthConfiguration();
        return {
          secret: configuration.accessTokenSecret,
          signOptions: { expiresIn: ACCESS_TOKEN_TTL },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    {
      provide: AUTH_CONFIGURATION,
      useFactory: loadAuthConfiguration,
    },
    AuthService,
    JwtAuthGuard,
  ],
  exports: [AUTH_CONFIGURATION, JwtModule, JwtAuthGuard, AuthService],
})
export class AuthModule {}
