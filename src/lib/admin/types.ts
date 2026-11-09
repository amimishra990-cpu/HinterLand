export type SeriesPoint = { day: string; count: number };

export type AdminOverview = {
  generatedAt: string;
  totalUsers: number;
  confirmedUsers: number;
  newToday: number;
  newWeek: number;
  newMonth: number;
  activeUsers30d: number;
  loginsToday: number;
  logins7d: number;
  failedToday: number;
  failed7d: number;
  failedLastHour: number;
  openIssues: number;
  criticalOpenIssues: number;
  warningOpenIssues: number;
  resolved7d: number;
  totalIssues: number;
  signupSeries: SeriesPoint[];
  loginSeries: SeriesPoint[];
  failedSeries: SeriesPoint[];
  issueSeries: SeriesPoint[];
  database: { sizeBytes: number; connections: number };
  aiLastRun: { status: string | null; model: string | null; created_at: string } | null;
  recentUsers: Array<{
    id: string;
    email: string | null;
    fullName: string;
    createdAt: string;
    confirmed: boolean;
  }>;
  recentEvents: Array<{
    id: string;
    eventType: string;
    success: boolean;
    email: string;
    createdAt: string;
  }>;
  recentIssues: Array<{
    id: string;
    severity: string;
    category: string;
    message: string;
    status: string;
    occurrenceCount: number;
    lastSeenAt: string;
    route: string | null;
  }>;
};

export type AdminUserRow = {
  user_id: string;
  email: string | null;
  full_name: string;
  username: string | null;
  created_at: string;
  email_confirmed: boolean;
  status: string;
  last_sign_in_at: string | null;
  last_seen_at: string | null;
  login_count: number;
  project_count: number;
  document_count: number;
  meeting_count: number;
  total_count: number;
};

export type AdminUserDetail = {
  user: {
    id: string;
    email: string | null;
    fullName: string;
    username: string | null;
    role: string;
    createdAt: string;
    emailConfirmedAt: string | null;
    lastSignInAt: string | null;
    lastSeenAt: string | null;
    bannedUntil: string | null;
    providers: string[];
  };
  counts: {
    projects: number;
    documents: number;
    meetings: number;
    decisions: number;
    actionItems: number;
    knowledgeEntries: number;
    logins: number;
    failedLogins: number;
  };
  recentEvents: Array<{
    id: string;
    eventType: string;
    success: boolean;
    reason: string | null;
    correlationId: string | null;
    userAgent: string;
    createdAt: string;
  }>;
};

export type AuthEventRow = {
  id: string;
  user_id: string | null;
  email: string;
  event_type: string;
  success: boolean;
  reason: string | null;
  correlation_id: string | null;
  user_agent: string;
  created_at: string;
};

export type AuthEventListRow = AuthEventRow & { total_count: number };

export type IssueRow = {
  id: string;
  fingerprint: string;
  severity: string;
  category: string;
  message: string;
  route: string | null;
  environment: string;
  app_version: string | null;
  status: string;
  occurrence_count: number;
  first_seen_at: string;
  last_seen_at: string;
  correlation_id: string | null;
  total_count: number;
};

export type IssueDetail = Omit<IssueRow, "total_count"> & {
  metadata: Record<string, unknown>;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
  updated_at: string;
};

export type AuditRow = {
  id: string;
  actor_id: string | null;
  actor_email: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  total_count: number;
};

export type AdminSettings = {
  monitoring_retention_days?: number;
  issue_retention_days?: number;
  failed_login_alert_threshold?: number;
};

export type DatabaseOverview = {
  generatedAt: string;
  databaseName: string;
  sizeBytes: number;
  connections: number;
  maxConnections: number;
  cacheHitRatio: number | null;
  tables: Array<{ name: string; rows: number; sizeBytes: number }>;
  storage: { objects: number; bytes: number };
  documents: {
    total: number;
    processing: number;
    needsReview: number;
    failed: number;
  };
  telemetry: { authEvents: number; issues: number; auditEntries: number };
  recentDatabaseIssues: Array<{
    id: string;
    message: string;
    severity: string;
    status: string;
    lastSeenAt: string;
  }>;
};

export type DocumentPipeline = {
  total: number;
  processing: number;
  needsReview: number;
  failed: number;
  ocrDocuments: number;
  averageConfidence: number | null;
  latestProcessedAt: string | null;
};

export type HealthStatus =
  | "operational"
  | "degraded"
  | "unavailable"
  | "not_configured"
  | "unknown";

export type HealthCheck = {
  id: string;
  label: string;
  status: HealthStatus;
  detail: string;
  latencyMs: number | null;
  checkedAt: string;
};
