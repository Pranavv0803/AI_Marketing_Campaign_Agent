import React from 'react';
import { BrandKit, Persona } from '../types';
import { BrandKitForm } from './BrandKitForm';
import { PersonaCard } from './PersonaCard';
import { DownloadCloud, ArrowRight, Sparkles } from 'lucide-react';

interface SetupViewProps {
  brandKit: BrandKit;
  personas: Persona[];
  onUpdateBrandKit: (updated: BrandKit) => void;
  onUpdatePersona: (index: number, updated: Persona) => void;
  onLoadSampleData: () => void;
  onProceedToConcepts: () => void;
  isLoading: boolean;
}

export const SetupView: React.FC<SetupViewProps> = ({
  brandKit,
  personas,
  onUpdateBrandKit,
  onUpdatePersona,
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
    personas.length < 3 ||
    personas.some((p) => !p.name.trim() || p.pain_points.length === 0);

  const isFormValid = !hasInvertedLimits && !hasEmptyBrandData && !hasInvalidPersonas;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white border border-slate-200 rounded-xl p-5 shadow-sm gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            AI Marketing Campaign Generator
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure your brand kit and 3 distinct target personas. All values are editable at runtime.
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
                  : 'Ensure all 3 personas have a name and at least 1 pain point'
                : 'Generate 3 creative campaign concepts'
            }
            className={`px-5 py-2 text-white rounded-lg text-xs font-semibold inline-flex items-center shadow-sm transition-colors ${
              isFormValid && !isLoading
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

      {/* 3 Personas Side by Side */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-slate-900">
            Target Customer Personas ({personas.length})
          </h2>
          <span className="text-xs text-slate-500">
            Each persona receives a uniquely tailored angle derived from their primary pain point.
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
