# WEB_MIGRATION_AUDIT.md — Auditoria de Migração Desktop → Web (2026-11-13)

## 1. Inventário do projeto (`C:\Users\charl\nanoMuse\PRISMA`)

### Frontend (`apps/desktop/src`) — React 18 + TS + Vite 5 + Tailwind + Zustand + React Query + sonner
| Arquivo | Tamanho | Classificação | Observação |
|---|---|---|---|
| `App.tsx`, `main.tsx` | 7,6 KB | **ADAPTAR** | Rotas (react-router) ok; `BrowserRouter` → trocar para roteamento web com guard de auth |
| `index.css` + `tailwind.config.js` | ~16 KB | **REUTILIZAR** | Graphite Academic intacto; só remover `@apply` de classes desktop se necessário |
| `components/ui/*` (12 arquivos) | ~40 KB | **REUTILIZAR** | Button/Card/Input/Select/Badge/Avatar/ScrollArea/Progress/toaster — puros React, sem Tauri |
| `components/layout/Sidebar.tsx`, `RightPanel.tsx` | 22 KB | **REUTILIZAR** | layout web direto |
| `pages/*` (12 páginas) | ~115 KB | **ADAPTAR** | toda página que chama `@/services/tauri` vira chamada de API web |
| `services/tauri.ts` | 11,2 KB | **SUBSTITUIR** | 27 funções `invoke()` → client HTTP (fetch) para `/api/*` |
| `store/index.ts` | 13,4 KB | **ADAPTAR** | Zustand ok; trocar transporte (tauri → fetch); persist local ok |
| `utils/helpers.ts` | 3,8 KB | **REUTILIZAR** | puro |

### Dependências Tauri no frontend (a remover na web)
`@tauri-apps/api` + 8 plugins (dialog, fs, shell, clipboard, notification, global-shortcut, window-state, store) e `@tauri-apps/cli`.
Substituir por: `fetch` nativo + Web APIs (clipboard, Notification do navegador, `<input type=file>`).

### Backend (`apps/desktop/src-tauri`) — Rust + Tauri 2 + sqlx/SQLite
| Arquivo | Classificação | Observação |
|---|---|---|
| `src/models.rs` (53 structs, 28 KB) | **ADAPTAR** | vira schemas TS (zod) + tipos Prisma/Postgres — é a base do contrato de dados |
| `migrations/001_initial_schema.up.sql` (55 tabelas, 28 KB) | **ADAPTAR** | base para schema PostgreSQL (Supabase) — remover FTS5-specific, usar pg full-text |
| `migrations/002_fts5_search_index.up.sql` | **SUBSTITUIR** | FTS5 → `tsvector`/pg_trgm ou busca vetorial (pgvector no Supabase free) |
| `src/commands/*.rs` (5 módulos, ~40 KB) | **ADAPTAR** | lógica de negócio → rotas de API serverless (Vercel functions) em TS |
| `src/db.rs`, `error.rs` | **SUBSTITUIR** | sqlx/SQLite → Prisma/Postgres client |
| `src/main.rs`, `tauri.conf.json`, `Cargo.toml` | **DESCARTAR** (após backup) | específico de desktop |

### Comandos Tauri mapeados (27 no `services/tauri.ts`)
`create/get/list/update/delete_profile` · `get/update_settings` · `export/import_data` · `create_backup` · `list_backups` · `import_file` · `list/get/delete/open_document` · `search` · `reindex` · `get_dashboard_data` · `pickFile/pickFolder` (→ upload web) · `clipboard` (→ navigator.clipboard) · `showNotification` (→ Notification API) · `getAppDataDir/getDbPath` (→ servidor).

### Documentação
`SPEC.md`, `ARCHITECTURE.md`, `DATA_MODEL.md`, `ROADMAP.md`, `RUNBOOK.md`, `SECURITY.md`, `SOURCE_POLICY.md`, `TEST_PLAN.md`, `IMPLEMENTATION_STATUS.md`, `NEXT_STEPS.md`, `CHANGELOG.md` + `docs/` — **REUTILIZAR** como base da especificação web.

## 2. Estado atual conhecido
- Frontend desktop **compila** (`tsc --noEmit` limpo, `vite build` OK — dist gerado em 12/11).
- Backend Rust: `cargo fetch` OK; `cargo check` não completou (linker) — **não é mais necessário para a versão web**.
- Git local: 2 commits em `main` (checkpoint `55ffde5` + docs `9a4187b`). Nenhum remote.

## 3. Backup / preservação (Fase 1)
- Tag git `backup-desktop-v1` criada (ver abaixo) — código-fonte intacto e recuperável.
- `.gitignore` já exclui node_modules/dist/target/caches/.env/chaves/bancos.
- Verificado: nenhum segredo trackeado (`git ls-files` sem .env/.pem/.db).

## 4. Plano da nova arquitetura (Opção A — React+Vite+serverless, recomendada)
- **Frontend:** mesmo código React/TS em `apps/web`, Vite, deploy Vercel Hobby (grátis).
- **API:** Vercel Serverless Functions em TS (`/api/*`), substituindo os 27 comandos Tauri 1:1.
- **Banco:** Supabase Free (Postgres + Auth + Storage + RLS) — schema derivado das 55 tabelas SQLite.
- **LIA:** função serverless dedicated `/api/lia/chat` (streaming SSE), chave NVIDIA só em env do servidor, provedor intercambiável.
- **Auth:** Supabase Auth (e-mail+senha do dono; sem cadastro público), sessão validada no backend em toda rota; RLS em todas as tabelas.
- **Docs:** Supabase Storage privado (bucket com policy só do dono).

## 5. O que NÃO será feito sem autorização
Publicar site, enviar arquivos a serviços externos, criar contas/projetos, habilitar billing, excluir arquivos/programas, mudar configs globais do Windows.

## 6. Consumo de SSD
- Projeto atual: 0,41 GB. `rust_home` 1,88 GB, MinGW copiado p/ workspace ~0,9 GB, `target/` parcial — candidatos a limpeza **somente na Fase 7, após aprovação item a item** (`CLEANUP_REPORT.md`).
