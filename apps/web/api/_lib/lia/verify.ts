// ============================================================
// LIA — Verificação e sinalização de incerteza (server-side)
// Analisa a resposta final: detectaunters, valida estrutura de cálculo,
// e marca confiança. Nunca bloqueia — só sinaliza.
// ============================================================

export interface VerificationResult {
  hasUncertaintyMarker: boolean;
  hasCitations: boolean;
  looksLikeCalculation: boolean;
  calculationChecked: boolean;
  confidence: 'alta' | 'média' | 'baixa';
  notes: string[];
}

const UNCERTAINTY_RE = /\[incerteza:\s*(alta|m[eé]dia|baixa)\]|não tenho certeza|não sei|talvez|posso estar errado/i;
const CITATION_RE = /\[doc:\s*[^\]]+\]/i;
const CALC_RE = /(\d+[.,]?\d*\s*[+\-×x*/÷]\s*\d+[.,]?\d*\s*=\s*[\d.,]+)/;

/** Avalia a resposta da LIA e retorna sinalizações. */
export function verifyResponse(text: string, hasRagContext: boolean): VerificationResult {
  const notes: string[] = [];
  const hasUncertaintyMarker = UNCERTAINTY_RE.test(text);
  const hasCitations = CITATION_RE.test(text);
  const looksLikeCalculation = CALC_RE.test(text);
  let calculationChecked = false;

  if (looksLikeCalculation) {
    // Extrai a primeira expressão e tenta avaliar com segurança
    const m = text.match(CALC_RE);
    if (m) {
      try {
        // Avalia só números e operadores básicos (sem eval de código arbitrário)
        const expr = m[1].replace(/[=].*$/, '').replace(/×/g, '*').replace(/÷/g, '/').replace(/,/g, '.');
        if (/^[\d\s+\-*/.()]+$/.test(expr)) {
          // eslint-disable-next-line no-eval
          const computed = Function(`"use strict"; return (${expr})`)();
          const claimed = parseFloat(m[1].split('=')[1].replace(',', '.'));
          calculationChecked = true;
          if (Math.abs(computed - claimed) > 0.01) {
            notes.push(`Cálculo pode estar incorreto: ${m[1]} (calculado: ${computed})`);
          }
        }
      } catch { /* não conseguiu avaliar */ }
    }
  }

  if (hasRagContext && !hasCitations) {
    notes.push('Há documentos relevantes no contexto, mas a resposta não citou fontes [doc: ...].');
  }
  if (!hasUncertaintyMarker && !hasCitations && text.length > 400) {
    notes.push('Resposta longa sem marcador de incerteza nem citação — revisar se é fato ou geração.');
  }

  let confidence: VerificationResult['confidence'] = 'alta';
  if (hasUncertaintyMarker || notes.length > 0) confidence = 'média';
  if (notes.some((n) => n.includes('incorreto'))) confidence = 'baixa';

  return { hasUncertaintyMarker, hasCitations, looksLikeCalculation, calculationChecked, confidence, notes };
}
