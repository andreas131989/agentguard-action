import * as core from "@actions/core";
import type { AgentGuardMode, RiskLevel } from "../risk/types.js";

export type ActionInputs = {
  githubToken: string;
  mode?: AgentGuardMode;
  commentThreshold?: RiskLevel;
  configPath: string;
  licenseKey: string;
};

type RawActionInputs = {
  githubToken?: string;
  mode?: string;
  commentThreshold?: string;
  configPath?: string;
  licenseKey?: string;
};

const VALID_MODES = ["ai-only", "labeled", "all-prs"] as const;
const VALID_RISK_LEVELS = ["low", "medium", "high", "critical"] as const;

function normalizeString(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

function optionalString(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

export function parseActionMode(value: string | undefined): AgentGuardMode {
  const normalized = optionalString(value)?.toLowerCase();

  if (normalized && VALID_MODES.includes(normalized as AgentGuardMode)) {
    return normalized as AgentGuardMode;
  }

  throw new Error(
    `Invalid AgentGuard mode "${value}". Expected one of: ${VALID_MODES.join(", ")}.`
  );
}

export function parseOptionalActionMode(value: string | undefined): AgentGuardMode | undefined {
  if (!optionalString(value)) {
    return undefined;
  }

  return parseActionMode(value);
}

export function parseRiskLevel(value: string | undefined): RiskLevel {
  const normalized = optionalString(value)?.toLowerCase();

  if (normalized && VALID_RISK_LEVELS.includes(normalized as RiskLevel)) {
    return normalized as RiskLevel;
  }

  throw new Error(
    `Invalid AgentGuard comment threshold "${value}". Expected one of: ${VALID_RISK_LEVELS.join(
      ", "
    )}.`
  );
}

export function parseOptionalRiskLevel(value: string | undefined): RiskLevel | undefined {
  if (!optionalString(value)) {
    return undefined;
  }

  return parseRiskLevel(value);
}

export function normalizeActionInputs(raw: RawActionInputs): ActionInputs {
  const githubToken = raw.githubToken?.trim() ?? "";

  if (githubToken.length === 0) {
    throw new Error("Missing required GitHub token input.");
  }

  const inputs: ActionInputs = {
    githubToken,
    configPath: normalizeString(raw.configPath, ".agentguard.yml"),
    licenseKey: raw.licenseKey?.trim() ?? ""
  };

  const mode = parseOptionalActionMode(raw.mode);
  const commentThreshold = parseOptionalRiskLevel(raw.commentThreshold);

  if (mode !== undefined) {
    inputs.mode = mode;
  }

  if (commentThreshold !== undefined) {
    inputs.commentThreshold = commentThreshold;
  }

  return inputs;
}

export function readActionInputs(): ActionInputs {
  return normalizeActionInputs({
    githubToken: core.getInput("github-token"),
    mode: core.getInput("mode"),
    commentThreshold: core.getInput("comment-threshold"),
    configPath: core.getInput("config-path"),
    licenseKey: core.getInput("license-key")
  });
}
