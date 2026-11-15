import { useState, useRef, useEffect } from 'react';
import { cn } from '@/utils/helpers';
import { X, Send, Mic, MicOff, Paperclip, Bot, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { useUIStore } from '@/store';
import { useToastStore } from '@/store';
import { Button } from '@/components/ui/Button';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: Date;
  citations?: string[];
  toolInvocations?: ToolInvocation[];
  isStreaming?: boolean;
}

interface ToolInvocation {
  toolName: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  status: 'pending' | 'approved' | 'rejected' | 'executed' | 'failed' | 'rolled_back';
}

const TOOLS = [
  { name: 'create_plan', description: 'Criar plano de estudo', icon: '📅' },
  { name: 'draft_exam', description: 'Gerar simulado', icon: '📝' },
  { name: 'draft_cards', description: 'Criar flashcards', icon: '🗂️' },
  { name: 'summarize_source', description: 'Resumir fonte', icon: '📄' },
  { name: 'generate_presentation', description: 'Gerar apresentação', icon: '📊' },
  { name: 'compare_sources', description: 'Comparar fontes', icon: '🔍' },
];

export function RightPanel() {
  const { panelOpen, setPanelOpen, panelCollapsed, setPanelCollapsed } = useUIStore();
  const { addToast } = useToastStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;
    
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsStreaming(true);
    
    // Simulate LIA response
    await simulateLIAResponse(currentInput);
    setIsStreaming(false);
  };
  
  const simulateLIAResponse = async (_userInput: string) => {
    // Simulate typing effect
    const responses = [
      "Entendi sua pergunta. Vou analisar seus materiais e responder com base nas fontes disponíveis.",
      "Com base no seu perfil e nos documentos na biblioteca, posso sugerir...",
      "Essa é uma excelente questão. Deixe-me buscar as informações mais relevantes...",
    ];
    
    const response = responses[Math.floor(Math.random() * responses.length)];
    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };
    
    setMessages((prev) => [...prev, assistantMessage]);
    
    // Typewriter effect
    for (let i = 0; i <= response.length; i++) {
      await new Promise((r) => setTimeout(r, 15));
      setMessages((prev) => 
        prev.map((msg) => 
          msg.id === assistantMessage.id 
            ? { ...msg, content: response.slice(0, i), isStreaming: i < response.length }
            : msg
        )
      );
    }
    
    // Finalize
    setMessages((prev) => 
      prev.map((msg) => 
        msg.id === assistantMessage.id 
          ? { ...msg, isStreaming: false, citations: ['doc-1', 'doc-2'] }
          : msg
      )
    );
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const handleVoiceToggle = () => {
    setIsRecording(!isRecording);
    if (isRecording) {
      addToast({ type: 'info', title: 'Gravação parada', message: 'Processando áudio...' });
    } else {
      addToast({ type: 'info', title: 'Gravando...', message: 'Fale agora' });
    }
  };
  
  const handleToolClick = (toolName: string) => {
    const tool = TOOLS.find((t) => t.name === toolName);
    if (tool) {
      console.log('Tool clicked:', toolName);
      // Add tool invocation to last message
      setMessages((prev) => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg && lastMsg.role === 'assistant') {
          return [
            ...prev.slice(0, -1),
            { ...lastMsg, toolInvocations: [...(lastMsg.toolInvocations || []), { toolName, input: {}, status: 'pending' as const }] }
          ];
        }
        return prev;
      });
    }
  };
  
  if (!panelOpen) return null;
  
  return (
    <aside
      className={cn(
        'panel flex flex-col transition-all duration-300 ease-in-out lg:translate-x-0',
        panelCollapsed && 'w-0 border-l-0',
        !panelCollapsed && 'w-96'
      )}
      aria-label="Painel da LIA"
    >
      {/* Header */}
      <div className={cn('flex items-center justify-between h-16 px-4 border-b border-border', panelCollapsed && 'justify-center')}>
        {!panelCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent-bg flex items-center justify-center">
              <Bot className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="font-medium text-text-primary">LIA</p>
              <p className="text-xs text-text-muted">Laboratório de Inteligência Acadêmica</p>
            </div>
          </div>
        )}
        <button
          className={cn('p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors', panelCollapsed && 'mx-auto')}
          onClick={() => setPanelCollapsed(!panelCollapsed)}
          aria-label={panelCollapsed ? 'Expandir painel LIA' : 'Colapsar painel LIA'}
        >
          {panelCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
        <button
          className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
          onClick={() => setPanelOpen(false)}
          aria-label="Fechar painel LIA"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <ScrollArea className="flex-1 pr-2">
          <div className="space-y-4 p-4">
            {messages.length === 0 && !panelCollapsed && (
              <div className="flex flex-col items-center justify-center h-full text-center py-12 px-6">
                <div className="w-16 h-16 rounded-full bg-accent-bg flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-lg font-medium text-text-primary mb-2">Como posso ajudar?</h3>
                <p className="text-sm text-text-muted mb-6 max-w-xs">
                  Pergunte sobre seus materiais, peça para criar flashcards, simulados, planos de estudo ou explique conceitos.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {TOOLS.slice(0, 4).map((tool) => (
                    <Button
                      key={tool.name}
                      variant="secondary"
                      size="sm"
                      className="text-xs"
                      onClick={() => handleToolClick(tool.name)}
                    >
                      {tool.icon} {tool.description}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        {/* Input Area */}
        {!panelCollapsed && (
          <div className="p-4 border-t border-border">
            <div className="flex items-end gap-2">
              <Button
                variant="secondary"
                size="icon"
                onClick={handleVoiceToggle}
                aria-label={isRecording ? 'Parar gravação' : 'Iniciar gravação'}
                disabled={isStreaming}
                className={cn(isRecording && 'bg-error/10 text-error')}
              >
                {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </Button>
              
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Mensagem para a LIA... (Shift+Enter para nova linha)"
                  className="w-full pr-12 min-h-[44px] max-h-[150px] resize-none bg-surface border border-border rounded-lg px-4 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent disabled:opacity-50"
                  disabled={isStreaming}
                  rows={1}
                />
                <div className="absolute bottom-2 right-2 flex items-center gap-1">
                  <button
                    className="p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
                    onClick={() => setShowTools(!showTools)}
                    aria-label="Ferramentas da LIA"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <Button
                variant="primary"
                size="icon"
                onClick={handleSend}
                disabled={!input.trim() || isStreaming}
                aria-label="Enviar mensagem"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
            
            {/* Tools dropdown */}
            {showTools && (
              <div className="mt-2 absolute bottom-full right-0 mb-1 z-50 bg-surface border border-border rounded-lg shadow-lg p-1 min-w-[200px]">
                {TOOLS.map((tool) => (
                  <button
                    key={tool.name}
                    className="w-full px-3 py-2 rounded text-left text-sm text-text-primary hover:bg-surface-hover transition-colors flex items-center gap-2"
                    onClick={() => { handleToolClick(tool.name); setShowTools(false); }}
                  >
                    <span className="text-lg">{tool.icon}</span>
                    <span>{tool.description}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  
  return (
    <div className={cn('flex gap-3 animate-fade-in', isUser && 'flex-row-reverse')}>
      <Avatar
        size="sm"
        fallback={isUser ? 'Você' : 'LIA'}
        className={cn('flex-shrink-0 mt-0.5', isUser ? 'bg-accent-bg text-accent' : 'bg-sage-100 text-sage-600 dark:bg-sage-900/30 dark:text-sage-400')}
      />
      <div className={cn(
        'max-w-[80%] rounded-2xl px-4 py-2.5',
        isUser
          ? 'bg-accent text-text-inverse rounded-br-md'
          : 'bg-surface border border-border rounded-bl-md'
      )}>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {message.content}
        </div>
        
        {(message.citations?.length || message.toolInvocations?.length) && (
          <div className="mt-2 pt-2 border-t border-border/50">
            {message.citations && message.citations.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap text-xs text-text-muted">
                <span>Fontes:</span>
                {message.citations.map((cite, i) => (
                  <Badge key={i} variant="outline" size="sm">{cite}</Badge>
                ))}
              </div>
            )}
            {message.toolInvocations && message.toolInvocations.length > 0 && (
              <div className="mt-2 space-y-1">
                {message.toolInvocations.map((tool, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <Badge variant="outline" size="sm">{tool.toolName}</Badge>
                    <Badge 
                      variant={tool.status === 'executed' ? 'success' : tool.status === 'failed' ? 'error' : 'warning'} 
                      size="sm"
                    >
                      {tool.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        <div className="mt-1.5 flex items-center gap-2 text-xs text-text-muted">
          <time dateTime={message.timestamp.toISOString()}>
            {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </time>
          {!isUser && message.isStreaming && (
            <span className="flex items-center gap-1 text-accent">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
              <span className="animate-pulse">Digitando...</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}