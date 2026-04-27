import { describe, expect, it } from "vitest";
import {
  normalizeActionInputs,
  parseActionMode,
  parseOptionalActionMode,
  parseOptionalRiskLevel,
  parseRiskLevel
} from "../../src/action/inputs.js";

describe("action input parsing", () => {
  it("keeps mode and comment threshold unset when workflow inputs are omitted", () => {
    const inputs = normalizeActionInputs({
      githubToken: "token"
    });

    expect(inputs).toEqual({
      githubToken: "token",
      configPath: ".agentguard.yml",
      licenseKey: ""
    });
    expect("mode" in inputs).toBe(false);
    expect("commentThreshold" in inputs).toBe(false);
  });

  it("treats explicit default-looking workflow inputs as real overrides", () => {
    expect(
      normalizeActionInputs({
        githubToken: "token",
        mode: "ai-only",
        commentThreshold: "high"
      })
    ).toEqual({
      githubToken: "token",
      mode: "ai-only",
      commentThreshold: "high",
      configPath: ".agentguard.yml",
      licenseKey: ""
    });
  });

  it("uses action inputs as explicit overrides when provided", () => {
    expect(
      normalizeActionInputs({
        githubToken: "token",
        mode: "all-prs",
        commentThreshold: "critical",
        configPath: "config/agentguard.yml",
        licenseKey: "future-key"
      })
    ).toEqual({
      githubToken: "token",
      mode: "all-prs",
      commentThreshold: "critical",
      configPath: "config/agentguard.yml",
      licenseKey: "future-key"
    });
  });

  it("normalizes supported modes and risk levels", () => {
    expect(parseActionMode("ALL-PRS")).toBe("all-prs");
    expect(parseActionMode(" labeled ")).toBe("labeled");
    expect(parseRiskLevel("CRITICAL")).toBe("critical");
    expect(parseRiskLevel(" medium ")).toBe("medium");
  });

  it("returns undefined for omitted optional override inputs", () => {
    expect(parseOptionalActionMode("")).toBeUndefined();
    expect(parseOptionalActionMode(undefined)).toBeUndefined();
    expect(parseOptionalRiskLevel("")).toBeUndefined();
    expect(parseOptionalRiskLevel(undefined)).toBeUndefined();
  });

  it("rejects unsupported modes", () => {
    expect(() => parseActionMode("blocking")).toThrow(
      'Invalid AgentGuard mode "blocking". Expected one of: ai-only, labeled, all-prs.'
    );
  });

  it("rejects unsupported risk levels", () => {
    expect(() => parseRiskLevel("severe")).toThrow(
      'Invalid AgentGuard comment threshold "severe". Expected one of: low, medium, high, critical.'
    );
  });

  it("requires a GitHub token", () => {
    expect(() => normalizeActionInputs({ githubToken: " " })).toThrow(
      "Missing required GitHub token input."
    );
  });
});
