import { useState } from 'react';
import { Volume2, Square, Mic } from 'lucide-react';
import { speak, stopSpeaking, listenOnce, voiceCapabilities } from '@/services/voice';

interface Props {
  /** Texto a ser lido em voz alta (TTS). */
  text?: string;
  /** Recebe o texto reconhecido (STT) — ex.: enviar para a LIA. */
  onTranscript?: (t: string) => void;
  className?: string;
}

export function VoiceControls({ text, onTranscript, className }: Props) {
  const caps = voiceCapabilities();
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleListen = () => {
    setError(null);
    const stop = listenOnce(
      (r) => { setListening(false); onTranscript?.(r.transcript); },
      (msg) => { setListening(false); setError(msg); }
    );
    if (stop) setListening(true);
    else setError('STT não suportado neste navegador.');
  };

  return (
    <div className={`flex items-center gap-2 ${className ?? ''}`}>
      {caps.tts && text && (
        <button type="button" className="btn btn-ghost btn-icon" aria-label="Ouvir" onClick={() => speak(text)}>
          <Volume2 size={14} />
        </button>
      )}
      {caps.tts && (
        <button type="button" className="btn btn-ghost btn-icon" aria-label="Parar fala" onClick={() => stopSpeaking()}>
          <Square size={12} />
        </button>
      )}
      {caps.stt && (
        <button
          type="button"
          className={`btn btn-ghost btn-icon ${listening ? 'text-accent' : ''}`}
          aria-label="Ditado por voz"
          onClick={handleListen}
        >
          <Mic size={14} className={listening ? 'animate-pulse' : undefined} />
        </button>
      )}
      {error && <span className="text-xs text-text-muted">{error}</span>}
    </div>
  );
}
