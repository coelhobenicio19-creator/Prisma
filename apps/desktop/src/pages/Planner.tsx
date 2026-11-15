import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Calendar, Plus, Target, TrendingUp, LayoutDashboard, RotateCcw, GraduationCap } from 'lucide-react';

export function Planner() {
  return (
    <div className="module-workspace space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Planner</h1>
          <p className="text-text-muted">Calendário, metas, prioridades determinísticas, replanejamento, rotinas</p>
        </div>
        <Button variant="primary"><Plus className="w-4 h-4 mr-1" />Nova Atividade</Button>
      </div>
      
      <Card className="p-8 text-center">
        <Calendar className="w-16 h-16 mx-auto text-text-muted mb-4 opacity-50" />
        <h3 className="text-lg font-medium text-text-primary mb-2">Módulo Planner em desenvolvimento</h3>
        <p className="text-text-muted mb-6 max-w-xl mx-auto">
          Calendário com metas, datas, disponibilidade semanal, revisões (M04), prioridades determinísticas com justificativa, replanejamento de atividades perdidas, modelos de rotina, integração com Exames, Estudo, Recall, Projetos.
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          <Button variant="secondary"><Plus className="w-4 h-4 mr-1" />Adicionar Atividade</Button>
          <Button variant="secondary"><RotateCcw className="w-4 h-4 mr-1" />Replanejar Semana</Button>
          <Button variant="secondary"><Target className="w-4 h-4 mr-1" />Definir Metas</Button>
        </div>
      </Card>
    </div>
  );
}

export function Projects() {
  return (
    <div className="module-workspace space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Projetos (Kanban)</h1>
          <p className="text-text-muted">Quadro, entregáveis, anexos, checklist, relações com Atlas/Library</p>
        </div>
        <Button variant="primary"><Plus className="w-4 h-4 mr-1" />Novo Projeto</Button>
      </div>
      
      <Card className="p-8 text-center">
        <LayoutDashboard className="w-16 h-16 mx-auto text-text-muted mb-4 opacity-50" />
        <h3 className="text-lg font-medium text-text-primary mb-2">Módulo Projects em desenvolvimento</h3>
        <p className="text-text-muted mb-6 max-w-xl mx-auto">
          Kanban com colunas personalizáveis, WIP limits, entregáveis versionados, anexos, checklists, relações com matérias (M17), tópicos do Atlas (M02), documentos da Library (M11).
        </p>
        <Button variant="primary"><Plus className="w-4 h-4 mr-1" />Criar primeiro projeto</Button>
      </Card>
    </div>
  );
}

export function School() {
  return (
    <div className="module-workspace space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Gestão Escolar</h1>
          <p className="text-text-muted">Matérias, períodos, avaliações, pesos, notas, médias, frequência</p>
        </div>
        <Button variant="primary"><Plus className="w-4 h-4 mr-1" />Nova Matéria</Button>
      </div>
      
      <Card className="p-8 text-center">
        <GraduationCap className="w-16 h-16 mx-auto text-text-muted mb-4 opacity-50" />
        <h3 className="text-lg font-medium text-text-primary mb-2">Módulo School em desenvolvimento</h3>
        <p className="text-text-muted mb-6 max-w-xl mx-auto">
          Períodos letivos, matérias com pesos configuráveis, avaliações (provas, trabalhos, projetos), médias recalculáveis com fórmulas explícitas, metas por matéria, frequência opcional, lembretes locais.
        </p>
        <Button variant="primary"><Plus className="w-4 h-4 mr-1" />Configurar Período</Button>
      </Card>
    </div>
  );
}

export function Forecast() {
  return (
    <div className="module-workspace space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Previsão de Prontidão</h1>
          <p className="text-text-muted">Cobertura, domínio, retenção, simulados, tempo, cenários com incerteza</p>
        </div>
        <Button variant="secondary"><TrendingUp className="w-4 h-4 mr-1" />Recalcular</Button>
      </div>
      
      <Card className="p-8 text-center">
        <TrendingUp className="w-16 h-16 mx-auto text-text-muted mb-4 opacity-50" />
        <h3 className="text-lg font-medium text-text-primary mb-2">Módulo Forecast em desenvolvimento</h3>
        <p className="text-text-muted mb-6 max-w-xl mx-auto">
          Estimativa de cobertura (tópicos do edital vs estudados), domínio (Atlas), retenção (Recall), simulados (Exams), tempo disponível. Cenários pessimista/realista/otimista com intervalos. Histórico de calibração. Ausência de dados = "insuficiente".
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          <Button variant="secondary"><TrendingUp className="w-4 h-4 mr-1" />Gerar Previsão</Button>
          <Button variant="secondary"><Target className="w-4 h-4 mr-1" />Definir Meta</Button>
        </div>
      </Card>
    </div>
  );
}
