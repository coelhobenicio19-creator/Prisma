import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  ArrowUp,
  Sparkles,
  Plus,
  MessageSquare,
  BookOpen,
  Network,
  Brain,
  Loader2,
} from "lucide-react";
import { useProfileStore } from "@/store";
import { Button } from "@/components/ui/Button";
import { VoiceControls } from "@/components/VoiceControls";
import {
  listConversations,
  getConversation,
  liaChat,
  LiaConversation,
  LiaMessage,
} from "@/services/api";

const prompts = [
  {
    Icon: BookOpen,
    title: "Entender um conceito",
    text: "Ajude-me a entender um conceito dos meus materiais. Comece perguntando qual assunto quero explorar.",
  },
  {
    Icon: Network,
    title: "Conectar ideias",
    text: "Quero conectar dois assuntos que estou estudando. Ajude-me a encontrar relações entre eles.",
  },
  {
    Icon: Brain,
    title: "Praticar o que aprendi",
    text: "Quero praticar um assunto com perguntas. Pergunte o tópico e meu nível antes de começar.",
  },
];
export function LIAPage() {
  const pid = useProfileStore((state) => state.currentProfile?.id ?? null);
  const [conversations, setConversations] = useState<LiaConversation[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<LiaMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState("");
  const bottom = useRef<HTMLDivElement>(null);
  const generation = useRef(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const current = ++generation.current;
    setConversationId(null);
    setMessages([]);
    setInput("");
    setError("");
    setConversations([]);
    setBusy(false);
    setOpening(false);
    if (pid)
      listConversations(pid)
        .then((items) => {
          if (current === generation.current) setConversations(items);
        })
        .catch(() => {
          if (current === generation.current)
            setError("Não foi possível carregar as conversas anteriores.");
        });
    return () => {
      generation.current++;
    };
  }, [pid]);
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "instant", block: "nearest" });
  }, [messages]);
  const open = async (id: string) => {
    if (!pid || busy) return;
    setOpening(true);
    setError("");
    const current = ++generation.current;
    try {
      const items = await getConversation(pid, id);
      if (current === generation.current) {
        setConversationId(id);
        setMessages(
          items.filter(
            (item) => item.role === "user" || item.role === "assistant",
          ),
        );
      }
    } catch {
      if (current === generation.current)
        setError("Não foi possível abrir esta conversa. Tente novamente.");
    } finally {
      if (current === generation.current) setOpening(false);
    }
  };
  const fresh = () => {
    if (busy) return;
    generation.current++;
    setOpening(false);
    setConversationId(null);
    setMessages([]);
    setError("");
    inputRef.current?.focus();
  };
  const send = async (event?: React.FormEvent) => {
    event?.preventDefault();
    const text = input.trim();
    if (!pid || !text || busy || opening) return;
    const current = ++generation.current;
    setBusy(true);
    setError("");
    setInput("");
    const answerId = crypto.randomUUID();
    setMessages((old) => [
      ...old,
      {
        id: crypto.randomUUID(),
        conversation_id: conversationId ?? "",
        role: "user",
        content: text,
        created_at: new Date().toISOString(),
      },
      {
        id: answerId,
        conversation_id: conversationId ?? "",
        role: "assistant",
        content: "",
        created_at: new Date().toISOString(),
      },
    ]);
    try {
      const result = await liaChat(pid, conversationId, text, (token) => {
        if (current === generation.current)
          setMessages((old) =>
            old.map((message) =>
              message.id === answerId
                ? { ...message, content: message.content + token }
                : message,
            ),
          );
      });
      if (current === generation.current) {
        setConversationId(result.conversation_id || conversationId);
        setMessages((old) =>
          old.map((message) =>
            message.id === answerId
              ? { ...message, content: result.full_text || message.content }
              : message,
          ),
        );
        listConversations(pid)
          .then((items) => {
            if (current === generation.current) setConversations(items);
          })
          .catch(() => {});
      }
    } catch (err) {
      if (current === generation.current) {
        setError(
          err instanceof Error
            ? err.message
            : "Não foi possível obter uma resposta. Confira a configuração da LIA.",
        );
        setMessages((old) =>
          old.filter((message) => message.id !== answerId || message.content),
        );
        setInput(text);
      }
    } finally {
      if (current === generation.current) setBusy(false);
    }
  };
  return (
    <div className="lia-page animate-fade-in">
      <div className="flex items-end justify-between gap-5 mb-7">
        <div>
          <span className="section-eyebrow">IDEIAS QUE VÃO ALÉM</span>
          <h1 className="text-3xl font-normal tracking-tighter mt-3">
            Um novo ponto de vista.
          </h1>
          <p className="module-intro mt-2">
            Explore seus materiais e aprofunde suas perguntas com a LIA.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={fresh} disabled={busy}>
          <Plus size={13} />
          Nova conversa
        </Button>
      </div>
      <div className="lia-layout">
        <aside className="lia-history">
          <div className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-text-muted mb-5">
            <MessageSquare size={12} />
            Suas conversas
          </div>
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              disabled={busy || opening}
              onClick={() => void open(conversation.id)}
              aria-pressed={conversationId === conversation.id}
            >
              {conversation.title || "Uma nova conversa"}
              <small>
                {new Date(conversation.updated_at).toLocaleDateString("pt-BR")}
              </small>
            </button>
          ))}
          {conversations.length === 0 && (
            <p className="text-[11px] leading-relaxed text-text-muted">
              Suas ideias começam aqui. Abra uma conversa para explorar uma nova
              conexão.
            </p>
          )}
          <Link
            to="/library"
            className="text-[10px] text-accent flex items-center gap-2 mt-7"
          >
            Ir à biblioteca <ArrowUpRight size={12} />
          </Link>
        </aside>
        <section className="lia-conversation" aria-label="Conversa com a LIA">
          <div className="lia-conversation-top">
            <span>
              <Sparkles size={14} />
              LIA <i /> Laboratório de Inteligência Acadêmica
            </span>
            <Link to="/settings" aria-label="Configurar LIA">
              <ArrowUpRight size={13} />
            </Link>
          </div>
          <div className="lia-messages">
            {opening ? (
              <div className="lia-welcome" role="status">
                <Loader2 className="animate-spin" />
                <p>Abrindo sua conversa…</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="lia-welcome">
                <span className="lia-welcome-icon">
                  <Sparkles size={27} strokeWidth={1} />
                </span>
                <span className="section-eyebrow mt-7">
                  UM UNIVERSO DE POSSIBILIDADES
                </span>
                <h2>
                  Onde sua curiosidade
                  <br />
                  vai levar você hoje?
                </h2>
                <p>Uma pergunta pode ser o começo de uma grande conexão.</p>
                <div className="lia-prompts">
                  {prompts.map(({ Icon, title, text }) => (
                    <button
                      key={title}
                      onClick={() => {
                        setInput(text);
                        inputRef.current?.focus();
                      }}
                      disabled={!pid}
                    >
                      <Icon size={17} strokeWidth={1.3} />
                      <span>{title}</span>
                      <ArrowUpRight size={11} />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <article
                  key={message.id}
                  className={`lia-message ${message.role === "user" ? "from-user" : "from-lia"}`}
                >
                  <div className="lia-message-label">
                    {message.role === "user" ? (
                      "VOCÊ"
                    ) : (
                      <>
                        <Sparkles size={11} />
                        LIA
                      </>
                    )}
                  </div>
                  <div className="whitespace-pre-wrap leading-[1.9] text-[13px] break-words">
                    {message.content || (
                      <span className="flex items-center gap-2 text-text-muted">
                        <Loader2 size={12} className="animate-spin" />
                        Explorando sua pergunta…
                      </span>
                    )}
                  </div>
                </article>
              ))
            )}
            <div ref={bottom} />
          </div>
          <div className="lia-composer-area">
            {error && (
              <p role="alert" className="text-xs text-error mb-3">
                {error}{" "}
                <Link className="underline" to="/settings">
                  Ver configurações
                </Link>
              </p>
            )}
            <form onSubmit={send} className="lia-composer">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey &&
                    !event.nativeEvent.isComposing
                  ) {
                    event.preventDefault();
                    void send();
                  }
                }}
                placeholder={
                  pid
                    ? "Uma pergunta. Uma nova conexão."
                    : "Configure um perfil para conversar com a LIA."
                }
                aria-label="Mensagem para a LIA"
                rows={2}
                disabled={!pid || opening}
              />
              <div className="flex items-center justify-between">
                <VoiceControls
                  onTranscript={(text) =>
                    setInput((old) => `${old}${old ? " " : ""}${text}`)
                  }
                />
                <button
                  className="lia-send"
                  aria-label="Enviar mensagem"
                  disabled={!pid || !input.trim() || busy || opening}
                >
                  {busy ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <ArrowUp size={16} />
                  )}
                </button>
              </div>
            </form>
            <p className="lia-disclaimer">
              A LIA pode cometer erros. Confira informações importantes nas
              fontes.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
