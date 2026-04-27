export function normalizePath(value: string): string {
  return value.replace(/\\/g, "/").replace(/^\.\//, "").replace(/^\/+/, "").trim();
}

function basename(value: string): string {
  const normalized = normalizePath(value);
  const parts = normalized.split("/");
  return parts[parts.length - 1] ?? normalized;
}

function escapeRegexChar(char: string): string {
  return /[\\^$+?.()|[\]{}]/.test(char) ? `\\${char}` : char;
}

function globBodyToRegex(pattern: string): string {
  let output = "";

  for (let index = 0; index < pattern.length; index += 1) {
    const char = pattern[index];

    if (char === "*") {
      const next = pattern[index + 1];

      if (next === "*") {
        while (pattern[index + 1] === "*") {
          index += 1;
        }

        if (pattern[index + 1] === "/") {
          output += "(?:.*/)?";
          index += 1;
        } else {
          output += ".*";
        }

        continue;
      }

      output += "[^/]*";
      continue;
    }

    if (char === "?") {
      output += "[^/]";
      continue;
    }

    output += escapeRegexChar(char ?? "");
  }

  return output;
}

function buildGlobRegex(pattern: string, basenameOnly: boolean): RegExp {
  const normalizedPattern = normalizePath(pattern);
  const body = globBodyToRegex(normalizedPattern);

  if (basenameOnly) {
    return new RegExp(`^${body}$`);
  }

  const shouldAllowNestedPrefix =
    normalizedPattern.includes("/") && !normalizedPattern.startsWith("/");

  const prefix = shouldAllowNestedPrefix ? "^(?:.*/)?" : "^";

  return new RegExp(`${prefix}${body}$`);
}

export function globMatch(filename: string, pattern: string): boolean {
  const normalizedFilename = normalizePath(filename);
  const normalizedPattern = normalizePath(pattern);

  if (!normalizedFilename || !normalizedPattern) {
    return false;
  }

  const basenameOnly = !normalizedPattern.includes("/");
  const target = basenameOnly ? basename(normalizedFilename) : normalizedFilename;
  const regex = buildGlobRegex(normalizedPattern, basenameOnly);

  return regex.test(target);
}

export function matchAnyGlob(filename: string, patterns: readonly string[]): boolean {
  return patterns.some((pattern) => globMatch(filename, pattern));
}
