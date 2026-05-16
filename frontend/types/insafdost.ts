export interface AnalysisCaseRequest {
  cases: string[];
}

export interface PrecedentMeta {
  source: string;
  score: number;
}

export interface AnalysisCaseResult {
  raw_text: string;
  category: string;
  legal_keywords: string;
  precedents: string[];
  precedent_meta: PrecedentMeta[];
  final_answer: string;
  audit_score: number;
  _case_num: number;
  [key: string]: unknown;
}

export interface AnalysisResponse {
  status: string;
  data: AnalysisCaseResult[];
}

export interface BackendHealthResponse {
  status: string;
  message: string;
}

export interface BackendHealthState {
  connected: boolean;
  message: string;
}