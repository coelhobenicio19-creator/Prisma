import { afterEach, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { VoiceControls } from '../src/components/VoiceControls';
afterEach(() => vi.unstubAllGlobals());
it('mantém os controles de voz como ações independentes do envio do formulário', () => {
  vi.stubGlobal('window',{speechSynthesis:{},SpeechRecognition:function(){}});
  const html=renderToStaticMarkup(<form><VoiceControls text="Texto para ouvir" onTranscript={()=>{}}/></form>);
  const buttons=html.match(/<button\b[^>]*>/g)??[];
  expect(buttons.length).toBeGreaterThan(0);
  expect(buttons.every((button)=>button.includes('type="button"'))).toBe(true);
});
