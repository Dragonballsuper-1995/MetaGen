// ---------------------------------------------------------------------------
// API schemas (mirrors FastAPI Pydantic models in main.py)
// ---------------------------------------------------------------------------

export type ModelChoice = "auto" | "groq" | "groq-20b" | "mistral";

export interface VideoRequest {
  text: string;
  model?: ModelChoice;
}

export interface TaskResponse {
  task_id: string;
  status: string;
}

export interface SeoBreakdown {
  title: number;
  description: number;
  tags: number;
  keyword_relevance: number;
  readability: number;
}

export interface MetadataResult {
  title: string;
  description: string;
  tags: string[];
  seo_score?: number;
  seo_breakdown?: SeoBreakdown;
  model?: string;
}

export interface HistoryItem {
  id: string;
  title: string;
  description: string;
  tags: string[];
  script?: string;
  time?: string;
  latency?: number;
  seo_score?: number;
  seo_breakdown?: SeoBreakdown;
  model?: string;
}

export interface TitleVariantsResponse {
  titles: string[];
}

export interface StatusResponse {
  status: string;
  result: MetadataResult | null;
  error: string | null;
}

export interface DependencyStatus {
  ok: boolean;
  error: string | null;
}

export interface WorkerStatus extends DependencyStatus {
  online: number;
}

export interface DepsHealthResponse {
  status: string;
  poll_ready: boolean;
  redis: DependencyStatus;
  worker: WorkerStatus;
}

export interface WarmupHealthResponse {
  status: string;
  ready: boolean;
  last_attempt_utc: string | null;
  completed_at_utc: string | null;
  warmup_duration_s: number | null;
  error: string | null;
}

// ---------------------------------------------------------------------------
// SSE stream events (from ai_engine.py → main.py /api/generate/stream)
// ---------------------------------------------------------------------------

export type StreamEvent =
  | { type: "tags"; data: string[] }
  | { type: "token"; data: string }
  | { type: "done"; data: MetadataResult }
  | { type: "error"; message: string };

// ---------------------------------------------------------------------------
// Client-side state
// ---------------------------------------------------------------------------

export type GenerationStatus =
  | "idle"
  | "loading"
  | "streaming"
  | "completed"
  | "error";

export type GenerationMode = "poll" | "stream";

export type LayoutMode = "teenage";

export type ThemeMode = "dark" | "light";

/** Props shared by both layout components */
export interface LayoutProps {
  script: string;
  onScriptChange: (text: string) => void;
  onGenerate: () => void;
  onReset: () => void;
  onDismissNotice: () => void;
  status: GenerationStatus;
  result: MetadataResult | null;
  error: string | null;
  notice: string | null;
  generationTime: number | null;
  streamTokens: string;
  streamTags: string[] | null;
  titleVariants: string[];
  mode: GenerationMode;
  onModeChange: (mode: GenerationMode) => void;
  pollReady: boolean | null;
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  selectedModel: ModelChoice;
  onModelChange: (model: ModelChoice) => void;
}
