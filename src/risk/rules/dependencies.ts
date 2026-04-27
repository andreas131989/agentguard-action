import { classifyFile } from '../../files/classify-file.js';
import type { RiskInput, RiskSignal } from '../types.js';

export function dependenciesRule(input: RiskInput): RiskSignal | null {
  const files = input.changedFiles
    .filter((file) => classifyFile(file.filename, input.config).dependency)
    .map((file) => file.filename)
    .sort();

  if (files.length === 0) {
    return null;
  }

  return {
    id: 'dependency_file',
    label: 'Dependency files changed',
    severity: 'medium',
    description: 'PR changes dependency manifests or lockfiles.',
    files
  };
}
