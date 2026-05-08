import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "../../src/risk/defaults.js";
import { isAiAuthored } from "../../src/risk/rules/ai-author.js";
import type { RiskInput } from "../../src/risk/types.js";

function input(overrides: Partial<RiskInput>): RiskInput {
  return {
    authorLogin: "human-user",
    authorType: "user",
    branchName: "feature/manual-change",
    title: "Manual change",
    body: "",
    labels: [],
    changedFiles: [],
    config: DEFAULT_CONFIG,
    ...overrides
  };
}

describe("AI marker detection", () => {
  it("detects standalone ai markers in branch names", () => {
    expect(isAiAuthored(input({ branchName: "feature/ai-auth-update" }))).toBe(true);
  });

  it("detects standalone agent markers in titles", () => {
    expect(isAiAuthored(input({ title: "Agent generated auth update" }))).toBe(true);
  });

  it("detects configured and marker-based labels", () => {
    expect(isAiAuthored(input({ labels: ["agent-pr"] }))).toBe(true);
    expect(isAiAuthored(input({ labels: ["ai"] }))).toBe(true);
    expect(isAiAuthored(input({ labels: ["agent"] }))).toBe(true);
  });

  it("detects AI and agent markers in author login", () => {
    expect(isAiAuthored(input({ authorLogin: "ai-agent" }))).toBe(true);
    expect(isAiAuthored(input({ authorLogin: "internal-agent" }))).toBe(true);
    expect(isAiAuthored(input({ authorLogin: "codex-runner" }))).toBe(true);
    expect(isAiAuthored(input({ authorLogin: "cursor-worker" }))).toBe(true);
    expect(isAiAuthored(input({ authorLogin: "claude-code-user" }))).toBe(true);
  });

  it("avoids simple branch/title/body substring false positives for ai and agent", () => {
    expect(
      isAiAuthored(
        input({
          branchName: "feature/maintain-main-route",
          title: "Maintain main route",
          body: "This is a manual maintenance change."
        })
      )
    ).toBe(false);
  });

  it("avoids simple author-login substring false positives", () => {
    expect(isAiAuthored(input({ authorLogin: "maintainer" }))).toBe(false);
    expect(isAiAuthored(input({ authorLogin: "main-admin" }))).toBe(false);
    expect(isAiAuthored(input({ authorLogin: "against-change" }))).toBe(false);
  });

  it("avoids bot substring false positives in author login", () => {
    expect(isAiAuthored(input({ authorLogin: "robot" }))).toBe(false);
    expect(isAiAuthored(input({ authorLogin: "jacobot" }))).toBe(false);
    expect(isAiAuthored(input({ authorLogin: "robotics-admin" }))).toBe(false);
  });

  it("still detects legitimate bot logins by token", () => {
    expect(isAiAuthored(input({ authorLogin: "deploy-bot" }))).toBe(true);
    expect(isAiAuthored(input({ authorLogin: "automation-bot" }))).toBe(true);
  });

  it("treats user-agent as an intentional standalone agent marker", () => {
    expect(
      isAiAuthored(
        input({
          branchName: "feature/user-agent-header",
          title: "Update user agent parser"
        })
      )
    ).toBe(true);
  });
});
