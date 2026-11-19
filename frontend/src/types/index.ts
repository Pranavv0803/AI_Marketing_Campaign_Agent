export interface PostRules {
  max_chars: number;
  hashtags_min: number;
  hashtags_max: number;
}

export interface EmailRules {
  subject_max_chars: number;
  body_min_words: number;
  body_max_words: number;
}

export interface ChannelRules {
  post: PostRules;
  email: EmailRules;
}

export interface BrandKit {
  brand_name: string;
  product_name: string;
  tagline: string;
  voice_adjectives: string[];
  voice_summary: string;
  example_lines: string[];
  product_features: string[];
  banned_terms: string[];
  channel_rules: ChannelRules;
}

export interface Persona {
  id: string;
  name: string;
  role: string;
  pain_points: string[];
  motivations: string[];
  preferred_tone: string;
}

export interface Concept {
  name: string;
  key_message: string;
  hook: string;
}

export interface RuleResult {
  rule_id: string;
  passed: boolean;
  detail: string;
  matched_text?: string | null;
}

export interface JudgeResult {
  reason: string;
  score: number;
}

export interface PieceResult {
  persona_id: string;
  channel: 'post' | 'email';
  assembled_text: string;
  rule_results: RuleResult[];
  judge: JudgeResult;
  status: 'pass' | 'fixed' | 'failing';
  provider: string;
}

export interface Campaign {
  brand_kit: BrandKit;
  personas: Persona[];
  concept: Concept;
  pieces: PieceResult[];
}

export interface SampleDataResponse {
  brand_kit: BrandKit;
  personas: Persona[];
}

export interface ConceptsResponse {
  concepts: Concept[];
}

export interface ExportResponse {
  filename: string;
  content: string;
  mime_type: string;
}

export interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  primary_provider: string;
  primary_reachable: boolean;
  fallback_provider: string;
  fallback_reachable: boolean;
  mock_mode: boolean;
}
