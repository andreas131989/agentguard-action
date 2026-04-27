import { DEFAULT_CONFIG, resolveAgentGuardConfig } from "../risk/defaults.js";
import type { AgentGuardConfig } from "../risk/types.js";
import type { ActionConfigOverrides, AgentGuardUserConfig } from "./types.js";

function mergeUnique(base: string[], additions: string[] | undefined): string[] {
  if (!additions || additions.length === 0) {
    return base;
  }

  return Array.from(new Set([...base, ...additions].map((value) => value.trim()).filter(Boolean)));
}

export function normalizeAgentGuardConfig(userConfig: AgentGuardUserConfig = {}): AgentGuardConfig {
  const partialConfig: Partial<AgentGuardConfig> = {};

  if (userConfig.enabled !== undefined) {
    partialConfig.enabled = userConfig.enabled;
  }

  if (userConfig.mode !== undefined) {
    partialConfig.mode = userConfig.mode;
  }

  if (userConfig.commentThreshold !== undefined) {
    partialConfig.commentThreshold = userConfig.commentThreshold;
  }

  if (userConfig.agentAuthors !== undefined) {
    partialConfig.agentAuthors = mergeUnique(DEFAULT_CONFIG.agentAuthors, userConfig.agentAuthors);
  }

  if (userConfig.criticalPaths !== undefined) {
    partialConfig.criticalPaths = mergeUnique(DEFAULT_CONFIG.criticalPaths, userConfig.criticalPaths);
  }

  if (userConfig.ignorePaths !== undefined) {
    partialConfig.ignorePaths = mergeUnique(DEFAULT_CONFIG.ignorePaths, userConfig.ignorePaths);
  }

  return resolveAgentGuardConfig(partialConfig);
}

export function applyActionInputConfigOverrides(
  config: AgentGuardConfig,
  overrides: ActionConfigOverrides
): AgentGuardConfig {
  const partialConfig: Partial<AgentGuardConfig> = {
    ...config
  };

  if (overrides.mode !== undefined) {
    partialConfig.mode = overrides.mode;
  }

  if (overrides.commentThreshold !== undefined) {
    partialConfig.commentThreshold = overrides.commentThreshold;
  }

  return resolveAgentGuardConfig(partialConfig);
}
