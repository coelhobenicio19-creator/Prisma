// ============================================================
// Voz — Web Speech API nativa do navegador (R$ 0, sem servidor)
// STT: SpeechRecognition (quando disponível)
// TTS: speechSynthesis
// Fallback gracioso: retorna null/false se não suportado.
// ============================================================

export interface VoiceCapabilities {
  stt: boolean;
  tts: boolean;
}

export function voiceCapabilities(): VoiceCapabilities {
  if (typeof window === 'undefined') return { stt: false, tts: false };
  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  return {
    stt: typeof SR !== 'undefined',
    tts: typeof window.speechSynthesis !== 'undefined',
  };
}

/** Fala um texto (TTS). Retorna false se não suportado. */
export function speak(text: string, lang = 'pt-BR', rate = 1): boolean {
  if (typeof window === 'undefined' || !window.speechSynthesis) return false;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = rate;
  const voices = window.speechSynthesis.getVoices();
  const pt = voices.find((v) => v.lang?.toLowerCase().startsWith('pt'));
  if (pt) u.voice = pt;
  window.speechSynthesis.speak(u);
  return true;
}

export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
}

export interface SttResult {
  transcript: string;
  confidence: number;
}

/**
 * Reconhecimento de fala (STT) com callback.
 * Retorna função de parada. Se não suportado, chama onError.
 */
export function listenOnce(
  onResult: (r: SttResult) => void,
  onError: (msg: string) => void,
  lang = 'pt-BR'
): (() => void) | null {
  if (typeof window === 'undefined') return null;
  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SR) { onError('Reconhecimento de fala não suportado neste navegador.'); return null; }
  const rec = new SR();
  rec.lang = lang;
  rec.interimResults = false;
  rec.maxAlternatives = 1;
  rec.onresult = (e: any) => {
    const res = e.results?.[0]?.[0];
    if (res) onResult({ transcript: res.transcript, confidence: res.confidence ?? 0 });
  };
  rec.onerror = (e: any) => onError(e.error ?? 'erro de reconhecimento');
  rec.start();
  return () => { try { rec.stop(); } catch { /* noop */ } };
}
