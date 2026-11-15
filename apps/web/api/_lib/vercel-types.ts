// Tipos mínimos compatíveis com @vercel/node (VercelRequest/VercelResponse),
// usados apenas em compile-time das funções serverless. Em produção na Vercel,
// o runtime real fornece esses objetos; aqui só precisamos dasassinaturas.
import type { IncomingMessage, ServerResponse } from 'http';

export interface VercelRequest extends IncomingMessage {
  query: Record<string, string | string[]>;
  body?: unknown;
  cookies?: Record<string, string>;
}

export interface VercelResponse extends ServerResponse {
  status(code: number): this;
  json(data: unknown): void;
  send(data: unknown): void;
  redirect(url: string): void;
}
