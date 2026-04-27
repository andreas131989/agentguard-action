import { describe, expect, it } from "vitest";
import { analyzeRisk, changedFile, findSignal, hasSignal } from "./helpers.js";

describe("migration and schema detection", () => {
  it("flags migration directories across common repo layouts", () => {
    const result = analyzeRisk({
      changedFiles: [
        changedFile("services/api/migrations/202604260001_add_users.sql"),
        changedFile("database/migrations/001_create_users.sql"),
        changedFile("db/migrate/202604270001_create_users.rb"),
        changedFile("supabase/migrations/202604270001_policy.sql"),
        changedFile("src/main/resources/db/migration/V1__init.sql"),
        changedFile("liquibase/changelog.xml")
      ]
    });

    expect(hasSignal(result, "migration_schema")).toBe(true);
    expect(findSignal(result, "migration_schema")?.files).toContain(
      "services/api/migrations/202604260001_add_users.sql"
    );
  });

  it("flags SQL, Prisma, and Rails schema files", () => {
    const result = analyzeRisk({
      changedFiles: [
        changedFile("schema.prisma"),
        changedFile("packages/db/schema.prisma"),
        changedFile("db/schema.sql"),
        changedFile("db/schema.rb")
      ]
    });

    expect(hasSignal(result, "migration_schema")).toBe(true);
  });

  it("flags GraphQL, OpenAPI, Swagger, and protobuf schema files", () => {
    const result = analyzeRisk({
      changedFiles: [
        changedFile("graphql.schema"),
        changedFile("api/schema.graphql"),
        changedFile("api/openapi.yaml"),
        changedFile("api/openapi.yml"),
        changedFile("api/openapi.json"),
        changedFile("api/swagger.yaml"),
        changedFile("api/swagger.json"),
        changedFile("proto/payments.proto")
      ]
    });

    expect(hasSignal(result, "migration_schema")).toBe(true);
  });

  it("does not flag ignored schema-like documentation", () => {
    const result = analyzeRisk({
      changedFiles: [
        changedFile("docs/schema.sql"),
        changedFile("docs/openapi.yaml"),
        changedFile("docs/openapi.yml"),
        changedFile("docs/schema.graphql")
      ]
    });

    expect(hasSignal(result, "migration_schema")).toBe(false);
  });
});
