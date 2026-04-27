import { classifyFile } from '../../files/classify-file.js';
import type { RiskInput, RiskSignal } from '../types.js';

export function sourceWithoutTestsRule(input: RiskInput): RiskSignal | null {
  const sourceFiles = input.changedFiles
    .filter((file) => classifyFile(file.filename, input.config).source)
    .map((file) => file.filename)
    .sort();

  if (sourceFiles.length === 0) {
    return null;
  }

  const hasTestChanges = input.changedFiles.some((file) => classifyFile(file.filename, input.config).test);

  if (hasTestChanges) {
    return null;
  }

  return {
    id: 'source_without_tests',
    label: 'Source changed without tests',
    severity: 'medium',
    description: 'PR changes source files without matching test file changes in this PR.',
    files: sourceFiles
  };
}
