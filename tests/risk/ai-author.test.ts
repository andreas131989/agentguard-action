import { describe, expect, it } from "vitest";
import { analyzeRisk, changedFile, hasSignal } from "./helpers.js";

describe("AI/bot author detection", () => {
  it("detects GitHub bot authors in ai-only mode", () => {
    const result = analyzeRisk({
      authorLogin: "github-copilot[bot]",
      authorType: "bot",
      changedFiles: [changedFile("src/index.ts")],
    });

    expect(result.skipped).toBeFalsy();
    expect(hasSignal(result, "ai_author")).toBe(true);
  });

  it("detects configured agent authors case-insensitively", () => {
    const result = analyzeRisk({
      authorLogin: "Acme-Agent",
      authorType: "user",
      branchName: "feature/refactor",
      title: "Refactor service",
      body: "",
      changedFiles: [changedFile("src/service.ts")],
      config: {
        agentAuthors: ["acme-agent"],
      },
    });

    expect(result.skipped).toBeFalsy();
    expect(hasSignal(result, "ai_author")).toBe(true);
  });

  it("detects AI markers in branch names", () => {
    const result = analyzeRisk({
      authorLogin: "human-user",
      authorType: "user",
      branchName: "codex/update-auth-flow",
      title: "Update auth flow",
      body: "",
      changedFiles: [changedFile("auth/session.ts")],
    });

    expect(result.skipped).toBeFalsy();
    expect(hasSignal(result, "ai_author")).toBe(true);
  });

  it("detects AI markers in PR title or body", () => {
    const result = analyzeRisk({
      authorLogin: "human-user",
      authorType: "user",
      branchName: "feature/update",
      title: "Claude Code generated update",
      body: "Implemented by an AI coding agent.",
      changedFiles: [changedFile("src/index.ts")],
    });

    expect(result.skipped).toBeFalsy();
    expect(hasSignal(result, "ai_author")).toBe(true);
  });

  it("skips normal human PRs in ai-only mode", () => {
    const result = analyzeRisk({
      authorLogin: "human-user",
      authorType: "user",
      branchName: "feature/manual-change",
      title: "Manual change",
      body: "",
      changedFiles: [changedFile("src/index.ts")],
    });

    expect(result.skipped).toBe(true);
    expect(result.skipReason).toBeDefined();
    expect(hasSignal(result, "ai_author")).toBe(false);
  });

  it("labeled mode evaluates PRs with configured AI labels", () => {
    const result = analyzeRisk({
      authorLogin: "human-user",
      authorType: "user",
      branchName: "feature/manual-change",
      title: "Manual change",
      body: "",
      labels: ["agent-pr"],
      changedFiles: [changedFile("src/index.ts")],
      config: {
        mode: "labeled",
      },
    });

    expect(result.skipped).toBeFalsy();
    expect(hasSignal(result, "ai_author")).toBe(true);
  });

  it("labeled mode skips PRs without configured AI labels", () => {
    const result = analyzeRisk({
      authorLogin: "github-copilot[bot]",
      authorType: "bot",
      labels: ["dependencies"],
      changedFiles: [changedFile("src/index.ts")],
      config: {
        mode: "labeled",
      },
    });

    expect(result.skipped).toBe(true);
  });
});
