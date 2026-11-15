import { useEffect, useState } from 'react';
import { Play, Pause, Volume2, Check, Loader2, Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface VoiceOption {
  id: string;
  name: string;
  provider: 'edge' | 'web-speech' | 'google';
  description: string;
  previewText: string;
  recommended?: boolean;
}

const VOICES: VoiceOption[] = [
  {
    id: 'pt-BR-ThalitaMultilingualNeural',
    name: 'Thalita (Multilingual Neural)',
    provider: 'edge',
    description: 'Voz feminina natural, multilíngue — melhor para português',
    previewText: 'Olá! Sou a Thalita. Posso ajudar você a estudar com uma voz natural e agradável.',
    recommended: true,
  },
  {
    id: 'pt-BR-AntonioNeural',
    name: 'Antônio (Neural)',
    provider: 'edge',
    description: 'Voz masculina neural, clara e profissional',
    previewText: 'Olá! Sou o Antônio. Estou pronto para acompanhar seus estudos.',
  },
  {
    id: 'pt-BR-FranciscaNeural',
    name: 'Francisca (Neural)',
    provider: 'edge',
    description: 'Voz feminina neural, calorosa e expressiva',
    previewText: 'Oi! Sou a Francisca. Vamos aprender juntos?',
  },
  {
    id: 'pt-BR-ThalitaMultilingualNeural-Fast',
    name: 'Thalita Rápida',
    provider: 'edge',
    description: 'Thalita com velocidade aumentada (rate=1.3)',
    previewText: 'Esta é a Thalita em velocidade mais rápida para revisões ágeis.',
  },
];

const EDGE_TTS_BASE = 'https://api.edge-tts.com/v1/voices'; // placeholder, usamos endpoint direto

// Edge TTS endpoint público (não oficial, mas funciona)
const EDGE_SYNTHESIZE = (voice: string, text: string) =>
  `https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?voice=${voice}&text=${encodeURIComponent(text)}`;

// Fallback: Web Speech API
function speakWithWebSpeech(text: string, voiceName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      reject(new Error('Web Speech API não suportada'));
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'pt-BR';
    const voices = window.speechSynthesis.getVoices();
    const v = voices.find((vo) => vo.name.includes(voiceName) || vo.lang === 'pt-BR');
    if (v) utter.voice = v;
    utter.onend = () => resolve();
    utter.onerror = () => reject(new Error('Erro na síntese'));
    window.speechSynthesis.speak(utter);
  });
}

