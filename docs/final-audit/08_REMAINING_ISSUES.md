# 08_REMAINING_ISSUES.md — pendências REAIS (2026-11-14)

## Bloqueios por dependência externa (não simuláveis)
1. **Deploy**: GitHub privado + Supabase Free + Vercel Hobby exigem contas e sua autorização. Tudo preparado (`docs/DEPLOYMENT_REPORT.md`).
2. **Testes RLS reais** no Supabase: `supabase/tests/rls_isolation.sql` pronto, aguarda projeto criado.
3. **LIA com NVIDIA real**: aguarda `NVIDIA_API_KEY` no Vercel. Até lá responde mock explícito.
4. **E2E Playwright**: aguarda servidor no ar + conta de teste (`E2E_EMAIL/E2E_PASSWORD`). Rodar `npx playwright install chromium` antes.
5. **Lighthouse/performance real**: aguarda app no ar.

## Módulos ainda parciais (UI sem persistência)
Learn, Atlas, Focus, Exams, Forecast, Planner, Projects, School, Studio (parte), Lab, Oral (voz real ok, fluxo UI). Os endpoints necessários já existem (sessions, commitments, goals); falta ligar as páginas — trabalho frontend puro, sem bloqueio.

##Conhecidos
- `tests/api.test.mjs` legado é frágil (dependia de build output); substituído pelos testes vitest novos. Mantido por histórico.
- npm audit moderate remanescente: `minimatch` via typescript-eslint (dev-only).
- CI usa `pnpm` no workflow mas o projeto tem `package-lock.json` (npm) — harmonizar para `npm ci` no CI antes do primeiro run verde.

## Limites free tier
Vercel Hobby ~1000 invocações/dia, Supabase Free 500 MB/1 GB storage/50k MAU — suficiente para uso pessoal; monitorar no painel.
