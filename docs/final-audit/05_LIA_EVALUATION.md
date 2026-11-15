# 05_LIA_EVALUATION.md — 2026-11-14

## O que está implementado (código real, testado em unit)
- **Endpoint:** `api/profiles/[id]/lia/chat.ts` — agent loop com SSE, máx. iterações, ferramentas tipadas.
- **Modelo:** NVIDIA Nemotron 3 Ultra via `https://integrate.api.nvidia.com/v1` (env `NVIDIA_API_KEY`, `NVIDIA_MODEL` opcional). Sem chave → modo mock explícito (`[LIA mock] …`), nunca inventa resposta.
- **Ferramentas (6, testadas em `tests/lia-tools.test.ts`, 10 testes):** search_documents (RAG pgvector), create_flashcards, create_questions, compute (matemática determinística server-side), get_stats (dashboard), plan_study.
- **RAG:** embeddings `nv-embed-v1` (1536-dim) em `lia/rag.ts`; citações `[doc: título]` só de hits reais; sem hits → diz que não encontrou.
- **Verificação (`lia/verify.ts`, 6 testes):** marca `[incerteza: alta|média|baixa]`, detecta matemática sem suporte e citações inventadas.
- **Memória (`lia/memory.ts` + migration 003):** opt-in, só armazena com fonte e confiança ≥ 0.8; RLS por usuário.
- **Segurança:** prompt de sistema anti prompt-injection de documentos; tool calls validadas (args tipados, limites).

## O que NÃO foi validado (bloqueio real, não simulado)
- **Chamada real à NVIDIA:** exige `NVIDIA_API_KEY` configurada no Vercel + deploy autorizado. Até lá, o comportamento real da API (latência, 429, truncamento) é **PENDENTE**.
- **E2E da LIA no navegador** (streaming SSE, interrupção): scaffold existe, não executado sem servidor no ar.

## Avaliação honesta
- A lógica do agente (loop, ferramentas, RAG, verificação) está implementada e coberta por 16 testes unitários determinísticos.
- A qualidade das respostas do Nemotron em si só será aferível com a chave real no servidor — não há evidência disso ainda, e não invento.
