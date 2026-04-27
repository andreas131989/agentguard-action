import { describe, expect, it } from "vitest";
import { AGENTGUARD_COMMENT_MARKER } from "../../src/comments/constants.js";
import type { IssueComment } from "../../src/comments/find-existing-comment.js";
import {
  upsertRiskComment,
  type CreateIssueCommentParams,
  type IssueCommentClient,
  type UpdateIssueCommentParams
} from "../../src/comments/upsert-comment.js";

type FakeIssueCommentClient = IssueCommentClient & {
  paginateCalls: Record<string, unknown>[];
  created: CreateIssueCommentParams[];
  updated: UpdateIssueCommentParams[];
};

function createClient(comments: IssueComment[]): FakeIssueCommentClient {
  const paginateCalls: Record<string, unknown>[] = [];
  const created: CreateIssueCommentParams[] = [];
  const updated: UpdateIssueCommentParams[] = [];

  return {
    paginateCalls,
    created,
    updated,
    rest: {
      issues: {
        listComments: "listComments",
        createComment: async (parameters: CreateIssueCommentParams) => {
          created.push(parameters);
          return {
            data: {
              id: 99
            }
          };
        },
        updateComment: async (parameters: UpdateIssueCommentParams) => {
          updated.push(parameters);
          return {
            data: {
              id: parameters.comment_id
            }
          };
        }
      }
    },
    paginate: async <T>(_method: unknown, parameters: Record<string, unknown>): Promise<T[]> => {
      paginateCalls.push(parameters);
      return comments as T[];
    }
  };
}

describe("upsert risk comment", () => {
  it("skips without listing comments when the risk is below the comment threshold", async () => {
    const client = createClient([]);

    await expect(
      upsertRiskComment(client, {
        owner: "agentguard",
        repo: "agentguard-action",
        issueNumber: 42,
        body: "body",
        shouldComment: false
      })
    ).resolves.toEqual({
      action: "skipped",
      reason: "Risk level is below the configured comment threshold."
    });

    expect(client.paginateCalls).toEqual([]);
    expect(client.created).toEqual([]);
    expect(client.updated).toEqual([]);
  });

  it("creates a new comment when no existing AgentGuard comment exists", async () => {
    const client = createClient([
      {
        id: 1,
        body: "Normal reviewer comment"
      }
    ]);

    await expect(
      upsertRiskComment(client, {
        owner: "agentguard",
        repo: "agentguard-action",
        issueNumber: 42,
        body: `${AGENTGUARD_COMMENT_MARKER}\n\n## AgentGuard Risk Report`,
        shouldComment: true
      })
    ).resolves.toEqual({
      action: "created",
      commentId: 99
    });

    expect(client.created).toEqual([
      {
        owner: "agentguard",
        repo: "agentguard-action",
        issue_number: 42,
        body: `${AGENTGUARD_COMMENT_MARKER}\n\n## AgentGuard Risk Report`
      }
    ]);
    expect(client.updated).toEqual([]);
  });

  it("updates the existing AgentGuard comment instead of creating a duplicate", async () => {
    const client = createClient([
      {
        id: 123,
        body: `${AGENTGUARD_COMMENT_MARKER}\n\nOld report`
      }
    ]);

    await expect(
      upsertRiskComment(client, {
        owner: "agentguard",
        repo: "agentguard-action",
        issueNumber: 42,
        body: `${AGENTGUARD_COMMENT_MARKER}\n\nUpdated report`,
        shouldComment: true
      })
    ).resolves.toEqual({
      action: "updated",
      commentId: 123
    });

    expect(client.created).toEqual([]);
    expect(client.updated).toEqual([
      {
        owner: "agentguard",
        repo: "agentguard-action",
        comment_id: 123,
        body: `${AGENTGUARD_COMMENT_MARKER}\n\nUpdated report`
      }
    ]);
  });
});
