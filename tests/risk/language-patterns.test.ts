import { describe, expect, it } from 'vitest';
import { classifyFile } from '../../src/files/classify-file.js';
import { DEFAULT_CONFIG } from '../../src/risk/defaults.js';
import languagePatterns from '../fixtures/language-patterns.json' with { type: 'json' };

type LanguagePatternCase = {
  filename: string;
  ignored?: boolean;
  source?: boolean;
  test?: boolean;
  dependency?: boolean;
  migration?: boolean;
  ciCd?: boolean;
  sensitive?: boolean;
  secret?: boolean;
};

describe('language and ecosystem file-pattern classification', () => {
  it.each(languagePatterns as LanguagePatternCase[])('classifies $filename', (testCase) => {
    const classification = classifyFile(testCase.filename, DEFAULT_CONFIG);

    for (const key of ['ignored', 'source', 'test', 'dependency', 'migration', 'ciCd', 'sensitive', 'secret'] as const) {
      if (typeof testCase[key] === 'boolean') {
        expect(classification[key]).toBe(testCase[key]);
      }
    }
  });
});
