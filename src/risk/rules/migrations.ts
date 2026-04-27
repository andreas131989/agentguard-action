import { classifyFile } from '../../files/classify-file.js';
import type { RiskInput, RiskSignal } from '../types.js';

export function migrationsRule(input: RiskInput): RiskSignal | null {
  const files = input.changedFiles
    .filter((file) => classifyFile(file.filename, input.config).migration)
    .map((file) => file.filename)
    .sort();

  if (files.length === 0) {
    return null;
  }

  return {
    id: 'migration_schema',
    label: 'Migration or schema files changed',
    severity: 'high',
    description: 'PR changes migration, schema, SQL, API schema, or protobuf files.',
    files
  };
}
