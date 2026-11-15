import { useEffect, useState } from 'react';
import { useLibraryStore } from '@/store';
import { useProfileStore } from '@/store';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn, formatRelativeTime } from '@/utils/helpers';
import { pickFile } from '@/services/tauri';
import {
  FileText,
  Search,
  Plus,
  Trash2,
  Eye,
  Loader2,
  AlertCircle,
  FileCheck,
  Clock,
} from 'lucide-react';

function getStatusIcon(doc: any) {
  if (doc.ocr_status === 'completed' && doc.extraction_status === 'completed') return <FileCheck className="w-4 h-4 text-accent" />;
  if (doc.ocr_status === 'processing' || doc.extraction_status === 'processing') return <Loader2 className="w-4 h-4 animate-spin text-warning" />;
  if (doc.ocr_status === 'failed' || doc.extraction_status === 'failed') return <AlertCircle className="w-4 h-4 text-error" />;
  return <Clock className="w-4 h-4 text-text-muted" />;
}

function getStatusLabel(doc: any) {
  if (doc.ocr_status === 'completed' && doc.extraction_status === 'completed') return 'Pronto';
  if (doc.ocr_status === 'processing' || doc.extraction_status === 'processing') return 'Processando...';
  if (doc.ocr_status === 'failed' || doc.extraction_status === 'failed') return 'Falhou';
  return 'Pendente';
}

export function Library() {
  const { currentProfile } = useProfileStore();
  const { documents, isLoading, fetchDocuments, importDocument, deleteDocument, openDocument, selectedDocument, selectDocument } = useLibraryStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{ file: string; progress: number } | null>(null);
  
  useEffect(() => {
    if (currentProfile) {
      fetchDocuments(currentProfile.id);
    }
  }, [currentProfile, fetchDocuments]);
  
  const handleImport = async () => {
    const filePaths = await pickFile({
      title: 'Importar documentos',
      filters: [
        { name: 'PDF', extensions: ['pdf'] },
        { name: 'Documentos', extensions: ['pdf', 'docx', 'doc', 'txt', 'md', 'epub'] },
        { name: 'Todos', extensions: ['*'] },
      ],
      multiple: true,
    });
    
    if (!filePaths || (Array.isArray(filePaths) && filePaths.length === 0)) return;
    
    const files = Array.isArray(filePaths) ? filePaths : [filePaths];
    setImporting(true);
    
    for (const file of files) {
      try {
        setImportProgress({ file: file.split('\\').pop() || file, progress: 0 });
        // Simulate progress
        for (let i = 0; i <= 100; i += 20) {
          await new Promise(r => setTimeout(r, 50));
          setImportProgress(p => p ? { ...p, progress: i } : null);
        }
        
        await importDocument(currentProfile!.id, file);
        setImportProgress({ file: file.split('\\').pop() || file, progress: 100 });
      } catch (err: any) {
        console.error('Erro ao importar:', err);
        if (err.message?.includes('já importado')) {
          alert(`Arquivo já importado: ${file.split('\\').pop()}`);
        } else {
          alert(`Erro ao importar ${file.split('\\').pop()}: ${err.message}`);
        }
      }
    }
    
    setImporting(false);
    setImportProgress(null);
  };
  
  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este documento?')) {
      await deleteDocument(id);
    }
  };
  
  const filteredDocs = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <div className="module-workspace space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Biblioteca</h1>
          <p className="text-text-muted">Gerencie seus materiais de estudo: PDFs, documentos, anotações</p>
        </div>
        <Button onClick={handleImport} disabled={importing}>
          <Plus className="w-4 h-4 mr-1" />
          {importing ? 'Importando...' : 'Importar Arquivos'}
        </Button>
      </div>
      
      {/* Import Progress */}
      {importProgress && (
        <Card className="p-4 border-accent/50">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-accent" />
            <div className="flex-1">
              <p className="font-medium text-text-primary">Importando: {importProgress.file}</p>
              <div className="h-2 bg-surface-border rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-300"
                  style={{ width: `${importProgress.progress}%` }}
                />
              </div>
            </div>
            <span className="text-sm text-text-muted">{importProgress.progress}%</span>
          </div>
        </Card>
      )}
      
      {/* Search & Filter */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="search"
              placeholder="Buscar por título..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <span>{filteredDocs.length} de {documents.length} documentos</span>
          </div>
        </div>
      </Card>
      
      {/* Documents Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {isLoading ? (
          [...Array(6)].map((_, i) => (
            <DocumentCardSkeleton key={i} />
          ))
        ) : filteredDocs.length === 0 ? (
          <div className="col-span-full">
            <Card className="p-12 text-center">
              {searchQuery ? (
                <>
                  <Search className="w-12 h-12 mx-auto text-text-muted mb-4" />
                  <h3 className="text-lg font-medium text-text-primary mb-2">Nenhum resultado</h3>
                  <p className="text-text-muted">Tente ajustar sua busca</p>
                </>
              ) : (
                <>
                  <FileText className="w-12 h-12 mx-auto text-text-muted mb-4" />
                  <h3 className="text-lg font-medium text-text-primary mb-2">Biblioteca vazia</h3>
                  <p className="text-text-muted mb-4">Importe seus primeiros materiais de estudo</p>
                  <Button onClick={handleImport} className="mt-2">
                    <Plus className="w-4 h-4 mr-1" />
                    Importar Arquivos
                  </Button>
                </>
              )}
            </Card>
          </div>
        ) : (
          filteredDocs.map((doc) => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              onOpen={() => openDocument(doc.id)}
              onDelete={() => handleDelete(doc.id)}
              onSelect={() => selectDocument(doc)}
              isSelected={selectedDocument?.id === doc.id}
            />
          ))
        )}
      </div>
    </div>
  );
}

function DocumentCard({ doc, onOpen, onDelete, onSelect, isSelected }: any) {
  const isPdf = doc.mime_type === 'application/pdf';
  
  return (
    <Card
      variant="interactive"
      className={cn('relative overflow-hidden', isSelected && 'ring-2 ring-accent')}
      onClick={onSelect}
    >
      <div className="aspect-[3/4] bg-surface-border relative overflow-hidden">
        {isPdf ? (
          <div className="w-full h-full flex items-center justify-center">
            <FileText className="w-16 h-16 text-text-muted" />
          </div>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-surface-border to-surface-hover" />
        )}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onOpen(); }} aria-label="Abrir">
            <Eye className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDelete(); }} aria-label="Excluir">
            <Trash2 className="w-4 h-4 text-error" />
          </Button>
        </div>
        <div className="absolute bottom-2 left-2 right-2 flex justify-between">
          <Badge variant="outline" size="sm">{getStatusIcon(doc)} {getStatusLabel(doc)}</Badge>
          <span className="text-xs text-text-muted bg-black/50 px-2 py-0.5 rounded">
            {formatFileSize(doc.file_size)}
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-medium text-text-primary truncate mb-1">{doc.title}</h3>
        <div className="flex items-center gap-3 text-xs text-text-muted">
          <span>{formatRelativeTime(doc.created_at)}</span>
          <span>{doc.page_count ? `${doc.page_count} pág.` : ''}</span>
        </div>
      </div>
    </Card>
  );
}

function DocumentCardSkeleton() {
  return (
    <Card variant="padded" className="animate-pulse">
      <div className="aspect-[3/4] bg-surface-border rounded mb-4" />
      <div className="h-4 w-3/4 bg-surface-border rounded mb-2" />
      <div className="h-3 w-1/2 bg-surface-border rounded" />
    </Card>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}