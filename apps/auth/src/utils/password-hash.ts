import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(scryptCallback);

const PASSWORD_HASH_PREFIX = 'scrypt';
const HASH_LENGTH = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derivedKey = (await scrypt(password, salt, HASH_LENGTH)) as Buffer;
  return `${PASSWORD_HASH_PREFIX}:${salt.toString('hex')}:${derivedKey.toString('hex')}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    const [prefix, saltHex, hashHex] = storedHash.split(':');
    if (prefix !== PASSWORD_HASH_PREFIX || !saltHex || !hashHex) {
      return false;
    }

    const salt = Buffer.from(saltHex, 'hex');
    const expected = Buffer.from(hashHex, 'hex');
    const derived = (await scrypt(password, salt, expected.length)) as Buffer;

    return expected.length === derived.length && timingSafeEqual(expected, derived);
  } catch {
    return false;
  }
}

export function isPasswordHash(value: string): boolean {
  const [prefix, saltHex, hashHex] = value.split(':');
  return prefix === PASSWORD_HASH_PREFIX && Boolean(saltHex) && Boolean(hashHex);
}
