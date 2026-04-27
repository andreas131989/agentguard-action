import { classifyFile } from '../../files/classify-file.js';
import type { ChangedFile, RiskInput, RiskSignal } from '../types.js';

export function isIgnoredFile(file: ChangedFile, input: RiskInput): boolean {
  return classifyFile(file.filename, input.config).ignored;
}

export function getAnalyzableFiles(input: RiskInput): ChangedFile[] {
  return input.changedFiles.filter((file) => !isIgnoredFile(file, input));
}

export function ignoredPathsRule(): RiskSignal | null {
  return null;
}
