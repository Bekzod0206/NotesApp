import crypto from 'crypto';

export function randomToken(bytes = 48) {
  return crypto.randomBytes(bytes).toString('hex');
}

export function sha256(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

export function refreshExpiry(): Date {
  const days = Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 7);
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}