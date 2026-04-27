import { describe, expect, it } from "vitest";
import {
  fetchChangedFiles,
  mapPullRequestFile,
  type PullRequestFilesClient
} from "../../src/files/changed-files.js";

describe("changed file fetching", () => {
  it("maps GitHub pull request files into AgentGuard changed files", () => {
    expect(
      mapPullRequestFile({
        filename: "src/index.ts",
        status: "modified",
        additions: 10,
        deletions: 3,
        changes: 13
      })
    ).toEqual({
      filename: "src/index.ts",
      status: "modified",
      additions: 10,
      deletions: 3,
      changes: 13
    });
  });

  it("uses unknown status and addition/deletion fallback for unexpected GitHub data", () => {
    expect(
      mapPullRequestFile({
        filename: "src/index.ts",
        status: "changed",
        additions: undefined,
        deletions: undefined,
        changes: undefined
      })
    ).toEqual({
      filename: "src/index.ts",
      status: "unknown",
      additions: 0,
      deletions: 0,
      changes: 0
    });
  });

  it("fetches all paginated PR files from GitHub", async () => {
    const calls: Record<string, unknown>[] = [];

    const client: PullRequestFilesClient = {
      rest: {
        pulls: {
          listFiles: "listFiles"
        }
      },
      paginate: async <T>(_method: unknown, parameters: Record<string, unknown>): Promise<T[]> => {
        calls.push(parameters);

        return [
          {
            filename: "auth/session.ts",
            status: "modified",
            additions: 20,
            deletions: 2,
            changes: 22
          }
        ] as T[];
      }
    };

    await expect(
      fetchChangedFiles(client, {
        owner: "agentguard",
        repo: "agentguard-action",
        pullNumber: 123
      })
    ).resolves.toEqual([
      {
        filename: "auth/session.ts",
        status: "modified",
        additions: 20,
        deletions: 2,
        changes: 22
      }
    ]);

    expect(calls).toEqual([
      {
        owner: "agentguard",
        repo: "agentguard-action",
        pull_number: 123,
        per_page: 100
      }
    ]);
  });
});
