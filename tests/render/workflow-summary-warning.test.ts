import { describe, expect, it } from "vitest";
import { renderWarningWorkflowSummary } from "../../src/render/workflow-summary.js";

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
