import { describe, it, expect } from 'vitest';
import { evaluateMath, accuracyPercent, diffLines, mean } from '../src/utils/academic';

describe('evaluateMath (parser seguro, sem eval)', () => {
  it('precedência e parênteses', () => {
    expect(evaluateMath('(3+4)*2')).toBe(14);
    expect(evaluateMath('2+3*4')).toBe(14);
    expect(evaluateMath('10/4')).toBe(2.5);
  });
  it('potência associativa à direita e unário menos', () => {
    expect(evaluateMath('2^3^2')).toBe(512);
    expect(evaluateMath('-3+5')).toBe(2);
    expect(evaluateMath('-(2+2)')).toBe(-4);
  });
  it('funções', () => {
    expect(evaluateMath('sqrt(16)')).toBe(4);
    expect(evaluateMath('abs(-7)')).toBe(7);
    expect(evaluateMath('log(100)')).toBe(2);
    expect(evaluateMath('ln(exp(2))')).toBeCloseTo(2, 10);
  });
  it('vírgula decimal', () => {
    expect(evaluateMath('1,5 + 2,5')).toBe(4);
  });
  it('rejeita entradas perigosas', () => {
    expect(() => evaluateMath('alert(1)')).toThrow();
    expect(() => evaluateMath('process.exit()')).toThrow();
    expect(() => evaluateMath('1/0')).toThrow('divisão por zero');
    expect(() => evaluateMath('(1+2')).toThrow();
    expect(() => evaluateMath('2**3')).toThrow();
  });
});

describe('accuracyPercent', () => {
  it('calcula e arredonda', () => {
    expect(accuracyPercent(7, 10)).toBe(70);
    expect(accuracyPercent(1, 3)).toBe(33.3);
  });
  it('total zero retorna 0 (sem NaN)', () => {
    expect(accuracyPercent(0, 0)).toBe(0);
  });
});

describe('diffLines (LCS)', () => {
  it('identifica adições e remoções', () => {
    const d = diffLines('a\nb\nc', 'a\nx\nc');
    expect(d).toEqual([
      { type: 'same', text: 'a' },
      { type: 'del', text: 'b' },
      { type: 'add', text: 'x' },
      { type: 'same', text: 'c' },
    ]);
  });
  it('textos iguais', () => {
    expect(diffLines('a', 'a')).toEqual([{ type: 'same', text: 'a' }]);
  });
});

describe('mean', () => {
  it('média simples e vazia', () => {
    expect(mean([2, 4, 6])).toBe(4);
    expect(mean([])).toBe(0);
  });
});
