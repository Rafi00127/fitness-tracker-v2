import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  const authConfiguration = {
    accessTokenSecret: 'access-secret-with-more-than-32-characters',
    refreshTokenSecret: 'refresh-secret-with-more-than-32-characters',
  };
  let jwtService: Pick<JwtService, 'verifyAsync'>;
  let guard: JwtAuthGuard;

  beforeEach(() => {
    jwtService = { verifyAsync: jest.fn() } as Pick<JwtService, 'verifyAsync'>;
    guard = new JwtAuthGuard(jwtService as JwtService, authConfiguration);
  });

  it('rejects requests without a bearer token', async () => {
    const context = createContext(undefined);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects refresh tokens used as access tokens', async () => {
    jest
      .mocked(jwtService.verifyAsync)
      .mockResolvedValue({ sub: 'user-1', type: 'refresh' } as never);
    const context = createContext('Bearer signed-token');

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('accepts access tokens and attaches the authenticated user', async () => {
    jest
      .mocked(jwtService.verifyAsync)
      .mockResolvedValue({ sub: 'user-1', type: 'access' } as never);
    const request: { headers: { authorization: string }; user?: unknown } = {
      headers: { authorization: 'Bearer signed-token' },
    };
    const context = createContext(request.headers.authorization, request);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toEqual({ sub: 'user-1' });
  });
});

function createContext(
  authorization: string | undefined,
  request: { headers: { authorization?: string }; user?: unknown } = {
    headers: {},
  },
): ExecutionContext {
  if (authorization) {
    request.headers.authorization = authorization;
  }

  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as ExecutionContext;
}
