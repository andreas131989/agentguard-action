import { describe, expect, it } from "vitest";
import { analyzeRisk, changedFile, findSignal, hasSignal } from "./helpers.js";

describe("CI/CD and deployment file detection", () => {
  it("flags GitHub Actions workflow changes", () => {
    const result = analyzeRisk({
      changedFiles: [changedFile(".github/workflows/test.yml")],
    });

    expect(hasSignal(result, "ci_cd")).toBe(true);
    expect(findSignal(result, "ci_cd")?.files).toContain(".github/workflows/test.yml");
  });

  it("flags Docker and Docker Compose files", () => {
    const result = analyzeRisk({
      changedFiles: [
        changedFile("Dockerfile"),
        changedFile("services/api/Dockerfile"),
        changedFile("docker-compose.yml"),
        changedFile("deploy/docker-compose.yaml"),
      ],
    });

    expect(hasSignal(result, "ci_cd")).toBe(true);
  });

  it("flags deployment, infra, Terraform, Kubernetes, and Helm files", () => {
    const result = analyzeRisk({
      changedFiles: [
        changedFile("deploy/prod.yml"),
        changedFile("infra/network.yml"),
        changedFile("terraform/main.tf"),
        changedFile("k8s/deployment.yaml"),
        changedFile("helm/values.yaml"),
      ],
    });

    expect(hasSignal(result, "ci_cd")).toBe(true);
  });

  it("does not flag normal source files as CI/CD changes", () => {
    const result = analyzeRisk({
      changedFiles: [changedFile("src/index.ts")],
    });

    expect(hasSignal(result, "ci_cd")).toBe(false);
  });
});
