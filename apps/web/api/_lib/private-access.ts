// E-mails autorizados. As senhas são gerenciadas exclusivamente pelo Supabase Auth.
export const PRIVATE_ACCOUNTS = [
  'coelhobenicio19@gmail.com',
  'sugundousuario@gmail.com',
  'terceirousuario@gmail.com',
  'quartousuario@gmail.com',
  'benicioias@gmail.com',
  'beniciokyrios@gmail.com',
] as const;

export function normalizeAccountEmail(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export function isAllowedAccount(value: unknown): boolean {
  return (PRIVATE_ACCOUNTS as readonly string[]).includes(normalizeAccountEmail(value));
}

export function isLocalMock(env: Record<string, string | undefined> = process.env): boolean {
  return env.USE_MOCK_DB === '1' && env.NODE_ENV !== 'production' && !env.VERCEL && !env.VERCEL_ENV;
}
