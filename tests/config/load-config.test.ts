import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadAgentGuardConfig, parseSimpleYamlConfig } from "../../src/config/load-config.js";
import { DEFAULT_CONFIG } from "../../src/risk/defaults.js";

let tempDirectories: string[] = [];

async function createTempDirectory(): Promise<string> {
  const directory = await mkdtemp(path.join(tmpdir(), "agentguard-config-"));
  tempDirectories.push(directory);
  return directory;
}

afterEach(async () => {
  await Promise.all(
    tempDirectories.map((directory) =>
      rm(directory, {
        recursive: true,
        force: true
      })
    )
  );
  tempDirectories = [];
});

describe("AgentGuard config loading", () => {
  it("parses the supported MVP YAML subset", () => {
    expect(
      parseSimpleYamlConfig(`
        enabled: true
        mode: all-prs
        comment_threshold: high

        agent_authors:
          - "cursor-agent"
          - 'local-agent'

        critical_paths: ["fraud/**", "risk/**"]
        ignore_paths:
          - snapshots/**
      `)
    ).toEqual({
      enabled: true,
      mode: "all-prs",
      comment_threshold: "high",
      agent_authors: ["cursor-agent", "local-agent"],
      critical_paths: ["fraud/**", "risk/**"],
      ignore_paths: ["snapshots/**"]
    });
  });

  it("falls back to defaults when the config file is missing", async () => {
    const directory = await createTempDirectory();

    await expect(loadAgentGuardConfig(".agentguard.yml", directory)).resolves.toEqual({
      config: DEFAULT_CONFIG,
      found: false,
      path: path.join(directory, ".agentguard.yml")
    });
  });

  it("loads and normalizes .agentguard.yml when present", async () => {
    const directory = await createTempDirectory();

    await writeFile(
      path.join(directory, ".agentguard.yml"),
      [
        "enabled: false",
        "mode: all-prs",
        "comment_threshold: critical",
        "",
        "agent_authors:",
        '  - "local-agent"',
        "",
        "critical_paths:",
        '  - "fraud/**"',
        "",
        "ignore_paths:",
        '  - "snapshots/**"',
        ""
      ].join("\n"),
      "utf8"
    );

    const result = await loadAgentGuardConfig(".agentguard.yml", directory);

    expect(result.found).toBe(true);
    expect(result.path).toBe(path.join(directory, ".agentguard.yml"));
    expect(result.config.enabled).toBe(false);
    expect(result.config.mode).toBe("all-prs");
    expect(result.config.commentThreshold).toBe("critical");
    expect(result.config.agentAuthors).toContain("github-copilot[bot]");
    expect(result.config.agentAuthors).toContain("local-agent");
    expect(result.config.criticalPaths).toContain("auth/**");
    expect(result.config.criticalPaths).toContain("fraud/**");
    expect(result.config.ignorePaths).toContain("docs/**");
    expect(result.config.ignorePaths).toContain("snapshots/**");
  });

  it("loads config from a configurable path", async () => {
    const directory = await createTempDirectory();

    await writeFile(
      path.join(directory, "config.yml"),
      ["mode: labeled", "comment_threshold: medium", ""].join("\n"),
      "utf8"
    );

    const result = await loadAgentGuardConfig("config.yml", directory);

    expect(result.found).toBe(true);
    expect(result.config.mode).toBe("labeled");
    expect(result.config.commentThreshold).toBe("medium");
  });

  it("fails invalid config with a clear message", async () => {
    const directory = await createTempDirectory();

    await writeFile(path.join(directory, ".agentguard.yml"), "mode: blocking\n", "utf8");

    await expect(loadAgentGuardConfig(".agentguard.yml", directory)).rejects.toThrow(
      "Invalid AgentGuard config"
    );
    await expect(loadAgentGuardConfig(".agentguard.yml", directory)).rejects.toThrow(
      '"mode" must be one of: ai-only, labeled, all-prs.'
    );
  });

  it("rejects unsupported nested YAML objects", () => {
    expect(() =>
      parseSimpleYamlConfig(`
        enabled: true
        nested:
          child: value
      `)
    ).toThrow("Nested YAML objects are not supported by AgentGuard MVP config.");
  });
});
