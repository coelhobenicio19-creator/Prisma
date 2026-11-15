import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Check, CheckCircle, Loader2, Target, BookOpen, Zap, Shield, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { useProfileStore } from '@/store';
import { createProfile } from '@/services/tauri';
import { cn } from '@/utils/helpers';

const STEPS = [
  { id: 'welcome', title: 'Bem-vindo ao PRISMA', description: 'Seu laboratório acadêmico pessoal com assistente LIA' },
  { id: 'profile', title: 'Seu Perfil', description: 'Configure seu nome, objetivo e fuso horário' },
  { id: 'goal', title: 'Objetivo de Estudo', description: 'Defina o que você quer alcançar' },
  { id: 'privacy', title: 'Privacidade & Telemetria', description: 'Controle total dos seus dados, offline-first por padrão' },
  { id: 'ai', title: 'Assistente LIA', description: 'Configure sua chave API NVIDIA (opcional)' },
  { id: 'complete', title: 'Pronto!', description: 'Seu PRISMA está configurado e pronto para usar' },
];

const GOAL_TYPES = [
  { value: 'free', label: 'Estudo Livre', description: 'Sem prova específica, organizar aprendizado pessoal', icon: BookOpen },
  { value: 'exam', label: 'Vestibular / ENEM', description: 'Preparação para ingresso no ensino superior', icon: Target },
  { value: 'contest', label: 'Concurso Público', description: 'Estudo para cargos públicos', icon: Users },
  { value: 'olympiad', label: 'Olimpíadas Científicas', description: 'Preparação para competições acadêmicas', icon: Zap },
  { value: 'course', label: 'Disciplina / Curso', description: 'Acompanhamento de matéria específica', icon: BookOpen },
  { value: 'self_study', label: 'Autodidata', description: 'Trilha personalizada sem instituição', icon: Target },
];

