import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "../../src/risk/defaults.js";
import { analyzeRisk, changedFile, findSignal, hasSignal } from "./helpers.js";

describe("maxChangedFilesAnalyzed enforcement", () => {
  it("caps file-based rule evaluation while keeping large PR detection based on total analyzable files", () => {
    const result = analyzeRisk({
      changedFiles: [
        changedFile("src/first.ts"),
        changedFile("auth/session.ts"),
        changedFile("package.json")
      ],
      config: {
        largePr: {
          ...DEFAULT_CONFIG.largePr,
          largeFileCount: 2,
          maxChangedFilesAnalyzed: 1
        }
      }
    });

    expect(hasSignal(result, "source_without_tests")).toBe(true);
    expect(findSignal(result, "source_without_tests")?.files).toEqual(["src/first.ts"]);

    expect(hasSignal(result, "sensitive_path")).toBe(false);
    expect(hasSignal(result, "dependency_file")).toBe(false);

    expect(hasSignal(result, "large_pr")).toBe(true);
    expect(findSignal(result, "large_pr")?.description).toContain("3 files changed");

    expect(hasSignal(result, "file_cap_truncated")).toBe(true);
    expect(findSignal(result, "file_cap_truncated")?.description).toContain("2 file(s) were not checked");
  });

  it("does not allow files after the analysis cap to create critical secret signals", () => {
    const result = analyzeRisk({
      changedFiles: [changedFile("src/first.ts"), changedFile(".env.production")],
      config: {
        largePr: {
          ...DEFAULT_CONFIG.largePr,
          maxChangedFilesAnalyzed: 1
        }
      }
    });

    expect(hasSignal(result, "secret_file")).toBe(false);
    expect(hasSignal(result, "large_pr")).toBe(true);
    expect(hasSignal(result, "file_cap_truncated")).toBe(true);
    expect(result.riskLevel).toBe("high");
  });
});
