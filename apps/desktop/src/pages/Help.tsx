import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/helpers';
import {
  Search,
  BookOpen,
  Keyboard,
  LifeBuoy,
  Github,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  Info,
  Zap,
  Shield,
  Brain,
  Target,
  Award,
  Library,
  Calendar,
  Kanban,
  BarChart2,
  PenTool,
  FlaskConical,
  Mic2,
  Bot,
  Network,
  LayoutDashboard,
  GraduationCap,
  TrendingUp,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';

const SHORTCUTS = [
  { keys: ['Ctrl', 'K'], description: 'Abrir busca' },
  { keys: ['Esc'], description: 'Fechar diálogo ou navegação móvel' },
];

const FAQ = [
  {
    q: 'O PRISMA funciona sem internet?',
    a: 'Sim! 100% dos recursos locais funcionam offline: Biblioteca, Busca, Atlas, Recall, Planner, Simulados, Dashboard, etc. Apenas a LIA (assistente IA) requer conexão para processar perguntas.',
  },
  {
    q: 'Meus dados saem do meu computador?',
    a: 'Não, por padrão. Todos os dados ficam no SQLite local (%APPDATA%\\PRISMA). Apenas se você configurar a chave API NVIDIA e usar a LIA, o texto da sua pergunta é enviado para api.nvidia.com via HTTPS. Telemetria está OFF por padrão e só envia dados anônimos se você ativar explicitamente nas Configurações.',
  },
  {
    q: 'Como importar meus PDFs e apostilas?',
    a: 'Vá em Biblioteca → "Importar Arquivos" ou arraste arquivos para a janela. O PRISMA calcula hash SHA-256 para evitar duplicatas, extrai texto (com OCR para scans) e indexa no FTS5 para busca instantânea.',
  },
  {
    q: 'O que é o Atlas?',
    a: 'É o grafo de conhecimento: tópicos, pré-requisitos e relações entre assuntos. O domínio de cada tópico é calculado automaticamente baseado em suas evidências (simulados, flashcards, erros, sessões de estudo).',
  },
  {
    q: 'Como funciona o Recall (repetição espaçada)?',
    a: 'Usa o algoritmo FSRS (state-of-the-art). Crie flashcards manualmente ou a partir de erros/documentos. O PRISMA agenda revisões otimizadas. Estatísticas de retenção e histórico completo disponíveis.',
  },
  {
    q: 'Posso fazer simulados cronometrados?',
    a: 'Sim. Módulo Exames suporta modo Treino (com dicas/LIA) e modo Exame (sem ajuda, cronômetro monotônico, integridade). O estado persiste se fechar o app ou o PC reiniciar.',
  },
  {
    q: 'Como o Error Lab detecta causas dos erros?',
    a: 'Ao errar uma questão, o PRISMA registra automaticamente: tópico, tempo gasto, alternativa escolhida. Você confirma a causa (conceito, cálculo, interpretação, pressa, esquecimento). Reincidências são detectadas e sugerem revisão direcionada.',
  },
  {
    q: 'A LIA pode criar materiais de estudo?',
    a: 'Sim! Com a chave API configurada, a LIA pode: criar planos de estudo, gerar simulados, fazer flashcards, resumir fontes, criar apresentações, comparar documentos. Todas as ações pedem sua aprovação antes de executar.',
  },
];

const MODULES = [
  { id: 'dashboard', icon: LayoutDashboard, name: 'Dashboard', desc: 'Visão consolidada: compromissos, revisões, estatísticas, sugestões' },
  { id: 'library', icon: Library, name: 'Biblioteca (M11)', desc: 'Importar PDFs, DOCX, organizar, deduplicar, buscar, abrir' },
  { id: 'search', icon: Search, name: 'Busca Universal (M12)', desc: 'FTS5 em documentos, questões, conversas, tarefas, sessões' },
  { id: 'atlas', icon: Network, name: 'Atlas (M02)', desc: 'Grafo de conhecimento, pré-requisitos, domínio derivado de evidências' },
  { id: 'learn', icon: BookOpen, name: 'Aprender (M01)', desc: 'Trilhas, lições escalonadas, prática guiada, progresso' },
  { id: 'exams', icon: Award, name: 'Simulados (M06)', desc: 'Provas cronometradas, integridade, recuperação, correção, revisão' },
  { id: 'recall', icon: Brain, name: 'Recall FSRS (M04)', desc: 'Flashcards multi-tipo, repetição espaçada, decks, exportação Anki' },
  { id: 'focus', icon: Target, name: 'Foco Pomodoro (M05)', desc: 'Timer monotônico, metas, sons, logs, modo redução distrações' },
  { id: 'planner', icon: Calendar, name: 'Planner (M15)', desc: 'Calendário, prioridades determinísticas, replanejamento, rotinas' },
  { id: 'projects', icon: Kanban, name: 'Projetos Kanban (M16)', desc: 'Quadro, entregáveis, anexos, checklist, relações Atlas' },
  { id: 'school', icon: GraduationCap, name: 'Escolar (M17)', desc: 'Matérias, períodos, avaliações, pesos, médias, frequência' },
  { id: 'forecast', icon: BarChart2, name: 'Previsão (M09)', desc: 'Cobertura, domínio, retenção, simulados, cenários com incerteza' },
  { id: 'errorlab', icon: AlertCircle, name: 'Error Lab (M03)', desc: 'Caderno de erros, hipóteses de causa, reincidências, recuperação' },
  { id: 'studio', icon: PenTool, name: 'Studio (M19)', desc: 'DOCX, PPTX, PDF, Markdown, citações ABNT, templates' },
  { id: 'lab', icon: FlaskConical, name: 'Lab (M21)', desc: 'Experimentos, hipótese/método/dados, SymPy, relatórios' },
  { id: 'oral', icon: Mic2, name: 'Oral (M22)', desc: 'Banca oral, STT/TTS local, rubricas, transcrição editável' },
  { id: 'lia', icon: Bot, name: 'LIA (M23)', desc: 'Nemotron 3 Ultra, RAG local, ferramentas tipadas, memória opt-in' },
  { id: 'activelearning', icon: TrendingUp, name: 'Active Learning (M24)', desc: 'Recomendações baseadas em evidência, ciclos fechar-aprender-avaliar' },
];

export function Help() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'intro' | 'shortcuts' | 'faq' | 'modules' | 'troubleshooting'>('intro');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Ajuda e Documentação</h1>
        <p className="text-text-muted">Guias, atalhos, FAQ e referência dos módulos</p>
      </div>
      
      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
          <input
            type="search"
            placeholder="Buscar na ajuda... (ex: 'importar PDF', 'FSRS', 'simulado')"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-12"
          />
        </div>
      </Card>
      
      {/* Tabs */}
      <div className="tabs" role="tablist">
        {[
          { id: 'intro', label: 'Introdução', icon: Info },
          { id: 'shortcuts', label: 'Atalhos', icon: Keyboard },
          { id: 'faq', label: 'FAQ', icon: HelpCircle },
          { id: 'modules', label: 'Módulos', icon: BookOpen },
          { id: 'troubleshooting', label: 'Problemas', icon: AlertCircle },
        ].map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={cn('tab', activeTab === tab.id && 'tab-active')}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Content */}
      <Card className="p-6 animate-fade-in">
        {activeTab === 'intro' && <IntroTab />}
        {activeTab === 'shortcuts' && <ShortcutsTab shortcuts={SHORTCUTS} />}
        {activeTab === 'faq' && <FaqTab faq={FAQ} expandedFaq={expandedFaq} setExpandedFaq={setExpandedFaq} searchQuery={searchQuery} />}
        {activeTab === 'modules' && <ModulesTab modules={MODULES} searchQuery={searchQuery} />}
        {activeTab === 'troubleshooting' && <TroubleshootingTab />}
      </Card>
      
      {/* Links */}
      <Card className="p-5">
        <h3 className="font-semibold text-text-primary mb-4">Recursos Externos</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'GitHub do PRISMA', href: '#', desc: 'Código fonte, issues, releases' },
            { label: 'Documentação Tauri', href: 'https://tauri.app', desc: 'Framework desktop usado' },
            { label: 'NVIDIA Nemotron API', href: 'https://api.nvidia.com', desc: 'Chave API para LIA' },
            { label: 'FSRS Algorithm', href: 'https://github.com/open-spaced-repetition/fsrs', desc: 'Algoritmo de repetição espaçada' },
            { label: 'Tauri Security', href: 'https://tauri.app/security', desc: 'Modelo de segurança do Tauri' },
            { label: 'SQLite FTS5', href: 'https://sqlite.org/fts5.html', desc: 'Busca full-text no SQLite' },
            { label: 'SymPy', href: 'https://www.sympy.org', desc: 'Matemática simbólica (Lab)' },
            { label: 'Reportar Bug', href: '#', desc: 'Abrir issue no GitHub' },
          ].map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.href.startsWith('http') ? '_blank' : undefined}
              rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="btn btn-secondary btn-sm justify-start gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              <div className="text-left">
                <p className="font-medium text-xs">{link.label}</p>
                <p className="text-[10px] text-text-muted">{link.desc}</p>
              </div>
            </a>
          ))}
        </div>
      </Card>
    </div>
  );
}

