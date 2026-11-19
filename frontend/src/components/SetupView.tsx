import React from 'react';
import { BrandKit, Persona } from '../types';
import { BrandKitForm } from './BrandKitForm';
import { PersonaCard } from './PersonaCard';
import { DownloadCloud, ArrowRight } from 'lucide-react';

interface SetupViewProps {
  brandKit: BrandKit;
  personas: Persona[];
  onUpdateBrandKit: (updated: BrandKit) => void;
  onUpdatePersona: (index: number, updated: Persona) => void;
  onChangePersonaCount: (count: number) => void;
  onLoadSampleData: () => void;
  onProceedToConcepts: () => void;
  isLoading: boolean;
}

export const SetupView: React.FC<SetupViewProps> = ({
  brandKit,
  personas,
  onUpdateBrandKit,
  onUpdatePersona,
  onChangePersonaCount,
  onLoadSampleData,
  onProceedToConcepts,
  isLoading,
}) => {
  const hasInvertedLimits =
    brandKit.channel_rules.post.hashtags_min > brandKit.channel_rules.post.hashtags_max ||
    brandKit.channel_rules.email.body_min_words > brandKit.channel_rules.email.body_max_words ||
    brandKit.channel_rules.post.max_chars <= 0 ||
    brandKit.channel_rules.email.subject_max_chars <= 0;

  const hasEmptyBrandData =
    !brandKit.brand_name.trim() ||
    !brandKit.product_name.trim() ||
    brandKit.product_features.length === 0;

  const hasInvalidPersonas =
    personas.length < 1 ||
    personas.some((p) => !p.name.trim() || p.pain_points.length === 0);

  const isFormValid = !hasInvertedLimits && !hasEmptyBrandData && !hasInvalidPersonas;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Step 1 Control Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white border border-slate-200 rounded-xl p-5 shadow-sm gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
              Step 1 of 4
            </span>
            <h2 className="text-lg font-bold text-slate-900">
              Brand Kit &amp; Target Personas
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure your brand identity, voice adjectives, channel boundaries, and customer personas.
          </p>
        </div>
        <div className="flex items-center space-x-3 shrink-0">
          <button
            type="button"
            onClick={onLoadSampleData}
            disabled={isLoading}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold inline-flex items-center transition-colors border border-slate-300"
          >
            <DownloadCloud className="w-4 h-4 mr-1.5" />
            Load Sample Data
          </button>
          <button
            type="button"
            onClick={onProceedToConcepts}
            disabled={isLoading || !isFormValid}
            title={
              !isFormValid
                ? hasInvertedLimits
                  ? 'Fix channel limit warnings before continuing'
                  : hasEmptyBrandData
                    ? 'Provide Brand Name, Product Name, and at least 1 feature'
                    : 'Ensure all personas have a name and at least 1 pain point'
                : 'Generate creative campaign concepts'
            }
            className={`px-5 py-2 text-white rounded-lg text-xs font-semibold inline-flex items-center shadow-sm transition-colors ${isFormValid && !isLoading
              ? 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer'
              : 'bg-slate-400 cursor-not-allowed opacity-60'
              }`}
          >
            <span>Next: Concepts</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </button>
        </div>
      </div>

      {/* Brand Kit Form */}
      <BrandKitForm brandKit={brandKit} onChange={onUpdateBrandKit} />

      {/* Dynamic Personas Section */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              Target Customer Personas
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                {personas.length} {personas.length === 1 ? 'persona' : 'personas'}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Each persona receives a uniquely tailored angle derived from their primary pain point.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
            <label className="text-xs font-semibold text-slate-700">Choose count:</label>
            <select
              value={personas.length}
              onChange={(e) => onChangePersonaCount(Number(e.target.value))}
              className="px-2.5 py-1 bg-slate-50 border border-slate-300 rounded text-xs font-bold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <option key={num} value={num}>
                  {num} {num === 1 ? 'Persona' : 'Personas'}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={`grid gap-4 ${personas.length === 1
          ? 'grid-cols-1 max-w-xl mx-auto'
          : personas.length === 2
            ? 'grid-cols-1 md:grid-cols-2'
            : personas.length === 3
              ? 'grid-cols-1 md:grid-cols-3'
              : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          }`}>
          {personas.map((persona, idx) => (
            <PersonaCard
              key={persona.id || idx}
              persona={persona}
              allPersonas={personas}
              onChange={(updated) => onUpdatePersona(idx, updated)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
