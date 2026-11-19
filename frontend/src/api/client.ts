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
    const err = await res.json().catch(() => ({ detail: 'Concept generation failed' }));
    throw new Error(err.detail || 'Concept generation failed');
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
    const err = await res.json().catch(() => ({ detail: 'Piece generation failed' }));
    throw new Error(err.detail || 'Piece generation failed');
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
    const err = await res.json().catch(() => ({ detail: 'Export failed' }));
    throw new Error(err.detail || 'Export failed');
  }
  return res.json();
}
