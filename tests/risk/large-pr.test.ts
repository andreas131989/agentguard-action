import { describe, expect, it } from "vitest";
import { analyzeRisk, changedFile, hasSignal } from "./helpers.js";

describe("large PR detection", () => {
  it("does not flag exactly the default file-count threshold", () => {
    const files = Array.from({ length: 30 }, (_, index) =>
      changedFile(`src/file-${index}.ts`, {
        additions: 1,
        deletions: 0,
        changes: 1,
      }),
    );

    const result = analyzeRisk({
      changedFiles: files,
    });

    expect(hasSignal(result, "large_pr")).toBe(false);
  });

  it("flags PRs above the default file-count threshold", () => {
    const files = Array.from({ length: 31 }, (_, index) =>
      changedFile(`src/file-${index}.ts`, {
        additions: 1,
        deletions: 0,
        changes: 1,
      }),
    );

    const result = analyzeRisk({
      changedFiles: files,
    });

    expect(hasSignal(result, "large_pr")).toBe(true);
  });

  it("does not flag exactly the default changed-line threshold", () => {
    const result = analyzeRisk({
      changedFiles: [
        changedFile("src/large.ts", {
          additions: 800,
          deletions: 0,
          changes: 800,
        }),
      ],
    });

    expect(hasSignal(result, "large_pr")).toBe(false);
  });

  it("flags PRs above the default changed-line threshold", () => {
    const result = analyzeRisk({
      changedFiles: [
        changedFile("src/large.ts", {
          additions: 801,
          deletions: 0,
          changes: 801,
        }),
      ],
    });

    expect(hasSignal(result, "large_pr")).toBe(true);
  });

  it("handles very large changed file arrays deterministically", () => {
    const files = Array.from({ length: 350 }, (_, index) =>
      changedFile(`src/generated-ish/file-${index}.ts`, {
        additions: 1,
        deletions: 0,
        changes: 1,
      }),
    );

    const first = analyzeRisk({
      changedFiles: files,
    });

    const second = analyzeRisk({
      changedFiles: files,
    });

    expect(hasSignal(first, "large_pr")).toBe(true);
    expect(first).toEqual(second);
  });
});