function IntroTab() {
  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
          <Zap className="w-8 h-8 text-accent" />
        </div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Bem-vindo ao PRISMA</h2>
        <p className="text-text-muted max-w-2xl mx-auto">
          Seu laboratório acadêmico pessoal: 24 módulos integrados para aprendizado, avaliação, produção e inteligência.
          Local-first, gratuito, open source, com assistente LIA (Nemotron 3 Ultra).
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: Shield, title: 'Privacidade Total', desc: 'Dados no seu PC, telemetria OFF, chave API no Windows Credential Manager' },
          { icon: Zap, title: 'Offline-First', desc: '100% funcional sem internet (exceto LIA e fontes web)' },
          { icon: Brain, title: 'IA Responsável', desc: 'LIA com RAG local, ferramentas tipadas, aprovação humana, sem alucinação' },
        ].map((item, i) => (
          <Card key={i} className="p-5 text-center h-full">
            <div className="w-12 h-12 mx-auto rounded-lg bg-accent/10 flex items-center justify-center mb-3">
              <item.icon className="w-6 h-6 text-accent" />
            </div>
            <h3 className="font-semibold text-text-primary mb-1">{item.title}</h3>
            <p className="text-sm text-text-muted">{item.desc}</p>
          </Card>
        ))}
      </div>
      
      <div className="p-4 bg-surface-border/50 rounded-lg">
        <h3 className="font-medium text-text-primary mb-3">Primeiros Passos</h3>
        <ol className="space-y-2 text-sm text-text-secondary pl-5 list-decimal">
          <li>Importe seus primeiros PDFs na <strong>Biblioteca</strong></li>
          <li>Crie um <strong>Objetivo de Estudo</strong> no Dashboard ou Aprender</li>
          <li>Adicione tópicos no <strong>Atlas</strong> e vincule às fontes</li>
          <li>Crie <strong>Flashcards</strong> no Recall (ou peça para a LIA)</li>
          <li>Agende sessões no <strong>Planner</strong> e use o <strong>Foco</strong> (Pomodoro)</li>
          <li>Faça um <strong>Simulado</strong> para calibrar seu nível</li>
          <li>Configure a <strong>Chave API NVIDIA</strong> nas Configurações para usar a LIA</li>
        </ol>
      </div>
    </div>
  );
}

