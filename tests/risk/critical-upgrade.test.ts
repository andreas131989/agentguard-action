import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "../../src/risk/defaults.js";
import { evaluateRisk } from "../../src/risk/engine.js";
import type { RiskInput } from "../../src/risk/types.js";
import criticalAiAuthNoTests from "../fixtures/critical-ai-auth-no-tests.json" with { type: "json" };
import criticalAiMigrationCi from "../fixtures/critical-ai-migration-ci.json" with { type: "json" };
import { analyzeRisk, changedFile, signalIds } from "./helpers.js";

describe("critical upgrade logic", () => {
  it("classifies AI auth changes without tests as critical", () => {
    const result = evaluateRisk({
      ...(criticalAiAuthNoTests as Omit<RiskInput, "config">),
      config: DEFAULT_CONFIG
    });

    expect(result.riskLevel).toBe("critical");
    expect(result.shouldComment).toBe(true);
    expect(signalIds(result)).toEqual(["ai_author", "sensitive_path", "source_without_tests"]);
  });

  it("classifies AI payment/security-sensitive path changes without tests as critical", () => {
    const result = analyzeRisk({
      changedFiles: [changedFile("payments/processor.ts")]
    });

    expect(result.riskLevel).toBe("critical");
    expect(result.shouldComment).toBe(true);
    expect(signalIds(result)).toEqual(["ai_author", "sensitive_path", "source_without_tests"]);
  });

    it("classifies AI migration/schema plus CI/CD changes as critical", () => {
      const result = evaluateRisk({
        ...(criticalAiMigrationCi as Omit<RiskInput, "config">),
        config: DEFAULT_CONFIG
      });

      expect(result.riskLevel).toBe("critical");
      expect(result.shouldComment).toBe(true);
      expect(signalIds(result)).toEqual([
        "ai_author",
        "sensitive_path",
        "migration_schema",
        "ci_cd"
      ]);
    });

  it("does not upgrade unrelated sensitive paths without tests to critical", () => {
    const result = analyzeRisk({
      changedFiles: [changedFile("infra/network.ts")]
    });

    expect(result.riskLevel).toBe("high");
    expect(result.shouldComment).toBe(true);
    expect(signalIds(result)).toEqual([
      "ai_author",
      "sensitive_path",
      "ci_cd",
      "source_without_tests"
    ]);
  });
});
