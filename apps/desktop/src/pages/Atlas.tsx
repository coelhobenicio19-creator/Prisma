import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, Target, BookOpen, Settings, Zap, Brain, Award, Play } from 'lucide-react';

export { NativeAtlas as Atlas } from './NativeAtlas';

export function Learn() {
  return (
    <div className="module-workspace space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Aprender (Trilhas)</h1>
          <p className="text-text-muted">Conteúdos por objetivos, pré-requisitos, explicações escalonadas, prática guiada</p>
        </div>
        <Button variant="primary"><Plus className="w-4 h-4 mr-1" />Nova Trilha</Button>
      </div>
      
      <Card className="p-8 text-center">
        <BookOpen className="w-16 h-16 mx-auto text-text-muted mb-4 opacity-50" />
        <h3 className="text-lg font-medium text-text-primary mb-2">Módulo Aprender em desenvolvimento</h3>
        <p className="text-text-muted mb-6 max-w-xl mx-auto">
          Crie trilhas do zero, associe fontes (PDFs, URLs oficiais), lições com explicação escalonada (visão geral → detalhes → prática), prática guiada com feedback, progresso persistido.
        </p>
        <Button variant="primary"><Plus className="w-4 h-4 mr-1" />Criar primeira trilha</Button>
      </Card>
    </div>
  );
}

export function Exams() {
  return (
    <div className="module-workspace space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Simulados e Provas</h1>
          <p className="text-text-muted">Máquina de estados, cronômetro monotônico, integridade, modos Treino/Exame</p>
        </div>
        <Button variant="primary"><Plus className="w-4 h-4 mr-1" />Novo Simulado</Button>
      </div>
      
      <Card className="p-8 text-center">
        <Award className="w-16 h-16 mx-auto text-text-muted mb-4 opacity-50" />
        <h3 className="text-lg font-medium text-text-primary mb-2">Módulo Exams em desenvolvimento</h3>
        <p className="text-text-muted mb-6 max-w-xl mx-auto">
          Perfis universais, provas oficiais/importadas/autorais, duração, instruções, autosave, banco de eventos, correção, revisão pós-prova. Recuperação após crash com journal + snapshot.
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          <Button variant="secondary"><Settings className="w-4 h-4 mr-1" />Configurar Simulado</Button>
          <Button variant="secondary"><BookOpen className="w-4 h-4 mr-1" />Importar Prova</Button>
          <Button variant="secondary"><Zap className="w-4 h-4 mr-1" />Gerar com LIA</Button>
        </div>
      </Card>
    </div>
  );
}

export function Recall() {
  return (
    <div className="module-workspace space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Recall (FSRS)</h1>
          <p className="text-text-muted">Flashcards multi-tipo, repetição espaçada, decks, estatísticas, exportação Anki</p>
        </div>
        <Button variant="primary"><Plus className="w-4 h-4 mr-1" />Novo Flashcard</Button>
      </div>
      
      <Card className="p-8 text-center">
        <Brain className="w-16 h-16 mx-auto text-text-muted mb-4 opacity-50" />
        <h3 className="text-lg font-medium text-text-primary mb-2">Módulo Recall em desenvolvimento</h3>
        <p className="text-text-muted mb-6 max-w-xl mx-auto">
          FSRS (state-of-the-art), flashcards texto/imagem/equação/fórmula, criação manual e assistida por LIA, decks por disciplina/erro, estatísticas de retenção, exportação Anki-compatível.
        </p>
        <Button variant="primary"><Plus className="w-4 h-4 mr-1" />Criar primeiro deck</Button>
      </Card>
    </div>
  );
}

export function Focus() {
  return (
    <div className="module-workspace space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Foco (Pomodoro)</h1>
          <p className="text-text-muted">Timer monotônico, metas, sons, logs, modo redução voluntária de distrações</p>
        </div>
        <Button variant="primary"><Play className="w-4 h-4 mr-1" />Iniciar Foco</Button>
      </div>
      
      <Card className="p-8 text-center">
        <Target className="w-16 h-16 mx-auto text-text-muted mb-4 opacity-50" />
        <h3 className="text-lg font-medium text-text-primary mb-2">Módulo Focus em desenvolvimento</h3>
        <p className="text-text-muted mb-6 max-w-xl mx-auto">
          Pomodoro configurável, timer monotônico (imune a mudança de relógio), metas de sessão, pausas obrigatórias/opcionais, sons, logs, suspensão/retomada real, modo fullscreen sem distrações.
        </p>
        <Button variant="primary"><Play className="w-4 h-4 mr-1" />Configurar Pomodoro</Button>
      </Card>
    </div>
  );
}