function ShortcutsTab({ shortcuts }: any) {
  return (
    <div className="space-y-4">
      <p className="text-text-muted">Atalhos globais (funcionam em qualquer tela). Use <kbd className="px-1.5 py-0.5 bg-surface-border rounded text-text-secondary font-mono text-xs">Ctrl+K</kbd> para busca global.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {shortcuts.map((s: any, i: number) => (
          <Card key={i} className="p-4 flex items-center justify-between hover:bg-surface-hover transition-colors">
            <div className="flex items-center gap-3">
              <kbd className="px-2 py-1 bg-surface-border rounded text-text-secondary font-mono text-xs">
                {s.keys.join(' + ')}
              </kbd>
              <span className="text-text-primary">{s.description}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function FaqTab({ faq, expandedFaq, setExpandedFaq, searchQuery }: any) {
  const filtered = faq.filter((item: any) =>
    item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.a.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <div className="space-y-3">
      {filtered.length === 0 ? (
        <div className="text-center py-8 text-text-muted">
          <Search className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p>Nenhuma pergunta encontrada para "{searchQuery}"</p>
        </div>
      ) : (
        filtered.map((item: any, i: number) => (
          <Card key={i} className="p-0 overflow-hidden">
            <button
              className="w-full p-5 text-left flex items-center justify-between hover:bg-surface-hover transition-colors"
              onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
              style={{ textAlign: 'left' }}
            >
              <div className="flex items-start gap-3 flex-1">
                <span className={cn('w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5', expandedFaq === i ? 'bg-accent text-white' : 'bg-surface-border text-text-muted')}>
                  {expandedFaq === i ? <ChevronRight className="w-4 h-4" rotate={90} /> : <ChevronRight className="w-4 h-4" />}
                </span>
                <span className="font-medium text-text-primary">{item.q}</span>
              </div>
            </button>
            {expandedFaq === i && (
              <div className="px-5 pb-5 border-t border-border animate-slide-in">
                <p className="text-text-secondary">{item.a}</p>
              </div>
            )}
          </Card>
        ))
      )}
    </div>
  );
}

function ModulesTab({ modules, searchQuery }: any) {
  const filtered = modules.filter((m: any) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <div className="space-y-4">
      <p className="text-text-muted">24 módulos obrigatórios organizados em 6 áreas. Clique para ver detalhes (futuro: links para cada página).</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((module: any) => (
          <Card key={module.id} className="p-4 hover:bg-surface-hover transition-colors group">
            <div className="flex items-start gap-3">
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', module.id === 'lia' ? 'bg-purple-500/10 text-purple-500' : 'bg-accent/10 text-accent')}>
                <module.icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-text-primary">{module.name}</h4>
                  {module.id === 'lia' && <Badge variant="primary" size="sm">IA</Badge>}
                </div>
                <p className="text-sm text-text-muted">{module.desc}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function TroubleshootingTab() {
  const issues = [
    {
      title: 'App não abre / Crash na inicialização',
      steps: [
        'Verifique logs em %APPDATA%\\PRISMA\\logs\\',
        'Execute PRISMA.exe no terminal para ver erro',
        'Causas: WebView2 ausente, banco corrompido, chave API inválida, permissão pasta',
        'Solução: Reinstalar WebView2, restaurar backup, remover chave do Credential Manager',
      ],
    },
    {
      title: 'Build falha (cargo tauri build)',
      steps: [
        'link.exe not found → Instalar VS Build Tools (workload VCTools)',
        'webview2 not found → cargo install tauri-bundler baixa automaticamente',
        'sqlx offline prepare → cargo sqlx prepare --workspace',
        'Out of memory → Fechar apps pesados, aumentar swap',
      ],
    },
    {
      title: 'LIA não responde / Erro de API',
      steps: [
        'Verifique chave API em Configurações → IA',
        'Teste conectividade: curl -I https://api.nvidia.com',
        'Logs: RUST_LOG=prisma::lia=debug PRISMA.exe',
        'Códigos: 401=chave inválida, 429=rate limit (retry 3x), 503=indisponível (modo offline), Timeout=rede lenta',
      ],
    },
    {
      title: 'Busca não encontra resultados',
      steps: [
        'Verifique FTS5: sqlite3 prisma.db "SELECT * FROM search_index LIMIT 5"',
        'Reindexar: Configurações → Diagnósticos → Reconstruir índice',
        'Verifique triggers de sincronização nas migrações',
      ],
    },
    {
      title: 'Timer/Exames com tempo errado',
      steps: [
        'PRISMA usa relógio monotônico (std::time::Instant)',
        'Mudança de relógio do Windows NÃO afeta tempo de prova',
        'Verifique exam_session.time_remaining_seconds no DB',
      ],
    },
  ];
  
  return (
    <div className="space-y-4">
      {issues.map((issue, i) => (
        <Card key={i} className="p-0 overflow-hidden">
          <div className="px-5 py-4 bg-surface-border/50 border-b border-border">
            <h3 className="font-semibold text-text-primary">{issue.title}</h3>
          </div>
          <div className="p-5">
            <ol className="space-y-2 text-sm text-text-secondary pl-5 list-decimal">
              {issue.steps.map((step, j) => (
                <li key={j}>{step}</li>
              ))}
            </ol>
          </div>
        </Card>
      ))}
      
      <Card className="p-5 border-l-4 border-info">
        <h3 className="font-medium text-text-primary mb-3">Ainda com problemas?</h3>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" asChild>
            <a href="#" target="_blank" rel="noopener">
              <Github className="w-4 h-4 mr-1" /> Abrir Issue no GitHub
            </a>
          </Button>
          <Button variant="ghost" size="sm">
            <LifeBuoy className="w-4 h-4 mr-1" /> Ver Logs (%APPDATA%\\PRISMA\\logs)
          </Button>
          <Button variant="ghost" size="sm">
            <RefreshCw className="w-4 h-4 mr-1" /> Reindexar Busca
          </Button>
        </div>
      </Card>
    </div>
  );
}