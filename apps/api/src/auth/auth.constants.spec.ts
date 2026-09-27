import { loadAuthConfiguration } from './auth.constants';

describe('loadAuthConfiguration', () => {
  it('requires strong, distinct access and refresh secrets', () => {
    expect(() =>
      loadAuthConfiguration({
        JWT_SECRET: 'replace-with-a-long-example-secret',
        REFRESH_TOKEN_SECRET: 'a-different-long-example-secret',
      }),
    ).toThrow(/at least 32/);

    expect(() =>
      loadAuthConfiguration({
        JWT_SECRET: 'same-secret-that-is-long-enough-to-pass-validation',
        REFRESH_TOKEN_SECRET: 'same-secret-that-is-long-enough-to-pass-validation',
      }),
    ).toThrow(/must be different/);
  });

  it('returns valid configured secrets', () => {
    expect(
      loadAuthConfiguration({
        JWT_SECRET: 'access-secret-with-more-than-32-characters',
        REFRESH_TOKEN_SECRET: 'refresh-secret-with-more-than-32-characters',
      }),
    ).toEqual({
      accessTokenSecret: 'access-secret-with-more-than-32-characters',
      refreshTokenSecret: 'refresh-secret-with-more-than-32-characters',
    });
  });
});
