import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { bearer, createTestApp, loginAdmin, type TestContext } from './helpers';

/** A valid 1×1 PNG. */
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGNgYGAAAAAEAAH2FzhVAAAAAElFTkSuQmCC',
  'base64',
);

describe('School settings, logo and audit log (integration)', () => {
  let ctx: TestContext;
  let token: string;

  beforeAll(async () => {
    ctx = await createTestApp();
    token = (await loginAdmin(ctx)).token;
  });

  afterAll(async () => {
    await ctx.app.close();
    await ctx.prisma.$disconnect();
  });

  it('saves school settings and records only the changed fields', async () => {
    const res = await ctx
      .http()
      .put('/api/v1/settings/school')
      .set(bearer(token))
      .send({
        schoolName: 'Iqra Public School',
        campusName: 'Main Campus',
        address: '12 Mall Road, Lahore',
        phone: '042-35123456',
        email: 'Office@Iqra.edu.pk',
        currency: 'PKR',
        academicSession: '2026-2027',
        bankName: 'Meezan Bank',
        accountTitle: 'Iqra Public School',
        accountNumber: '0101-0123456789',
        iban: 'pk36 scbl 0000 0011 2345 6702',
        jazzCash: '0300-1234567',
        easypaisa: '0345 7654321',
      })
      .expect(200);

    expect(res.body).toMatchObject({
      schoolName: 'Iqra Public School',
      email: 'office@iqra.edu.pk',
      iban: 'PK36SCBL0000001123456702',
    });

    const get = await ctx.http().get('/api/v1/settings/school').set(bearer(token)).expect(200);
    expect(get.body.academicSession).toBe('2026-2027');

    await ctx
      .http()
      .put('/api/v1/settings/school')
      .set(bearer(token))
      .send({ ...get.body, phone: '042-99999999' })
      .expect(200);

    const entry = await ctx.prisma.auditLog.findFirstOrThrow({
      where: { action: 'settings.updated' },
      orderBy: { createdAt: 'desc' },
    });
    expect(entry.previousValues).toEqual({ phone: '042-35123456' });
    expect(entry.newValues).toEqual({ phone: '042-99999999' });
    expect(entry.ipAddress).toBeTruthy();
  });

  it('returns field errors for invalid settings', async () => {
    const res = await ctx
      .http()
      .put('/api/v1/settings/school')
      .set(bearer(token))
      .send({ schoolName: '', currency: 'XYZ', iban: 'nope', email: 'bad' })
      .expect(400);
    expect(Object.keys(res.body.fieldErrors)).toEqual(
      expect.arrayContaining(['schoolName', 'currency', 'iban', 'email']),
    );
  });

  it('uploads, serves and removes the logo', async () => {
    const upload = await ctx
      .http()
      .post('/api/v1/settings/school/logo')
      .set(bearer(token))
      .attach('file', PNG, { filename: 'logo.png', contentType: 'image/png' })
      .expect(201);
    expect(upload.body.hasLogo).toBe(true);

    const branding = await ctx.http().get('/api/v1/public/branding').expect(200);
    expect(branding.body).toMatchObject({ schoolName: 'Iqra Public School', hasLogo: true });
    expect(branding.body).not.toHaveProperty('iban');

    const logo = await ctx.http().get('/api/v1/public/branding/logo').expect(200);
    expect(logo.headers['content-type']).toBe('image/png');
    expect(Buffer.compare(logo.body as Buffer, PNG)).toBe(0);

    await ctx.http().delete('/api/v1/settings/school/logo').set(bearer(token)).expect(200);
    await ctx.http().get('/api/v1/public/branding/logo').expect(404);

    const actions = await ctx.prisma.auditLog.findMany({
      where: { action: { in: ['settings.logo_updated', 'settings.logo_removed'] } },
    });
    expect(actions).toHaveLength(2);
  });

  it('rejects files that are not really images, whatever they are called', async () => {
    const res = await ctx
      .http()
      .post('/api/v1/settings/school/logo')
      .set(bearer(token))
      .attach('file', Buffer.from('<svg onload="alert(1)"/>'), {
        filename: 'logo.png',
        contentType: 'image/png',
      })
      .expect(415);
    expect(res.body.message).toMatch(/PNG, JPEG or WebP/);
  });

  it('lists audit entries newest first with actor details', async () => {
    const res = await ctx
      .http()
      .get('/api/v1/audit-logs')
      .query({ pageSize: 50 })
      .set(bearer(token))
      .expect(200);
    expect(res.body.total).toBeGreaterThan(0);
    const [latest] = res.body.items;
    expect(latest.actor).toMatchObject({ username: 'admin' });
    const times = res.body.items.map((i: { createdAt: string }) => i.createdAt);
    expect([...times].sort().reverse()).toEqual(times);

    const filtered = await ctx
      .http()
      .get('/api/v1/audit-logs')
      .query({ action: 'auth.login' })
      .set(bearer(token))
      .expect(200);
    expect(filtered.body.items.every((i: { action: string }) => i.action === 'auth.login')).toBe(
      true,
    );
  });

  it('makes the audit log append-only at the database level', async () => {
    await expect(ctx.prisma.auditLog.deleteMany({})).rejects.toThrow(/append-only/);
    await expect(ctx.prisma.auditLog.updateMany({ data: { action: 'tampered' } })).rejects.toThrow(
      /append-only/,
    );
  });
});
