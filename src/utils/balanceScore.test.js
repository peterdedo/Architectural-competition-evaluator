import { describe, it, expect } from 'vitest';
import { scoreProject, scoreProjects, computeIndicatorRanges, DIRECTIONS } from './balanceScore.js';

const ind = (id, getValue) => ({ id, nazev: id, sectionCode: 'X', jednotka: 'm²', getValue });

describe('computeIndicatorRanges', () => {
  it('computes min/max across proposals, skipping missing values', () => {
    const indicators = [ind('a', (d) => d.a ?? null)];
    const ranges = computeIndicatorRanges([{ data: { a: 10 } }, { data: { a: 30 } }, { data: {} }], indicators);
    expect(ranges.a).toEqual({ min: 10, max: 30 });
  });

  it('returns null bounds when no proposal has the value', () => {
    const indicators = [ind('a', () => null)];
    const ranges = computeIndicatorRanges([{ data: {} }], indicators);
    expect(ranges.a).toEqual({ min: null, max: null });
  });
});

describe('scoreProject', () => {
  it('an indicator without a chosen direction is excluded from the score entirely', () => {
    const indicators = [{ ...ind('a', (d) => d.a), observedMin: 0, observedMax: 100 }];
    const result = scoreProject({ data: { a: 999999 } }, indicators, {}, {}); // no direction set
    expect(result.indicatorScores).toHaveLength(0);
    expect(result.weightedScore).toBeNull(); // nothing scored → null, not 0
  });

  it('direction "higher" ranks the max value at 100', () => {
    const indicators = [{ ...ind('a', (d) => d.a), observedMin: 0, observedMax: 100 }];
    const result = scoreProject({ data: { a: 100 } }, indicators, { a: DIRECTIONS.HIGHER }, { a: 10 });
    expect(result.indicatorScores[0].normalized).toBe(100);
  });

  it('direction "lower" ranks the min value at 100', () => {
    const indicators = [{ ...ind('a', (d) => d.a), observedMin: 0, observedMax: 100 }];
    const result = scoreProject({ data: { a: 0 } }, indicators, { a: DIRECTIONS.LOWER }, { a: 10 });
    expect(result.indicatorScores[0].normalized).toBe(100);
  });

  it('divides by the sum of applied weights, never returns a raw sum', () => {
    const indicators = [
      { ...ind('a', (d) => d.a), observedMin: 0, observedMax: 100 },
      { ...ind('b', (d) => d.b), observedMin: 0, observedMax: 100 },
    ];
    // Both maxed out → weighted average should be exactly 100, regardless of weight values or count.
    const result = scoreProject(
      { data: { a: 100, b: 100 } },
      indicators,
      { a: DIRECTIONS.HIGHER, b: DIRECTIONS.HIGHER },
      { a: 70, b: 5 }
    );
    expect(result.weightedScore).toBeCloseTo(100);
  });

  it('a missing/NaN indicator value is skipped, not scored as 0, and does not zero the rest', () => {
    const indicators = [
      { ...ind('a', (d) => d.a ?? null), observedMin: 0, observedMax: 100 },
      { ...ind('b', (d) => (Number.isFinite(d.b) ? d.b : null)), observedMin: 0, observedMax: 100 },
    ];
    const result = scoreProject(
      { data: { b: 100 } }, // 'a' missing entirely
      indicators,
      { a: DIRECTIONS.HIGHER, b: DIRECTIONS.HIGHER },
      { a: 10, b: 10 }
    );
    expect(result.indicatorScores.map((s) => s.id)).toEqual(['b']);
    expect(result.weightedScore).toBe(100); // only 'b' counted, and it's maxed → 100, not dragged down by missing 'a'
  });

  it('when every proposal ties (no variance), the indicator scores as fully met (100)', () => {
    const indicators = [{ ...ind('a', (d) => d.a), observedMin: 50, observedMax: 50 }];
    const result = scoreProject({ data: { a: 50 } }, indicators, { a: DIRECTIONS.HIGHER }, { a: 10 });
    expect(result.indicatorScores[0].normalized).toBe(100);
  });

  it('direction "lower": normalized is the best (lowest) value as a share of this value, not min-max position', () => {
    // Best (lowest) observed is 50; a proposal at 100 achieves half of it → 50%, not a min-max
    // position within [50, 200].
    const indicators = [{ ...ind('a', (d) => d.a), observedMin: 50, observedMax: 200 }];
    const result = scoreProject({ data: { a: 100 } }, indicators, { a: DIRECTIONS.LOWER }, { a: 10 });
    expect(result.indicatorScores[0].normalized).toBe(50);
  });

  it('direction "higher": normalized is this value as a share of the best, not a min-max position', () => {
    // Best (highest) observed is 200; a proposal at 100 achieves half of it → 50%.
    const indicators = [{ ...ind('a', (d) => d.a), observedMin: 50, observedMax: 200 }];
    const result = scoreProject({ data: { a: 100 } }, indicators, { a: DIRECTIONS.HIGHER }, { a: 10 });
    expect(result.indicatorScores[0].normalized).toBe(50);
  });

  it('when the best (lowest) value is 0, a ratio is undefined – falls back to linear position between worst and 0', () => {
    const indicators = [{ ...ind('a', (d) => d.a), observedMin: 0, observedMax: 100 }];
    const zeroProposal = scoreProject({ data: { a: 0 } }, indicators, { a: DIRECTIONS.LOWER }, { a: 10 });
    const worstProposal = scoreProject({ data: { a: 100 } }, indicators, { a: DIRECTIONS.LOWER }, { a: 10 });
    // Halfway between the best (0) and the worst (100) scores 50, not 0 – "half as bad as the
    // worst" must not collapse to the same score as "as bad as the worst".
    const halfwayProposal = scoreProject({ data: { a: 50 } }, indicators, { a: DIRECTIONS.LOWER }, { a: 10 });
    expect(zeroProposal.indicatorScores[0].normalized).toBe(100);
    expect(worstProposal.indicatorScores[0].normalized).toBe(0);
    expect(halfwayProposal.indicatorScores[0].normalized).toBe(50);
  });
});