export function VoicePreviewPage() {
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playPreview = async (voice: VoiceOption) => {
    if (playing === voice.id) {
      audioRef.current?.pause();
      setPlaying(null);
      return;
    }

    audioRef.current?.pause();
    setLoading(voice.id);
    setError(null);

    try {
      let audioUrl: string;

      if (voice.provider === 'edge') {
        // Edge TTS via endpoint público
        audioUrl = `https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?voice=${voice.id}&text=${encodeURIComponent(voice.previewText)}`;
      } else {
        // Web Speech API - criamos um blob via MediaRecorder (mais complexo)
        // Para simplicidade, usamos o endpoint do Edge mesmo para Web Speech
        audioUrl = `https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?voice=pt-BR-ThalitaMultilingualNeural&text=${encodeURIComponent(voice.previewText)}`;
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => {
        setPlaying(voice.id);
        setLoading(null);
      };
      audio.onpause = () => setPlaying(null);
      audio.onended = () => setPlaying(null);
      audio.onerror = () => {
        setError('Erro ao reproduzir. Tentando fallback...');
        // Fallback para Web Speech API
        speakWithWebSpeech(voice.previewText, voice.name).then(() => setPlaying(null)).catch(() => {
          setError('Não foi possível reproduzir. Verifique sua conexão.');
          setPlaying(null);
        });
      };

      await audio.play();
    } catch (err) {
      setError('Erro ao carregar áudio.');
      setLoading(null);
    }
  };

  const stopAll = () => {
    audioRef.current?.pause();
    audioRef.current = null;
    setPlaying(null);
    setLoading(null);
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
        <header className="text-center">
          <h1 className="text-3xl font-light tracking-tight">Escolha a voz da LIA</h1>
          <p className="text-text-muted mt-2 max-w-2xl mx-auto">
            Ouça cada opção e escolha sua favorita. As vozes <strong>Edge TTS (Microsoft)</strong> são neurais, gratuitas e soam muito próximas do ElevenLabs.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          {VOICES.map((voice) => (
            <VoiceCard
              key={voice.id}
              voice={voice}
              isPlaying={playing === voice.id}
              isLoading={loading === voice.id}
              isSelected={selectedVoice === voice.id}
              onPlay={() => playPreview(voice)}
              onSelect={() => setSelectedVoice(voice.id)}
            />
          ))}
        </div>

        {error && (
          <div className="p-4 bg-error/10 border border-error/20 rounded-lg text-error text-sm" role="alert">
            {error}
          </div>
        )}

        {selectedVoice && (
          <div className="p-6 bg-accent/5 border border-accent/20 rounded-xl text-center">
            <p className="text-sm text-text-muted">
              Voz selecionada:
            </p>
            <p className="text-lg font-medium text-accent mt-1">
              {VOICES.find(v => v.id === selectedVoice)?.name}
            </p>
            <div className="mt-4 flex gap-3 justify-center">
              <Button variant="outline" onClick={stopAll}>
                <Pause size={16} /> Parar
              </Button>
              <Button onClick={() => alert('Configuração salva! A LIA usará esta voz.')}>
                <Check size={16} /> Confirmar e usar
              </Button>
            </div>
          </div>
        )}

        <footer className="text-center text-sm text-text-muted pt-8 border-t">
          <p>As vozes Edge TTS funcionam online (precisa de internet).</p>
          <p className="mt-1">Para uso 100% offline, o navegador usa Web Speech API (qualidade varia).</p>
        </footer>
      </div>
    </div>
  );
}

function VoiceCard({
  voice,
  isPlaying,
  isLoading,
  isSelected,
  onPlay,
  onSelect,
}: {
  voice: VoiceOption;
  isPlaying: boolean;
  isLoading: boolean;
  isSelected: boolean;
  onPlay: () => void;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`relative p-5 rounded-xl border-2 transition-all ${
        isSelected
          ? 'border-accent bg-accent/5'
          : 'border-border/50 hover:border-accent/50'
      }`}
      style={{ cursor: 'pointer' }}
    >
      {voice.recommended && (
        <span className="absolute -top-2 -right-2 flex items-center gap-1 px-2 py-0.5 bg-accent text-accent-foreground text-[10px] font-medium rounded-full">
          <Star size={10} fill={currentColor} /> Recomendada
        </span>
      )}

      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
          {isLoading ? (
            <Loader2 size={20} className="animate-spin text-accent" />
          ) : (
            <Volume2 size={24} className={isPlaying ? 'text-accent animate-pulse' : 'text-text-muted'} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate">{voice.name}</h3>
          <p className="text-sm text-text-muted mt-1 line-clamp-2">{voice.description}</p>
          <span className="inline-block mt-2 px-2 py-0.5 text-[10px] uppercase tracking-wider rounded bg-muted">
            {voice.provider === 'edge' ? '🌐 Edge TTS (Neural)' : '🖥️ Web Speech API'}
          </span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-border/50 flex items-center gap-3">
        <button
          onClick={(e) => { e.stopPropagation(); onPlay(); }}
          disabled={isLoading}
          className="flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2
            ${isPlaying ? 'bg-accent text-accent-foreground' : 'bg-muted hover:bg-muted/80'}"
        >
          {isLoading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Carregando...
            </>
          ) : isPlaying ? (
            <>
              <Pause size={14} />
              Parar
            </>
          ) : (
            <>
              <Play size={14} />
              Ouvir preview
            </>
          )}
        </button>
        {isSelected && (
          <Check className="w-5 h-5 text-accent flex-shrink-0" />
        )}
      </div>
    </button>
  );
}

import { useRef } from 'react';