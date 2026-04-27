import { describe, expect, it } from "vitest";
import { riskLevelFromScore, scoreSignals } from "../../src/risk/scoring.js";
import type { RiskSignal, SignalSeverity } from "../../src/risk/types.js";

function signal(id: string, severity: SignalSeverity): RiskSignal {
  return {
    id,
    label: id,
    severity,
    description: id
  };
}

describe("risk scoring calibration", () => {
  it("keeps an AI-only signal low risk", () => {
    const signals = [signal("ai_author", "low")];
    const score = scoreSignals(signals);

    expect(score).toBe(10);
    expect(riskLevelFromScore(score, signals)).toBe("low");
  });

  it("keeps AI source changes without tests at medium risk", () => {
    const signals = [signal("ai_author", "low"), signal("source_without_tests", "medium")];
    const score = scoreSignals(signals);

    expect(score).toBe(35);
    expect(riskLevelFromScore(score, signals)).toBe("medium");
  });

  it("raises AI dependency changes to high risk", () => {
    const signals = [signal("ai_author", "low"), signal("dependency_file", "medium")];
    const score = scoreSignals(signals);

    expect(score).toBe(60);
    expect(riskLevelFromScore(score, signals)).toBe("high");
  });

  it("maps any high-severity signal to at least high risk", () => {
    const signals = [signal("ci_cd", "high")];
    const score = scoreSignals(signals);

    expect(score).toBe(50);
    expect(riskLevelFromScore(score, signals)).toBe("high");
  });

  it("raises sensitive path plus dependency plus migration/schema to critical risk", () => {
    const signals = [
      signal("sensitive_path", "high"),
      signal("dependency_file", "medium"),
      signal("migration_schema", "high")
    ];
    const score = scoreSignals(signals);

    expect(score).toBe(150);
    expect(riskLevelFromScore(score, signals)).toBe("critical");
  });

  it("maps critical-severity signals to critical risk", () => {
    const signals = [signal("secret_file", "critical")];
    const score = scoreSignals(signals);

    expect(score).toBe(100);
    expect(riskLevelFromScore(score, signals)).toBe("critical");
  });
});
