import { afterEach, describe, expect, it, vi } from 'vitest';
import login from '../api/auth/login';
import { getUserFromRequest } from '../api/_lib/db';

afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
const response=()=>({statusCode:200,body:undefined as any,headers:{} as Record<string,unknown>,status(code:number){this.statusCode=code;return this;},json(body:unknown){this.body=body;return this;},setHeader(key:string,value:unknown){this.headers[key]=value;return this;}});
const request=(email:string)=>({method:'POST',body:{email,password:'fixture-password'},on(){throw new Error('parsed request.body must be used');}} as any);

describe('acesso privado das seis contas',()=>{
  it('recusa contas fora da lista antes de chamar o provedor',async()=>{
    const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher);vi.stubEnv('SUPABASE_URL','https://fixture.supabase.co');vi.stubEnv('SUPABASE_ANON_KEY','fixture');
    const res=response();await login(request('outside@example.com'),res as any);
    expect(res.statusCode).toBe(401);expect(fetcher).not.toHaveBeenCalled();expect(res.headers['Set-Cookie']).toBeUndefined();
  });
  it('não cria sessão simulada quando a produção não tem configuração',async()=>{
    vi.stubEnv('NODE_ENV','production');vi.stubEnv('SUPABASE_URL','');vi.stubEnv('SUPABASE_ANON_KEY','');vi.stubEnv('USE_MOCK_DB','1');
    const res=response();await login(request('coelhobenicio19@gmail.com'),res as any);
    expect(res.statusCode).toBe(503);expect(res.headers['Set-Cookie']).toBeUndefined();
  });
  it('normaliza e-mail autorizado e mantém a senha apenas na chamada ao Auth',async()=>{
    vi.stubEnv('NODE_ENV','production');vi.stubEnv('SUPABASE_URL','https://fixture.supabase.co');vi.stubEnv('SUPABASE_ANON_KEY','fixture');
    const fetcher=vi.fn(async()=>new Response(JSON.stringify({access_token:'fixture-access',refresh_token:'fixture-refresh',expires_in:3600,user:{id:'user-1',email:'coelhobenicio19@gmail.com'}}),{status:200}));vi.stubGlobal('fetch',fetcher);
    const res=response();await login(request('  COELHOBENICIO19@GMAIL.COM  '),res as any);
    expect(res.statusCode).toBe(200);expect(res.body.email).toBe('coelhobenicio19@gmail.com');
    const init=(fetcher.mock.calls[0] as unknown as [string,RequestInit])[1];expect(JSON.parse(String(init.body)).email).toBe('coelhobenicio19@gmail.com');
    expect(String(res.headers['Set-Cookie'])).toContain('HttpOnly');expect(String(res.headers['Set-Cookie'])).toContain('Secure');expect(JSON.stringify(res.body)).not.toContain('fixture-password');
  });
});
