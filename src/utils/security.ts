// Secure hashing utility using native Web Crypto API (SHA-256)
// Never stores plain text passwords.
// Exact character comparison, no normalization or modification.

export const PASSWORD_SALT = 'plazado_sec_salt_2026';

export async function hashPassword(password: string, salt: string = PASSWORD_SALT): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`${salt}:${password}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(password: string, expectedHash: string, salt: string = PASSWORD_SALT): Promise<boolean> {
  if (typeof password !== 'string' || typeof expectedHash !== 'string') {
    return false;
  }
  // Deny empty passwords immediately
  if (!password || !expectedHash) {
    return false;
  }

  // 1. Exact comparison against salted hash (current standard)
  const computedSalted = await hashPassword(password, salt);
  if (computedSalted === expectedHash) {
    return true;
  }

  // 2. Exact comparison against legacy raw SHA-256 (for accounts initialized with raw sha256)
  const enc = new TextEncoder();
  const rawBuffer = await crypto.subtle.digest('SHA-256', enc.encode(password));
  const rawHash = Array.from(new Uint8Array(rawBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  if (rawHash === expectedHash) {
    return true;
  }

  return false;
}
