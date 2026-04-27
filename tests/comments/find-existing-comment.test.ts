import { describe, expect, it } from "vitest";
import { AGENTGUARD_COMMENT_MARKER } from "../../src/comments/constants.js";
import {
  findExistingAgentGuardComment,
  isAgentGuardComment,
  type IssueComment,
  type IssueCommentListClient
} from "../../src/comments/find-existing-comment.js";

function createClient(comments: IssueComment[]): IssueCommentListClient & {
  calls: Record<string, unknown>[];
} {
  const calls: Record<string, unknown>[] = [];

  return {
    calls,
    rest: {
      issues: {
        listComments: "listComments"
      }
    },
    paginate: async <T>(_method: unknown, parameters: Record<string, unknown>): Promise<T[]> => {
      calls.push(parameters);
      return comments as T[];
    }
  };
}

describe("find existing AgentGuard comment", () => {
  it("detects AgentGuard comments by hidden marker", () => {
    expect(
      isAgentGuardComment({
        id: 1,
        body: `${AGENTGUARD_COMMENT_MARKER}\n\n## AgentGuard Risk Report`
      })
    ).toBe(true);

    expect(
      isAgentGuardComment({
        id: 2,
        body: "Normal reviewer comment"
      })
    ).toBe(false);
  });

  it("returns the existing AgentGuard comment when present", async () => {
    const client = createClient([
      {
        id: 1,
        body: "Normal comment"
      },
      {
        id: 2,
        body: `${AGENTGUARD_COMMENT_MARKER}\n\n## AgentGuard Risk Report`
      }
    ]);

    await expect(
      findExistingAgentGuardComment(client, {
        owner: "agentguard",
        repo: "agentguard-action",
        issueNumber: 42
      })
    ).resolves.toEqual({
      id: 2,
      body: `${AGENTGUARD_COMMENT_MARKER}\n\n## AgentGuard Risk Report`
    });

    expect(client.calls).toEqual([
      {
        owner: "agentguard",
        repo: "agentguard-action",
        issue_number: 42,
        per_page: 100
      }
    ]);
  });

  it("returns null when no AgentGuard comment exists", async () => {
    const client = createClient([
      {
        id: 1,
        body: "Normal comment"
      }
    ]);

    await expect(
      findExistingAgentGuardComment(client, {
        owner: "agentguard",
        repo: "agentguard-action",
        issueNumber: 42
      })
    ).resolves.toBeNull();
  });
});
