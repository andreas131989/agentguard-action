import { readFile } from "node:fs/promises";
import path from "node:path";
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

function stripInlineComment(line: string): string {
  let inSingleQuote = false;
  let inDoubleQuote = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];

    if (character === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
    }

    if (character === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
    }

    if (character === "#" && !inSingleQuote && !inDoubleQuote) {
      return line.slice(0, index);
    }
  }

  return line;
}

function unquote(value: string): string {
  const trimmed = value.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function splitInlineArray(value: string): string[] {
  const inner = value.trim().slice(1, -1).trim();

  if (inner.length === 0) {
    return [];
  }

  const items: string[] = [];
  let current = "";
  let inSingleQuote = false;
  let inDoubleQuote = false;

  for (const character of inner) {
    if (character === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
      current += character;
      continue;
    }

    if (character === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
      current += character;
      continue;
    }

    if (character === "," && !inSingleQuote && !inDoubleQuote) {
      items.push(unquote(current));
      current = "";
      continue;
    }

    current += character;
  }

  if (current.trim().length > 0) {
    items.push(unquote(current));
  }

  return items;
}

function parseScalar(value: string): unknown {
  const trimmed = value.trim();

  if (trimmed === "true") {
    return true;
  }

  if (trimmed === "false") {
    return false;
  }

  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    return splitInlineArray(trimmed);
  }

  return unquote(trimmed);
}

export function parseSimpleYamlConfig(content: string): RawAgentGuardConfig {
  const rawLines = content.split(/\r?\n/);

  const meaningfulLines = rawLines
    .map((rawLine) => stripInlineComment(rawLine).trimEnd())
    .filter((line) => line.trim().length > 0);

  const baseIndent =
    meaningfulLines
      .filter((line) => !line.trimStart().startsWith("- "))
      .map((line) => line.match(/^\s*/)?.[0].length ?? 0)
      .reduce<number | null>(
        (minimum, indent) => (minimum === null ? indent : Math.min(minimum, indent)),
        null
      ) ?? 0;

  const result: RawAgentGuardConfig = {};
  let currentListKey: string | null = null;

  for (const rawLine of meaningfulLines) {
    const line = rawLine.slice(baseIndent);
    const listItemMatch = line.match(/^\s{2}-\s*(.*)$/);

    if (listItemMatch) {
      if (!currentListKey) {
        throw new Error("List item found without a preceding key.");
      }

      const existingValue = result[currentListKey];

      if (!Array.isArray(existingValue)) {
        throw new Error(`"${currentListKey}" cannot mix scalar and list values.`);
      }

      existingValue.push(parseScalar(listItemMatch[1] ?? ""));
      continue;
    }

    if (/^\s/.test(line)) {
      throw new Error("Nested YAML objects are not supported by AgentGuard MVP config.");
    }

    const keyValueMatch = line.match(/^([A-Za-z_][A-Za-z0-9_-]*):(?:\s*(.*))?$/);

    if (!keyValueMatch) {
      throw new Error(`Unsupported YAML line: ${line.trim()}`);
    }

    const key = keyValueMatch[1] ?? "";
    const value = keyValueMatch[2] ?? "";

    if (Object.prototype.hasOwnProperty.call(result, key)) {
      throw new Error(`Duplicate config key "${key}".`);
    }

    if (value.trim().length === 0) {
      result[key] = [];
      currentListKey = key;
      continue;
    }

    result[key] = parseScalar(value);
    currentListKey = null;
  }

  return result;
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
