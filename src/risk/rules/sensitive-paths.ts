import { classifyFile } from '../../files/classify-file.js';
import type { RiskInput, RiskSignal } from '../types.js';

export function sensitivePathsRule(input: RiskInput): RiskSignal | null {
  const files = input.changedFiles
    .filter((file) => classifyFile(file.filename, input.config).sensitive)
    .map((file) => file.filename)
    .sort();

  if (files.length === 0) {
    return null;
  }

  return {
    id: 'sensitive_path',
    label: 'Sensitive paths changed',
    severity: 'high',
    description: 'PR changes files in paths that commonly affect auth, billing, security, infra, migrations, or workflows.',
    files
  };
}
