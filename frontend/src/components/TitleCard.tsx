import React from 'react';
import { Sparkles, ShieldCheck, Cpu, RotateCcw } from 'lucide-react';

interface TitleCardProps {
  onResetDefaults?: () => void;
  isLoading?: boolean;
}

export const TitleCard: React.FC<TitleCardProps> = ({ onResetDefaults, isLoading }) => {
  return (
    <header className="w-full bg-white border-b border-slate-200/90 relative overflow-hidden">
      {/* Decorative top accent gradient */}
      <div className="h-1 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          {/* Left: Branding & Tagline */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 shrink-0 ring-4 ring-emerald-50">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  AI Marketing Campaign Generator
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  SipSense ThermoPulse™
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Autonomous multi-persona marketing campaign generator &amp; compliance judge with deterministic rule validation
              </p>
            </div>
          </div>

          {/* Right: Architecture Chips & Quick Reset */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <div className="hidden lg:flex items-center gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
              <Cpu className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-medium">GPT-4o-mini</span>
              <span className="text-slate-300">|</span>
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              <span className="font-medium">Deterministic Guardrails</span>
            </div>
            {onResetDefaults && (
              <button
                type="button"
                onClick={onResetDefaults}
                disabled={isLoading}
                title="Reset brand kit, personas, and campaign to starter defaults"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Reset Defaults</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
