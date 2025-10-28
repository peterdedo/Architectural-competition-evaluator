import { describe, it, expect } from 'vitest';
import { calculateProjectScore, validateWeights, evaluateProjects } from './EvaluationEngine';

describe('EvaluationEngine', () => {
  it('calculateProjectScore returns 0 for missing args', () => {
    expect(calculateProjectScore(null, {})).toBe(0);
    expect(calculateProjectScore({}, null)).toBe(0);
  });

  it('validateWeights handles empty object', () => {
    expect(typeof validateWeights({})).toBe('boolean');
  });

  it('evaluateProjects returns array for empty input', () => {
    const out = evaluateProjects([], {});
    expect(Array.isArray(out)).toBe(true);
    expect(out.length).toBe(0);
  });
});
