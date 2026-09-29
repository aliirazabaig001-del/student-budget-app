import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  ADMIN,
  CLIENT_HEADER,
  bearer,
  createTestApp,
  createUserAndLogin,
  login,
  loginAdmin,
  refreshCookie,
  type TestContext,
} from './helpers';

describe('Authentication (integration)', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  afterAll(async () => {
    await ctx.app.close();
    await ctx.prisma.$disconnect();
  });

  it('reports health with a working database connection', async () => {
    const res = await ctx.http().get('/api/v1/health').expect(200);
    expect(res.body).toMatchObject({ status: 'ok', database: 'up' });
  });

  it('protects routes by default', async () => {
    const res = await ctx.http().get('/api/v1/users').expect(401);
    expect(res.body).toMatchObject({ statusCode: 401, error: 'Unauthorized' });
    expect(res.body.requestId).toBeTruthy();
    await ctx.http().get('/api/v1/users').set(bearer('not-a-jwt')).expect(401);
  });

  it('stores passwords as Argon2id hashes only', async () => {
    const admin = await ctx.prisma.user.findUniqueOrThrow({ where: { username: ADMIN.username } });
    expect(admin.passwordHash.startsWith('$argon2id$')).toBe(true);
    expect(admin.passwordHash).not.toContain(ADMIN.initialPassword);
  });

  it('rejects wrong credentials with a generic message and audits the attempt', async () => {
    const res = await ctx
      .http()
      .post('/api/v1/auth/login')
      .send({ identifier: ADMIN.username, password: 'wrong-password-1' })
      .expect(401);
    expect(res.body.message).toBe('Invalid email/username or password.');

    const unknown = await ctx
      .http()
      .post('/api/v1/auth/login')
      .send({ identifier: 'nobody', password: 'wrong-password-1' })
      .expect(401);
    expect(unknown.body.message).toBe(res.body.message);

    const failures = await ctx.prisma.auditLog.count({ where: { action: 'auth.login_failed' } });
    expect(failures).toBeGreaterThanOrEqual(2);
  });

  it('validates login input', async () => {
    const res = await ctx.http().post('/api/v1/auth/login').send({ identifier: '' }).expect(400);
    expect(res.body.fieldErrors).toHaveProperty('identifier');
    expect(res.body.fieldErrors).toHaveProperty('password');
  });

  it('forces a password change before anything else, then unlocks the account', async () => {
    const admin = await ctx.prisma.user.findUniqueOrThrow({ where: { username: ADMIN.username } });
    if (admin.mustChangePassword) {
      const first = await login(ctx, ADMIN.email.toUpperCase(), ADMIN.initialPassword);
      expect(first.body.user.mustChangePassword).toBe(true);

      const blocked = await ctx.http().get('/api/v1/users').set(bearer(first.token)).expect(403);
      expect(blocked.body.code).toBe('PASSWORD_CHANGE_REQUIRED');
      await ctx.http().get('/api/v1/auth/me').set(bearer(first.token)).expect(200);
    }

    const { token } = await loginAdmin(ctx);
    const me = await ctx.http().get('/api/v1/auth/me').set(bearer(token)).expect(200);
    expect(me.body.mustChangePassword).toBe(false);
    expect(me.body.roles).toEqual([{ key: 'super_admin', name: 'Super Admin' }]);
    await ctx.http().get('/api/v1/users').set(bearer(token)).expect(200);
  });

  it('rotates refresh tokens and requires the CSRF client header', async () => {
    const { cookie } = await login(ctx, ADMIN.username, ADMIN.password);

    await ctx.http().post('/api/v1/auth/refresh').set('Cookie', cookie).expect(403);

    const refreshed = await ctx
      .http()
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookie)
      .set(CLIENT_HEADER)
      .expect(200);
    const rotated = refreshCookie(refreshed);
    expect(rotated).toBeTruthy();
    expect(rotated).not.toBe(cookie);
    expect(refreshed.headers['set-cookie']?.[0]).toMatch(/HttpOnly/i);
    expect(refreshed.headers['set-cookie']?.[0]).toMatch(/SameSite=Strict/i);
  });

  it('treats reuse of an old refresh token as theft and ends the session', async () => {
    const { cookie } = await login(ctx, ADMIN.username, ADMIN.password);
    const refreshed = await ctx
      .http()
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookie)
      .set(CLIENT_HEADER)
      .expect(200);
    const newCookie = refreshCookie(refreshed);

    // Move the rotation outside the concurrent-tab grace window.
    await ctx.prisma.session.updateMany({
      where: { revokeReason: 'rotated' },
      data: { revokedAt: new Date(Date.now() - 5 * 60_000) },
    });

    await ctx
      .http()
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookie)
      .set(CLIENT_HEADER)
      .expect(401);
    // The legitimate newer token is now dead as well.
    await ctx
      .http()
      .post('/api/v1/auth/refresh')
      .set('Cookie', newCookie)
      .set(CLIENT_HEADER)
      .expect(401);
    // ...and so is the access token issued for that session.
    await ctx.http().get('/api/v1/auth/me').set(bearer(refreshed.body.accessToken)).expect(401);

    expect(
      await ctx.prisma.auditLog.count({ where: { action: 'auth.refresh_reuse_detected' } }),
    ).toBeGreaterThan(0);
  });

  it('logs out: revokes the session, clears the cookie and audits it', async () => {
    const { token, cookie } = await login(ctx, ADMIN.username, ADMIN.password);
    const res = await ctx
      .http()
      .post('/api/v1/auth/logout')
      .set('Cookie', cookie)
      .set(CLIENT_HEADER)
      .expect(204);
    expect(res.headers['set-cookie']?.[0]).toMatch(/sl_refresh=;/);

    await ctx.http().get('/api/v1/auth/me').set(bearer(token)).expect(401);
    await ctx
      .http()
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookie)
      .set(CLIENT_HEADER)
      .expect(401);
    expect(await ctx.prisma.auditLog.count({ where: { action: 'auth.logout' } })).toBeGreaterThan(
      0,
    );
  });

  it('locks an account after repeated failures', async () => {
    const admin = await loginAdmin(ctx);
    const victim = await createUserAndLogin(ctx, admin.token, 'viewer', 'lockout');
    for (let i = 0; i < 5; i += 1) {
      await ctx
        .http()
        .post('/api/v1/auth/login')
        .send({ identifier: victim.username, password: 'wrong-password-1' })
        .expect(401);
    }
    const locked = await ctx
      .http()
      .post('/api/v1/auth/login')
      .send({ identifier: victim.username, password: victim.password })
      .expect(423);
    expect(locked.body.code).toBe('ACCOUNT_LOCKED');
  });

  it('changing the password signs out other sessions', async () => {
    const admin = await loginAdmin(ctx);
    const user = await createUserAndLogin(ctx, admin.token, 'viewer', 'pwchange');
    const other = await login(ctx, user.username, user.password);

    const res = await ctx
      .http()
      .post('/api/v1/auth/change-password')
      .set(bearer(user.token))
      .send({
        currentPassword: user.password,
        newPassword: 'Brand-new-pass-99',
        confirmPassword: 'Brand-new-pass-99',
      })
      .expect(200);

    await ctx.http().get('/api/v1/auth/me').set(bearer(res.body.accessToken)).expect(200);
    await ctx.http().get('/api/v1/auth/me').set(bearer(other.token)).expect(401);
    expect(
      await ctx.prisma.auditLog.count({
        where: { action: 'auth.password_changed', entityId: user.id },
      }),
    ).toBe(1);
  });
});
