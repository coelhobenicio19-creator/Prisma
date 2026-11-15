// ============================================================
// LIA — Executor de ferramentas (server-side)
// Cada ferramenta chama a camada db com o profile_id do usuário.
// ============================================================

import { db } from '../db';

export interface ToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

export interface ToolResult {
  tool_call_id: string;
  role: 'tool';
  name: string;
  content: string;
}

/**
 * Executa uma tool call da LIA e retorna o resultado em formato de mensagem.
 * Todas as ferramentas verificam ownership implicitamente via profile_id + RLS.
 */
export async function executeToolCall(
  call: ToolCall,
  profileId: string,
  userId: string
): Promise<ToolResult> {
  let args: any = {};
  try { args = JSON.parse(call.function.arguments || '{}'); } catch { /* args vazio */ }

  try {
    switch (call.function.name) {
      case 'search_documents': {
        const q = String(args.query ?? '');
        const limit = Number(args.limit ?? 5);
        const rows = await db.search(profileId, q, limit);
        const formatted = rows.map((r) => `[fonte: ${r.entity_type}/${r.title}] ${r.snippet}`).join('\n---\n');
        return {
          tool_call_id: call.id, role: 'tool', name: call.function.name,
          content: rows.length
            ? `Trechos encontrados (${rows.length}):\n${formatted}`
            : 'Nenhum trecho relevante encontrado nos documentos.',
        };
      }

      case 'get_dashboard': {
        const data = await db.dashboard(profileId);
        return {
          tool_call_id: call.id, role: 'tool', name: call.function.name,
          content: JSON.stringify(data, null, 2),
        };
      }

      case 'list_due_cards': {
        const limit = Number(args.limit ?? 20);
        const cards = await db.getDueFlashcards(profileId, limit);
        return {
          tool_call_id: call.id, role: 'tool', name: call.function.name,
          content: cards.length
            ? `Flashcards devidos (${cards.length}):\n` + cards.map((c) => `- ${c.front} (deck ${c.deck_id})`).join('\n')
            : 'Nenhum flashcard devido agora.',
        };
      }

      case 'create_flashcards': {
        const deckId = String(args.deck_id ?? '');
        const cards = Array.isArray(args.cards) ? args.cards : [];
        if (!deckId || cards.length === 0) {
          return { tool_call_id: call.id, role: 'tool', name: call.function.name, content: 'Erro: deck_id e cards obrigatórios.' };
        }
        const deck = await db.getDeck(deckId);
        if (!deck || deck.profile_id !== profileId) {
          return { tool_call_id: call.id, role: 'tool', name: call.function.name, content: 'Erro: deck não encontrado ou sem permissão.' };
        }
        const created = [];
        for (const c of cards.slice(0, 50)) { // limite de segurança
          const card = await db.createFlashcard({
            deck_id: deckId, profile_id: profileId,
            type: 'basic', front: String(c.front), back: String(c.back),
            extra_data: null, tags: Array.isArray(c.tags) ? c.tags.map(String) : [],
            source_type: 'lia', source_id: null,
            difficulty: 0.5, stability: 0, retrievability: 0, reps: 0, lapses: 0,
          });
          created.push({ id: card.id, front: card.front });
        }
        return {
          tool_call_id: call.id, role: 'tool', name: call.function.name,
          content: `${created.length} flashcards criados no deck "${deck.name}":\n` + created.map((c) => `- ${c.front}`).join('\n'),
        };
      }

      case 'create_questions': {
        const qs = Array.isArray(args.questions) ? args.questions : [];
        if (qs.length === 0) {
          return { tool_call_id: call.id, role: 'tool', name: call.function.name, content: 'Erro: questions vazio.' };
        }
        const created = [];
        for (const q of qs.slice(0, 30)) {
          const question = await db.createQuestion({
            profile_id: profileId,
            stem: String(q.stem), type: 'multiple_choice',
            alternatives: q.alternatives ?? null,
            correct_answer: q.correct_answer ? String(q.correct_answer) : null,
            explanation: q.explanation ? String(q.explanation) : null,
            subject: args.subject ? String(args.subject) : null,
            topic: args.topic ? String(args.topic) : null,
            difficulty: 0.5, source_type: 'lia', source_id: null,
            tags: [],
          });
          created.push({ id: question.id, stem: question.stem });
        }
        return {
          tool_call_id: call.id, role: 'tool', name: call.function.name,
          content: `${created.length} questões criadas:\n` + created.map((q) => `- ${q.stem}`).join('\n'),
        };
      }

      case 'schedule_review': {
        const c = await db.createCommitment({
          profile_id: profileId,
          title: String(args.title ?? 'Revisão'),
          description: args.description ? String(args.description) : null,
          type: 'review',
          start_at: String(args.start_at),
          end_at: String(args.end_at),
          all_day: false, location: null, recurrence_rule: null,
          source_type: 'lia', source_id: null,
        });
        return {
          tool_call_id: call.id, role: 'tool', name: call.function.name,
          content: `Revisão agendada: "${c.title}" de ${c.start_at} até ${c.end_at} (id ${c.id}).`,
        };
      }

      default:
        return { tool_call_id: call.id, role: 'tool', name: call.function.name, content: `Ferramenta desconhecida: ${call.function.name}` };
    }
  } catch (e: any) {
    return { tool_call_id: call.id, role: 'tool', name: call.function.name, content: `Erro ao executar ${call.function.name}: ${e.message}` };
  }
}
