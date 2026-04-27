import { describe, expect, it } from "vitest";
import { analyzeRisk, changedFile, findSignal, hasSignal } from "./helpers.js";

describe("large PR unrelated top-level directory detection", () => {
  it("flags PRs touching many unrelated top-level directories", () => {
    const result = analyzeRisk({
      changedFiles: [
        changedFile("api/config.yml"),
        changedFile("web/config.yml"),
        changedFile("mobile/config.yml"),
        changedFile("infra/config.yml"),
        changedFile("docs-site/config.yml"),
        changedFile("packages/config.yml"),
        changedFile("tools/config.yml"),
        changedFile("scripts/config.yml")
      ]
    });

    expect(hasSignal(result, "large_pr")).toBe(true);
    expect(findSignal(result, "large_pr")?.description).toContain(
      "8 top-level directories touched"
    );
    expect(result.riskLevel).toBe("high");
  });

  it("does not flag ordinary small PRs as broad PRs", () => {
    const result = analyzeRisk({
      changedFiles: [
        changedFile("api/config.yml"),
        changedFile("api/routes.yml"),
        changedFile("web/config.yml")
      ]
    });

    expect(hasSignal(result, "large_pr")).toBe(false);
  });
});
