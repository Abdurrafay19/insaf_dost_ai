export type LegalCategory = "Criminal" | "Civil" | "Family" | "Irrelevant";

export interface PrecedentMeta {
  source: string;
  score: number;
}

export interface CaseResponseItem {
  _case_num: number;
  raw_text: string;
  is_valid: boolean;
  category: LegalCategory;
  legal_keywords: string;
  precedents: string[];
  precedent_meta: PrecedentMeta[];
  final_answer: string;
  audit_score: number;
}

export type PipelineNode =
  | "guardrail"
  | "processor"
  | "retriever"
  | "reasoner"
  | "auditor";

export type StreamEvent =
  | { type: "case_start"; case_num: number; total_cases: number }
  | { type: "node_start"; case_num: number; node: PipelineNode; label: string }
  | { type: "node_complete"; case_num: number; node: PipelineNode }
  | { type: "case_complete"; case_num: number; data: CaseResponseItem }
  | { type: "error"; case_num: number; detail: string }
  | { type: "done" };

export interface BackendStatusState {
  ready: boolean;
  message: string;
}

export interface AnalyzeStreamRequest {
  cases: string[];
}

export type NodeStatus = "pending" | "active" | "done";

export interface CaseProgress {
  caseNum: number;
  totalCases: number;
  status: "queued" | "running" | "complete" | "error";
  nodes: Record<PipelineNode, NodeStatus>;
  activeLabel?: string;
  errorDetail?: string;
}
