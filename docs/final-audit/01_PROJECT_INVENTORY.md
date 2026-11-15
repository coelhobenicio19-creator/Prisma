# 01_PROJECT_INVENTORY.md

**Data:** 2026-11-14 ~11:45 BRT · **Commit pós-auditoria:** ver tag `audit-v1`

## Estrutura
```
PRISMA/
├── apps/web/                 # frontend + API serverless (único app ativo)
│   ├── src/pages/            # 13 arquivos (incl. modules/)
│   ├── src/pages/modules/    # ModulesA (Questions/ErrorLab/ExamIntel/ActiveLearning), ModulesB (Reader/Compare/Formula/Board)
│   ├── src/components/       # ui/ (Button, Card, Input, Select, Badge, Label, ScrollArea, ...), layout/ (Sidebar, RightPanel)
│   ├── src/store/index.ts    # Zustand: profile, settings, dashboard, library, search, ui, toast
│   ├── src/services/         # api.ts (cliente HTTP, cookies httpOnly), export.ts, voice.ts, notifications.ts, backup.ts, tauri.ts (shim)
│   ├── src/utils/            # helpers.ts, mindmap.ts, academic.ts (parser matemático + diff LCS)
│   ├── api/                  # 25 endpoints serverless + _lib (db, http, lia/)
│   ├── tests/                # 6 arquivos vitest (41 testes)
│   ├── e2e/                  # Playwright scaffold (auth.spec.ts)
│   └── public/sw.js          # service worker (push)
├── supabase/migrations/      # 001 schema+RLS, 002 RPCs, 003 LIA memory
├── supabase/tests/rls_isolation.sql
├── .github/workflows/        # ci.yml, cd.yml (deploy gated em aprovação)
├── docs/                     # arquitetura, relatórios, final-audit/
└── apps/desktop/             # legado preservado só no git (tag backup-desktop-v1)
```

## Tecnologias e versões principais
- react 18.3, react-router 6, zustand 4, @tanstack/react-query 5
- vite 5.4, typescript 5.5, tailwind 3.4
- vitest 1.6, eslint 9 (flat), typescript-eslint 8
- API: Node 20 (Vercel serverless), sem framework (handlers próprios), Supabase REST

## Dependências (npm audit pós-auditoria)
- **0 vulnerabilidades high/critical**
- moderada restante: `minimatch` via typescript-eslint (só ferramenta de lint dev) — não vai para produção
- `@vercel/node` removido (era a fonte do high); tipos locais em `api/_lib/vercel-types.ts`
- esbuild elevado a ^0.25 via override (fix do advisory do dev server)

## Testes existentes
- 41 testes unitários (vitest) em 6 arquivos — **41/41 passando**
- E2E Playwright: scaffold pronto, não executado (precisa de preview/produção + credenciais de teste)
- RLS: `supabase/tests/rls_isolation.sql` pronto para rodar no Supabase
