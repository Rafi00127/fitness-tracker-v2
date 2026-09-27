export const AUTH_CONFIGURATION = Symbol('AUTH_CONFIGURATION');
export const ACCESS_TOKEN_TTL = '15m';
export const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;
export const REFRESH_TOKEN_COOKIE = 'refresh_token';

export interface AuthConfiguration {
  accessTokenSecret: string;
  refreshTokenSecret: string;
}

export function loadAuthConfiguration(
  environment: NodeJS.ProcessEnv = process.env,
): AuthConfiguration {
  const accessTokenSecret = environment.JWT_SECRET;
  const refreshTokenSecret = environment.REFRESH_TOKEN_SECRET;

  if (!isStrongSecret(accessTokenSecret) || !isStrongSecret(refreshTokenSecret)) {
    throw new Error(
      'JWT_SECRET and REFRESH_TOKEN_SECRET must each contain at least 32 UTF-8 bytes and must not use placeholder values.',
    );
  }

  if (accessTokenSecret === refreshTokenSecret) {
    throw new Error('JWT_SECRET and REFRESH_TOKEN_SECRET must be different.');
  }

  return { accessTokenSecret, refreshTokenSecret };
}

function isStrongSecret(secret: string | undefined): secret is string {
  return (
    secret !== undefined &&
    Buffer.byteLength(secret, 'utf8') >= 32 &&
    !/(replace[-_ ]?me|change[-_ ]?me|example|your[-_ ]|placeholder)/i.test(
      secret,
    )
  );
}
