import React, { useState } from 'react';
import { PieceResult } from '../types';
import { RefreshCw, CheckCircle2, AlertCircle, Sparkles, Wrench, ShieldCheck, Copy, Check } from 'lucide-react';

interface PieceCardProps {
  piece: PieceResult | null;
  channel: 'post' | 'email';
  personaName: string;
  onRegenerate: () => void;
  isLoading: boolean;
}

export const PieceCard: React.FC<PieceCardProps> = ({
  piece,
  channel,
  personaName,
  onRegenerate,
  isLoading,
}) => {
  const [copied, setCopied] = useState(false);
  const [showReason, setShowReason] = useState(false);

  const handleCopy = () => {
    if (!piece) return;
    navigator.clipboard.writeText(piece.assembled_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading || !piece) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm animate-pulse space-y-3">
        <div className="flex justify-between">
          <div className="w-24 h-4 bg-slate-200 rounded" />
          <div className="w-16 h-4 bg-slate-200 rounded" />
        </div>
        <div className="w-full h-24 bg-slate-100 rounded" />
        <div className="w-full h-10 bg-slate-100 rounded" />
      </div>
    );
  }

  const isPassing = piece.status === 'pass';
  const isFixed = piece.status === 'fixed';
  const isFailing = piece.status === 'failing';

  return (
    <div
      className={`projector-card p-5 flex flex-col justify-between transition-all ${
        isFailing ? 'border-rose-300 ring-1 ring-rose-200 bg-rose-50/10' : 'bg-white'
      }`}
    >
      <div>
        {/* Header: Channel Title, Status Badge & Actions */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
              {channel === 'post' ? 'Social Post' : 'Marketing Email'}
            </span>
            {isFixed && (
              <span className="badge-fixed">
                <Wrench className="w-3 h-3 mr-1" /> Fixed automatically
              </span>
            )}
            {isPassing && (
              <span className="badge-pass">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Passing
              </span>
            )}
            {isFailing && (
              <span className="badge-fail">
                <AlertCircle className="w-3 h-3 mr-1" /> Rule Failure
              </span>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={handleCopy}
              title="Copy to clipboard"
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={onRegenerate}
              disabled={isLoading}
              title="Regenerate this piece"
              className="p-1.5 text-slate-400 hover:text-emerald-600 rounded hover:bg-slate-100 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Copy Content Box */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3.5 mb-3 text-xs leading-relaxed text-slate-800 whitespace-pre-line font-mono select-text">
          {piece.assembled_text}
        </div>

        {/* Brand Voice Score & Reason */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-900">Brand-Fit Score:</span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded ${
                  piece.judge.score >= 4
                    ? 'bg-emerald-100 text-emerald-800'
                    : piece.judge.score === 3
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {piece.judge.score} / 5
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowReason(!showReason)}
              className="text-[11px] text-emerald-700 hover:underline font-medium"
            >
              {showReason ? 'Hide rationale' : 'View rationale'}
            </button>
          </div>
          {showReason && (
            <p className="mt-2 text-[11px] text-slate-600 border-t border-slate-200/60 pt-2 italic leading-relaxed">
              "{piece.judge.reason}"
            </p>
          )}
        </div>

        {/* Deterministic Rule Verification Details */}
        <div className="space-y-1.5">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Rule Checks ({piece.rule_results.filter((r) => r.passed).length}/{piece.rule_results.length} Passing)
          </span>
          <div className="space-y-1">
            {piece.rule_results.map((rule, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between px-2.5 py-1 rounded text-[11px] border ${
                  rule.passed
                    ? 'bg-emerald-50/50 border-emerald-100 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900 font-semibold'
                }`}
              >
                <div className="flex items-center space-x-1.5 truncate">
                  {rule.passed ? (
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  )}
                  <span className="truncate">{rule.detail}</span>
                </div>
                {rule.matched_text && (
                  <span className="ml-2 font-mono text-[10px] bg-white px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                    {rule.matched_text}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer: Provider Tag */}
      <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>Persona: <strong className="text-slate-700">{personaName}</strong></span>
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium ${
            piece.provider === 'openai'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${piece.provider === 'openai' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          {piece.provider === 'openai' ? 'OpenAI' : 'Mock'}
        </span>
      </div>
    </div>
  );
};
