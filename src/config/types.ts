import type { AgentGuardMode, RiskLevel } from "../risk/types.js";

export type RawAgentGuardConfig = Record<string, unknown>;

export type AgentGuardUserConfig = {
  enabled?: boolean;
  mode?: AgentGuardMode;
  commentThreshold?: RiskLevel;
  agentAuthors?: string[];
  criticalPaths?: string[];
  ignorePaths?: string[];
};

export type ActionConfigOverrides = {
  mode?: AgentGuardMode;
  commentThreshold?: RiskLevel;
};
