import { describe, expect, it } from "vitest";
import { analyzeRisk, changedFile, findSignal, hasSignal } from "./helpers.js";

describe("dependency file detection", () => {
  it("flags JavaScript and TypeScript dependency manifests and lockfiles", () => {
    const result = analyzeRisk({
      changedFiles: [
        changedFile("package.json"),
        changedFile("pnpm-lock.yaml"),
        changedFile("pnpm-workspace.yaml"),
        changedFile("packages/web/yarn.lock"),
        changedFile("apps/api/package-lock.json"),
        changedFile("npm-shrinkwrap.json"),
        changedFile("tools/bun.lockb"),
        changedFile("deno.json"),
        changedFile("deno.lock")
      ]
    });

    expect(hasSignal(result, "dependency_file")).toBe(true);
    expect(findSignal(result, "dependency_file")?.files).toContain("packages/web/yarn.lock");
  });

  it("flags Python dependency files", () => {
    const result = analyzeRisk({
      changedFiles: [
        changedFile("requirements.txt"),
        changedFile("requirements-dev.txt"),
        changedFile("services/api/pyproject.toml"),
        changedFile("poetry.lock"),
        changedFile("workers/Pipfile.lock"),
        changedFile("setup.py"),
        changedFile("setup.cfg"),
        changedFile("uv.lock")
      ]
    });

    expect(hasSignal(result, "dependency_file")).toBe(true);
  });

  it("flags Go, Rust, Ruby, Java, Kotlin, PHP, and .NET dependency files", () => {
    const result = analyzeRisk({
      changedFiles: [
        changedFile("go.mod"),
        changedFile("services/api/go.sum"),
        changedFile("go.work"),
        changedFile("services/api/go.work.sum"),
        changedFile("Cargo.toml"),
        changedFile("crates/core/Cargo.lock"),
        changedFile("Gemfile"),
        changedFile("apps/rails/Gemfile.lock"),
        changedFile("gems.rb"),
        changedFile("apps/rails/gems.locked"),
        changedFile("pom.xml"),
        changedFile("build.gradle.kts"),
        changedFile("settings.gradle.kts"),
        changedFile("gradle/libs.versions.toml"),
        changedFile("composer.json"),
        changedFile("src/App/App.csproj"),
        changedFile("src/App.sln"),
        changedFile("Directory.Packages.props"),
        changedFile("NuGet.config"),
        changedFile("packages.config"),
        changedFile("packages.lock.json")
      ]
    });

    expect(hasSignal(result, "dependency_file")).toBe(true);
  });

  it("flags Terraform provider lockfiles as dependency-sensitive inputs", () => {
    const result = analyzeRisk({
      changedFiles: [changedFile(".terraform.lock.hcl")]
    });

    expect(hasSignal(result, "dependency_file")).toBe(true);
  });

  it("does not flag non-dependency documentation files", () => {
    const result = analyzeRisk({
      changedFiles: [changedFile("README.md"), changedFile("docs/package-management.md")]
    });

    expect(hasSignal(result, "dependency_file")).toBe(false);
    expect(result.riskLevel).toBe("low");
  });
});
