# DEPLOYMENT_REPORT.md — PRISMA Web 2.0

> **Status: PREPARADO, NÃO EXECUTADO.** Deploy real aguarda autorização explícita do usuário (criar contas, conectar serviços, publicar). Nada foi publicado; nenhum serviço pago foi criado.

## Serviços alvo (todos R$ 0 — free tier)

| Serviço | Plano | Limites free | O que usamos |
|---|---|---|---|
| **Vercel** | Hobby | 100 GB bandwidth, 120h compute/mês, 1000 builds | Frontend estático (Vite) + Serverless Functions (`/api/*`) |
| **Supabase** | Free | 500 MB DB, 1 GB storage, 2 GB transfer, 50k MAU | Postgres + Auth + Storage (bucket `documents`) + pgvector |
| **GitHub** | Free | Repositórios privados ilimitados | Código + Actions (CI/CD) |
| **NVIDIA NIM** | Trial/credits | conforme conta | Nemotron 3 Ultra (chat) + nv-embed-v1 (embeddings) |

## Checklist de deploy (ordem)

1. **GitHub**: criar repo privado → `gh auth login` → `git remote add origin …` → `git push -u origin main --tags`.
2. **Supabase**: criar projeto (região `sa-east-1` se disponível) → no SQL Editor rodar, na ordem:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rpcs.sql`
   - `supabase/migrations/003_lia_memory.sql`
   - Habilitar extensões pgvector/pg_trgm (já no script 001).
   - Criar bucket `documents` privado (o script já cria via SQL; se falhar, criar na UI e a policy já está no script).
   - Rodar `supabase/tests/rls_isolation.sql` e confirmar zeros/erros esperados.
   - Pegar em Settings → API: `SUPABASE_URL`, `anon key`, `service_role key`.
3. **Vercel**: Import GitHub repo → Root Directory `apps/web` → Framework Vite.
   - Environment Variables (Production + Preview):
     - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (mark as secret)
     - `NVIDIA_API_KEY` (secret) — opcional; sem ela a LIA responde em modo mock
     - `NVIDIA_MODEL` (opcional), `NVIDIA_EMBED_MODEL` (opcional)
     - `VITE_VAPID_PUBLIC_KEY` (opcional, para push) + `VAPID_PRIVATE_KEY` (secret, se usar push server-side)
   - Build command padrão (`npm run build`); Output `dist`.
4. **GitHub Secrets** (para o CD): `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.
5. **Deploy**: `git push` na `main` → CD faz build + deploy production (com sua aprovação).
6. **Pós-deploy**: rodar E2E (`E2E_BASE_URL=<url> E2E_EMAIL=… E2E_PASSWORD=… npx playwright test`), testar login real, upload, LIA streaming.

## Variáveis de ambiente (resumo — nenhuma em código)

| Variável | Serviço | Obrigatória |
|---|---|---|
| `SUPABASE_URL` | Vercel | sim |
| `SUPABASE_ANON_KEY` | Vercel | sim |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel (secret) | sim |
| `NVIDIA_API_KEY` | Vercel (secret) | para LIA real |
| `NVIDIA_MODEL` / `NVIDIA_BASE_URL` | Vercel | não (defaults) |
| `NVIDIA_EMBED_MODEL` | Vercel | não (default nv-embed-v1) |
| `VITE_VAPID_PUBLIC_KEY` | Vercel (build) | não (push) |
| `VERCEL_TOKEN` / `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` | GitHub Secrets | para CD |
| `USE_MOCK_DB=1` | só local/CI | não |

## Rollback
- Vercel: Promote deployment anterior (dashboard) ou `git revert` + push.
- Supabase: migrations são aditivas; rollback = restaurar backup (Settings → Backups no free tier faz PITR limitado).
- Código: tags `backup-desktop-v1`, `web-foundation-v1`, `web-api-v1`, `phase3-complete`, `phase4-lia`, `phase5-complete`.

## Monitoramento (free)
- Vercel Analytics (hobby inclui básico), logs de funções.
- Supabase: Database → Logs.
- Erros frontend: opcional Sentry free (não configurado).
