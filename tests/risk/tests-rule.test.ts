import { describe, expect, it } from "vitest";
import { analyzeRisk, changedFile, hasSignal } from "./helpers.js";

describe("source changed without tests detection", () => {
  it("flags source changes without test changes", () => {
    const result = analyzeRisk({
      changedFiles: [changedFile("src/auth/session.ts")]
    });

    expect(hasSignal(result, "source_without_tests")).toBe(true);
    expect(result.riskLevel).toBe("critical");
  });

  it("does not flag source changes when JavaScript or TypeScript tests changed", () => {
    const result = analyzeRisk({
      changedFiles: [
        changedFile("src/auth/session.ts"),
        changedFile("src/auth/session.test.ts"),
        changedFile("__tests__/session.spec.ts"),
        changedFile("e2e/login.spec.ts"),
        changedFile("cypress/e2e/login.test.js")
      ]
    });

    expect(hasSignal(result, "source_without_tests")).toBe(false);
  });

  it("does not flag source changes when ecosystem-specific tests changed", () => {
    const result = analyzeRisk({
      changedFiles: [
        changedFile("services/api/main.go"),
        changedFile("services/api/main_test.go"),
        changedFile("app/models/user.rb"),
        changedFile("spec/models/user_spec.rb"),
        changedFile("src/main/kotlin/AuthService.kt"),
        changedFile("src/test/kotlin/AuthServiceIT.kt"),
        changedFile("src/App/Program.cs"),
        changedFile("src/App.Tests/ProgramTest.cs"),
        changedFile("services/api/app/main.py"),
        changedFile("conftest.py")
      ]
    });

    expect(hasSignal(result, "source_without_tests")).toBe(false);
  });

  it("does not flag test-only changes", () => {
    const result = analyzeRisk({
      changedFiles: [
        changedFile("src/parser.test.ts"),
        changedFile("tests/test_parser.py"),
        changedFile("src/test/java/AuthServiceTest.java"),
        changedFile("src/test/java/AuthServiceIT.java")
      ]
    });

    expect(hasSignal(result, "source_without_tests")).toBe(false);
  });

  it("does not flag ignored generated source-looking files", () => {
    const result = analyzeRisk({
      changedFiles: [changedFile("generated/client.ts"), changedFile("dist/index.js")]
    });

    expect(hasSignal(result, "source_without_tests")).toBe(false);
    expect(result.riskLevel).toBe("low");
  });
});
