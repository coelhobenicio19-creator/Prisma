# 09_DEPLOY_READINESS.md — checklist técnico (2026-11-14)

## ✅ Pronto (comprovado local)
- [x] `tsc --noEmit` frontend — exit 0
- [x] `tsc -p tsconfig.api.json` — exit 0
- [x] ESLint flat config — 0 erros/0 warnings
- [x] 41/41 testes unitários
- [x] Build de produção ok (gzip total ~130 kB JS+CSS)
- [x] npm audit: 0 high/critical
- [x] Scan de segredos: limpo (sem .env, sem chaves no código)
- [x] CI (`ci.yml`: typecheck/build/test/lint/audit/secret-scan) e CD (`cd.yml`, gated em `environment: production`)
- [x] Migrations 001–003 + RLS + bucket `documents` + teste RLS SQL
- [x] vercel.json (rewrites, nodejs20.x, maxDuration 30)
- [x] Chave NVIDIA 100% server-side; cookie httpOnly; RLS por usuário
- [x] Checkpoints git: tags `backup-desktop-v1` … `phase5-complete`, `audit-baseline`, `audit-v1`

## ⏳ Pendente de autorização/contas (usuário)
- [ ] Criar repo GitHub privado, `gh auth login`, push (nada foi pushado)
- [ ] Criar projeto Supabase (Free), rodar migrations 001→003, rodar `rls_isolation.sql`, copiar URL + keys
- [ ] Criar projeto Vercel Hobby, root `apps/web`, env vars: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (secret), `NVIDIA_API_KEY` (secret)
- [ ] GitHub Secrets p/ CD: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
- [ ] Autorizar o deploy (push na main com ambiente `production` aprovado)
- [ ] Pós-deploy: E2E (`E2E_BASE_URL=… npx playwright test`), teste real de login/upload/LIA, teste RLS com 2 usuários

## Regras mantidas
R$ 0, nada publicado sem sua ordem, nenhuma credencial no chat/git, backups preservados.
