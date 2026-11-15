import { useEffect, useState, useRef } from 'react';
import { useSearchStore } from '@/store';
import { useProfileStore } from '@/store';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { cn, formatRelativeTime } from '@/utils/helpers';
import {
  Search,
  X,
  Filter,
  FileText,
  MessageSquare,
  HelpCircle,
  Target,
  Clock,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';

const ENTITY_TYPES = [
  { value: 'all', label: 'Todos', icon: Search },
  { value: 'document', label: 'Documentos', icon: FileText },
  { value: 'question', label: 'Questões', icon: HelpCircle },
  { value: 'conversation', label: 'Conversas LIA', icon: MessageSquare },
  { value: 'task', label: 'Tarefas', icon: Target },
  { value: 'study_session', label: 'Sessões de Estudo', icon: Clock },
];

function getEntityIcon(type: string) {
  const entity = ENTITY_TYPES.find(e => e.value === type);
  return entity?.icon || Search;
}

function getEntityLabel(type: string) {
  const entity = ENTITY_TYPES.find(e => e.value === type);
  return entity?.label || type;
}

export function SearchPage() {
  const { currentProfile } = useProfileStore();
  const { results, query, isLoading, error, search, setQuery, clearResults } = useSearchStore();
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['all']);
  const [showFilters, setShowFilters] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (currentProfile) {
      inputRef.current?.focus();
    }
  }, [currentProfile]);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      search(currentProfile!.id, query);
    }
  };
  
  const handleClear = () => {
    setQuery('');
    clearResults();
    inputRef.current?.focus();
  };
  
  const toggleType = (type: string) => {
    if (type === 'all') {
      setSelectedTypes(['all']);
    } else {
      setSelectedTypes(prev => {
        const next = prev.filter(t => t !== 'all');
        if (next.includes(type)) {
          return next.filter(t => t !== type);
        }
        return [...next, type];
      });
    }
  };
  
  return (
    <div className="module-workspace space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="section-eyebrow mb-3">SEU CONHECIMENTO, MAIS PERTO</span>
        <h1 className="text-2xl font-bold text-text-primary">Encontre uma conexão.</h1>
          <p className="text-text-muted">Encontre documentos, questões, conversas, tarefas e mais</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="w-4 h-4 mr-1" />
          Filtros
        </Button>
      </div>
      
      {/* Search Bar */}
      <Card className="p-4">
        <form onSubmit={handleSearch} className="relative">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              ref={inputRef}
              type="search"
              placeholder="Digite sua busca... (Ctrl+K para focar)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="input pl-12 pr-16 text-lg"
              autoFocus
            />
            {query && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-3 top-1/2 -translate-y-1/2"
                onClick={handleClear}
                aria-label="Limpar busca"
              >
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>
          
          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2 mt-4">
            {ENTITY_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => toggleType(type.value)}
                className={cn(
                  'btn btn-sm gap-1.5 transition-all',
                  selectedTypes.includes(type.value)
                    ? 'btn-primary'
                    : 'btn-secondary'
                )}
                disabled={isLoading}
              >
                <type.icon className="w-3.5 h-3.5" />
                {type.label}
              </button>
            ))}
          </div>
        </form>
      </Card>
      
      {/* Advanced Filters */}
      {showFilters && (
        <Card className="p-4 animate-slide-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-text-primary">Filtros Avançados</h3>
            <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input label="De (data)" type="date" placeholder="Início" />
            <Input label="Até (data)" type="date" placeholder="Fim" />
            <Select
              label="Origem"
              placeholder="Todas"
              options={[
                { value: 'official', label: 'Oficial' },
                { value: 'user_file', label: 'Arquivo do usuário' },
                { value: 'web', label: 'Web' },
                { value: 'generated', label: 'Gerado por IA' },
              ]}
              value=""
              onChange={() => {}}
            />
            <Select
              label="Status"
              placeholder="Todos"
              options={[
                { value: 'verified', label: 'Verificado' },
                { value: 'needs_review', label: 'Precisa revisão' },
                { value: 'unverified', label: 'Não verificado' },
                { value: 'generated', label: 'Gerado por IA' },
              ]}
              value=""
              onChange={() => {}}
            />
          </div>
        </Card>
      )}
      
      {/* Results */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <ResultCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <Card className="p-6 text-center border-error/50">
            <AlertCircle className="w-10 h-10 mx-auto text-error mb-3" />
            <h3 className="font-medium text-text-primary mb-1">Erro na busca</h3>
            <p className="text-text-muted mb-4">{error}</p>
            <Button variant="secondary" onClick={() => search(currentProfile!.id, query)}>
              Tentar novamente
            </Button>
          </Card>
        ) : results.length === 0 && query ? (
          <Card className="p-12 text-center">
            <Search className="w-12 h-12 mx-auto text-text-muted mb-4" />
            <h3 className="text-lg font-medium text-text-primary mb-2">Nenhum resultado encontrado</h3>
            <p className="text-text-muted mb-4">Tente termos diferentes ou ajuste os filtros</p>
            <Button variant="ghost" onClick={handleClear}>
              Limpar busca
            </Button>
          </Card>
        ) : results.length === 0 ? (
          <Card className="p-12 text-center">
            <Search className="w-12 h-12 mx-auto text-text-muted mb-4" />
            <h3 className="text-lg font-medium text-text-primary mb-2">Comece sua busca</h3>
            <p className="text-text-muted">Digite acima para pesquisar em todos os seus dados</p>
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between text-sm text-text-muted">
              <span>{results.length} resultado{results.length !== 1 ? 's' : ''} para &ldquo;{query}&rdquo;</span>
              <Button variant="ghost" size="sm" onClick={handleClear}>
                Limpar
              </Button>
            </div>
            <div className="space-y-3">
              {results.map((result) => (
                <ResultCard key={result.entity_id} result={result} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ResultCard({ result }: any) {
  const Icon = getEntityIcon(result.entity_type);
  
  return (
    <Card variant="hover" className="p-4 group">
      <div className="flex items-start gap-4">
        <div className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
          result.entity_type === 'document' && 'bg-blue-500/10 text-blue-500',
          result.entity_type === 'question' && 'bg-purple-500/10 text-purple-500',
          result.entity_type === 'conversation' && 'bg-green-500/10 text-green-500',
          result.entity_type === 'task' && 'bg-orange-500/10 text-orange-500',
          result.entity_type === 'study_session' && 'bg-accent/10 text-accent',
        )}>
          <Icon className="w-5 h-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-text-primary truncate">{result.title || 'Sem título'}</h4>
            <Badge variant="outline" size="sm">{getEntityLabel(result.entity_type)}</Badge>
            {result.source_type !== undefined && (
              <Badge variant="neutral" size="sm">
                {['Oficial', 'Usuário', 'Web', 'IA'][result.source_type] || 'Desconhecido'}
              </Badge>
            )}
          </div>
          
          {result.snippet && (
            <p className="text-sm text-text-muted truncate-2 mb-2">{result.snippet}</p>
          )}
          
          <div className="flex items-center gap-4 text-xs text-text-muted">
            <span>{formatRelativeTime(result.created_at)}</span>
            <span className="text-accent font-medium">Relevância: {(1 - result.rank).toFixed(2)}</span>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Abrir resultado"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
}

function ResultCardSkeleton() {
  return (
    <Card variant="padded" className="animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-surface-border" />
        <div className="flex-1 space-y-3">
          <div className="h-4 w-3/4 bg-surface-border rounded" />
          <div className="h-4 w-full bg-surface-border rounded" />
          <div className="h-3 w-1/2 bg-surface-border rounded" />
        </div>
      </div>
    </Card>
  );
}