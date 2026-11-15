// /api/profiles/[id]/lia/chat — POST { conversation_id?, message }
// Loop de agente completo: RAG + memória + tool calling + streaming SSE.
// A chave NVIDIA fica só aqui (env do servidor). Nunca exposta ao cliente.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { error, readBody, requireUser, methodNotAllowed } from '../../../_lib/http';
import { db } from '../../../_lib/db';
import { LIA_SYSTEM_PROMPT, LIA_TOOL_DEFINITIONS } from '../../../_lib/lia/system';
import { executeToolCall, ToolCall } from '../../../_lib/lia/tools';
import { ragSearch, formatCitations } from '../../../_lib/lia/rag';
import { memory } from '../../../_lib/lia/memory';
import { verifyResponse } from '../../../_lib/lia/verify';

export const config = { api: { bodyParser: true }, maxDuration: 60 };

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY ?? '';
const NVIDIA_BASE = process.env.NVIDIA_BASE_URL ?? 'https://integrate.api.nvidia.com/v1';
const NVIDIA_MODEL = process.env.NVIDIA_MODEL ?? 'nvidia/nemotron-3-ultra';
const MAX_TOOL_ITERATIONS = 5;

type ChatMessage = { role: string; content: string; tool_calls?: any[]; tool_call_id?: string; name?: string };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireUser(req, res);
  if (!user) return;
  if (req.method !== 'POST') return methodNotAllowed(res);

  const profileId = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  const profile = await db.getProfile(profileId);
  if (!profile || profile.user_id !== user.id) return error(res, 403, 'Acesso negado', 'FORBIDDEN');

  const body = await readBody(req);
  const message = String(body.message ?? '');
  if (!message) return error(res, 400, 'message é obrigatório', 'VALIDATION');
  if (body.conversation_id) {
    const conversation = await db.gGet<{ profile_id: string }>('lia_conversation', String(body.conversation_id));
    if (!conversation || conversation.profile_id !== profileId) return error(res, 404, 'Conversa não encontrada', 'NOT_FOUND');
  }

  const mockMode = process.env.USE_MOCK_DB === '1' || !NVIDIA_API_KEY;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Cria ou reutiliza conversa
  let conversationId: string = body.conversation_id ? String(body.conversation_id) : '';
  if (!conversationId) {
    const conv = await db.createConversation({ profile_id: profileId, title: message.slice(0, 60), model: NVIDIA_MODEL });
    conversationId = conv.id;
  }
  const send = (obj: unknown) => res.write(`data: ${JSON.stringify(obj)}\n\n`);
  send({ conversation_id: conversationId });

  // ---- MOCK MODE (testes locais sem chave) ----
  if (mockMode) {
    await db.addMessage({ conversation_id: conversationId, profile_id: profileId, role: 'user', content: message });
    const reply = `[LIA mock] Recebi: "${message}". Configure NVIDIA_API_KEY no Vercel para habilitar a IA real (RAG + ferramentas + Nemotron).`;
    for (const tok of reply.split(' ')) { send({ token: tok + ' ' }); await new Promise((r) => setTimeout(r, 5)); }
    await db.addMessage({ conversation_id: conversationId, profile_id: profileId, role: 'assistant', content: reply });
    send({ done: true, full_text: reply });
    res.write('data: [DONE]\n\n');
    return res.end();
  }

  // ---- MODO REAL: monta contexto (memória + perfil de conhecimento permitido + RAG + histórico) ----
  const memBlock = await memory.formatForPrompt(profileId);
  const citations = await ragSearch(profileId, message, 5);
  const ragBlock = formatCitations(citations);
  // perfil de conhecimento: só entradas com allow_lia=true (consentimento do usuário), máx 20 p/ economizar tokens
  const kEntries = (await db.gList<any>('knowledge_entry', profileId))
    .filter((e) => e.allow_lia !== false)
    .slice(0, 20)
    .map((e) => `- [${e.kind}] ${e.subject}${e.topic ? ` · ${e.topic}` : ''} (confiança ${e.confidence})`)
    .join('\n');
  const knowledgeBlock = kEntries ? `\n\n## CONHECIMENTO DO USUÁRIO (só o que ele autorizou; declarado ≠ provado)\n${kEntries}\nDiferencie: declarado (usuário diz que sabe), demonstrado (resultados), inferido (estimativa com incerteza).` : '';

  const systemContent = LIA_SYSTEM_PROMPT +
    `\n\n## CONTEXTO DO PERFIL\nObjetivo: ${profile.goal_type}${profile.goal_description ? ` — ${profile.goal_description}` : ''}` +
    memBlock + knowledgeBlock + ragBlock;

  const history = await db.getConversationMessages(conversationId);
  const messages: ChatMessage[] = [
    { role: 'system', content: systemContent },
    ...history.map((m) => ({ role: m.role, content: m.content, tool_calls: m.tool_calls, tool_call_id: m.tool_call_id, name: m.name })),
    { role: 'user', content: message },
  ];

  // Salva mensagem do usuário
  await db.addMessage({ conversation_id: conversationId, profile_id: profileId, role: 'user', content: message });

  // ---- LOOP DE AGENTE: chama NVIDIA, executa ferramentas, repete ----
  let fullText = '';
  try {
    for (let iter = 0; iter < MAX_TOOL_ITERATIONS; iter++) {
      const upstream = await fetch(`${NVIDIA_BASE}/chat/completions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${NVIDIA_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: NVIDIA_MODEL,
          messages,
          tools: LIA_TOOL_DEFINITIONS,
          tool_choice: 'auto',
          stream: true,
          temperature: 0.6,
          max_tokens: 2048,
        }),
      });
      if (!upstream.ok || !upstream.body) {
        send({ error: `NVIDIA ${upstream.status}` });
        break;
      }

      const reader = upstream.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      const assistantMsg: ChatMessage = { role: 'assistant', content: '' };
      const toolCalls: ToolCall[] = [];

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        // SSE: linhas "data: {...}"
        let idx;
        while ((idx = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, idx).trim();
          buffer = buffer.slice(idx + 1);
          if (!line.startsWith('data:')) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === '[DONE]') continue;
          try {
            const evt = JSON.parse(payload);
            const choice = evt.choices?.[0];
            const delta = choice?.delta ?? {};
            if (delta.content) {
              assistantMsg.content += delta.content;
              fullText += delta.content;
              send({ token: delta.content });
            }
            if (delta.tool_calls) {
              for (const tc of delta.tool_calls) {
                const i = tc.index ?? 0;
                if (!toolCalls[i]) toolCalls[i] = { id: tc.id ?? `call_${i}`, type: 'function', function: { name: '', arguments: '' } };
                if (tc.function?.name) toolCalls[i].function.name = tc.function.name;
                if (tc.function?.arguments) toolCalls[i].function.arguments += tc.function.arguments;
                if (tc.id) toolCalls[i].id = tc.id;
              }
            }
            if (choice?.finish_reason === 'tool_calls' || choice?.finish_reason === 'stop') {
              // fim desta rodada
            }
          } catch { /* ignora */ }
        }
      }

      // Se não houve tool calls, terminou
      if (toolCalls.length === 0) break;

      // Registra a mensagem do assistente com tool_calls
      assistantMsg.tool_calls = toolCalls.map((t) => ({ id: t.id, type: 'function', function: t.function }));
      messages.push(assistantMsg);
      send({ tool_start: toolCalls.map((t) => t.function.name) });

      // Executa cada ferramenta e adiciona o resultado
      for (const tc of toolCalls) {
        send({ tool_executing: tc.function.name });
        const result = await executeToolCall(tc, profileId, user.id);
        messages.push({ role: 'tool', tool_call_id: tc.id, name: tc.function.name, content: result.content });
        send({ tool_result: { name: tc.function.name, preview: result.content.slice(0, 200) } });
      }
    }

    // Persiste resposta final do assistente
    if (fullText) {
      await db.addMessage({ conversation_id: conversationId, profile_id: profileId, role: 'assistant', content: fullText });
    }
    const verification = verifyResponse(fullText, citations.length > 0);
    send({
      done: true,
      full_text: fullText,
      citations: citations.map((c) => ({ title: c.title, document_id: c.document_id, similarity: c.similarity })),
      verification,
    });
    res.write('data: [DONE]\n\n');
    return res.end();
  } catch (e: any) {
    send({ error: e.message ?? 'Falha no chat' });
    res.write('data: [DONE]\n\n');
    return res.end();
  }
}
