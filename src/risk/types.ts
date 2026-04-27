export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type SignalSeverity = 'low' | 'medium' | 'high' | 'critical';

export type AgentGuardMode = 'ai-only' | 'labeled' | 'all-prs';

export type ChangedFileStatus = 'added' | 'modified' | 'removed' | 'renamed' | 'unknown';

export type ChangedFile = {
  filename: string;
  status: ChangedFileStatus;
  additions: number;
  deletions: number;
  changes: number;
};

export type LargePrConfig = {
  largeFileCount: number;
  largeLineCount: number;
  maxChangedFilesAnalyzed: number;
};

export type AgentGuardConfig = {
  enabled: boolean;
  mode: AgentGuardMode;
  commentThreshold: RiskLevel;
  agentAuthors: string[];
  aiLabels: string[];
  criticalPaths: string[];
  ignorePaths: string[];
  dependencyFiles: string[];
  migrationFiles: string[];
  ciCdFiles: string[];
  secretsFiles: string[];
  sourceFilePatterns: string[];
  testFilePatterns: string[];
  largePr: LargePrConfig;
};

export type RiskInput = {
  authorLogin: string;
  authorType: 'user' | 'bot' | 'unknown';
  branchName: string;
  title: string;
  body: string;
  labels: string[];
  changedFiles: ChangedFile[];
  config: AgentGuardConfig;
};

export type RiskSignal = {
  id: string;
  label: string;
  severity: SignalSeverity;
  description: string;
  files?: string[];
};

export type RiskResult = {
  riskScore: number;
  riskLevel: RiskLevel;
  signals: RiskSignal[];
  recommendations: string[];
  shouldComment: boolean;
  skipped?: boolean;
  skipReason?: string;
};

export type FileClassification = {
  filename: string;
  ignored: boolean;
  source: boolean;
  test: boolean;
  dependency: boolean;
  migration: boolean;
  ciCd: boolean;
  sensitive: boolean;
  secret: boolean;
};
