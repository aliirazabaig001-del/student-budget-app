import { describe, expect, it } from 'vitest';
import {
  ALL_PERMISSION_CODES,
  PERMISSIONS,
  SYSTEM_ROLES,
  SYSTEM_ROLE_KEYS,
  changePasswordSchema,
  createUserSchema,
  hasAllPermissions,
  loginSchema,
  passwordSchema,
  schoolSettingsSchema,
} from './index';

describe('permissions and roles', () => {
  it('has unique permission codes', () => {
    expect(new Set(ALL_PERMISSION_CODES).size).toBe(ALL_PERMISSION_CODES.length);
  });

  it('only references known permissions from roles', () => {
    for (const role of SYSTEM_ROLES) {
      for (const code of role.permissions) {
        expect(ALL_PERMISSION_CODES).toContain(code);
      }
    }
  });

  it('gives Super Admin every permission and withholds system.manage from School Admin', () => {
    const superAdmin = SYSTEM_ROLES.find((r) => r.key === SYSTEM_ROLE_KEYS.SUPER_ADMIN)!;
    const schoolAdmin = SYSTEM_ROLES.find((r) => r.key === SYSTEM_ROLE_KEYS.SCHOOL_ADMIN)!;
    expect([...superAdmin.permissions].sort()).toEqual([...ALL_PERMISSION_CODES].sort());
    expect(schoolAdmin.permissions).not.toContain(PERMISSIONS.SYSTEM_MANAGE);
  });

  it('checks permission subsets', () => {
    expect(hasAllPermissions(['a', 'b'], ['a'])).toBe(true);
    expect(hasAllPermissions(['a'], ['a', 'b'])).toBe(false);
    expect(hasAllPermissions([], [])).toBe(true);
  });
});

describe('auth schemas', () => {
  it('normalises the login identifier', () => {
    expect(loginSchema.parse({ identifier: '  Admin@School.PK ', password: 'x' }).identifier).toBe(
      'admin@school.pk',
    );
  });

  it('enforces the password policy', () => {
    expect(passwordSchema.safeParse('short1').success).toBe(false);
    expect(passwordSchema.safeParse('onlyletterslong').success).toBe(false);
    expect(passwordSchema.safeParse('1234567890').success).toBe(false);
    expect(passwordSchema.safeParse('Secure-pass-2026').success).toBe(true);
  });

  it('requires matching and different passwords when changing', () => {
    const mismatch = changePasswordSchema.safeParse({
      currentPassword: 'OldPassword1',
      newPassword: 'NewPassword22',
      confirmPassword: 'Different22',
    });
    expect(mismatch.success).toBe(false);

    const same = changePasswordSchema.safeParse({
      currentPassword: 'SamePassword1',
      newPassword: 'SamePassword1',
      confirmPassword: 'SamePassword1',
    });
    expect(same.success).toBe(false);
  });
});

describe('user schemas', () => {
  it('lowercases usernames and de-duplicates roles', () => {
    const parsed = createUserSchema.parse({
      fullName: 'Ayesha Khan',
      email: 'Ayesha@Example.com',
      username: 'Ayesha.K',
      password: 'Welcome-2026',
      roleKeys: ['accountant', 'accountant'],
    });
    expect(parsed.username).toBe('ayesha.k');
    expect(parsed.email).toBe('ayesha@example.com');
    expect(parsed.roleKeys).toEqual(['accountant']);
    expect(parsed.mustChangePassword).toBe(true);
  });
});

describe('school settings schema', () => {
  const base = { schoolName: 'Iqra Public School', currency: 'PKR' };

  it('converts blank optional fields to null', () => {
    const parsed = schoolSettingsSchema.parse({ ...base, campusName: '   ', email: '' });
    expect(parsed.campusName).toBeNull();
    expect(parsed.email).toBeNull();
  });

  it('normalises and validates IBANs', () => {
    const parsed = schoolSettingsSchema.parse({ ...base, iban: 'pk36 scbl 0000 0011 2345 6702' });
    expect(parsed.iban).toBe('PK36SCBL0000001123456702');
    expect(schoolSettingsSchema.safeParse({ ...base, iban: 'not-an-iban' }).success).toBe(false);
  });

  it('rejects unsupported currencies', () => {
    expect(schoolSettingsSchema.safeParse({ ...base, currency: 'XYZ' }).success).toBe(false);
  });
});
