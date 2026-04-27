import { resolveAgentGuardConfig } from "./defaults.js";
import { aiAuthorRule, shouldAnalyzeInput } from "./rules/ai-author.js";
import { ciCdRule } from "./rules/ci-cd.js";
import { dependenciesRule } from "./rules/dependencies.js";
import { getAnalyzableFiles } from "./rules/ignored-paths.js";
import { largePrRule } from "./rules/large-pr.js";
import { migrationsRule } from "./rules/migrations.js";
import { secretsRule } from "./rules/secrets.js";
import { sensitivePathsRule } from "./rules/sensitive-paths.js";
import { sourceWithoutTestsRule } from "./rules/tests.js";
import {
  isAtOrAboveRiskLevel,
  recommendationsForSignals,
  riskLevelFromScore,
  scoreSignals
} from "./scoring.js";
import type { RiskInput, RiskResult, RiskSignal } from "./types.js";

type RiskRule = (input: RiskInput) => RiskSignal | null;

const CAPPED_FILE_RULES: RiskRule[] = [
  aiAuthorRule,
  secretsRule,
  sensitivePathsRule,
  dependenciesRule,
  migrationsRule,
  ciCdRule,
  sourceWithoutTestsRule
];

function emptyResult(overrides: Partial<RiskResult> = {}): RiskResult {
  return {
    riskScore: 0,
    riskLevel: "low",
    signals: [],
    recommendations: [],
    shouldComment: false,
    ...overrides
  };
}

export function evaluateRisk(input: RiskInput): RiskResult {
  const config = resolveAgentGuardConfig(input.config);
  const normalizedInput: RiskInput = {
    ...input,
    body: input.body ?? "",
    labels: input.labels ?? [],
    config
  };

  if (!config.enabled) {
    return emptyResult({
      skipped: true,
      skipReason: "AgentGuard is disabled by configuration."
    });
  }

  const analysisDecision = shouldAnalyzeInput(normalizedInput);

  if (!analysisDecision.shouldAnalyze) {
    return emptyResult({
      skipped: true,
      skipReason: analysisDecision.skipReason
    });
  }

  const analyzableFiles = getAnalyzableFiles(normalizedInput);
  const cappedAnalyzableFiles = analyzableFiles.slice(0, config.largePr.maxChangedFilesAnalyzed);

  const cappedRuleInput: RiskInput = {
    ...normalizedInput,
    changedFiles: cappedAnalyzableFiles
  };

  const largePrInput: RiskInput = {
    ...normalizedInput,
    changedFiles: analyzableFiles
  };

  const cappedRuleSignals = CAPPED_FILE_RULES.map((rule) => rule(cappedRuleInput));
  const largePrSignal = largePrRule(largePrInput);

  const signals = [...cappedRuleSignals, largePrSignal].filter(
    (signal): signal is RiskSignal => signal !== null
  );
  const riskScore = scoreSignals(signals);
  const riskLevel = riskLevelFromScore(riskScore, signals);

  return {
    riskScore,
    riskLevel,
    signals,
    recommendations: recommendationsForSignals(signals),
    shouldComment: isAtOrAboveRiskLevel(riskLevel, config.commentThreshold)
  };
}
