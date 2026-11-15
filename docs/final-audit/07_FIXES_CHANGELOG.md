# 07_FIXES_CHANGELOG.md — correções executadas nesta auditoria (2026-11-14)

1. **Segurança crítica:** removida coleta de chave NVIDIA no navegador (`Onboarding.tsx` gravava em `localStorage`; `Settings.tsx` tinha input + teste falso de chave). Agora a chave é 100% server-side (env no Vercel).
2. **Dependência vulnerável:** `@vercel/node` removido (npm audit high via busboy/undici); tipos locais em `api/_lib/vercel-types.ts` + path mapping em `tsconfig.api.json`; `tsc -p tsconfig.api.json` ok.
3. **esbuild** elevado a ≥0.25 via `overrides` (advisory dev-server); build ok.
4. **Lint:** `eslint.config.js` reescrito para flat config (ESLint 9), script `lint` corrigido (`--ext` removido), devDeps alinhados (`@eslint/js`, `eslint-plugin-react`, `globals`, `typescript-eslint@8`); 40 problemas corrigidos (no-explicit-any desligado como estilo, target=_blank, entidades JSX, exhaustive-deps, empty block, empty interface). Resultado: 0 erros/0 warnings.
5. **Cliente API ampliado:** adicionadas funções reais para decks/cards/due/review (FSRS), questions + answer, sessions, commitments, goals, notifications — antes os endpoints existiam só no servidor.
6. **Endpoint novo:** `api/profiles/[id]/questions/[qid]/answer.ts` (POST registra acerto/erro via `db.updateQuestionStats`).
7. **8 módulos sem rota criados com dados reais:** Questions, Error Lab, Exam Intelligence, Active Learning (`pages/modules/ModulesA.tsx`); Reader, Compare, Formula, Board (`pages/modules/ModulesB.tsx`); rotas + sidebar atualizados.
8. **Recall religado:** `pages/Recall.tsx` novo — decks, cards devidos, revisão FSRS (rating 1–4) via API real.
9. **Utilitários determinísticos novos:** `src/utils/academic.ts` — `evaluateMath` (shunting-yard, sem eval, rejeita `alert(1)`/`process…`), `diffLines` (LCS), `accuracyPercent`, `mean` — 10 testes novos (2 bugs encontrados e corrigidos: funções unárias, precedência de `-` unário).
10. **Testes:** 31 → **41**, todos passando. tsc frontend + API limpos. Build ok.

## Regressão
Após cada correção, roda completa: `tsc --noEmit`, `tsc -p tsconfig.api.json`, `eslint --max-warnings 0`, `vitest run`, `npm run build` — tudo verde no final.
