import { DEFAULT_CONFIG, resolveAgentGuardConfig } from "../../src/risk/defaults.js";
import { evaluateRisk } from "../../src/risk/engine.js";
import type { ChangedFile, RiskInput, RiskResult, RiskSignal } from "../../src/risk/types.js";

type RiskInputOverrides = Omit<Partial<RiskInput>, "config"> & {
  config?: Partial<RiskInput["config"]>;
};

export function changedFile(
  filename: string,
  overrides: Partial<ChangedFile> = {},
): ChangedFile {
  const additions = overrides.additions ?? 10;
  const deletions = overrides.deletions ?? 0;

  return {
    filename,
    status: overrides.status ?? "modified",
    additions,
    deletions,
    changes: overrides.changes ?? additions + deletions,
  };
}

export function analyzeRisk(overrides: RiskInputOverrides = {}): RiskResult {
  return evaluateRisk({
    authorLogin: "github-copilot[bot]",
    authorType: "bot",
    branchName: "copilot/update-implementation",
    title: "AI generated implementation update",
    body: "",
    labels: [],
    changedFiles: [],
    ...overrides,
    config: resolveAgentGuardConfig({
      ...DEFAULT_CONFIG,
      ...(overrides.config ?? {}),
    }),
  });
}

export function findSignal(result: RiskResult, id: string): RiskSignal | undefined {
  return result.signals.find((signal) => signal.id === id);
}

export function hasSignal(result: RiskResult, id: string): boolean {
  return findSignal(result, id) !== undefined;
}

export function signalIds(result: RiskResult): string[] {
  return result.signals.map((signal) => signal.id);
}
