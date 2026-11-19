import {
  SampleDataResponse,
  ConceptsResponse,
  PieceResult,
  ExportResponse,
  HealthResponse,
  BrandKit,
  Persona,
  Concept,
  Campaign,
} from '../types';

const API_BASE = '/api';

async function extractErrorMessage(res: Response, defaultMessage: string): Promise<string> {
  try {
    const data = await res.json();
    if (data && data.detail) {
      return typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
    }
    return JSON.stringify(data);
  } catch {
    const text = await res.text().catch(() => '');
    return text.trim() || `HTTP ${res.status}: ${res.statusText || defaultMessage}`;
  }
}

export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}

export async function fetchSampleData(): Promise<SampleDataResponse> {
  const res = await fetch(`${API_BASE}/sample`);
  if (!res.ok) throw new Error('Failed to load sample data');
  return res.json();
}

export async function generateConcepts(
  brandKit: BrandKit,
  personas: Persona[],
  mockMode?: boolean
): Promise<ConceptsResponse> {
  const payload: Record<string, any> = { brand_kit: brandKit, personas };
  if (mockMode !== undefined) payload.mock_mode = mockMode;

  const res = await fetch(`${API_BASE}/concepts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errText = await extractErrorMessage(res, 'Concept generation failed');
    throw new Error(errText);
  }
  return res.json();
}

export async function generatePiece(
  brandKit: BrandKit,
  persona: Persona,
  avoidPainPoints: string[],
  concept: Concept,
  channel: 'post' | 'email',
  mockMode?: boolean
): Promise<PieceResult> {
  const payload: Record<string, any> = {
    brand_kit: brandKit,
    persona,
    avoid_pain_points: avoidPainPoints,
    concept,
    channel,
  };
  if (mockMode !== undefined) payload.mock_mode = mockMode;

  const res = await fetch(`${API_BASE}/piece`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errText = await extractErrorMessage(res, 'Piece generation failed');
    throw new Error(errText);
  }
  return res.json();
}

export async function exportCampaign(
  campaign: Campaign,
  format: 'markdown' | 'json'
): Promise<ExportResponse> {
  const res = await fetch(`${API_BASE}/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ campaign, format }),
  });
  if (!res.ok) {
    const errText = await extractErrorMessage(res, 'Export failed');
    throw new Error(errText);
  }
  return res.json();
}
