import { describe, expect, it } from "vitest";
import { analyzeRisk, changedFile, findSignal, hasSignal } from "./helpers.js";

describe("secrets and credential-like file detection", () => {
  it("flags env and credential config files as critical", () => {
    const result = analyzeRisk({
      changedFiles: [
        changedFile(".env"),
        changedFile("services/api/.env.production"),
        changedFile(".envrc"),
        changedFile(".npmrc"),
        changedFile(".pypirc"),
        changedFile(".netrc")
      ]
    });

    expect(hasSignal(result, "secret_file")).toBe(true);
    expect(findSignal(result, "secret_file")?.severity).toBe("critical");
    expect(result.riskLevel).toBe("critical");
  });

  it("flags key, certificate, keystore, state, and credential-like files", () => {
    const result = analyzeRisk({
      changedFiles: [
        changedFile("certs/prod.pem"),
        changedFile("certs/api.key"),
        changedFile("certs/public.crt"),
        changedFile("certs/prod.p12"),
        changedFile("certs/prod.pfx"),
        changedFile("certs/prod.jks"),
        changedFile("certs/prod.keystore"),
        changedFile("terraform/prod.tfstate"),
        changedFile("kubeconfig"),
        changedFile("prod-kubeconfig"),
        changedFile("service-account-prod.json")
      ]
    });

    expect(hasSignal(result, "secret_file")).toBe(true);
    expect(result.riskLevel).toBe("critical");
  });

  it("flags secrets, credentials, SSH, and AWS credential paths", () => {
    const result = analyzeRisk({
      changedFiles: [
        changedFile("secrets/prod.yml"),
        changedFile("config/secrets/database.yml"),
        changedFile("credentials/service-account.json"),
        changedFile(".ssh/id_ed25519"),
        changedFile(".aws/credentials")
      ]
    });

    expect(hasSignal(result, "secret_file")).toBe(true);
  });

  it("does not flag normal JSON config files as secrets", () => {
    const result = analyzeRisk({
      changedFiles: [changedFile("config/app.json")]
    });

    expect(hasSignal(result, "secret_file")).toBe(false);
  });
});
