import { DEFAULT_CONFIG } from '../risk/defaults.js';
import type { AgentGuardConfig, FileClassification } from '../risk/types.js';
import { matchAnyGlob, normalizePath } from './glob-match.js';

export function classifyFile(filename: string, config: AgentGuardConfig = DEFAULT_CONFIG): FileClassification {
  const normalizedFilename = normalizePath(filename);

  return {
    filename: normalizedFilename,
    ignored: matchAnyGlob(normalizedFilename, config.ignorePaths),
    source: matchAnyGlob(normalizedFilename, config.sourceFilePatterns),
    test: matchAnyGlob(normalizedFilename, config.testFilePatterns),
    dependency: matchAnyGlob(normalizedFilename, config.dependencyFiles),
    migration: matchAnyGlob(normalizedFilename, config.migrationFiles),
    ciCd: matchAnyGlob(normalizedFilename, config.ciCdFiles),
    sensitive: matchAnyGlob(normalizedFilename, config.criticalPaths),
    secret: matchAnyGlob(normalizedFilename, config.secretsFiles)
  };
}
