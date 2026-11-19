import React from 'react';
import { Concept } from '../types';
import { ConceptCard } from './ConceptCard';
import { RefreshCw, ArrowRight, ArrowLeft } from 'lucide-react';

interface ConceptsViewProps {
  concepts: Concept[];
  selectedConcept: Concept | null;
  onSelectConcept: (concept: Concept) => void;
  onRegenerateConcepts: () => void;
  onBackToSetup: () => void;
  onProceedToCampaign: () => void;
  isLoading: boolean;
}

export const ConceptsView: React.FC<ConceptsViewProps> = ({
  concepts,
  selectedConcept,
  onSelectConcept,
  onRegenerateConcepts,
  onBackToSetup,
  onProceedToCampaign,
  isLoading,
}) => {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white border border-slate-200 rounded-xl p-5 shadow-sm gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Choose a Campaign Concept</h1>
          <p className="text-xs text-slate-500 mt-1">
            Review the 3 generated creative angles. Pick one to generate tailored social and email copy for all 3 personas.
          </p>
        </div>
        <div className="flex items-center space-x-3 shrink-0">
          <button
            type="button"
            onClick={onBackToSetup}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold inline-flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Setup
          </button>
          <button
            type="button"
            onClick={onRegenerateConcepts}
            disabled={isLoading}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold inline-flex items-center border border-slate-300 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Regenerate Concepts
          </button>
          <button
            type="button"
            disabled={!selectedConcept || isLoading}
            onClick={onProceedToCampaign}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold inline-flex items-center shadow-sm disabled:opacity-50"
          >
            <span>Next: Tailored Assets</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </button>
        </div>
      </div>

      {/* 3 Concepts Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm animate-pulse space-y-4">
              <div className="w-20 h-4 bg-slate-200 rounded" />
              <div className="w-40 h-6 bg-slate-200 rounded" />
              <div className="w-full h-16 bg-slate-100 rounded" />
              <div className="w-full h-12 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {concepts.map((concept, idx) => (
            <ConceptCard
              key={concept.name || idx}
              concept={concept}
              index={idx}
              isSelected={selectedConcept?.name === concept.name}
              onSelect={() => onSelectConcept(concept)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
