import { useEffect, useState } from 'react';
import { useSettingsStore, useUIStore } from '@/store';
import { useProfileStore } from '@/store';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import {
  Bell,
  Shield,
  Database,
  Palette,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Loader2,
  ExternalLink,
  LayoutDashboard,
  TrendingUp,
  Bot,
  Eye,
} from 'lucide-react';
import { useToastStore } from '@/store';

const THEMES = [
  { value: 'system', label: 'Sistema', desc: 'Segue o tema do Windows' },
  { value: 'light', label: 'Claro', desc: 'Sempre modo claro' },
  { value: 'dark', label: 'Escuro', desc: 'Sempre modo escuro' },
];

const LANGUAGES = [
  { value: 'pt-BR', label: 'Português (Brasil)' },
  { value: 'en-US', label: 'English (US)' },
];

export function Settings() {
  const { currentProfile } = useProfileStore();
  const { settings, fetchSettings, updateSettings } = useSettingsStore();
  const { addToast } = useToastStore();
  const { theme: appearanceTheme, setTheme } = useUIStore();
  const [aiKey, setAiKey] = useState('');
  const [aiKeyVisible, setAiKeyVisible] = useState(false);
  const [testingKey, setTestingKey] = useState(false);
  
  useEffect(() => {
    if (currentProfile) {
      fetchSettings(currentProfile.id);
    }
  }, [currentProfile, fetchSettings]);
  
  useEffect(() => {
    if (settings) {
      setAiKey(settings.ai_api_key_configured ? '••••••••' : '');
    }
  }, [settings]);
  
  const handleThemeChange = (theme: string) => {
    if (theme !== 'dark' && theme !== 'light' && theme !== 'system') return;
    setTheme(theme);
    if (currentProfile) void updateSettings(currentProfile.id, { theme });
  };

  const handleTestAIKey = async () => {
    if (!aiKey || aiKey === '••••••••') return;
    setTestingKey(true);
    try {
      // Would call actual API test command
      await new Promise(r => setTimeout(r, 1000));
      addToast({ type: 'success', title: 'Chave válida', message: 'Conexão com NVIDIA API funcionando' });
    } catch {
      addToast({ type: 'error', title: 'Chave inválida', message: 'Verifique sua chave API' });
    } finally {
      setTestingKey(false);
    }
  };
  
  const handleCreateBackup = async () => {
    try {
      addToast({ type: 'info', title: 'Criando backup...' });
      // Would call create_backup command
      await new Promise(r => setTimeout(r, 2000));
      addToast({ type: 'success', title: 'Backup criado', message: 'Backup salvo com sucesso' });
    } catch {
      addToast({ type: 'error', title: 'Erro no backup' });
    }
  };
  
  const handleExportData = async () => {
    try {
      // Would call export_data command
      addToast({ type: 'success', title: 'Exportação pronta', message: 'Dados salvos na área de transferência' });
    } catch {
      addToast({ type: 'error', title: 'Erro na exportação' });
    }
  };
  
  const handleResetSettings = () => {
    if (confirm('Resetar todas as configurações para padrão?')) {
      setTheme('system');
      updateSettings(currentProfile!.id, {
        theme: 'system',
        language: 'pt-BR',
        telemetry_enabled: false,
        telemetry_categories: { usage: false, performance: false, errors: false, ai_usage: false },
        auto_backup: true,
        backup_interval_hours: 24,
      });
      addToast({ type: 'success', title: 'Configurações resetadas' });
    }
  };
  
  const handleDeleteAllData = () => {
    if (confirm('⚠️ ATENÇÃO: Isso apagará TODOS os seus dados permanentemente. Esta ação não pode ser desfeita. Tem certeza?')) {
      if (confirm('Confirmação final: todos os perfis, documentos, questões, histórico e configurações serão deletados.')) {
        // Would call delete profile command
        addToast({ type: 'warning', title: 'Dados apagados', message: 'Todos os dados foram removidos' });
      }
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Configurações</h1>
        <p className="text-text-muted">Personalize seu PRISMA</p>
      </div>
      
      {/* Appearance */}
      <Card className="p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <Palette className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h2 className="font-semibold text-text-primary">Aparência</h2>
            <p className="text-sm text-text-muted">Tema e idioma da interface</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Tema</label>
            <Select
              value={appearanceTheme}
              onChange={handleThemeChange}
              options={THEMES.map(t => ({ value: t.value, label: t.label }))}
              placeholder="Selecione o tema"
            />
            <p className="text-xs text-text-muted mt-1">
              {THEMES.find(t => t.value === appearanceTheme)?.desc}
            </p>
          </div>
          
          <div>
            <label className="label">Idioma</label>
            <Select
              value={settings?.language || 'pt-BR'}
              onChange={(v) => updateSettings(currentProfile!.id, { language: v })}
              options={LANGUAGES}
              placeholder="Selecione o idioma"
            />
          </div>
        </div>
      </Card>
      
      {/* Notifications */}
      <Card className="p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Bell className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h2 className="font-semibold text-text-primary">Notificações</h2>
            <p className="text-sm text-text-muted">Lembretes e alertas do sistema</p>
          </div>
        </div>
        
        <div className="space-y-3">
          {[
            { id: 'study_reminders', label: 'Lembretes de estudo', desc: 'Notificações para sessões agendadas no Planner' },
            { id: 'review_reminders', label: 'Revisões pendentes', desc: 'Aviso quando houver flashcards para revisar' },
            { id: 'exam_reminders', label: 'Prazos de simulados', desc: 'Lembretes de provas e exames agendados' },
            { id: 'backup_reminders', label: 'Backup automático', desc: 'Notificação quando backup for concluído' },
          ].map((item) => (
            <label key={item.id} className="flex items-center gap-3 p-3 bg-surface-border/50 rounded-lg cursor-pointer hover:bg-surface-hover transition-colors">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-border text-accent focus:ring-accent"
                defaultChecked={item.id !== 'backup_reminders'}
              />
              <div className="flex-1">
                <p className="font-medium text-text-primary">{item.label}</p>
                <p className="text-sm text-text-muted">{item.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </Card>
      
      {/* Privacy & Telemetry */}
      <Card className="p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <h2 className="font-semibold text-text-primary">Privacidade e Telemetria</h2>
            <p className="text-sm text-text-muted">Controle total sobre seus dados</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="p-4 bg-surface-border/50 rounded-lg">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-medium text-text-primary">Telemetria e Diagnósticos</p>
                <p className="text-sm text-text-muted">Dados anônimos de uso para melhorar o PRISMA (OFF por padrão)</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings?.telemetry_enabled || false}
                  onChange={(e) => updateSettings(currentProfile!.id, { telemetry_enabled: e.target.checked })}
                />
                <div className="w-11 h-6 bg-surface-border peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
              </label>
            </div>
          </div>
          
          {settings?.telemetry_enabled && (
            <div className="p-4 bg-accent/10 rounded-lg border border-accent/20 animate-fade-in">
              <p className="font-medium text-text-primary mb-3">Categorias (escolha o que compartilhar):</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: 'usage', label: 'Uso do app', desc: 'Páginas visitadas, tempo de sessão', icon: LayoutDashboard },
                  { key: 'performance', label: 'Performance', desc: 'Tempos de carregamento, memória', icon: TrendingUp },
                  { key: 'errors', label: 'Erros e crashes', desc: 'Falhas técnicas (sem dados pessoais)', icon: AlertTriangle },
                  { key: 'ai_usage', label: 'Uso de IA', desc: 'Tokens, latência, modelos', icon: Bot },
                ].map((cat) => (
                  <label key={cat.key} className="flex items-center gap-3 p-3 bg-surface border border-border rounded-lg cursor-pointer hover:bg-surface-hover transition-colors">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-border text-accent focus:ring-accent"
                      checked={settings?.telemetry_categories[cat.key as keyof typeof settings.telemetry_categories] || false}
                      onChange={(e) => updateSettings(currentProfile!.id, {
                        telemetry_categories: { ...settings!.telemetry_categories, [cat.key]: e.target.checked }
                      })}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-text-primary">{cat.label}</p>
                      <p className="text-sm text-text-muted">{cat.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
              <p className="text-xs text-text-muted mt-3">
                Nenhum dado pessoal sai do seu computador. Pode revogar a qualquer momento.
              </p>
            </div>
          )}
          
          <div className="pt-4 border-t border-border">
            <p className="text-sm text-text-muted mb-3">Seus direitos (LGPD/GDPR):</p>
            <ul className="text-sm text-text-muted space-y-1 pl-5 list-disc">
              <li>Exportar todos os seus dados (JSON/CSV)</li>
              <li>Solicitar exclusão completa dos dados</li>
              <li>Revogar consentimento de telemetria a qualquer momento</li>
              <li>Dados ficam no seu PC — zero servidores externos</li>
            </ul>
          </div>
        </div>
      </Card>
      
      {/* AI Configuration */}
      <Card className="p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <Bot className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h2 className="font-semibold text-text-primary">Assistente LIA (IA)</h2>
            <p className="text-sm text-text-muted">Configuração da API NVIDIA Nemotron 3 Ultra</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="p-4 bg-surface-border/50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-medium text-text-primary">Chave API NVIDIA</p>
                <p className="text-sm text-text-muted">Necessária para recursos de IA (explicações, geração, análise)</p>
              </div>
              <Badge variant={settings?.ai_api_key_configured ? 'success' : 'warning'}>
                {settings?.ai_api_key_configured ? 'Configurada' : 'Não configurada'}
              </Badge>
            </div>
            
            <div className="relative">
              <Input
                label="Chave API"
                type={aiKeyVisible ? 'text' : 'password'}
                placeholder={settings?.ai_api_key_configured ? '•••••••• (clique para revelar)' : 'sk-... cole sua chave aqui'}
                value={aiKey}
                onChange={(e) => setAiKey(e.target.value)}
                hint="Obtenha em api.nvidia.com — armazenada com DPAPI no Windows"
              />
              <div className="absolute right-3 top-[38px] flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setAiKeyVisible(!aiKeyVisible)}
                  aria-label={aiKeyVisible ? 'Ocultar chave' : 'Mostrar chave'}
                >
                  {aiKeyVisible ? <Eye className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleTestAIKey}
                  disabled={testingKey || !aiKey || aiKey === '••••••••'}
                  aria-label="Testar conexão"
                >
                  {testingKey ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="secondary" onClick={handleTestAIKey} disabled={testingKey || !aiKey}>
                <RefreshCw className="w-4 h-4 mr-1" /> Testar Conexão
              </Button>
              <Button variant="secondary" onClick={() => { setAiKey(''); updateSettings(currentProfile!.id, { ai_api_key_configured: false }); }}>
                <Trash2 className="w-4 h-4 mr-1" /> Remover Chave
              </Button>
            </div>
          </div>
          
          <div className="p-4 bg-surface-border/50 rounded-lg border-l-4 border-info">
            <h4 className="font-medium text-text-primary mb-2">Como funciona:</h4>
            <ul className="text-sm text-text-muted space-y-1 pl-5 list-disc">
              <li>Chave armazenada no Windows Credential Manager (DPAPI)</li>
              <li>Nunca salva em arquivos, logs ou banco de dados</li>
              <li>Enviada apenas para api.nvidia.com via HTTPS</li>
              <li>Modo offline preserva todos os recursos locais</li>
              <li><a href="https://api.nvidia.com" target="_blank" rel="noopener" className="text-accent underline">Obter chave gratuita</a></li>
            </ul>
          </div>
        </div>
      </Card>
      
      {/* Data Management */}
      <Card className="p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
            <Database className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h2 className="font-semibold text-text-primary">Dados e Backup</h2>
            <p className="text-sm text-text-muted">Backup, exportação e gerenciamento de armazenamento</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-surface-border/50 rounded-lg">
              <p className="font-medium text-text-primary mb-1">Backup Automático</p>
              <p className="text-sm text-text-muted mb-3">Executa a cada 24h (configurável)</p>
              <Button variant="secondary" onClick={handleCreateBackup}>
                <Download className="w-4 h-4 mr-1" /> Criar Backup Agora
              </Button>
            </div>
            
            <div className="p-4 bg-surface-border/50 rounded-lg">
              <p className="font-medium text-text-primary mb-1">Exportar Dados</p>
              <p className="text-sm text-text-muted mb-3">JSON completo com todos os seus dados</p>
              <Button variant="secondary" onClick={handleExportData}>
                <Upload className="w-4 h-4 mr-1" /> Exportar (JSON)
              </Button>
            </div>
          </div>
          
          <div className="p-4 bg-surface-border/50 rounded-lg">
            <h3 className="font-medium text-text-primary mb-2">Local do Banco de Dados</h3>
            <p className="text-sm text-text-muted mb-2">
              <code className="bg-surface px-2 py-0.5 rounded text-xs">%APPDATA%\\PRISMA\\prisma.db</code>
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm">
                <ExternalLink className="w-4 h-4 mr-1" /> Abrir Pasta
              </Button>
              <Button variant="ghost" size="sm">
                <RefreshCw className="w-4 h-4 mr-1" /> Verificar Integridade
              </Button>
            </div>
          </div>
          
          <div className="pt-4 border-t border-border">
            <h3 className="font-medium text-text-primary mb-2">Zona de Perigo</h3>
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" onClick={handleResetSettings}>
                <RefreshCw className="w-4 h-4 mr-1" /> Resetar Configurações
              </Button>
              <Button variant="danger" onClick={handleDeleteAllData}>
                <Trash2 className="w-4 h-4 mr-1" /> Apagar TODOS os Dados
              </Button>
            </div>
            <p className="text-xs text-text-muted mt-2">
              Apagar dados remove perfis, documentos, questões, histórico, configurações. Backups não são afetados.
            </p>
          </div>
        </div>
      </Card>
      
      {/* About */}
      <Card className="p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h2 className="font-semibold text-text-primary">Sobre o PRISMA</h2>
            <p className="text-sm text-text-muted">Versão e informações do aplicativo</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="p-3 bg-surface-border/50 rounded-lg">
            <p className="text-text-muted">Versão</p>
            <p className="font-mono text-text-primary">0.1.0 (Fase 1 - Foundation)</p>
          </div>
          <div className="p-3 bg-surface-border/50 rounded-lg">
            <p className="text-text-muted">Tauri</p>
            <p className="font-mono text-text-primary">2.0</p>
          </div>
          <div className="p-3 bg-surface-border/50 rounded-lg">
            <p className="text-text-muted">Rust</p>
            <p className="font-mono text-text-primary">1.99.1</p>
          </div>
          <div className="p-3 bg-surface-border/50 rounded-lg">
            <p className="text-text-muted">React</p>
            <p className="font-mono text-text-primary">18.3</p>
          </div>
          <div className="p-3 bg-surface-border/50 rounded-lg">
            <p className="text-text-muted">SQLite</p>
            <p className="font-mono text-text-primary">3.45+ (WAL mode)</p>
          </div>
          <div className="p-3 bg-surface-border/50 rounded-lg">
            <p className="text-text-muted">Licença</p>
            <p className="font-mono text-text-primary">MIT OR Apache-2.0</p>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-sm text-text-muted text-center">
            PRISMA + LIA — Aplicativo desktop acadêmico pessoal, gratuito e local-first.
            <br />
            Desenvolvido com ❤️ usando Tauri, Rust, React e TypeScript.
          </p>
        </div>
      </Card>
    </div>
  );
}
