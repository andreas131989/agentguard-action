import { describe, expect, it } from "vitest";
import type { PullRequestRuntimeContext } from "../../src/action/context.js";
import {
  renderSkippedWorkflowSummary,
  renderWorkflowSummary
} from "../../src/render/workflow-summary.js";
import type { RiskResult } from "../../src/risk/types.js";

const pullRequest: PullRequestRuntimeContext = {
  owner: "agentguard",
  repo: "agentguard-action",
  pullNumber: 42,
  authorLogin: "github-copilot[bot]",
  authorType: "bot",
  branchName: "copilot/update-auth",
  title: "AI generated implementation update",
  body: "",
  labels: []
};

describe("workflow summary rendering", () => {
  it("renders a risk result and shows whether a PR comment is eligible", () => {
    const result: RiskResult = {
      riskScore: 85,
      riskLevel: "high",
      signals: [
        {
          id: "ai_author",
          label: "AI/bot-authored PR",
          severity: "low",
          description: "PR appears to be AI/bot-authored."
        },
        {
          id: "sensitive_path",
          label: "Sensitive path changed",
          severity: "high",
          description: "Changes touch sensitive paths.",
          files: ["auth/session.ts"]
        }
      ],
      recommendations: ["Request review from the relevant human owner."],
      shouldComment: true
    };

    expect(
      renderWorkflowSummary({
        pullRequest,
        result,
        changedFileCount: 1,
        maxChangedFilesAnalyzed: 300
      })
    ).toMatchInlineSnapshot(`
      "## AgentGuard Risk Summary

      **Risk Level:** High
      **Risk Score:** 85
      **Pull Request:** #42 AI generated implementation update
      **Author:** github-copilot[bot] (bot)
      **Changed Files Fetched:** 1
      **Max Files Analyzed By Rules:** 300
      **PR Comment Eligible:** Yes

      AgentGuard flags merge risk so humans can review the right changes. It does not determine whether code is correct.

      AgentGuard posts at most one PR comment when the result meets the configured comment threshold.

      ### Risk signals

      | Severity | Signal | Details |
      | --- | --- | --- |
      | Low | AI/bot-authored PR | PR appears to be AI/bot-authored. |
      | High | Sensitive path changed | Changes touch sensitive paths. — \`auth/session.ts\` |

      ### Recommended action

      - Request review from the relevant human owner.
      "
    `);
  });

  it("renders low and medium risk results as not PR-comment eligible by default", () => {
    const result: RiskResult = {
      riskScore: 35,
      riskLevel: "medium",
      signals: [
        {
          id: "source_without_tests",
          label: "Source changed without tests",
          severity: "medium",
          description: "Source files changed without matching test changes."
        }
      ],
      recommendations: ["Add or verify regression tests for the changed source files."],
      shouldComment: false
    };

    const markdown = renderWorkflowSummary({
      pullRequest,
      result,
      changedFileCount: 1,
      maxChangedFilesAnalyzed: 300
    });

    expect(markdown).toContain("**PR Comment Eligible:** No");
  });

  it("renders skipped summaries", () => {
    expect(renderSkippedWorkflowSummary("AgentGuard currently runs only on pull_request events."))
      .toMatchInlineSnapshot(`
        "## AgentGuard Risk Summary

        AgentGuard did not run risk analysis for this event.

        **Reason:** AgentGuard currently runs only on pull_request events.

        No PR comment was posted."
      `);
  });
});
