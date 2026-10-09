import crypto from 'node:crypto';
import type { PaymentGatewayConfig } from '../src/types';

function encryptionKey() {
  const secret = process.env.PAYMENT_CREDENTIALS_KEY || process.env.SESSION_SECRET;
  if (!secret?.trim()) throw new Error('Falta la clave del servidor para proteger las credenciales.');
  return crypto.createHash('sha256').update(`plazado:paypal:${secret}`).digest();
}

export function encryptPayPalSecret(value: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return ['enc-v1', iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), encrypted.toString('base64url')].join(':');
}

export function decryptPayPalSecret(value: string): string {
  const [version, iv, tag, data] = value.split(':');
  if (version !== 'enc-v1' || !iv || !tag || !data) throw new Error('El secreto PayPal guardado no es válido. Vuelve a introducirlo.');
  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(data, 'base64url')), decipher.final()]).toString('utf8');
}

export async function testPayPalCredentials(gateway: PaymentGatewayConfig, fetcher: typeof fetch = fetch): Promise<void> {
  const clientId = gateway.credentials?.clientId;
  const secret = gateway.credentials?.clientSecret;
  if (!clientId || !secret) throw new Error('Completa el Client ID y el Client Secret de PayPal antes de validar.');
  if (!['PRODUCTION', 'SANDBOX'].includes(gateway.environment)) throw new Error('Ambiente PayPal inválido.');
  const host = gateway.environment === 'PRODUCTION' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
  let response: Response;
  try {
    response = await fetcher(`${host}/v1/oauth2/token`, {
      method: 'POST',
      headers: {Authorization: `Basic ${Buffer.from(`${clientId}:${decryptPayPalSecret(secret)}`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded'},
      body: 'grant_type=client_credentials',
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    throw new Error('No se pudo conectar con PayPal. Revisa las credenciales y vuelve a intentar.');
  }
  if (!response.ok) throw new Error('PayPal rechazó las credenciales. Revisa Client ID, Client Secret y ambiente.');
  const result = await response.json();
  if (typeof result.access_token !== 'string' || !result.access_token) throw new Error('PayPal no confirmó la autenticación.');
}
