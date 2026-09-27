import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { AUTH_CONFIGURATION, AuthConfiguration } from './auth.constants';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(AUTH_CONFIGURATION)
    private readonly authConfiguration: AuthConfiguration,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader || typeof authHeader !== 'string') {
      throw new UnauthorizedException('Missing authorization token');
    }

    const [scheme, token, extra] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token || extra) {
      throw new UnauthorizedException('Invalid authorization format');
    }

    let payload: { sub?: unknown; type?: unknown };
    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: this.authConfiguration.accessTokenSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (typeof payload.sub !== 'string' || payload.type !== 'access') {
      throw new UnauthorizedException('Invalid or expired token');
    }

    request.user = { sub: payload.sub };
    return true;
  }
}
