# 03_TEST_RESULTS.md — 2026-11-14 (BRT)

Todos executados localmente em `apps/web/` (Node 20, Windows 11). Nenhum teste foi marcado como executado sem rodar.

## Bateria executada (pós-correções)

| Comando | Resultado |
|---|---|
| `npx tsc --noEmit` (frontend) | ✅ exit 0 |
| `npx tsc -p tsconfig.api.json` (API) | ✅ exit 0 |
| `npx eslint src --max-warnings 0` | ✅ exit 0 (0 erros, 0 warnings) |
| `npx vitest run` | ✅ **41/41 passando** (6 arquivos) |
| `npm run build` | ✅ build ok em ~50s — bundle index 243 kB (gzip 65 kB), vendor 164 kB (gzip 53 kB), ui 50 kB (gzip 13 kB) |
| `npm audit --audit-level high` | ✅ 0 high/critical (após remover @vercel/node e override esbuild≥0.25) |
| `npm audit` (todas) | moderate restante: minimatch via typescript-eslint (dev-only, não vai p/ produção) |
| Scan de segredos (grep `sk-…`, JWT `eyJ…`, private keys; glob `**/.env*`) | ✅ limpo — nenhum match, nenhum .env no repo |
| Testes RLS (`supabase/tests/rls_isolation.sql`) | ⏳ não executados — exigem projeto Supabase real (bloqueio externo) |
| Playwright E2E (`e2e/auth.spec.ts`) | ⏳ não executado — exige preview/produção + conta de teste (bloqueio externo); 2 testes de 401 rodam só com servidor no ar |

## Detalhe dos 41 testes unitários
- `tests/lia-verify.test.ts` — 6 (verificação de incerteza/cálculo da LIA)
- `tests/lia-tools.test.ts` — 10 (ferramentas do agente)
- `tests/phase5.test.ts` — 7 (export/voz/mindmap/achievements)
- `tests/backup.test.ts` — 5 (backup/restore parse)
- `tests/academic.test.ts` — 10 (parser matemático seguro, diff LCS, accuracy, mean) — **novo nesta auditoria**
- `src/store/store.test.ts` — 3 (UI store)

## Falhas encontradas e corrigidas durante a auditoria
1. `lint` quebrado (flag `--ext` inválida no flat config) → script + `eslint.config.js` reescritos; 40 problemas corrigidos (any, target=_blank, entidades, hooks)
2. `evaluateMath` aplicava funções unárias como binárias → corrigido; `-3+5` agora = 2 (precedência de `u-`)
3. Conflito de tipo `Goal` no api.ts → renomeado para `StudyGoal`
4. Build quebrado após remover input de chave → imports/JSX corrigidos

## Não executados (com bloqueio real)
- E2E de navegador, RLS no Supabase, LIA com NVIDIA real, upload real para Storage — todos exigem contas/serviços externos ou deploy autorizado.
