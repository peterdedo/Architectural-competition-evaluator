import { describe, it, expect } from 'vitest';
import { extractJsonFromContent } from './aiChat.js';

describe('extractJsonFromContent', () => {
  it('parses raw JSON', () => {
    expect(extractJsonFromContent('{"a": 1}')).toEqual({ a: 1 });
  });

  it('strips ```json fence', () => {
    expect(extractJsonFromContent('```json\n{"a": 1}\n```')).toEqual({ a: 1 });
  });

  it('strips plain ``` fence', () => {
    expect(extractJsonFromContent('```\n{"a": 1}\n```')).toEqual({ a: 1 });
  });

  it('extracts JSON embedded in surrounding prose', () => {
    expect(extractJsonFromContent('Tady je výsledek:\n{"a": 1}\nDoufám že pomůže.')).toEqual({ a: 1 });
  });

  it('repairs trailing commas', () => {
    expect(extractJsonFromContent('{"a": 1, "b": [1, 2,],}')).toEqual({ a: 1, b: [1, 2] });
  });

  it('throws a clear error when there is no JSON object', () => {
    expect(() => extractJsonFromContent('žádný json tady není')).toThrow(/JSON/);
  });
});
