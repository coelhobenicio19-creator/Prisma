import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowDown,
  Network,
  BookOpen,
  Sparkles,
  Layers,
  Pause,
  Play,
  Lock,
  Eye,
  EyeOff,
  Check,
  ChevronRight,
} from "lucide-react";
import { login } from "@/services/tauri";
import { PrismaMark } from "@/components/PrismaMark";
import { Constellation3D } from "@/components/Constellation3D";
import { Atlas3DGraph } from "@/components/Atlas3DGraph";
import type { NodeState } from "@/utils/atlas";
import "@/styles/landing.css";

const demoNodes = [
  { id: "m1", subject: "Matemática", topic: "Funções" },
  { id: "m2", subject: "Matemática", topic: "Equações" },
  { id: "m3", subject: "Matemática", topic: "Geometria" },
  { id: "f1", subject: "Física", topic: "Cinemática" },
  { id: "f2", subject: "Física", topic: "Energia" },
  { id: "f3", subject: "Física", topic: "Ondas" },
  { id: "b1", subject: "Biologia", topic: "Células" },
  { id: "b2", subject: "Biologia", topic: "Genética" },
  { id: "b3", subject: "Biologia", topic: "Ecologia" },
  { id: "q1", subject: "Química", topic: "Átomos" },
  { id: "q2", subject: "Química", topic: "Ligações" },
  { id: "q3", subject: "Química", topic: "Reações" },
];
const demoEdges = [
  { from_node: "m2", to_node: "m1" },
  { from_node: "m1", to_node: "f1" },
  { from_node: "f1", to_node: "f2" },
  { from_node: "q1", to_node: "q2" },
  { from_node: "b1", to_node: "b2" },
  { from_node: "q2", to_node: "b1" },
];
const demoStates: Record<string, NodeState> = {
  m1: "em estudo",
  m2: "dominado",
  m3: "não iniciado",
  f1: "em estudo",
  f2: "dificuldade",
  f3: "não iniciado",
  b1: "dominado",
  b2: "em estudo",
  b3: "não iniciado",
  q1: "dominado",
  q2: "em estudo",
  q3: "não iniciado",
};

