import { describe, it, expect } from 'vitest';
import { verifyResponse } from '../api/_lib/lia/verify';

describe('verifyResponse — sinalização de incerteza', () => {
  it('detecta marcador de incerteza explícito', () => {
    const r = verifyResponse('Não tenho certeza, mas [incerteza: alta] sobre isso.', false);
    expect(r.hasUncertaintyMarker).toBe(true);
    expect(r.confidence).not.toBe('alta');
  });

  it('detecta citação [doc: ...]', () => {
    const r = verifyResponse('Segundo o material [doc: Aula 3 - Direito Constitucional], o prazo é de 5 dias.', true);
    expect(r.hasCitations).toBe(true);
  });

  it('avisa quando há RAG mas sem citação', () => {
    const r = verifyResponse('Uma resposta longa sem citar nada e sem marcador de incerteza algum sobre o temaflasdkfjalsdfjalsdkfjasldfj alsdfj alsdfj alsdfj alsdfj alskdfj alsdfj alsdfj asldfkj asdlfj asdlfj asldfkj asldfj alsdfj alsdfj asldf alsdkfj asldf alsdfj alsdkf alsdfj alsdfj alsdfkj alsdfj alsdfj alsdfj alsdfj alsdfj asdfj', true);
    expect(r.notes.some((n) => n.includes('não citou'))).toBe(true);
  });

  it('valida cálculo correto', () => {
    const r = verifyResponse('2 + 2 = 4, portanto o total é 4.', false);
    expect(r.looksLikeCalculation).toBe(true);
    expect(r.calculationChecked).toBe(true);
    expect(r.notes.some((n) => n.includes('incorreto'))).toBe(false);
  });

  it('sinaliza cálculo incorreto', () => {
    const r = verifyResponse('2 + 2 = 5', false);
    expect(r.looksLikeCalculation).toBe(true);
    expect(r.notes.some((n) => n.includes('incorreto'))).toBe(true);
    expect(r.confidence).toBe('baixa');
  });

  it('resposta curta sem contexto não gera alerta', () => {
    const r = verifyResponse('Ok, combinado!', false);
    expect(r.confidence).toBe('alta');
    expect(r.notes.length).toBe(0);
  });
});
