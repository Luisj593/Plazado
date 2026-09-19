// Secure hashing utility using native Web Crypto API (SHA-256)
// Never stores plain text passwords

export async function hashPassword(password: string, salt: string = 'plazado_sec_salt_2026'): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`${salt}:${password}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(password: string, expectedHash: string, salt?: string): Promise<boolean> {
  const computed = await hashPassword(password, salt);
  return computed === expectedHash;
}
