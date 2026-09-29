import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

/**
 * Argon2id parameters from the OWASP Password Storage Cheat Sheet
 * (19 MiB memory, 2 iterations, 1 lane). Hashing takes a few tens of
 * milliseconds on a typical school PC, which is fine for login traffic.
 */
const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const;

@Injectable()
export class PasswordService {
  private dummyHash: Promise<string> | null = null;

  hash(password: string): Promise<string> {
    return argon2.hash(password, ARGON2_OPTIONS);
  }

  async verify(hash: string, password: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }

  /** True when a stored hash uses weaker parameters than the current policy. */
  needsRehash(hash: string): boolean {
    try {
      return argon2.needsRehash(hash, ARGON2_OPTIONS);
    } catch {
      return true;
    }
  }

  /**
   * Performs a verification against a throwaway hash so that "unknown user"
   * takes as long as "wrong password" and usernames cannot be probed by timing.
   */
  async verifyDummy(password: string): Promise<void> {
    this.dummyHash ??= this.hash('skoolledger-timing-equaliser');
    await this.verify(await this.dummyHash, password);
  }
}
