import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PenTool, FileText, FileType, FileSpreadsheet, Plus, Zap, Type, Layout, Quote, FlaskConical, Mic2, TrendingUp, List } from 'lucide-react';

export function Studio() {
  return (
    <div className="module-workspace space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Studio de Criação</h1>
          <p className="text-text-muted">DOCX, PPTX, PDF, Markdown, citações ABNT, templates acadêmicos</p>
        </div>
        <Button variant="primary"><Plus className="w-4 h-4 mr-1" />Novo Documento</Button>
      </div>
      
      <Card className="p-8 text-center">
        <PenTool className="w-16 h-16 mx-auto text-text-muted mb-4 opacity-50" />
        <h3 className="text-lg font-medium text-text-primary mb-2">Módulo Studio em desenvolvimento</h3>
        <p className="text-text-muted mb-6 max-w-xl mx-auto">
          Resumos curtos/profundos, fichamentos, mapas mentais, listas, apresentações PPTX editáveis, documentos DOCX, PDFs, Markdown. Citações e referências ABNT configurável. Templates: artigo, relatório, TCC, slide, poster. Exportação com prévia e validação. Impede citação inventada.
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          <Button variant="secondary"><FileText className="w-4 h-4 mr-1" />Novo DOCX</Button>
          <Button variant="secondary"><FileSpreadsheet className="w-4 h-4 mr-1" />Nova Planilha</Button>
          <Button variant="secondary"><Layout className="w-4 h-4 mr-1" />Nova Apresentação</Button>
          <Button variant="secondary"><Type className="w-4 h-4 mr-1" />Markdown</Button>
        </div>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: FileText, title: 'Documentos DOCX', desc: 'Artigos, relatórios, TCCs com ABNT' },
          { icon: Layout, title: 'Apresentações PPTX', desc: 'Slides editáveis, templates' },
          { icon: FileType, title: 'PDFs', desc: 'Geração e exportação' },
          { icon: Quote, title: 'Citações ABNT', desc: 'Referências verificáveis, auto-format' },
        ].map((item, i) => (
          <Card key={i} className="p-5 h-full">
            <item.icon className="w-10 h-10 text-accent mb-3" />
            <h4 className="font-medium text-text-primary mb-1">{item.title}</h4>
            <p className="text-sm text-text-muted">{item.desc}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function Lab() {
  return (
    <div className="module-workspace space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Laboratório</h1>
          <p className="text-text-muted">Experimentos, hipótese/método/dados, SymPy, gráficos, relatórios</p>
        </div>
        <Button variant="primary"><Plus className="w-4 h-4 mr-1" />Novo Experimento</Button>
      </div>
      
      <Card className="p-8 text-center">
        <FlaskConical className="w-16 h-16 mx-auto text-text-muted mb-4 opacity-50" />
        <h3 className="text-lg font-medium text-text-primary mb-2">Módulo Lab em desenvolvimento</h3>
        <p className="text-text-muted mb-6 max-w-xl mx-auto">
          Pesquisa livre, experimentos com hipótese/método/dados/gráficos/arquivos. Execução controlada de cálculos/simulações (SymPy sidecar, timeout, memória, IPC tipado). Relatórios com diferenciação simulado vs observado. Experimento de exemplo reproduzível.
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          <Button variant="secondary"><FlaskConical className="w-4 h-4 mr-1" />Novo Experimento</Button>
          <Button variant="secondary"><Zap className="w-4 h-4 mr-1" />Calcular com SymPy</Button>
          <Button variant="secondary"><TrendingUp className="w-4 h-4 mr-1" />Gerar Gráfico</Button>
        </div>
      </Card>
    </div>
  );
}

export function Oral() {
  return (
    <div className="module-workspace space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Banca Oral</h1>
          <p className="text-text-muted">Perguntas voz/texto, STT/TTS local, rubricas, feedback, transcrição editável</p>
        </div>
        <Button variant="primary"><Plus className="w-4 h-4 mr-1" />Nova Sessão</Button>
      </div>
      
      <Card className="p-8 text-center">
        <Mic2 className="w-16 h-16 mx-auto text-text-muted mb-4 opacity-50" />
        <h3 className="text-lg font-medium text-text-primary mb-2">Módulo Oral em desenvolvimento</h3>
        <p className="text-text-muted mb-6 max-w-xl mx-auto">
          Perguntas em voz ou texto, resposta via microfone (faster-whisper) ou digitação. Rubricas transparentes (critérios, pesos, níveis), feedback justificado, relatório pontos fortes/fracos. Transcrição verificável/editável. Voz opcional (push-to-talk), fallback texto completo.
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          <Button variant="secondary"><Mic2 className="w-4 h-4 mr-1" />Iniciar Banca</Button>
          <Button variant="secondary"><List className="w-4 h-4 mr-1" />Criar Rubrica</Button>
        </div>
      </Card>
    </div>
  );
}
