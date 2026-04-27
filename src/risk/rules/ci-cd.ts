import { classifyFile } from '../../files/classify-file.js';
import type { RiskInput, RiskSignal } from '../types.js';

export function ciCdRule(input: RiskInput): RiskSignal | null {
  const files = input.changedFiles
    .filter((file) => classifyFile(file.filename, input.config).ciCd)
    .map((file) => file.filename)
    .sort();

  if (files.length === 0) {
    return null;
  }

  return {
    id: 'ci_cd',
    label: 'CI/CD or deployment files changed',
    severity: 'high',
    description: 'PR changes workflow, container, deployment, infrastructure, Terraform, Kubernetes, or Helm files.',
    files
  };
}
