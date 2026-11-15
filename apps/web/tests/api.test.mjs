// Teste de fumaça da API serverless em modo mock (USE_MOCK_DB=1), sem serviços externos.
// Roda os handlers diretamente com req/res falsos.
import { execFileSync } from 'child_process';

process.env.USE_MOCK_DB = '1';

// Compila a pasta api para JS temporário e importa os handlers.
const outDir = 'tests/.build';
execFileSync(process.execPath, ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.api.json'], { stdio: 'inherit' });

const { default: login } = await import(`../${outDir}/auth/login.cjs`);
const { default: session } = await import(`../${outDir}/auth/session.cjs`);
const { default: profiles } = await import(`../${outDir}/profiles/index.cjs`);
const { default: profileById } = await import(`../${outDir}/profiles/[id].cjs`);
const { default: dashboard } = await import(`../${outDir}/profiles/[id]/dashboard.cjs`);
const { default: search } = await import(`../${outDir}/profiles/[id]/search/index.cjs`);
const { default: liaChat } = await import(`../${outDir}/profiles/[id]/lia/chat.cjs`);

function mockRes() {
  return {
    statusCode: 200,
    headers: {},
    body: undefined,
    chunks: [],
    status(c) { this.statusCode = c; return this; },
    json(d) { this.body = d; return this; },
    setHeader(k, v) { this.headers[k] = v; return this; },
    write(c) { this.chunks.push(c); return true; },
    end() { this.ended = true; return this; },
  };
}

function mockReq({ method = 'GET', body, headers = {}, query = {}, url = '/api' }) {
  const listeners = {};
  return {
    method, query, url,
    headers,
    on(ev, fn) { listeners[ev] = fn; if (ev === 'data' && body) queueMicrotask(() => { fn(Buffer.from(JSON.stringify(body))); listeners['end']?.(); }); },
  };
}

let passed = 0, failed = 0;
function check(name, cond) {
  if (cond) { passed++; console.log('  PASS', name); }
  else { failed++; console.log('  FAIL', name); }
}

// 1. login mock
const loginRes = mockRes();
await login(mockReq({ method: 'POST', body: { email: 'dono@local', password: 'x' } }), loginRes);
check('login retorna 200 + usuário', loginRes.statusCode === 200 && loginRes.body?.email === 'dono@local');
const cookie = loginRes.headers['Set-Cookie']?.[0];
const token = cookie?.match(/sb-access-token=([^;]+)/)?.[1];
check('login define cookie de sessão', !!token);
const authHeaders = { authorization: `Bearer ${token}` };

// 2. session sem token -> 401
const s1 = mockRes();
await session(mockReq({}), s1);
check('session sem token retorna 401', s1.statusCode === 401);

// 3. session com token -> 200
const s2 = mockRes();
await session(mockReq({ headers: authHeaders }), s2);
check('session com token retorna 200', s2.statusCode === 200 && s2.body?.email === 'dono@local');

// 4. criar perfil
const p1 = mockRes();
await profiles(mockReq({ method: 'POST', headers: authHeaders, body: { name: 'ENEM 2026', goal_type: 'exam' } }), p1);
check('criar perfil retorna 201', p1.statusCode === 201 && p1.body?.name === 'ENEM 2026');
const profileId = p1.body?.id;

// 5. listar perfis
const p2 = mockRes();
await profiles(mockReq({ headers: authHeaders }), p2);
check('listar perfis retorna 1 perfil', p2.statusCode === 200 && p2.body?.length === 1);

// 6. dashboard do perfil
const d1 = mockRes();
await dashboard(mockReq({ headers: authHeaders, query: { id: profileId } }), d1);
check('dashboard retorna estrutura válida', d1.statusCode === 200 && typeof d1.body?.study_stats === 'object');

// 7. busca vazia
const se1 = mockRes();
await search(mockReq({ method: 'POST', headers: authHeaders, query: { id: profileId }, body: { query: 'álgebra' } }), se1);
check('search retorna 200 + array', se1.statusCode === 200 && Array.isArray(se1.body));

// 8. LIA chat mock (SSE)
const c1 = mockRes();
await liaChat(mockReq({ method: 'POST', headers: authHeaders, query: { id: profileId }, body: { message: 'oi LIA' } }), c1);
const sse = c1.chunks.join('');
check('lia chat envia SSE com conversation_id e done', sse.includes('conversation_id') && sse.includes('"done":true') && c1.ended === true);

// 9. acesso sem auth em profiles -> 401
const p3 = mockRes();
await profiles(mockReq({}), p3);
check('profiles sem auth retorna 401', p3.statusCode === 401);

console.log(`\nResultado: ${passed} passaram, ${failed} falharam`);
process.exit(failed ? 1 : 0);
