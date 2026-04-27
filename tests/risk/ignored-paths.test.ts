import { describe, expect, it } from "vitest";
import { analyzeRisk, changedFile, hasSignal, signalIds } from "./helpers.js";

describe("ignored path filtering", () => {
  it("ignores docs-only AI PRs except for the PR-level AI author signal", () => {
    const result = analyzeRisk({
      changedFiles: [
        changedFile("README.md"),
        changedFile("docs/installation.md"),
        changedFile("docs/auth/overview.md")
      ]
    });

    expect(result.riskLevel).toBe("low");
    expect(signalIds(result)).toEqual(["ai_author"]);
  });

  it("ignores generated, build artifact, dependency cache, vendor, and tool cache paths", () => {
    const result = analyzeRisk({
      changedFiles: [
        changedFile("generated/client.ts"),
        changedFile("dist/index.js"),
        changedFile("build/output.js"),
        changedFile("coverage/lcov.info"),
        changedFile("node_modules/example/package.json"),
        changedFile("vendor/library/Gemfile"),
        changedFile(".next/server/app.js"),
        changedFile(".nuxt/dist/server.js"),
        changedFile("out/site/index.js"),
        changedFile("target/debug/agentguard"),
        changedFile("tmp/cache/index.js"),
        changedFile(".cache/vite/deps.js"),
        changedFile(".terraform/providers/registry/provider")
      ]
    });

    expect(hasSignal(result, "source_without_tests")).toBe(false);
    expect(hasSignal(result, "dependency_file")).toBe(false);
    expect(hasSignal(result, "large_pr")).toBe(false);
    expect(result.riskLevel).toBe("low");
  });

  it("does not ignore real dependency or CI files outside ignored paths", () => {
    const result = analyzeRisk({
      changedFiles: [
        changedFile("packages/api/package.json"),
        changedFile(".github/workflows/release.yml")
      ]
    });

    expect(hasSignal(result, "dependency_file")).toBe(true);
    expect(hasSignal(result, "ci_cd")).toBe(true);
  });

  it("does not let ignored docs/schema files create migration risk", () => {
    const result = analyzeRisk({
      changedFiles: [
        changedFile("docs/schema.sql"),
        changedFile("docs/openapi.yaml"),
        changedFile("docs/openapi.yml"),
        changedFile("docs/graphql.schema")
      ]
    });

    expect(hasSignal(result, "migration_schema")).toBe(false);
    expect(result.riskLevel).toBe("low");
  });
});
