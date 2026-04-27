import { describe, expect, it } from "vitest";
import { validateAgentGuardConfig } from "../../src/config/schema.js";

describe("AgentGuard config schema validation", () => {
  it("validates supported MVP config fields", () => {
    expect(
      validateAgentGuardConfig({
        enabled: true,
        mode: "all-prs",
        comment_threshold: "critical",
        agent_authors: ["custom-agent"],
        critical_paths: ["fraud/**"],
        ignore_paths: ["snapshots/**"]
      })
    ).toEqual({
      enabled: true,
      mode: "all-prs",
      commentThreshold: "critical",
      agentAuthors: ["custom-agent"],
      criticalPaths: ["fraud/**"],
      ignorePaths: ["snapshots/**"]
    });
  });

  it("rejects unsupported keys", () => {
    expect(() =>
      validateAgentGuardConfig({
        blocking: true
      })
    ).toThrow('Unsupported AgentGuard config key "blocking".');
  });

  it("rejects invalid mode values", () => {
    expect(() =>
      validateAgentGuardConfig({
        mode: "blocking"
      })
    ).toThrow('"mode" must be one of: ai-only, labeled, all-prs.');
  });

  it("rejects invalid comment thresholds", () => {
    expect(() =>
      validateAgentGuardConfig({
        comment_threshold: "severe"
      })
    ).toThrow('"comment_threshold" must be one of: low, medium, high, critical.');
  });

  it("rejects invalid array fields", () => {
    expect(() =>
      validateAgentGuardConfig({
        agent_authors: ["cursor-agent", ""]
      })
    ).toThrow('"agent_authors" item 2 must be a non-empty string.');
  });

  it("rejects non-object config values", () => {
    expect(() => validateAgentGuardConfig(["enabled", true])).toThrow(
      "Config must be a YAML object."
    );
  });
});
