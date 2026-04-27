import { classifyFile } from '../../files/classify-file.js';
import type { RiskInput, RiskSignal } from '../types.js';

export function secretsRule(input: RiskInput): RiskSignal | null {
  const files = input.changedFiles
    .filter((file) => classifyFile(file.filename, input.config).secret)
    .map((file) => file.filename)
    .sort();

  if (files.length === 0) {
    return null;
  }

  return {
    id: 'secret_file',
    label: 'Secrets or credential-like files changed',
    severity: 'critical',
    description: 'PR changes obvious secret, credential, key, certificate, kubeconfig, or environment files.',
    files
  };
}
