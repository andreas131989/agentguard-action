import type { ChangedFile, ChangedFileStatus } from "../risk/types.js";

type PullRequestFile = {
  filename: string;
  status?: string | undefined;
  additions?: number | undefined;
  deletions?: number | undefined;
  changes?: number | undefined;
};

export type PullRequestFilesClient = {
  paginate: <T>(method: unknown, parameters: Record<string, unknown>) => Promise<T[]>;
  rest: {
    pulls: {
      listFiles: unknown;
    };
  };
};

export type FetchChangedFilesOptions = {
  owner: string;
  repo: string;
  pullNumber: number;
};

function normalizeStatus(status: string | undefined): ChangedFileStatus {
  switch (status) {
    case "added":
    case "modified":
    case "removed":
    case "renamed":
      return status;
    default:
      return "unknown";
  }
}

function normalizeCount(value: number | undefined): number {
  return Number.isFinite(value) && value !== undefined ? value : 0;
}

export function mapPullRequestFile(file: PullRequestFile): ChangedFile {
  const additions = normalizeCount(file.additions);
  const deletions = normalizeCount(file.deletions);

  return {
    filename: file.filename,
    status: normalizeStatus(file.status),
    additions,
    deletions,
    changes: normalizeCount(file.changes) || additions + deletions
  };
}

export async function fetchChangedFiles(
  client: PullRequestFilesClient,
  options: FetchChangedFilesOptions
): Promise<ChangedFile[]> {
  const files = await client.paginate<PullRequestFile>(client.rest.pulls.listFiles, {
    owner: options.owner,
    repo: options.repo,
    pull_number: options.pullNumber,
    per_page: 100
  });

  return files.map(mapPullRequestFile);
}
