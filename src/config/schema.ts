import type { AgentGuardMode, RiskLevel } from "../risk/types.js";
import type { AgentGuardUserConfig, RawAgentGuardConfig } from "./types.js";

const ALLOWED_CONFIG_KEYS = new Set([
  "enabled",
  "mode",
  "comment_threshold",
  "agent_authors",
  "critical_paths",
  "ignore_paths"
]);

const VALID_MODES = new Set<AgentGuardMode>(["ai-only", "labeled", "all-prs"]);
const VALID_RISK_LEVELS = new Set<RiskLevel>(["low", "medium", "high", "critical"]);

function isPlainObject(value: unknown): value is RawAgentGuardConfig {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOwnKey(object: RawAgentGuardConfig, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function parseBoolean(value: unknown, key: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`"${key}" must be a boolean.`);
  }

  return value;
}

function parseMode(value: unknown): AgentGuardMode {
  if (typeof value !== "string" || !VALID_MODES.has(value as AgentGuardMode)) {
    throw new Error(`"mode" must be one of: ai-only, labeled, all-prs.`);
  }

  return value as AgentGuardMode;
}

function parseRiskLevel(value: unknown): RiskLevel {
  if (typeof value !== "string" || !VALID_RISK_LEVELS.has(value as RiskLevel)) {
    throw new Error(`"comment_threshold" must be one of: low, medium, high, critical.`);
  }

  return value as RiskLevel;
}

function parseStringArray(value: unknown, key: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`"${key}" must be a list of strings.`);
  }

  const values = value.map((item, index) => {
    if (typeof item !== "string" || item.trim().length === 0) {
      throw new Error(`"${key}" item ${index + 1} must be a non-empty string.`);
    }

    return item.trim();
  });

  return Array.from(new Set(values));
}

export function validateAgentGuardConfig(raw: unknown): AgentGuardUserConfig {
  if (!isPlainObject(raw)) {
    throw new Error("Config must be a YAML object.");
  }

  for (const key of Object.keys(raw)) {
    if (!ALLOWED_CONFIG_KEYS.has(key)) {
      throw new Error(`Unsupported AgentGuard config key "${key}".`);
    }
  }

  const config: AgentGuardUserConfig = {};

  if (hasOwnKey(raw, "enabled")) {
    config.enabled = parseBoolean(raw.enabled, "enabled");
  }

  if (hasOwnKey(raw, "mode")) {
    config.mode = parseMode(raw.mode);
  }

  if (hasOwnKey(raw, "comment_threshold")) {
    config.commentThreshold = parseRiskLevel(raw.comment_threshold);
  }

  if (hasOwnKey(raw, "agent_authors")) {
    config.agentAuthors = parseStringArray(raw.agent_authors, "agent_authors");
  }

  if (hasOwnKey(raw, "critical_paths")) {
    config.criticalPaths = parseStringArray(raw.critical_paths, "critical_paths");
  }

  if (hasOwnKey(raw, "ignore_paths")) {
    config.ignorePaths = parseStringArray(raw.ignore_paths, "ignore_paths");
  }

  return config;
}
