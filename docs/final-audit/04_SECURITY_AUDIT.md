# 04_SECURITY_AUDIT.md — 2026-11-14

## Vulnerabilidades encontradas e corrigidas nesta auditoria

| # | Gravidade | Local | Problema | Correção | Prova |
|---|---|---|---|---|---|
| 1 | **CRÍTICA** | `Onboarding.tsx:95`, `Settings.tsx` | Chave API NVIDIA coletada no navegador e gravada em `localStorage('prisma_ai_key_temp')` — exposição de credencial (XSS/leitura de storage vazaria a chave) | Inputs de chave removidos das duas páginas; texto explica que a chave vive só no servidor (`NVIDIA_API_KEY` no Vercel). Backend já usava só `process.env` | grep `sk-`/`localStorage.*key` limpo; tsc+lint+build ok |
| 2 | **ALTA** | `package.json` → `@vercel/node` | busboy/undici DoS + CRLF injection (GHSA-x8mw-p69m-v3mx, GHSA-gxm5-99cw-xjw9) | pacote removido; tipos locais `api/_lib/vercel-types.ts` mapeados via `tsconfig.api.json` paths | `npm audit --audit-level high` → 0 |
| 3 | média | vite/esbuild | advisory dev-server esbuild ≤0.24.2 | override `esbuild@^0.25` | build passa; audit high 0 |
| 4 | média | código misto | `target="_blank"` sem `rel="noreferrer"`, entidades não escapadas | `eslint --fix` + regras | lint 0 warnings |

## Verificações feitas (estado atual)
- **Segredos no repo:** scan por `sk-…`, JWTs, private keys, arquivos `.env` → **limpo**. `.env` nunca commitado.
- **SERVICE_ROLE_KEY:** usada só em `api/` (servidor), nunca importada no frontend (`src/`). O cliente usa cookie httpOnly (`credentials: 'include'`).
- **Autenticação:** Supabase Auth e-mail/senha; JWT validado server-side em `getUserFromRequest`; cookie httpOnly; 401 → redirect /login no cliente. MOCK só com `USE_MOCK_DB=1` (CI/local), nunca em produção.
- **Autorização:** todo endpoint verifica `profile.user_id === user.id` (403 caso contrário); RLS no banco com `user_id = auth.uid()`; teste de isolamento em `supabase/tests/rls_isolation.sql` (aguarda execução no Supabase real).
- **Upload:** bucket `documents` privado, path `user_id/profile_id/…`, policy no migration 001. Validação de tipo/tamanho no endpoint upload.
- **XSS:** React escapa por padrão; `dangerouslySetInnerHTML` — nenhum uso encontrado no src.
- **SQL injection:** acesso só via Supabase REST com service role e parâmetros na query string/POST body — sem concatenação SQL no código da API. RPCs usam parâmetros nomeados.
- **CSRF:** cookie de sessão + mesma origem; API exige JSON e valida sessão; rotas mutantes são POST com body — estado não muda via GET.
- **Prompt injection em PDFs:** LIA trata conteúdo de documentos como dados (system prompt instrui a não seguir instruções do documento); citações só de RAG real `[doc: …]`.
- **Rate limit / 429 NVIDIA:** `lia/chat.ts` trata erros da NVIDIA e propaga mensagem clara; retry/limit fica no free tier da NVIDIA (documentado em 08).
- **CORS:** API mesma origem (Vercel serve front+api); sem CORS aberto configurado.

## Pendente (bloqueio externo)
- Execução real dos testes RLS no Supabase (precisa projeto criado).
- Verificação de isolation entre dois usuários reais pós-deploy (E2E).