describe('scoreProjects', () => {
  it('adding/removing a proposal reshuffles rankings consistent with ratio-to-best normalization', () => {
    const indicators = [ind('a', (d) => d.a)];
    const directions = { a: DIRECTIONS.HIGHER };
    const weights = { a: 10 };

    const twoProposals = scoreProjects(
      [{ id: 'p1', data: { a: 10 } }, { id: 'p2', data: { a: 20 } }],
      indicators,
      directions,
      weights
    );
    // Best (p2, a=20) always scores 100; p1 scores its share of the best (10/20 = 50%).
    expect(twoProposals.find((p) => p.id === 'p1').weightedScore).toBe(50);
    expect(twoProposals.find((p) => p.id === 'p2').weightedScore).toBe(100);

    const threeProposals = scoreProjects(
      [{ id: 'p1', data: { a: 10 } }, { id: 'p2', data: { a: 20 } }, { id: 'p3', data: { a: 40 } }],
      indicators,
      directions,
      weights
    );
    // Adding a stronger p3 (a=40) becomes the new best; p2 is now only 50% of it (20/40).
    expect(threeProposals.find((p) => p.id === 'p2').weightedScore).toBe(50);
    expect(threeProposals.find((p) => p.id === 'p3').weightedScore).toBe(100);
  });

  it('sorts descending by weightedScore, proposals with no scored indicators sort last', () => {
    const indicators = [ind('a', (d) => d.a ?? null)];
    const directions = { a: DIRECTIONS.HIGHER };
    const results = scoreProjects(
      [
        { id: 'empty', data: {} },
        { id: 'low', data: { a: 10 } },
        { id: 'high', data: { a: 90 } },
      ],
      indicators,
      directions,
      { a: 10 }
    );
    expect(results.map((r) => r.id)).toEqual(['high', 'low', 'empty']);
  });

  it('returns an empty array for empty input', () => {
    expect(scoreProjects([], [], {}, {})).toEqual([]);
  });
});
