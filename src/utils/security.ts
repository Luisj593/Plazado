import bcrypt from 'bcryptjs';

// Secure hashing utility using industry-standard bcrypt
// Never stores plain text passwords.
// Exact character comparison, no normalization or alteration.

export const BCRYPT_SALT_ROUNDS = 10;
export const LEGACY_PASSWORD_SALT = 'plazado_sec_salt_2026';

/**
 * Generate a cryptographically secure bcrypt hash of the password.
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

/**
 * Cryptographically verify an entered password against stored passwordHash.
 * Uses constant-time comparison in bcrypt.
 * Supports legacy SHA-256 hashes during seamless background migration.
 */
export async function verifyPassword(password: string, expectedHash: string): Promise<boolean> {
  if (typeof password !== 'string' || typeof expectedHash !== 'string') {
    return false;
  }
  // Deny empty passwords immediately
  if (!password || !expectedHash) {
    return false;
  }

  // 1. Standard bcrypt hash check ($2a$, $2b$, $2y$)
  if (expectedHash.startsWith('$2')) {
    try {
      return await bcrypt.compare(password, expectedHash);
    } catch (e) {
      return false;
    }
  }

  // 2. Legacy salted SHA-256 check
  const enc = new TextEncoder();
  const saltedBuffer = await crypto.subtle.digest('SHA-256', enc.encode(`${LEGACY_PASSWORD_SALT}:${password}`));
  const saltedHash = Array.from(new Uint8Array(saltedBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  if (saltedHash === expectedHash) {
    return true;
  }

  // 3. Legacy raw SHA-256 check
  const rawBuffer = await crypto.subtle.digest('SHA-256', enc.encode(password));
  const rawHash = Array.from(new Uint8Array(rawBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  if (rawHash === expectedHash) {
    return true;
  }

  return false;
}