export function Landing() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [paused, setPaused] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [selected, setSelected] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.12 },
    );
    root.current
      ?.querySelectorAll(".landing-reveal")
      .forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);
  const enter = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      window.location.assign("/dashboard");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível entrar. Confira seus dados e tente novamente.",
      );
      setLoading(false);
    }
  };
  const selectedNode = demoNodes.find((node) => node.id === selected);
  return (
    <div
      ref={root}
      className={`prisma-landing ${paused ? "motion-paused" : ""}`}
    >
      <a className="landing-skip" href="#conteudo">
        Pular para o conteúdo
      </a>
      <header className="landing-nav">
        <a href="#" className="landing-brand" aria-label="Prisma — início">
          <PrismaMark size={31} />
          <span>PRISMA</span>
        </a>
        <nav aria-label="Página de apresentação">
          <a href="#atlas">Explore o Atlas</a>
          <a href="#metodo">Seu jeito de aprender</a>
        </nav>
        <a className="landing-nav-enter" href="#entrar">
          Entrar no meu espaço <ArrowUpRight size={13} />
        </a>
      </header>
      <main id="conteudo">
        <section className="landing-hero">
          <div className="hero-copy">
            <div className="landing-eyebrow hero-enter">
              <span />
              SEU UNIVERSO DE APRENDIZADO
            </div>
            <h1 className="hero-enter">
              Grandes ideias.
              <br />
              Novas <em>conexões.</em>
            </h1>
            <p className="hero-enter hero-description">
              O que você aprende não precisa ficar espalhado.
              <br className="hidden sm:block" /> Conecte seu conhecimento,
              encontre seu caminho
              <br className="hidden sm:block" /> e transforme curiosidade em
              evolução.
            </p>
            <div className="hero-actions hero-enter">
              <a href="#entrar" className="landing-button">
                Acessar meu espaço <ArrowUpRight size={15} />
              </a>
              <a href="#atlas" className="landing-text-link">
                Conheça o Prisma <ArrowRight size={14} />
              </a>
            </div>
            <div className="hero-caption hero-enter">
              <span className="caption-line" />
              APRENDER É ENXERGAR AS CONEXÕES.
            </div>
          </div>
          <div className="hero-universe">
            <Constellation3D className="hero-constellation" paused={paused} />
            <div className="universe-coordinate universe-top">
              <span>FIG. 01 — CONHECIMENTO CONECTADO</span>
              <span>PRISMA / ATLAS</span>
            </div>
            <div className="universe-coordinate universe-bottom">
              <span>
                <i /> UM UNIVERSO EM EXPANSÃO
              </span>
              <button
                onClick={() => setPaused((value) => !value)}
                aria-label={paused ? "Ativar animação" : "Pausar animação"}
              >
                {paused ? <Play size={11} /> : <Pause size={11} />}
              </button>
            </div>
            <div className="universe-note">
              <span className="note-orbit">
                <Network size={16} />
              </span>
              <div>
                <strong>Tudo se conecta.</strong>
                <span>Uma ideia abre novos caminhos.</span>
              </div>
              <ArrowUpRight size={12} />
            </div>
          </div>
          <a href="#descubra" className="hero-scroll">
            <ArrowDown size={12} />
            <span>EXPLORE SEU PRÓXIMO PASSO</span>
          </a>
        </section>
        <section id="descubra" className="landing-paths">
          {[
            {
              n: "01",
              title: "Enxergue o todo",
              desc: "Seu conhecimento, em um mapa vivo.",
              Icon: Network,
              href: "#atlas",
            },
            {
              n: "02",
              title: "Aprofunde suas ideias",
              desc: "Materiais e LIA no mesmo lugar.",
              Icon: Sparkles,
              href: "#metodo",
            },
            {
              n: "03",
              title: "Faça o aprendizado ficar",
              desc: "Pratique, revise e siga em frente.",
              Icon: Layers,
              href: "#recall",
            },
          ].map(({ n, title, desc, Icon, href }) => (
            <a key={n} href={href} className="landing-path">
              <span className="path-number">{n}</span>
              <div>
                <Icon size={19} />
                <h2>{title}</h2>
                <p>{desc}</p>
              </div>
              <ArrowUpRight size={15} />
            </a>
          ))}
        </section>
        <section id="atlas" className="landing-atlas landing-reveal">
          <div className="landing-section-head">
            <div>
              <span className="landing-eyebrow">
                01 / ATLAS DE CONHECIMENTO
              </span>
              <h2>
                Não são assuntos isolados.
                <br />É o <em>seu universo.</em>
              </h2>
            </div>
            <p>
              Veja o que você já domina, descubra o que precisa de atenção e
              encontre relações que tornam o aprendizado mais claro.
            </p>
          </div>
          <div className="landing-atlas-window">
            <div className="atlas-window-bar">
              <span>
                <Network size={13} /> Atlas de conhecimento
              </span>
              <span className="demo-label">DEMONSTRAÇÃO INTERATIVA</span>
              <span className="window-dots">
                <i />
                <i />
                <i />
              </span>
            </div>
            <Atlas3DGraph
              nodes={demoNodes}
              edges={demoEdges}
              states={demoStates}
              selectedId={selected}
              onSelect={setSelected}
              height={500}
            />
            <div className="atlas-window-bottom">
              <span aria-live="polite">
                {selectedNode
                  ? `${selectedNode.subject} / ${selectedNode.topic} — ${demoStates[selectedNode.id]}`
                  : "Arraste o mapa. Selecione um tópico. Descubra as conexões."}
              </span>
              <span>Dados ilustrativos</span>
            </div>
          </div>
          <div className="atlas-caption">
            <span>Seu ponto de partida não define até onde você pode ir.</span>
            <a href="#entrar">
              Explore o seu Atlas <ArrowUpRight size={13} />
            </a>
          </div>
        </section>
        <section id="metodo" className="landing-method landing-reveal">
          <div className="method-copy">
            <span className="landing-eyebrow">02 / APRENDA COM CONTEXTO</span>
            <h2>
              Uma boa pergunta.
              <br />
              Infinitas <em>possibilidades.</em>
            </h2>
            <p>
              Traga seus materiais para a biblioteca. Investigue ideias com a
              LIA. Conecte uma dúvida ao que você já sabe.
            </p>
            <a href="#entrar" className="landing-text-link">
              Conhecer meu espaço <ArrowRight size={14} />
            </a>
            <div className="method-footnote">
              <BookOpen size={14} />
              <span>
                Seu estudo ganha contexto.
                <br />
                Suas ideias ganham continuidade.
              </span>
            </div>
          </div>
          <div className="lia-preview">
            <div className="lia-preview-head">
              <span className="lia-symbol">
                <Sparkles size={18} />
              </span>
              <div>
                <strong>LIA</strong>
                <span>Um novo ponto de vista para suas ideias</span>
              </div>
              <span className="demo-label">EXEMPLO</span>
            </div>
            <div className="lia-question">
              Como a matemática ajuda a entender o movimento?
            </div>
            <div className="lia-answer">
              <span className="lia-answer-label">
                <Sparkles size={12} /> CONECTANDO IDEIAS
              </span>
              <p>
                Uma função pode descrever como a posição muda com o tempo. Sua
                taxa de variação nos ajuda a entender a velocidade.
              </p>
              <div className="lia-equation">
                posição <span>→</span> variação <span>→</span> velocidade
              </div>
              <span className="lia-related">
                <Network size={12} /> Matemática <ChevronRight size={10} />{" "}
                Física
              </span>
            </div>
            <div className="lia-preview-input">
              <span>Uma nova conexão começa com uma pergunta.</span>
              <ArrowUpRight size={15} />
            </div>
          </div>
        </section>
        <section id="recall" className="landing-recall landing-reveal">
          <div className="recall-art" aria-hidden="true">
            <div className="recall-orbit" />
            <div className="recall-card recall-card-back">
              <Layers size={22} />
            </div>
            <div className="recall-card recall-card-front">
              <span>RECALL / EXEMPLO</span>
              <BookOpen size={23} />
              <strong>
                Entender é o começo.
                <br />
                Lembrar é continuar.
              </strong>
              <div>
                <span>Prática</span>
                <i />
                <span>Revisão</span>
                <i />
                <span>Evolução</span>
              </div>
            </div>
            <span className="recall-satellite">
              <Check size={12} /> Mais uma conexão consolidada
            </span>
          </div>
          <div className="method-copy">
            <span className="landing-eyebrow">03 / CONSTRUA CONSISTÊNCIA</span>
            <h2>
              Aprender hoje.
              <br />
              <em>Levar para amanhã.</em>
            </h2>
            <p>
              Questões, flashcards e revisões espaçadas ajudam a transformar um
              bom momento de estudo em conhecimento que fica.
            </p>
            <a href="#entrar" className="landing-text-link">
              Continuar minha jornada <ArrowRight size={14} />
            </a>
          </div>
        </section>
        <section id="entrar" className="landing-access landing-reveal">
          <div>
            <span className="landing-eyebrow">SEU PRÓXIMO CAPÍTULO</span>
            <h2>
              Existe um universo
              <br />
              de ideias <em>em você.</em>
            </h2>
            <p>Dê espaço para elas se conectarem.</p>
            <div className="access-signature">
              <PrismaMark size={28} />
              <span>
                PRISMA<span>CONHECIMENTO EM EXPANSÃO.</span>
              </span>
            </div>
          </div>
          <form className="landing-login" onSubmit={enter}>
            <div className="login-eyebrow">
              <Lock size={12} /> SEU ESPAÇO PESSOAL
            </div>
            <h3>Bom ter você por aqui.</h3>
            <p>Entre para continuar suas conexões.</p>
            <label htmlFor="prisma-email">E-mail</label>
            <input
              id="prisma-email"
              name="email"
              autoComplete="username"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="seu@email.com"
              required
              disabled={loading}
            />
            <label htmlFor="prisma-password">Senha</label>
            <div className="login-password">
              <input
                id="prisma-password"
                name="password"
                autoComplete="current-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Sua senha"
                required
                disabled={loading}
              />
              <button
                type="button"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {error && (
              <p role="alert" className="login-error">
                {error}
              </p>
            )}
            <button
              className="landing-button login-submit"
              type="submit"
              disabled={loading}
            >
              {loading ? "Entrando…" : "Entrar no Prisma"}
              {!loading && <ArrowUpRight size={15} />}
            </button>
          </form>
        </section>
      </main>
      <footer className="landing-footer">
        <a className="landing-brand" href="#">
          <PrismaMark size={23} />
          <span>PRISMA</span>
        </a>
        <span>Aprender é um universo de possibilidades.</span>
        <a href="#conteudo">
          Voltar ao início <ArrowUpRight size={12} />
        </a>
      </footer>
    </div>
  );
}
