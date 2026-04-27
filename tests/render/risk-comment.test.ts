import { describe, expect, it } from "vitest";
import { AGENTGUARD_COMMENT_MARKER } from "../../src/comments/constants.js";
import { renderRiskComment } from "../../src/render/risk-comment.js";
import type { RiskResult } from "../../src/risk/types.js";

describe("risk comment rendering", () => {
  it("renders polished high-risk comment markdown with marker, summary, risks, recommendations, and details", () => {
    const result: RiskResult = {
      riskScore: 85,
      riskLevel: "high",
      shouldComment: true,
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
        },
        {
          id: "source_without_tests",
          label: "Source changed without tests",
          severity: "medium",
          description: "Source files changed without matching test changes.",
          files: ["auth/session.ts"]
        }
      ],
      recommendations: [
        "Request review from the relevant human owner.",
        "Add or verify regression tests for the changed source files."
      ]
    };

    const markdown = renderRiskComment(result);

    expect(markdown).toContain(AGENTGUARD_COMMENT_MARKER);
    expect(markdown).toContain("## 🛡️ AgentGuard");
    expect(markdown).toContain("**🔴 High risk**");
    expect(markdown).toContain("| Level | Score | Signals | Related files |");
    expect(markdown).toContain("| **🔴 High** | **85** | **3** | **1** |");
    expect(markdown).toContain("AgentGuard detected AI/bot-related PR metadata");
    expect(markdown).toContain("### Key review risks");
    expect(markdown).toContain("**Sensitive path changed**");
    expect(markdown).toContain("`auth/session.ts`");
    expect(markdown).toContain("### Suggested next steps");
    expect(markdown).toContain("Request review from the relevant human owner.");
    expect(markdown).toContain("<details>");
    expect(markdown).toContain("<summary><strong>Detailed breakdown</strong></summary>");
    expect(markdown).toContain("#### Risk signals");
    expect(markdown).toContain("| Signal | Severity | Details |");
    expect(markdown).toContain("#### Related files");
    expect(markdown).toContain("AgentGuard does **not** determine whether code is correct, safe, or ready to merge.");
    expect(markdown).toContain("_Updated automatically by AgentGuard._");

    expect(markdown).not.toContain("sensitive_path");
    expect(markdown).not.toContain("source_without_tests");
  });

  it("renders generic wording when the PR is not AI/bot-authored", () => {
    const result: RiskResult = {
      riskScore: 50,
      riskLevel: "high",
      shouldComment: true,
      signals: [
        {
          id: "ci_cd",
          label: "CI/CD or deployment file changed",
          severity: "high",
          description: "Changes touch CI/CD or deployment files.",
          files: [".github/workflows/release.yml"]
        }
      ],
      recommendations: ["Confirm CI/CD or deployment changes cannot alter release behavior unexpectedly."]
    };

    const markdown = renderRiskComment(result);

    expect(markdown).toContain("AgentGuard detected review-risk signals in this PR.");
    expect(markdown).not.toContain("AgentGuard detected AI/bot-related PR metadata");
  });

  it("limits long file lists in visible and detailed sections", () => {
    const result: RiskResult = {
      riskScore: 50,
      riskLevel: "high",
      shouldComment: true,
      signals: [
        {
          id: "large_pr",
          label: "Large pull request",
          severity: "high",
          description: "PR changes many files.",
          files: [
            "src/1.ts",
            "src/2.ts",
            "src/3.ts",
            "src/4.ts",
            "src/5.ts",
            "src/6.ts",
            "src/7.ts",
            "src/8.ts",
            "src/9.ts",
            "src/10.ts",
            "src/11.ts",
            "src/12.ts",
            "src/13.ts"
          ]
        }
      ],
      recommendations: []
    };

    const markdown = renderRiskComment(result);

    expect(markdown).toContain("`src/1.ts`");
    expect(markdown).toContain("_+ 10 more_");
    expect(markdown).toContain("_+ 1 more_");
    expect(markdown).not.toContain("`src/13.ts`, `src/13.ts`");
  });

  it("renders critical risk with critical wording", () => {
    const result: RiskResult = {
      riskScore: 100,
      riskLevel: "critical",
      shouldComment: true,
      signals: [
        {
          id: "secret_file",
          label: "Secret or credential-like file changed",
          severity: "critical",
          description: "Changes touch secret or credential-like files.",
          files: [".env.production"]
        }
      ],
      recommendations: ["Remove secrets from the PR and rotate exposed credentials if needed."]
    };

    const markdown = renderRiskComment(result);

    expect(markdown).toContain("**🛑 Critical risk**");
    expect(markdown).toContain("high-impact review-risk signals");
    expect(markdown).toContain("| **🛑 Critical** | **100** | **1** | **1** |");
    expect(markdown).toContain("`\\.env.production`".replace("\\", ""));
  });

  it("renders useful fallback recommendations when none are provided", () => {
    const result: RiskResult = {
      riskScore: 60,
      riskLevel: "high",
      shouldComment: true,
      signals: [
        {
          id: "dependency_file",
          label: "Dependency file changed",
          severity: "high",
          description: "Changes touch dependency manifests or lockfiles.",
          files: ["package.json"]
        }
      ],
      recommendations: []
    };

    const markdown = renderRiskComment(result);

    expect(markdown).toContain("Review the changed areas with normal human judgment.");
    expect(markdown).toContain("Confirm the PR intent matches the implementation.");
    expect(markdown).toContain("Ask for tests if the change affects behavior or risk-sensitive code.");
  });
});