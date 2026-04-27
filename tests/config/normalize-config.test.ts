import { describe, expect, it } from "vitest";
import {
  applyActionInputConfigOverrides,
  normalizeAgentGuardConfig
} from "../../src/config/normalize-config.js";
import { DEFAULT_CONFIG } from "../../src/risk/defaults.js";

describe("AgentGuard config normalization", () => {
  it("falls back to defaults when no config is provided", () => {
    expect(normalizeAgentGuardConfig()).toEqual(DEFAULT_CONFIG);
  });

  it("merges lightweight config values with defaults", () => {
    const config = normalizeAgentGuardConfig({
      enabled: false,
      mode: "all-prs",
      commentThreshold: "critical",
      agentAuthors: ["local-agent"],
      criticalPaths: ["fraud/**"],
      ignorePaths: ["snapshots/**"]
    });

    expect(config.enabled).toBe(false);
    expect(config.mode).toBe("all-prs");
    expect(config.commentThreshold).toBe("critical");
    expect(config.agentAuthors).toContain("github-copilot[bot]");
    expect(config.agentAuthors).toContain("local-agent");
    expect(config.criticalPaths).toContain("auth/**");
    expect(config.criticalPaths).toContain("fraud/**");
    expect(config.ignorePaths).toContain("docs/**");
    expect(config.ignorePaths).toContain("snapshots/**");
    expect(config.dependencyFiles).toEqual(DEFAULT_CONFIG.dependencyFiles);
    expect(config.largePr).toEqual(DEFAULT_CONFIG.largePr);
  });

  it("deduplicates merged list values", () => {
    const config = normalizeAgentGuardConfig({
      agentAuthors: ["github-copilot[bot]", "github-copilot[bot]", "local-agent"]
    });

    expect(config.agentAuthors.filter((author) => author === "github-copilot[bot]")).toHaveLength(
      1
    );
    expect(config.agentAuthors).toContain("local-agent");
  });

  it("lets action inputs override config mode and comment threshold", () => {
    const config = normalizeAgentGuardConfig({
      mode: "labeled",
      commentThreshold: "critical"
    });

    const overridden = applyActionInputConfigOverrides(config, {
      mode: "all-prs",
      commentThreshold: "high"
    });

    expect(overridden.mode).toBe("all-prs");
    expect(overridden.commentThreshold).toBe("high");
  });

  it("does not override config when action inputs are omitted", () => {
    const config = normalizeAgentGuardConfig({
      mode: "labeled",
      commentThreshold: "critical"
    });

    const overridden = applyActionInputConfigOverrides(config, {});

    expect(overridden.mode).toBe("labeled");
    expect(overridden.commentThreshold).toBe("critical");
  });
});
