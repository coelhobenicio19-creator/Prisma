# AUDIT_BASELINE.md — estado exato ANTES da auditoria (turn 35)

- **Commit baseline:** `0f82fcc` (tag `phase5-complete`) + tag de checkpoint `audit-baseline`
- **Ramo:** `main`, repositório local apenas (sem remote), working tree limpo no início
- **Stack:** React 18 + TS + Vite 5 + Tailwind, Zustand, react-router, react-query; API serverless Node 20 em `apps/web/api/`; Supabase (Postgres+pgvector+Auth+Storage) via REST; Vercel como alvo de deploy
- **Testes existentes no baseline:** 31 (vitest, 5 arquivos) — todos passando; tsc frontend+API limpos; build ok
- **Scripts (apps/web):** dev, build, build:api, test:api, test:unit, lint (quebrado no baseline: `--ext` não existe no flat config), preview
- **Páginas no baseline:** 12 arquivos em `src/pages/` cobrindo 16 rotas; 8 módulos sem rota (Questions, Error Lab, Exam Intelligence, Reader, Compare, Formula, Board, Active Learning)
- **Achados críticos no baseline (corrigidos nesta auditoria):**
  1. Chave NVIDIA coletada no navegador e gravada em `localStorage` (`Onboarding.tsx:95`, `Settings.tsx`) — **CRÍTICO, corrigido**
  2. `lint` script incompatível com ESLint flat config — corrigido (config flat + deps v9)
  3. `@vercel/node` com vulnerabilidade **high** (busboy/undici) — removido, tipos locais em `api/_lib/vercel-types.ts`
  4. Cliente API sem funções de flashcards/questions/sessions/goals/commitments/notifications apesar dos endpoints existirem — adicionado
  5. Recall era página estática — religado ao FSRS real
  6. 8 módulos sem rota — criados com dados reais
- **Variáveis de ambiente esperadas (nenhuma no repo):** `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NVIDIA_API_KEY` (Vercel); `VITE_VAPID_PUBLIC_KEY` (opcional)
