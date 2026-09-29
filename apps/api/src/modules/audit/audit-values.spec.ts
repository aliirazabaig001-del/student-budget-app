import { describe, expect, it } from 'vitest';
import { REDACTED, diffValues, redact } from './audit-values';

describe('redact', () => {
  it('masks credential-like keys at any depth and serialises dates', () => {
    const at = new Date('2026-01-01T00:00:00.000Z');
    expect(
      redact({
        password: 'x',
        passwordHash: 'y',
        nested: { refreshToken: 'z', ok: 1 },
        when: at,
        skipped: undefined,
      }),
    ).toEqual({
      password: REDACTED,
      passwordHash: REDACTED,
      nested: { refreshToken: REDACTED, ok: 1 },
      when: '2026-01-01T00:00:00.000Z',
    });
  });
});

describe('diffValues', () => {
  const before = { name: 'Old', phone: null as string | null, city: 'Lahore', secret: 'a' };

  it('returns only changed fields that were supplied', () => {
    expect(diffValues(before, { name: 'New', city: 'Lahore' }, ['name', 'phone', 'city'])).toEqual({
      previousValues: { name: 'Old' },
      newValues: { name: 'New' },
    });
  });

  it('treats undefined and null as the same', () => {
    expect(diffValues(before, { phone: undefined }, ['phone'])).toEqual({
      previousValues: null,
      newValues: null,
    });
  });

  it('never leaks sensitive values in diffs', () => {
    const diff = diffValues(before, { secret: 'b' }, ['secret']);
    expect(diff.previousValues).toEqual({ secret: REDACTED });
    expect(diff.newValues).toEqual({ secret: REDACTED });
  });

  it('ignores fields outside the allow-list', () => {
    expect(diffValues(before, { city: 'Karachi' }, ['name']).newValues).toBeNull();
  });
});
