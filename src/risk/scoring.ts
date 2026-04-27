import { normalizePath } from "../files/glob-match.js";
import type { RiskLevel, RiskSignal, SignalSeverity } from "./types.js";

const DEFAULT_SEVERITY_SCORES: Record<SignalSeverity, number> = {
  low: 10,
  medium: 25,
  high: 50,
  critical: 100
};

const SIGNAL_SCORE_OVERRIDES: Record<string, number> = {
  ai_author: 10,
  dependency_file: 50,
  source_without_tests: 25,
  sensitive_path: 50,
  migration_schema: 50,
  ci_cd: 50,
  large_pr: 50,
  secret_file: 100
};

const RISK_LEVEL_ORDER: Record<RiskLevel, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3
};

const CRITICAL_NO_TESTS_PATH_SEGMENTS = new Set([
  "auth",
  "oauth",
  "identity",
  "iam",
  "rbac",
  "billing",
  "payment",
  "payments",
  "permissions",
  "security",
  "crypto"
]);

function hasSignal(signals: RiskSignal[], id: string): boolean {
  return signals.some((signal) => signal.id === id);
}

function isCriticalSensitivePath(filename: string): boolean {
  return normalizePath(filename)
    .toLowerCase()
    .split("/")
    .some((segment) => CRITICAL_NO_TESTS_PATH_SEGMENTS.has(segment));
}

function shouldUpgradeAiSensitiveNoTestsToCritical(signals: RiskSignal[]): boolean {
  if (
    !hasSignal(signals, "ai_author") ||
    !hasSignal(signals, "sensitive_path") ||
    !hasSignal(signals, "source_without_tests")
  ) {
    return false;
  }

  const sensitiveSignal = signals.find((signal) => signal.id === "sensitive_path");

  return sensitiveSignal?.files?.some(isCriticalSensitivePath) ?? false;
}

function shouldUpgradeAiMigrationAndCiCdToCritical(signals: RiskSignal[]): boolean {
  return (
    hasSignal(signals, "ai_author") &&
    hasSignal(signals, "migration_schema") &&
    hasSignal(signals, "ci_cd")
  );
}

export function scoreSignals(signals: RiskSignal[]): number {
  return signals.reduce(
    (score, signal) =>
      score + (SIGNAL_SCORE_OVERRIDES[signal.id] ?? DEFAULT_SEVERITY_SCORES[signal.severity]),
    0
  );
}

export function riskLevelFromScore(score: number, signals: RiskSignal[]): RiskLevel {
  const signalIds = new Set(signals.map((signal) => signal.id));

  if (
    signals.some((signal) => signal.severity === "critical") ||
    shouldUpgradeAiSensitiveNoTestsToCritical(signals) ||
    shouldUpgradeAiMigrationAndCiCdToCritical(signals) ||
    (signalIds.has("sensitive_path") &&
      signalIds.has("dependency_file") &&
      signalIds.has("migration_schema"))
  ) {
    return "critical";
  }

  if (signals.some((signal) => signal.severity === "high") || score >= 60) {
    return "high";
  }

  if (signals.some((signal) => signal.severity === "medium") || score >= 25) {
    return "medium";
  }

  return "low";
}

export function isAtOrAboveRiskLevel(level: RiskLevel, threshold: RiskLevel): boolean {
  return RISK_LEVEL_ORDER[level] >= RISK_LEVEL_ORDER[threshold];
}

export function recommendationsForSignals(signals: RiskSignal[]): string[] {
  const signalIds = new Set(signals.map((signal) => signal.id));
  const recommendations: string[] = [];

  if (signals.length > 0) {
    recommendations.push("Request review from the relevant human owner.");
  }

  if (signalIds.has("sensitive_path")) {
    recommendations.push(
      "Confirm changes to sensitive paths are intentional and reviewed by the right owner."
    );
  }

  if (signalIds.has("dependency_file")) {
    recommendations.push("Confirm dependency changes are intentional.");
  }

  if (signalIds.has("migration_schema")) {
    recommendations.push("Confirm migration or schema changes are safe to apply and roll back.");
  }

  if (signalIds.has("ci_cd")) {
    recommendations.push(
      "Confirm CI/CD or deployment changes cannot alter release behavior unexpectedly."
    );
  }

  if (signalIds.has("source_without_tests")) {
    recommendations.push("Add or verify regression tests for the changed source files.");
  }

  if (signalIds.has("large_pr")) {
    recommendations.push("Consider splitting the PR or reviewing it in smaller logical sections.");
  }

  if (signalIds.has("secret_file")) {
    recommendations.push("Verify no secrets, credentials, or private keys were added or exposed.");
  }

  return recommendations;
}
