import { describe, expect, it } from "vitest";
import {
  renderLicenseRequiredSummary,
  renderWarningWorkflowSummary
} from "../../src/render/workflow-summary.js";

describe("license-required workflow summary rendering", () => {
  it("includes the reason and purchase URL", () => {
    const output = renderLicenseRequiredSummary(
      "No license key provided.",
      "https://agentguard.dev/pricing"
    );
    expect(output).toContain("No license key provided.");
    expect(output).toContain("https://agentguard.dev/pricing");
    expect(output).toContain("AgentGuard did not run");
    expect(output).toContain("No PR comment was posted.");
  });
});

describe("warning workflow summary rendering", () => {
  it("renders graceful failure summaries", () => {
    expect(renderWarningWorkflowSummary("Unable to fetch pull request changed files from GitHub."))
      .toMatchInlineSnapshot(`
        "## AgentGuard Risk Summary

        AgentGuard did not complete risk analysis.

        **Warning:** Unable to fetch pull request changed files from GitHub.

        AgentGuard failed gracefully and did not block this workflow by default.

        No PR comment was posted."
      `);
  });
});
