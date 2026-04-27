import { normalizePath } from "../../files/glob-match.js";
import type { RiskInput, RiskSignal } from "../types.js";

const UNRELATED_TOP_LEVEL_DIRECTORY_COUNT = 8;

function topLevelDirectory(filename: string): string {
  const normalized = normalizePath(filename);
  const parts = normalized.split("/").filter(Boolean);

  if (parts.length <= 1) {
    return ".";
  }

  return parts[0] ?? ".";
}

export function largePrRule(input: RiskInput): RiskSignal | null {
  const changedFileCount = input.changedFiles.length;
  const changedLineCount = input.changedFiles.reduce(
    (total, file) => total + file.additions + file.deletions,
    0
  );
  const topLevelDirectories = new Set(input.changedFiles.map((file) => topLevelDirectory(file.filename)));
  const reasons: string[] = [];

  if (changedFileCount > input.config.largePr.largeFileCount) {
    reasons.push(`${changedFileCount} files changed`);
  }

  if (changedLineCount > input.config.largePr.largeLineCount) {
    reasons.push(`${changedLineCount} lines changed`);
  }

  if (changedFileCount > input.config.largePr.maxChangedFilesAnalyzed) {
    reasons.push(`more than ${input.config.largePr.maxChangedFilesAnalyzed} changed files`);
  }

  if (topLevelDirectories.size >= UNRELATED_TOP_LEVEL_DIRECTORY_COUNT) {
    reasons.push(`${topLevelDirectories.size} top-level directories touched`);
  }

  if (reasons.length === 0) {
    return null;
  }

  return {
    id: "large_pr",
    label: "Large or broad pull request",
    severity: "high",
    description: `PR is broad or large enough to deserve extra attention: ${reasons.join(", ")}.`,
    files: input.changedFiles.map((file) => file.filename).sort()
  };
}
