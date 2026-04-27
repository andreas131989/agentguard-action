export type LogLevel = "info" | "warn" | "error";

export function log(level: LogLevel, message: string): void {
  const prefix = `[agentguard:${level}]`;

  if (level === "error") {
    console.error(`${prefix} ${message}`);
    return;
  }

  if (level === "warn") {
    console.warn(`${prefix} ${message}`);
    return;
  }

  console.log(`${prefix} ${message}`);
}
