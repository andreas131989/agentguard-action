import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "../../src/risk/defaults.js";
import { evaluateRisk } from "../../src/risk/engine.js";
import type { RiskInput } from "../../src/risk/types.js";
import ciChange from "../fixtures/ci-change.json" with { type: "json" };
import criticalAuthDependencyMigration from "../fixtures/critical-auth-dependency-migration.json" with { type: "json" };
import dependencyChange from "../fixtures/dependency-change.json" with { type: "json" };
import highRiskAuthNoTests from "../fixtures/high-risk-auth-no-tests.json" with { type: "json" };
import humanPr from "../fixtures/human-pr.json" with { type: "json" };
import largeAiPr from "../fixtures/large-ai-pr.json" with { type: "json" };
import lowRiskDocs from "../fixtures/low-risk-docs.json" with { type: "json" };
import mediumSourceNoTests from "../fixtures/medium-source-no-tests.json" with { type: "json" };

function fixtureInput(
  fixture: Omit<RiskInput, "config">,
  overrides: Partial<RiskInput> = {}
): RiskInput {
  return {
    ...fixture,
    ...overrides,
    config: {
      ...DEFAULT_CONFIG,
      ...(overrides.config ?? {})
    }
  };
}

function signalIds(result: ReturnType<typeof evaluateRisk>): string[] {
  return result.signals.map((signal) => signal.id);
}

describe("evaluateRisk", () => {
  it("skips human PRs in ai-only mode", () => {
    const result = evaluateRisk(fixtureInput(humanPr as Omit<RiskInput, "config">));

    expect(result.skipped).toBe(true);
    expect(result.skipReason).toBe("PR does not appear to be AI/bot-authored.");
    expect(result.riskScore).toBe(0);
    expect(result.riskLevel).toBe("low");
    expect(result.shouldComment).toBe(false);
    expect(result.signals).toEqual([]);
  });

  it("keeps low-risk docs-only AI PRs low risk", () => {
    const result = evaluateRisk(fixtureInput(lowRiskDocs as Omit<RiskInput, "config">));

    expect(result.skipped).toBeUndefined();
    expect(result.riskScore).toBe(10);
    expect(result.riskLevel).toBe("low");
    expect(result.shouldComment).toBe(false);
    expect(signalIds(result)).toEqual(["ai_author"]);
  });

  it("flags AI source changes without tests as medium risk", () => {
    const result = evaluateRisk(fixtureInput(mediumSourceNoTests as Omit<RiskInput, "config">));

    expect(result.riskScore).toBe(35);
    expect(result.riskLevel).toBe("medium");
    expect(result.shouldComment).toBe(false);
    expect(signalIds(result)).toEqual(["ai_author", "source_without_tests"]);
  });

  it("flags AI auth source changes without tests as critical risk", () => {
    const result = evaluateRisk(fixtureInput(highRiskAuthNoTests as Omit<RiskInput, "config">));

    expect(result.riskScore).toBe(85);
    expect(result.riskLevel).toBe("critical");
    expect(result.shouldComment).toBe(true);
    expect(signalIds(result)).toEqual(["ai_author", "sensitive_path", "source_without_tests"]);
  });

  it("flags AI dependency changes as high risk", () => {
    const result = evaluateRisk(fixtureInput(dependencyChange as Omit<RiskInput, "config">));

    expect(result.riskScore).toBe(60);
    expect(result.riskLevel).toBe("high");
    expect(result.shouldComment).toBe(true);
    expect(signalIds(result)).toEqual(["ai_author", "dependency_file"]);
  });

  it("flags combined auth, dependency, and migration changes as critical risk", () => {
    const result = evaluateRisk(
      fixtureInput(criticalAuthDependencyMigration as Omit<RiskInput, "config">)
    );

    expect(result.riskScore).toBe(185);
    expect(result.riskLevel).toBe("critical");
    expect(result.shouldComment).toBe(true);
    expect(signalIds(result)).toEqual([
      "ai_author",
      "sensitive_path",
      "dependency_file",
      "migration_schema",
      "source_without_tests"
    ]);
  });

  it("flags AI CI/CD changes as high risk", () => {
    const result = evaluateRisk(fixtureInput(ciChange as Omit<RiskInput, "config">));

    expect(result.riskScore).toBe(60);
    expect(result.riskLevel).toBe("high");
    expect(result.shouldComment).toBe(true);
    expect(signalIds(result)).toEqual(["ai_author", "ci_cd"]);
  });

  it("flags large AI PRs as high risk", () => {
    const result = evaluateRisk(fixtureInput(largeAiPr as Omit<RiskInput, "config">));

    expect(result.riskScore).toBe(85);
    expect(result.riskLevel).toBe("high");
    expect(result.shouldComment).toBe(true);
    expect(signalIds(result)).toEqual(["ai_author", "source_without_tests", "large_pr"]);
  });

  it("runs on human PRs in all-prs mode and evaluates them without AI authorship signal", () => {
    const result = evaluateRisk(
      fixtureInput(humanPr as Omit<RiskInput, "config">, {
        config: {
          ...DEFAULT_CONFIG,
          mode: "all-prs"
        }
      })
    );

    expect(result.skipped).toBeUndefined();
    expect(result.riskScore).toBe(25);
    expect(result.riskLevel).toBe("medium");
    expect(result.shouldComment).toBe(false);
    expect(signalIds(result)).toEqual(["source_without_tests"]);
  });

  it("runs only labeled PRs in labeled mode", () => {
    const unlabeled = evaluateRisk(
      fixtureInput(humanPr as Omit<RiskInput, "config">, {
        config: {
          ...DEFAULT_CONFIG,
          mode: "labeled"
        }
      })
    );

    const labeled = evaluateRisk(
      fixtureInput(humanPr as Omit<RiskInput, "config">, {
        labels: ["agent-pr"],
        config: {
          ...DEFAULT_CONFIG,
          mode: "labeled"
        }
      })
    );

    expect(unlabeled.skipped).toBe(true);
    expect(labeled.skipped).toBeUndefined();
    expect(signalIds(labeled)).toContain("ai_author");
  });

  it("respects a critical-only comment threshold", () => {
    const result = evaluateRisk(
      fixtureInput(highRiskAuthNoTests as Omit<RiskInput, "config">, {
        config: {
          ...DEFAULT_CONFIG,
          commentThreshold: "critical"
        }
      })
    );

      expect(result.riskLevel).toBe("critical");
      expect(result.shouldComment).toBe(true);
  });

  it("flags obvious secret or credential-like file changes as critical", () => {
    const result = evaluateRisk(
      fixtureInput(mediumSourceNoTests as Omit<RiskInput, "config">, {
        changedFiles: [
          {
            filename: ".env.production",
            status: "added",
            additions: 1,
            deletions: 0,
            changes: 1
          }
        ]
      })
    );

    expect(result.riskScore).toBe(110);
    expect(result.riskLevel).toBe("critical");
    expect(result.shouldComment).toBe(true);
    expect(signalIds(result)).toEqual(["ai_author", "secret_file"]);
  });
});
