import { readFile } from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";
import type { AgentGuardConfig } from "../risk/types.js";
import { normalizeAgentGuardConfig } from "./normalize-config.js";
import { validateAgentGuardConfig } from "./schema.js";
import type { RawAgentGuardConfig } from "./types.js";

export type LoadAgentGuardConfigResult = {
  config: AgentGuardConfig;
  found: boolean;
  path: string;
};

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

export function parseSimpleYamlConfig(content: string): RawAgentGuardConfig {
  const parsed = yaml.load(content);

  if (parsed === null || parsed === undefined) {
    return {};
  }

  if (typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Config must be a YAML object.");
  }

  return parsed as RawAgentGuardConfig;
}

function resolveConfigPath(configPath: string, cwd: string): string {
  const normalizedPath = configPath.trim() || ".agentguard.yml";
  return path.isAbsolute(normalizedPath) ? normalizedPath : path.join(cwd, normalizedPath);
}

export async function loadAgentGuardConfig(
  configPath = ".agentguard.yml",
  cwd = process.cwd()
): Promise<LoadAgentGuardConfigResult> {
  const resolvedPath = resolveConfigPath(configPath, cwd);

  let content: string;

  try {
    content = await readFile(resolvedPath, "utf8");
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return {
        config: normalizeAgentGuardConfig(),
        found: false,
        path: resolvedPath
      };
    }

    throw new Error(`Unable to read AgentGuard config at ${resolvedPath}: ${errorMessage(error)}`);
  }

  try {
    const rawConfig = parseSimpleYamlConfig(content);
    const userConfig = validateAgentGuardConfig(rawConfig);

    return {
      config: normalizeAgentGuardConfig(userConfig),
      found: true,
      path: resolvedPath
    };
  } catch (error: unknown) {
    throw new Error(`Invalid AgentGuard config at ${resolvedPath}: ${errorMessage(error)}`);
  }
}