export function Onboarding() {
  const navigate = useNavigate();
  const { setCurrentProfile } = useProfileStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    goal_type: 'free' as const,
    goal_description: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    telemetry_enabled: false,
    telemetry_categories: { usage: false, performance: false, errors: false, ai_usage: false },
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const step = STEPS[currentStep];
  const progress = ((currentStep + 1) / STEPS.length) * 100;
  
  const validateStep = () => {
    const newErrors: Record<string, string> = {};
    
    if (currentStep === 1) { // profile
      if (!formData.name.trim()) newErrors.name = 'Nome é obrigatório';
      if (!formData.timezone) newErrors.timezone = 'Fuso horário é obrigatório';
    }
    
    if (currentStep === 2) { // goal
      if (!formData.goal_description.trim()) newErrors.goal_description = 'Descreva seu objetivo';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleNext = async () => {
    if (!validateStep()) return;
    
    if (currentStep === STEPS.length - 2) { // Last step before complete - create profile
      setIsLoading(true);
      try {
        const profile = await createProfile(
          formData.name,
          formData.goal_type,
          formData.goal_description,
          undefined,
          undefined,
          formData.timezone
        );
        setCurrentProfile(profile);
        
        // Save settings (a chave NVIDIA fica SOMENTE no servidor — env var NVIDIA_API_KEY no Vercel;
        // nunca é coletada nem armazenada no navegador)
        const { updateSettings } = await import('@/services/tauri');
        await updateSettings(profile.id, {
          theme: 'system',
          language: 'pt-BR',
          telemetry_enabled: formData.telemetry_enabled,
          telemetry_categories: formData.telemetry_categories,
          ai_api_key_configured: false,
          auto_backup: true,
          backup_interval_hours: 24,
        });

        setCurrentStep(currentStep + 1);
      } catch (error) {
        console.error('Erro ao criar perfil:', error);
        alert('Erro ao criar perfil. Tente novamente.');
      } finally {
        setIsLoading(false);
      }
    } else {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };
  
  const handleComplete = () => {
    navigate('/dashboard');
  };
  
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                  i < currentStep ? 'bg-accent text-white' :
                  i === currentStep ? 'bg-accent-bg text-accent border-2 border-accent' :
                  'bg-surface-border text-text-muted'
                )}>
                  {i < currentStep ? <Check className="w-4 h-4" /> : <span>{i + 1}</span>}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn(
                    'hidden md:block w-16 h-0.5 mx-2',
                    i < currentStep ? 'bg-accent' : 'bg-surface-border'
                  )} />
                )}
              </div>
            ))}
          </div>
          <div className="h-1 bg-surface-border rounded-full overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        
        {/* Step Content */}
        <Card className="p-6 md:p-8 animate-fade-in">
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-2">
              {step.title}
            </h1>
            <p className="text-text-muted">
              {step.description}
            </p>
          </div>
          
          {currentStep === 0 && <WelcomeStep />}
          {currentStep === 1 && <ProfileStep formData={formData} setFormData={setFormData} errors={errors} />}
          {currentStep === 2 && <GoalStep formData={formData} setFormData={setFormData} errors={errors} />}
          {currentStep === 3 && <PrivacyStep formData={formData} setFormData={setFormData} />}
          {currentStep === 4 && <AIStep />}
          {currentStep === 5 && <CompleteStep />}
          
          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-border">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 0}
              className="w-24"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Voltar
            </Button>
            
            <div className="flex-1 text-center text-sm text-text-muted">
              Passo {currentStep + 1} de {STEPS.length}
            </div>
            
            {currentStep < STEPS.length - 1 ? (
              <Button
                onClick={handleNext}
                disabled={isLoading}
                className="w-24"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    Aguarde
                  </>
                ) : (
                  <>
                    Próximo
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                className="w-24"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Começar
              </Button>
            )}
          </div>
        </Card>
        
        {/* Features hint */}
        <div className="mt-6 grid grid-cols-3 gap-4 text-center">
          {[
            { icon: Shield, title: 'Local-First', desc: 'Seus dados no seu PC' },
            { icon: Zap, title: 'Offline', desc: 'Funciona sem internet' },
            { icon: Users, title: 'Privacidade', desc: 'Telemetria OFF por padrão' },
          ].map((item, i) => (
            <div key={i} className="p-4 bg-surface-border/50 rounded-lg">
              <item.icon className="w-6 h-6 mx-auto text-text-muted mb-2" />
              <p className="text-sm font-medium text-text-primary">{item.title}</p>
              <p className="text-xs text-text-muted">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WelcomeStep() {
  return (
    <div className="space-y-6">
      <div className="w-20 h-20 mx-auto rounded-2xl bg-accent-bg flex items-center justify-center">
        <svg className="w-12 h-12 text-accent" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      </div>
      <div className="grid md:grid-cols-2 gap-4 text-left">
        {[
          '24 módulos integrados: aprendizado, avaliação, conhecimento, produtividade, produção e inteligência',
          'Assistente LIA com Nemotron 3 Ultra para explicações, exercícios e criação de materiais',
          'Repetição espaçada (FSRS), Atlas de conhecimento, Caderno de erros, Simulados com integridade',
          'Biblioteca com OCR, Busca FTS5, Comparação de editais, Studio para DOCX/PPTX/PDF',
          'Custo zero, open source, instalador Windows nativo, dados 100% seus',
        ].map((feature, i) => (
          <div key={i} className="flex items-start gap-3 p-3 bg-surface-border/50 rounded-lg">
            <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
            <span className="text-sm text-text-secondary">{feature}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileStep({ formData, setFormData, errors }: any) {
  return (
    <div className="space-y-4">
      <Input
        label="Seu nome"
        placeholder="Como devemos te chamar?"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        error={errors.name}
        autoFocus
      />
      <Input
        label="Fuso horário"
        type="text"
        value={formData.timezone}
        onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
        error={errors.timezone}
        hint="Usado para agendamentos e prazos"
      />
    </div>
  );
}

function GoalStep({ formData, setFormData, errors }: any) {
  return (
    <div className="space-y-4">
      <Select
        label="Tipo de objetivo"
        placeholder="Selecione seu tipo de estudo"
        value={formData.goal_type}
        onChange={(v) => setFormData({ ...formData, goal_type: v as any })}
        options={GOAL_TYPES.map((g) => ({ value: g.value, label: g.label }))}
      />
      <div className="grid md:grid-cols-2 gap-3">
        {GOAL_TYPES.map((goal) => (
          <button
            key={goal.value}
            type="button"
            className={cn(
              'p-4 rounded-lg border-2 text-left transition-all',
              formData.goal_type === goal.value
                ? 'border-accent bg-accent-bg'
                : 'border-border hover:border-border-light hover:bg-surface-hover'
            )}
            onClick={() => setFormData({ ...formData, goal_type: goal.value })}
          >
            <goal.icon className={cn('w-5 h-5 mb-2', formData.goal_type === goal.value ? 'text-accent' : 'text-text-muted')} />
            <p className="font-medium text-text-primary">{goal.label}</p>
            <p className="text-xs text-text-muted">{goal.description}</p>
          </button>
        ))}
      </div>
      <Textarea
        label="Descreva seu objetivo"
        placeholder="Ex: Quero passar no ENEM 2024 com nota acima de 700, focando em Matemática e Física"
        value={formData.goal_description}
        onChange={(e) => setFormData({ ...formData, goal_description: e.target.value })}
        error={errors.goal_description}
        hint="Seja específico: prova, nota alvo, prazo, matérias prioritárias"
        rows={3}
      />
    </div>
  );
}

function PrivacyStep({ formData, setFormData }: any) {
  return (
    <div className="space-y-6">
      <div className="p-4 bg-surface-border/50 rounded-lg">
        <h3 className="font-medium text-text-primary mb-2">Telemetria e Diagnósticos</h3>
        <p className="text-sm text-text-muted mb-4">
          O PRISMA coleta dados de uso anônimos para melhorar o app. Você tem controle total:
        </p>
        
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.telemetry_enabled}
            onChange={(e) => setFormData({ ...formData, telemetry_enabled: e.target.checked })}
            className="w-4 h-4 rounded border-border text-accent focus:ring-accent"
          />
          <span className="text-sm text-text-primary">Ativar telemetria (OFF por padrão)</span>
        </label>
      </div>
      
      {formData.telemetry_enabled && (
        <div className="space-y-3 p-4 bg-surface-border/50 rounded-lg">
          <p className="text-sm font-medium text-text-secondary">Categorias (escolha o que compartilhar):</p>
          {[
            { key: 'usage', label: 'Uso do app', desc: 'Páginas visitadas, tempo de sessão' },
            { key: 'performance', label: 'Performance', desc: 'Tempos de carregamento, memória' },
            { key: 'errors', label: 'Erros', desc: 'Falhas e crashes (sem dados pessoais)' },
            { key: 'ai_usage', label: 'Uso de IA', desc: 'Tokens, latência, modelos usados' },
          ].map((cat) => (
            <label key={cat.key} className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.telemetry_categories[cat.key as keyof typeof formData.telemetry_categories]}
                onChange={(e) => setFormData({
                  ...formData,
                  telemetry_categories: { ...formData.telemetry_categories, [cat.key]: e.target.checked }
                })}
                className="w-4 h-4 mt-0.5 rounded border-border text-accent focus:ring-accent"
              />
              <div>
                <p className="text-sm text-text-primary">{cat.label}</p>
                <p className="text-xs text-text-muted">{cat.desc}</p>
              </div>
            </label>
          ))}
        </div>
      )}
      
      <div className="p-4 bg-surface-border/50 rounded-lg border-l-4 border-accent">
        <h4 className="font-medium text-text-primary mb-1">Seus direitos</h4>
        <ul className="text-sm text-text-muted space-y-1">
          <li>• Dados ficam no seu computador (SQLite local)</li>
          <li>• Nenhum dado sai sem seu consentimento explícito</li>
          <li>• Pode revogar a qualquer momento nas Configurações</li>
          <li>• Exportação e exclusão total disponíveis</li>
        </ul>
      </div>
    </div>
  );
}

function AIStep() {
  return (
    <div className="space-y-6">
      <div className="p-4 bg-surface-border/50 rounded-lg">
        <h3 className="font-medium text-text-primary mb-2">Assistente LIA</h3>
        <p className="text-sm text-text-muted mb-4">
          A LIA usa o modelo Nemotron 3 Ultra da NVIDIA. Para usar recursos de IA:
        </p>
        <ul className="text-sm text-text-muted space-y-1">
          <li>• A LIA usa o Nemotron 3 Ultra via NVIDIA, com a chave configurada <strong>apenas no servidor</strong> (env <code>NVIDIA_API_KEY</code> no Vercel).</li>
          <li>• Recursos locais funcionam sem chave: busca, flashcards, planner, etc.</li>
        </ul>
      </div>
      
      <div className="p-4 bg-surface-border/50 rounded-lg">
        <h4 className="font-medium text-text-primary mb-2">Chave API NVIDIA (LIA)</h4>
        <ul className="text-sm text-text-muted space-y-1 list-disc list-inside">
          <li>A chave <strong>não é pedida aqui</strong> — no PRISMA Web ela vive só no servidor (variável de ambiente <code>NVIDIA_API_KEY</code> no Vercel), nunca no navegador.</li>
          <li>Obtenha uma chave gratuita em <a href="https://api.nvidia.com" target="_blank" rel="noopener noreferrer" className="text-accent underline">api.nvidia.com</a> e configure no painel do Vercel.</li>
          <li>Sem a chave no servidor, a LIA responde em modo local (offline).</li>
        </ul>
      </div>
      
      <div className="p-4 bg-surface-border/50 rounded-lg border-l-4 border-info">
        <h4 className="font-medium text-text-primary mb-1">Sem chave? Sem problema.</h4>
        <p className="text-sm text-text-muted">
          Todos os recursos locais funcionam: Biblioteca, Busca, Atlas, Recall, Planner, Simulados, Dashboard, etc.
          A LIA ficará em modo offline até você adicionar a chave.
        </p>
      </div>
    </div>
  );
}

function CompleteStep() {
  return (
    <div className="text-center py-8">
      <div className="w-20 h-20 mx-auto rounded-full bg-accent-bg flex items-center justify-center mb-6">
        <CheckCircle className="w-10 h-10 text-accent" />
      </div>
      <h2 className="text-2xl font-bold text-text-primary mb-2">Tudo pronto!</h2>
      <p className="text-text-muted mb-6">
        Seu PRISMA está configurado. Vamos começar sua jornada acadêmica?
      </p>
      <div className="grid md:grid-cols-3 gap-4 text-left">
        {[
          { icon: BookOpen, title: 'Importe materiais', desc: 'PDFs, apostilas, editais para a Biblioteca' },
          { icon: Target, title: 'Crie seu primeiro objetivo', desc: 'Trilha de estudo no Aprender' },
          { icon: Zap, title: 'Inicie um simulado', desc: 'Teste seus conhecimentos nos Exames' },
        ].map((item, i) => (
          <div key={i} className="p-4 bg-surface-border/50 rounded-lg">
            <item.icon className="w-6 h-6 text-accent mb-2" />
            <p className="font-medium text-text-primary">{item.title}</p>
            <p className="text-sm text-text-muted">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}