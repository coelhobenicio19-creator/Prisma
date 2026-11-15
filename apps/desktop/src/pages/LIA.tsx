import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Sparkles, Zap, Shield, Brain, MessageSquare, Plus, Settings, Search, FileText, Lightbulb, RotateCcw } from 'lucide-react';

export function LIAPage() {
  return (
    <div className="module-workspace space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">LIA — Laboratório de Inteligência Acadêmica</h1>
          <p className="text-text-muted">Nemotron 3 Ultra via NVIDIA — RAG local, ferramentas tipadas, memória opt-in</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" asChild>
            <a href="/settings">
              <Settings className="w-4 h-4 mr-1" />Configurar IA
            </a>
          </Button>
          <Button variant="primary"><Plus className="w-4 h-4 mr-1" />Nova Conversa</Button>
        </div>
      </div>
      
      {/* Status Bar */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-warning" />
            <span className="text-sm font-medium text-text-primary">Modo Offline</span>
          </div>
          <span className="text-xs text-text-muted">Configure a chave API NVIDIA nas Configurações para ativar a LIA</span>
          <Button variant="ghost" size="sm" asChild>
            <a href="/settings">
              <Settings className="w-4 h-4 mr-1" />Configurar
            </a>
          </Button>
        </div>
      </Card>
      
      {/* Capabilities */}
      <Card className="p-6">
        <h3 className="font-semibold text-text-primary mb-4">O que a LIA pode fazer (com chave API):</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: MessageSquare, title: 'Explicar Conceitos', desc: 'Com citações das suas fontes (RAG local)', color: 'blue' },
            { icon: Lightbulb, title: 'Perguntas Socráticas', desc: 'Dicas graduais, não dá a resposta direta', color: 'yellow' },
            { icon: Zap, title: 'Criar Exercícios', desc: 'Flashcards, questões, problemas baseados no seu material', color: 'orange' },
            { icon: FileText, title: 'Resumir Fontes', desc: 'Resumos curtos/profundos com referências', color: 'green' },
            { icon: Brain, title: 'Planejar Estudos', desc: 'Cronogramas, metas, priorização baseada em evidência', color: 'purple' },
            { icon: Search, title: 'Comparar Fontes', desc: 'Diff textual/semântico entre documentos', color: 'pink' },
            { icon: Sparkles, title: 'Gerar Materiais', desc: 'DOCX, PPTX, flashcards, mapas mentais', color: 'indigo' },
            { icon: RotateCcw, title: 'Verificar Cálculos', desc: 'SymPy para derivadas, integrais, limites', color: 'cyan' },
            { icon: Shield, title: 'Memória Opt-in', desc: 'Você controla o que a LIA lembra por contexto', color: 'gray' },
          ].map((item, i) => (
            <Card key={i} className="p-4 h-full hover:bg-surface-hover transition-colors">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-3">
                <item.icon className="w-5 h-5 text-accent" />
              </div>
              <h4 className="font-medium text-text-primary mb-1">{item.title}</h4>
              <p className="text-sm text-text-muted">{item.desc}</p>
            </Card>
          ))}
        </div>
      </Card>
      
      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="font-semibold text-text-primary mb-4">Ações Rápidas (requerem chave API):</h3>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" disabled><FileText className="w-4 h-4 mr-1" />Resumir PDF Atual</Button>
          <Button variant="secondary" disabled><Brain className="w-4 h-4 mr-1" />Criar Plano de Estudos</Button>
          <Button variant="secondary" disabled><Zap className="w-4 h-4 mr-1" />Gerar Flashcards</Button>
          <Button variant="secondary" disabled><Search className="w-4 h-4 mr-1" />Comparar Fontes</Button>
          <Button variant="secondary" disabled><Lightbulb className="w-4 h-4 mr-1" />Explicar Tópico</Button>
          <Button variant="secondary" disabled><Plus className="w-4 h-4 mr-1" />Nova Conversa</Button>
        </div>
      </Card>
      
      {/* Privacy Note */}
      <Card className="p-5 border-l-4 border-info">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-info mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-text-primary mb-1">Privacidade e Controle</h4>
            <ul className="text-sm text-text-muted space-y-1 pl-5 list-disc">
              <li>Dados enviados apenas para <code className="bg-surface px-1 rounded">api.nvidia.com</code> via HTTPS</li>
              <li>Contexto minimizado (RAG local) — nunca documentos completos por padrão</li>
              <li>Memória opt-in por espaço/objetivo (perfil, prova, projeto, tópico)</li>
              <li>Todas as ações sensíveis exigem sua aprovação explícita</li>
              <li>Modo offline preserva 100% dos recursos locais</li>
              <li>Histórico local mantido mesmo se API falhar</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}