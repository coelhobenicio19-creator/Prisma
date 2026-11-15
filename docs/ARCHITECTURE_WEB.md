# ARCHITECTURE_WEB.md — PRISMA Web 2.0

## Visão geral
Plataforma web privada (pessoal) que substitui o app desktop Tauri. R$ 0/mês: Vercel Hobby + Supabase Free.

```
apps/web/
├── src/                  # Frontend React 18 + Vite 5 + Tailwind (tema Graphite Academic)
│   ├── services/api.ts   # Cliente HTTP (fetch) — espelha os endpoints /api/*
│   ├── services/tauri.ts # Shim: re-exporta api.ts (compatibilidade com código antigo)
│   ├── pages/            # 18 rotas (Dashboard, Library, Search, Atlas, Planner, Studio, LIA, Login...)
│   ├── store/            # Zustand (UI, profile, library, toasts)
│   └── components/ui/    # Button, Card, Input, Label, Select, ScrollArea, Avatar, Badge, Progress, Toaster
├── api/                  # Vercel Serverless Functions (Node 20)
│   ├── _lib/
│   │   ├── db.ts         # Camada de dados: Supabase REST (service role) + mock local (USE_MOCK_DB=1)
│   │   ├── http.ts       # Helpers: requireUser (JWT via Supabase Auth), json/error/readBody
│   │   └── lia/
│   │       ├── system.ts # System prompt acadêmico + definições de ferramentas
│   │       ├── tools.ts  # Executor de tool calls (search, dashboard, flashcards, questions, schedule)
│   │       ├── rag.ts    # Embeddings NVIDIA + vector_search (pgvector) + citações
│   │       ├── memory.ts # Memória acadêmica controlada (só grava com fonte)
│   │       └── verify.ts # Verificação de incerteza/cálculos na resposta final
│   ├── auth/             # login, session, logout (cookies httpOnly, Supabase Auth)
│   └── profiles/[id]/    # documents(+upload), search(+vector), dashboard, flashcards(+due,review,cards), commitments, questions, sessions, goals, notifications, lia/chat+conversations
├── tests/                # vitest (unit) + api.test.mjs (integração mock)
└── vercel.json           # rewrites + runtime nodejs20.x
supabase/migrations/      # 001 schema+RLS+storage, 002 RPCs, 003 lia_memory
.github/workflows/        # ci.yml (typecheck/build/test/lint/secret-scan/audit), cd.yml (Vercel, manual na main)
```

## Segurança
- **Auth**: Supabase Auth (e-mail+senha). JWT validado server-side em `getUserFromRequest`. Cookies httpOnly.
- **Isolamento**: RLS em todas as tabelas via `study_profile.user_id = auth.uid()`. Handlers também checam ownership (defesa em profundidade → 403).
- **Storage**: bucket `documents` privado; path `user_id/profile_id/hash-nome`; policy confirma `auth.uid()`.
- **Segredos**: só em env vars (Vercel/Supabase). `NVIDIA_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` nunca no frontend nem no git. CI tem TruffleHog.
- **LIA**: system prompt proíbe inventar; exige citações `[doc: ...]` e marcadores `[incerteza: ...]`; `verify.ts` valida cálculos.

## Variáveis de ambiente necessárias
| Variável | Onde configurar | Uso |
|---|---|---|
| `SUPABASE_URL` | Vercel (Production+Preview) | REST/Storage/Auth da API |
| `SUPABASE_ANON_KEY` | Vercel | login (token grant) |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel (**secret**) | db.ts server-side |
| `NVIDIA_API_KEY` | Vercel (**secret**) | LIA chat + embeddings |
| `NVIDIA_MODEL` (opcional) | Vercel | default `nvidia/nemotron-3-ultra` |
| `NVIDIA_EMBED_MODEL` (opcional) | Vercel | default `nvidia/nv-embed-v1` |
| `USE_MOCK_DB=1` | só local/CI de integração | usa mock em memória |
| `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` | GitHub Secrets | CD (deploy) |

## Fluxo da LIA (Fase 4)
1. `POST /api/profiles/[id]/lia/chat` recebe `message`.
2. Monta contexto: system prompt + memória verificada + RAG (embedding da query → `vector_search` → citações) + histórico.
3. Loop (máx 5): chama NVIDIA com `tools`; se houver `tool_calls`, executa no servidor (RLS) e realimenta; faz stream SSE dos tokens.
4. Ao final, `verifyResponse` sinaliza incerteza/cálculos e envia `citations` + `verification` no evento `done`.
5. Mensagens persistem em `lia_message` (RLS).
