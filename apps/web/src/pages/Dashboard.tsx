import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDashboardStore } from '@/store';
import { useProfileStore } from '@/store';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn, formatRelativeTime } from '@/utils/helpers';
import {
  LayoutDashboard,
  BookOpen,
  Clock,
  Target,
  Brain,
  Award,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Settings,
  RefreshCw,
  Network,
  Sparkles,
} from 'lucide-react';

export function Dashboard() {
  const navigate = useNavigate();
  const { currentProfile } = useProfileStore();
  const { data, isLoading, error, fetchDashboard, refreshDashboard } = useDashboardStore();
  
  useEffect(() => {
    if (currentProfile) {
      fetchDashboard(currentProfile.id);
    }
  }, [currentProfile, fetchDashboard]);
  
  if (!currentProfile) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="p-8 text-center max-w-md">
          <LayoutDashboard className="w-12 h-12 mx-auto text-text-muted mb-4" />
          <h2 className="text-xl font-semibold text-text-primary mb-2">Selecione um perfil</h2>
          <p className="text-text-muted mb-4">Crie ou selecione um perfil de estudo para ver seu dashboard</p>
          <Button onClick={() => window.location.href = '/onboarding'}>
            Configurar Perfil
          </Button>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Seu próximo passo.</h1>
          <p className="text-text-muted">Que bom ver você, {currentProfile.name}. Vamos conectar novas ideias?</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => refreshDashboard(currentProfile.id)}>
            <RefreshCw className="w-4 h-4 mr-1" /> Atualizar
          </Button>
          <Button variant="secondary" size="sm" asChild>
            <a href="/settings">
              <Settings className="w-4 h-4 mr-1" /> Configurações
            </a>
          </Button>
        </div>
      </div>
      
      {/* Loading / Error */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="p-6">
              <div className="space-y-3">
                <div className="h-4 w-3/4 bg-surface-border/50 rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-surface-border/50 rounded animate-pulse" />
                <div className="h-4 w-full bg-surface-border/50 rounded animate-pulse" />
              </div>
            </Card>
          ))}
        </div>
      )}
      
      {error && (
        <Card className="p-6 border-error/50">
          <div className="flex items-center gap-3 text-error">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-medium">Erro ao carregar dashboard</p>
              <p className="text-sm text-text-muted">{error}</p>
            </div>
          </div>
          <Button variant="secondary" size="sm" className="mt-4" onClick={() => fetchDashboard(currentProfile.id)}>
            Tentar novamente
          </Button>
        </Card>
      )}
      
      {!isLoading && !error && data && (
        <>
          <section className="next-session">
            <div><span className="section-eyebrow">SEU MOMENTO DE APRENDER</span><h2>{data.pending_reviews.total_due > 0 ? 'O que você aprende merece ficar.' : 'Uma nova conexão começa aqui.'}</h2><p>{data.pending_reviews.total_due > 0 ? `Você tem ${data.pending_reviews.total_due} revisões esperando por você. Retome de onde parou e fortaleça seu conhecimento.` : 'Explore seu Atlas, escolha um tópico e dê o próximo passo no seu aprendizado.'}</p><div className="flex flex-wrap gap-3 mt-6"><Button size="sm" asChild><Link to={data.pending_reviews.total_due > 0 ? '/recall' : '/atlas'}>{data.pending_reviews.total_due > 0 ? <Brain size={13}/> : <Network size={13}/>} {data.pending_reviews.total_due > 0 ? 'Começar revisão' : 'Explorar meu Atlas'}<ArrowRight size={13}/></Link></Button><Button size="sm" variant="ghost" asChild><Link to="/planner">Ver meu planejamento <ArrowRight size={12}/></Link></Button></div></div>
            <div className="hidden xl:flex w-28 h-28 items-center justify-center border border-accent/20 rounded-full relative text-accent"><span className="absolute -inset-5 border border-accent/10 rounded-full"/><span className="absolute inset-4 border border-accent/20 rounded-full"/><Sparkles size={28} strokeWidth={1}/><i className="absolute top-0 left-5 w-2 h-2 bg-accent rounded-full"/></div>
          </section>
          {/* Top Stats Row */}
          <div className="dashboard-stats">
            <StatCard
              icon={Brain}
              label="Domínio Médio"
              value={`${Math.round((data.mastery_overview.reduce((a, b) => a + b.mastery_level, 0) / (data.mastery_overview.length || 1)) * 100)}%`}
              trend="Domínio atual dos tópicos"
              trendPositive
            />
            <StatCard
              icon={Clock}
              label="Estudo esta semana"
              value={data.study_stats.total_study_hours.toFixed(1)}h
              trend={`${data.study_stats.sessions_this_week} sessões`}
            />
            <StatCard
              icon={Target}
              label="Streak atual"
              value={`${data.study_stats.current_streak_days} dias`}
              trend={data.study_stats.current_streak_days > 0 ? 'Continue assim!' : 'Comece hoje'}
              trendPositive={data.study_stats.current_streak_days > 0}
            />
            <StatCard
              icon={Award}
              label="Revisões pendentes"
              value={data.pending_reviews.total_due}
              trend={data.pending_reviews.overdue > 0 ? `${data.pending_reviews.overdue} atrasadas` : 'Em dia'}
              trendPositive={data.pending_reviews.overdue === 0}
            />
          </div>
          
          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Upcoming & Reviews */}
            <div className="lg:col-span-2 space-y-6">
              {/* Upcoming Commitments */}
              <Card className="p-0 overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-primary">Na sua agenda</h3>
                      <p className="text-sm text-text-muted">{data.upcoming_commitments.length} agendados</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <a href="/planner">Ver todos <ArrowRight className="w-4 h-4 ml-1" /></a>
                  </Button>
                </div>
                <div className="divide-y divide-border">
                  {data.upcoming_commitments.length === 0 ? (
                    <div className="p-6 text-center text-text-muted">
                      <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Nenhum compromisso agendado</p>
                      <Button variant="ghost" size="sm" className="mt-2" asChild>
                        <a href="/planner">Adicionar no Planner</a>
                      </Button>
                    </div>
                  ) : (
                    data.upcoming_commitments.slice(0, 5).map((commitment) => (
                      <div key={commitment.id} className="px-5 py-4 flex items-center gap-4 hover:bg-surface-hover transition-colors">
                        <div className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                          commitment.type === 'exam' && 'bg-error/10 text-error',
                          commitment.type === 'assessment' && 'bg-warning/10 text-warning',
                          commitment.type === 'study' && 'bg-accent/10 text-accent'
                        )}>
                          {commitment.type === 'exam' && <Award className="w-5 h-5" />}
                          {commitment.type === 'assessment' && <CheckCircle className="w-5 h-5" />}
                          {commitment.type === 'study' && <BookOpen className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-text-primary truncate">{commitment.title}</p>
                          <p className="text-sm text-text-muted">
                            {new Date(commitment.scheduled_at).toLocaleString('pt-BR', {
                              day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                            })}
                            {commitment.due_in_hours > 0 && (
                              <span className="ml-2 badge badge-primary">{commitment.due_in_hours}h</span>
                            )}
                          </p>
                        </div>
                        <Badge variant={commitment.type === 'exam' ? 'error' : commitment.type === 'assessment' ? 'warning' : 'primary'} size="sm">
                          {commitment.type === 'exam' ? 'Simulado' : commitment.type === 'assessment' ? 'Avaliação' : 'Estudo'}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </Card>
              
              {/* Pending Reviews */}
              <Card className="p-0 overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <Brain className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-primary">Uma revisão, novas conexões</h3>
                      <p className="text-sm text-text-muted">{data.pending_reviews.total_due} cards para revisar</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <a href="/recall">Ir para Recall <ArrowRight className="w-4 h-4 ml-1" /></a>
                  </Button>
                </div>
                <div className="px-5 py-4">
                  {data.pending_reviews.total_due === 0 ? (
                    <div className="text-center py-4 text-text-muted">
                      <CheckCircle className="w-10 h-10 mx-auto text-accent mb-2" />
                      <p className="font-medium">Tudo em dia!</p>
                      <p className="text-sm">Nenhuma revisão pendente no momento.</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="p-3 bg-error/10 rounded-lg text-center">
                          <p className="text-2xl font-bold text-error">{data.pending_reviews.overdue}</p>
                          <p className="text-xs text-text-muted">Atrasadas</p>
                        </div>
                        <div className="p-3 bg-warning/10 rounded-lg text-center">
                          <p className="text-2xl font-bold text-warning">{data.pending_reviews.due_today}</p>
                          <p className="text-xs text-text-muted">Hoje</p>
                        </div>
                        <div className="p-3 bg-accent/10 rounded-lg text-center">
                          <p className="text-2xl font-bold text-accent">{data.pending_reviews.total_due - data.pending_reviews.overdue - data.pending_reviews.due_today}</p>
                          <p className="text-xs text-text-muted">Futuras</p>
                        </div>
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {data.pending_reviews.by_deck.slice(0, 5).map((deck) => (
                          <div key={deck.deck_id} className="flex items-center justify-between p-3 bg-surface-border/50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                                <Brain className="w-4 h-4 text-accent" />
                              </div>
                              <div>
                                <p className="font-medium text-text-primary truncate max-w-[200px]">{deck.deck_name}</p>
                                <p className="text-xs text-text-muted">{deck.due_count} cards</p>
                              </div>
                            </div>
                            <Badge variant="primary">{deck.due_count}</Badge>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </Card>
            </div>
            
            {/* Right Column - Recent Docs, Errors, Mastery */}
            <div className="space-y-6">
              {/* Recent Documents */}
              <Card className="p-0 overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-primary">Sua biblioteca</h3>
                      <p className="text-sm text-text-muted">{data.recent_documents.length} na biblioteca</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <a href="/library">Ver todos <ArrowRight className="w-4 h-4 ml-1" /></a>
                  </Button>
                </div>
                <div className="divide-y divide-border">
                  {data.recent_documents.length === 0 ? (
                    <div className="p-6 text-center text-text-muted">
                      <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Nenhum documento importado</p>
                      <Button variant="ghost" size="sm" className="mt-2" asChild>
                        <a href="/library">Importar primeiro</a>
                      </Button>
                    </div>
                  ) : (
                    data.recent_documents.slice(0, 5).map((doc) => (
                      <div key={doc.id} className="px-5 py-3 flex items-center gap-3 hover:bg-surface-hover transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-surface-border flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-text-muted" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <path d="M14 2v6h6" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-text-primary truncate">{doc.title}</p>
                          <p className="text-xs text-text-muted">{formatRelativeTime(doc.imported_at)}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="shrink-0" aria-label="Abrir biblioteca" onClick={() => navigate('/library')}>
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </Card>
              
              {/* Error Summary */}
              <Card className="p-0 overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-error/10 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-error" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-primary">Aprender com os erros</h3>
                      <p className="text-sm text-text-muted">{data.error_summary.total_errors} erros registrados</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <a href="/error-lab">Ver Error Lab <ArrowRight className="w-4 h-4 ml-1" /></a>
                  </Button>
                </div>
                <div className="px-5 py-4">
                  {data.error_summary.total_errors === 0 ? (
                    <div className="text-center py-4 text-text-muted">
                      <CheckCircle className="w-10 h-10 mx-auto text-accent mb-2" />
                      <p>Nenhum erro registrado ainda</p>
                      <p className="text-sm">Erros em simulados aparecem aqui automaticamente</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-3 mb-4">
                        <div className="flex-1 p-3 bg-error/10 rounded-lg">
                          <p className="text-2xl font-bold text-error">{data.error_summary.unconfirmed_errors}</p>
                          <p className="text-xs text-text-muted">Não confirmados</p>
                        </div>
                        <div className="flex-1 p-3 bg-warning/10 rounded-lg">
                          <p className="text-2xl font-bold text-warning">{data.error_summary.recent_recurrences}</p>
                          <p className="text-xs text-text-muted">Reincidências (7d)</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {data.error_summary.by_cause.slice(0, 4).map((cause, i) => (
                          <div key={i} className="flex items-center justify-between p-2 bg-surface-border/50 rounded">
                            <span className="text-sm text-text-secondary capitalize">{cause.cause.replace('_', ' ')}</span>
                            <Badge variant="neutral">{cause.count}</Badge>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </Card>
              
              {/* Mastery Overview */}
              <Card className="p-0 overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-primary">Onde vale aprofundar</h3>
                      <p className="text-sm text-text-muted">Menor domínio no Atlas</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <a href="/atlas">Ver Atlas <ArrowRight className="w-4 h-4 ml-1" /></a>
                  </Button>
                </div>
                <div className="px-5 py-4">
                  {data.mastery_overview.length === 0 ? (
                    <div className="text-center py-4 text-text-muted">
                      <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Adicione tópicos no Atlas para ver progresso</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {data.mastery_overview.slice(0, 5).map((topic, i) => (
                        <div key={topic.topic_id} className="p-3 bg-surface-border/50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center text-accent text-xs font-bold">
                                {i + 1}
                              </span>
                              <div>
                                <p className="font-medium text-text-primary truncate max-w-[200px]">{topic.topic_name}</p>
                                <p className="text-xs text-text-muted">{topic.subject_name}</p>
                              </div>
                            </div>
                            <Badge variant={topic.mastery_level < 0.3 ? 'error' : topic.mastery_level < 0.6 ? 'warning' : 'success'} size="sm">
                              {Math.round(topic.mastery_level * 100)}%
                            </Badge>
                          </div>
                          <div className="h-1.5 bg-surface-border rounded-full overflow-hidden">
                            <div
                              className="h-full bg-accent rounded-full transition-all duration-500"
                              style={{ width: `${topic.mastery_level * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
          
          {/* Study Stats Summary */}
          <Card className="p-5">
            <h3 className="font-semibold text-text-primary mb-4">Estatísticas de Estudo (7 dias)</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <StatItem label="Horas totais" value={data.study_stats.total_study_hours.toFixed(1)} unit="h" icon={Clock} />
              <StatItem label="Sessões" value={data.study_stats.sessions_this_week} icon={CheckCircle} />
              <StatItem label="Streak" value={data.study_stats.current_streak_days} unit="dias" icon={Target} />
              <StatItem label="Foco" value={data.study_stats.focus_sessions_this_week} unit="sessões" icon={Brain} />
              <StatItem label="Pomodoros" value={data.study_stats.total_pomodoros} icon={Award} />
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, trend, trendPositive = true }: any) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-text-muted mb-1">{label}</p>
          <p className="text-2xl font-bold text-text-primary">{value}</p>
        </div>
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', 'bg-accent/10 text-accent')}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {trend && (
        <p className={cn('mt-3 text-sm', trendPositive ? 'text-success' : 'text-warning')}>
          {trend}
        </p>
      )}
    </Card>
  );
}

function StatItem({ label, value, unit, icon: Icon }: any) {
  return (
    <div className="text-center p-3 bg-surface-border/50 rounded-lg">
      <Icon className="w-5 h-5 mx-auto text-text-muted mb-2" />
      <p className="text-2xl font-bold text-text-primary">{value}{unit ? ` ${unit}` : ''}</p>
      <p className="text-xs text-text-muted">{label}</p>
    </div>
  );
}