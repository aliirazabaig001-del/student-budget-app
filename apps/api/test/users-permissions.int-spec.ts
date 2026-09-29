import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  ADMIN,
  bearer,
  createTestApp,
  createUserAndLogin,
  loginAdmin,
  type TestContext,
} from './helpers';

describe('Users, roles and permissions (integration)', () => {
  let ctx: TestContext;
  let adminToken: string;

  beforeAll(async () => {
    ctx = await createTestApp();
    adminToken = (await loginAdmin(ctx)).token;
  });

  afterAll(async () => {
    await ctx.app.close();
    await ctx.prisma.$disconnect();
  });

  it('seeds the five built-in roles', async () => {
    const res = await ctx.http().get('/api/v1/roles').set(bearer(adminToken)).expect(200);
    expect(res.body.map((r: { key: string }) => r.key)).toEqual([
      'super_admin',
      'school_admin',
      'accountant',
      'operator',
      'viewer',
    ]);
  });

  it('creates a user and records it in the audit log without the password', async () => {
    const user = await createUserAndLogin(ctx, adminToken, 'accountant', 'create');
    const entry = await ctx.prisma.auditLog.findFirstOrThrow({
      where: { action: 'user.created', entityId: user.id },
    });
    expect(entry.newValues).toMatchObject({ username: user.username, roles: ['accountant'] });
    expect(JSON.stringify(entry.newValues)).not.toContain(user.password);
  });

  it('rejects duplicate usernames with a field error', async () => {
    const res = await ctx
      .http()
      .post('/api/v1/users')
      .set(bearer(adminToken))
      .send({
        fullName: 'Duplicate',
        email: 'unique-address@test.local',
        username: ADMIN.username,
        password: 'Valid-pass-2026',
        roleKeys: ['viewer'],
      })
      .expect(409);
    expect(res.body.fieldErrors).toHaveProperty('username');
  });

  it('enforces permissions on the server, not just in the UI', async () => {
    const accountant = await createUserAndLogin(ctx, adminToken, 'accountant', 'perm');
    await ctx.http().get('/api/v1/users').set(bearer(accountant.token)).expect(403);
    await ctx.http().get('/api/v1/settings/school').set(bearer(accountant.token)).expect(200);
    await ctx
      .http()
      .put('/api/v1/settings/school')
      .set(bearer(accountant.token))
      .send({ schoolName: 'Hacked', currency: 'PKR' })
      .expect(403);

    const viewer = await createUserAndLogin(ctx, adminToken, 'viewer', 'perm');
    await ctx.http().get('/api/v1/audit-logs').set(bearer(viewer.token)).expect(403);
    await ctx.http().get('/api/v1/settings/school').set(bearer(viewer.token)).expect(403);
  });

  it('prevents a School Admin from escalating privileges', async () => {
    const schoolAdmin = await createUserAndLogin(ctx, adminToken, 'school_admin', 'escalate');

    // Cannot create a Super Admin...
    await ctx
      .http()
      .post('/api/v1/users')
      .set(bearer(schoolAdmin.token))
      .send({
        fullName: 'Sneaky',
        email: 'sneaky@test.local',
        username: 'sneaky',
        password: 'Valid-pass-2026',
        roleKeys: ['super_admin'],
      })
      .expect(403);

    // ...cannot edit or reset the Super Admin...
    const admin = await ctx.prisma.user.findUniqueOrThrow({ where: { username: ADMIN.username } });
    await ctx
      .http()
      .patch(`/api/v1/users/${admin.id}`)
      .set(bearer(schoolAdmin.token))
      .send({ isActive: false })
      .expect(403);
    await ctx
      .http()
      .post(`/api/v1/users/${admin.id}/reset-password`)
      .set(bearer(schoolAdmin.token))
      .send({ newPassword: 'Takeover-pass-1' })
      .expect(403);

    // ...and cannot change their own roles.
    await ctx
      .http()
      .put(`/api/v1/users/${schoolAdmin.id}/roles`)
      .set(bearer(schoolAdmin.token))
      .send({ roleKeys: ['super_admin'] })
      .expect(400);
  });

  it('applies role changes immediately and audits them', async () => {
    const user = await createUserAndLogin(ctx, adminToken, 'viewer', 'promote');
    await ctx.http().get('/api/v1/settings/school').set(bearer(user.token)).expect(403);

    const res = await ctx
      .http()
      .put(`/api/v1/users/${user.id}/roles`)
      .set(bearer(adminToken))
      .send({ roleKeys: ['accountant'] })
      .expect(200);
    expect(res.body.roles).toEqual([{ key: 'accountant', name: 'Accountant' }]);

    // Same access token, new permissions: nothing is cached in the JWT.
    await ctx.http().get('/api/v1/settings/school').set(bearer(user.token)).expect(200);

    const entry = await ctx.prisma.auditLog.findFirstOrThrow({
      where: { action: 'user.roles_changed', entityId: user.id },
    });
    expect(entry.previousValues).toEqual({ roles: ['viewer'] });
    expect(entry.newValues).toEqual({ roles: ['accountant'] });
  });

  it('deactivating a user ends their sessions immediately', async () => {
    const user = await createUserAndLogin(ctx, adminToken, 'viewer', 'deactivate');
    await ctx.http().get('/api/v1/auth/me').set(bearer(user.token)).expect(200);

    await ctx
      .http()
      .patch(`/api/v1/users/${user.id}`)
      .set(bearer(adminToken))
      .send({ isActive: false })
      .expect(200);

    await ctx.http().get('/api/v1/auth/me').set(bearer(user.token)).expect(401);
    const res = await ctx
      .http()
      .post('/api/v1/auth/login')
      .send({ identifier: user.username, password: user.password })
      .expect(401);
    expect(res.body.message).toMatch(/deactivated/);

    const entry = await ctx.prisma.auditLog.findFirstOrThrow({
      where: { action: 'user.updated', entityId: user.id },
    });
    expect(entry.previousValues).toEqual({ isActive: true });
    expect(entry.newValues).toEqual({ isActive: false });
  });

  it('does not let an admin deactivate themselves', async () => {
    const admin = await ctx.prisma.user.findUniqueOrThrow({ where: { username: ADMIN.username } });
    await ctx
      .http()
      .patch(`/api/v1/users/${admin.id}`)
      .set(bearer(adminToken))
      .send({ isActive: false })
      .expect(400);
  });

  it('lists and searches users with pagination', async () => {
    const res = await ctx
      .http()
      .get('/api/v1/users')
      .query({ search: 'promote', pageSize: 5 })
      .set(bearer(adminToken))
      .expect(200);
    expect(res.body.pageSize).toBe(5);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0]).not.toHaveProperty('passwordHash');
  });

  it('returns 404 for malformed ids', async () => {
    await ctx.http().get('/api/v1/users/not-a-uuid').set(bearer(adminToken)).expect(404);
  });
});
