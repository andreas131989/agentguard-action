import { describe, expect, it } from "vitest";
import { analyzeRisk, changedFile, findSignal, hasSignal } from "./helpers.js";

describe("sensitive path detection", () => {
  it("flags root sensitive paths", () => {
    const result = analyzeRisk({
      changedFiles: [changedFile("auth/session.ts")]
    });

    expect(hasSignal(result, "sensitive_path")).toBe(true);
    expect(findSignal(result, "sensitive_path")?.severity).toBe("high");
  });

  it("flags nested sensitive paths for monorepo-style layouts", () => {
    const result = analyzeRisk({
      changedFiles: [changedFile("services/api/billing/invoices.ts")]
    });

    expect(hasSignal(result, "sensitive_path")).toBe(true);
    expect(findSignal(result, "sensitive_path")?.files).toContain(
      "services/api/billing/invoices.ts"
    );
  });

  it("flags security, permissions, payments, crypto, and infra paths", () => {
    const result = analyzeRisk({
      changedFiles: [
        changedFile("apps/web/security/policy.ts"),
        changedFile("packages/core/permissions/check.ts"),
        changedFile("services/payments/stripe.ts"),
        changedFile("lib/crypto/hash.ts"),
        changedFile("platform/infra/network.tf")
      ]
    });

    expect(hasSignal(result, "sensitive_path")).toBe(true);
  });

  it("flags identity, IAM, OAuth, and RBAC paths", () => {
    const result = analyzeRisk({
      changedFiles: [
        changedFile("services/api/identity/user.ts"),
        changedFile("platform/iam/policy.tf"),
        changedFile("apps/web/oauth/callback.ts"),
        changedFile("packages/core/rbac/check.ts")
      ]
    });

    expect(hasSignal(result, "sensitive_path")).toBe(true);
  });

  it("normalizes Windows path separators before matching", () => {
    const result = analyzeRisk({
      changedFiles: [changedFile("services\\api\\auth\\session.ts")]
    });

    expect(hasSignal(result, "sensitive_path")).toBe(true);
    expect(findSignal(result, "sensitive_path")?.files).toContain(
      "services\\api\\auth\\session.ts"
    );
  });

  it("does not flag ignored documentation paths as sensitive", () => {
    const result = analyzeRisk({
      changedFiles: [changedFile("docs/auth/readme.md")]
    });

    expect(hasSignal(result, "sensitive_path")).toBe(false);
    expect(result.riskLevel).toBe("low");
  });
});
