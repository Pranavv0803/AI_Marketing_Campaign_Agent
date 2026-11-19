import React from 'react';
import { Persona, Concept, PieceResult } from '../types';
import { PieceCard } from './PieceCard';
import { RefreshCw, ArrowRight, ArrowLeft, User } from 'lucide-react';

interface CampaignViewProps {
  personas: Persona[];
  concept: Concept;
  pieces: PieceResult[];
  loadingPieces: Record<string, boolean>; // e.g. "commuter_post": true
  isRegeneratingAll: boolean;
  onRegeneratePiece: (personaId: string, channel: 'post' | 'email') => void;
  onRegenerateAll: () => void;
  onBackToConcepts: () => void;
  onProceedToExport: () => void;
}

export const CampaignView: React.FC<CampaignViewProps> = ({
  personas,
  concept,
  pieces,
  loadingPieces,
  isRegeneratingAll,
  onRegeneratePiece,
  onRegenerateAll,
  onBackToConcepts,
  onProceedToExport,
}) => {
  const getPiece = (personaId: string, channel: 'post' | 'email'): PieceResult | null => {
    return pieces.find((p) => p.persona_id === personaId && p.channel === channel) || null;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Bar with Chosen Concept & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white border border-slate-200 rounded-xl p-5 shadow-sm gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
              Active Concept
            </span>
            <h1 className="text-lg font-bold text-slate-900">{concept.name}</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 italic leading-tight">
            "{concept.hook}" — {concept.key_message}
          </p>
        </div>
        <div className="flex items-center space-x-3 shrink-0">
          <button
            type="button"
            onClick={onBackToConcepts}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold inline-flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Concepts
          </button>
          <button
            type="button"
            onClick={onRegenerateAll}
            disabled={isRegeneratingAll}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold inline-flex items-center shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${isRegeneratingAll ? 'animate-spin' : ''}`} />
            Regenerate All ({personas.length * 2} Assets)
          </button>
          <button
            type="button"
            onClick={onProceedToExport}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold inline-flex items-center shadow-sm"
          >
            <span>Next: Export</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </button>
        </div>
      </div>

      {/* Dynamic Columns Side-by-Side View */}
      <div className={`grid gap-6 ${
        personas.length === 1
          ? 'grid-cols-1 max-w-xl mx-auto'
          : personas.length === 2
          ? 'grid-cols-1 md:grid-cols-2'
          : personas.length === 3
          ? 'grid-cols-1 lg:grid-cols-3'
          : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
      }`}>
        {personas.map((persona) => {
          const postPiece = getPiece(persona.id, 'post');
          const emailPiece = getPiece(persona.id, 'email');
          const isPostLoading = loadingPieces[`${persona.id}_post`] || isRegeneratingAll;
          const isEmailLoading = loadingPieces[`${persona.id}_email`] || isRegeneratingAll;

          return (
            <div key={persona.id} className="space-y-4">
              {/* Persona Column Header */}
              <div className="bg-slate-900 text-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-emerald-400" />
                    <h2 className="text-sm font-bold tracking-tight">{persona.name}</h2>
                  </div>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-slate-800 text-emerald-400 rounded">
                    {persona.preferred_tone}
                  </span>
                </div>
                <p className="text-xs text-slate-300">{persona.role}</p>

                {/* Leading Pain Point Badge */}
                <div className="mt-3 p-2 bg-slate-800 rounded border border-slate-700 text-[11px]">
                  <span className="block text-[9px] uppercase font-bold text-emerald-400 tracking-wider mb-0.5">
                    Lead Campaign Angle
                  </span>
                  <span className="text-slate-200 font-medium leading-snug">
                    {persona.pain_points[0] || 'Primary Focus'}
                  </span>
                </div>
              </div>

              {/* Social Post Card */}
              <PieceCard
                piece={postPiece}
                channel="post"
                personaName={persona.name}
                onRegenerate={() => onRegeneratePiece(persona.id, 'post')}
                isLoading={isPostLoading}
              />

              {/* Email Card */}
              <PieceCard
                piece={emailPiece}
                channel="email"
                personaName={persona.name}
                onRegenerate={() => onRegeneratePiece(persona.id, 'email')}
                isLoading={isEmailLoading}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
