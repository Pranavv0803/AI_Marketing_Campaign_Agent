import React from 'react';
import { Concept } from '../types';
import { Check, Sparkles } from 'lucide-react';

interface ConceptCardProps {
  concept: Concept;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
}

export const ConceptCard: React.FC<ConceptCardProps> = ({
  concept,
  index,
  isSelected,
  onSelect,
}) => {
  return (
    <div
      onClick={onSelect}
      className={`projector-card p-6 cursor-pointer flex flex-col justify-between transition-all relative ${
        isSelected
          ? 'ring-2 ring-emerald-600 border-emerald-500 bg-emerald-50/20 shadow-md'
          : 'hover:border-slate-300 bg-white'
      }`}
    >
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="inline-flex items-center text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
            Concept 0{index + 1}
          </span>
          {isSelected && (
            <span className="flex items-center text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              <Check className="w-3.5 h-3.5 mr-1" /> Selected
            </span>
          )}
        </div>

        <h3 className="text-lg font-bold text-slate-900 mb-2">{concept.name}</h3>
        <p className="text-xs text-slate-600 mb-4 leading-relaxed">{concept.key_message}</p>

        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Creative Hook
          </span>
          <p className="text-xs italic text-slate-800 font-medium">"{concept.hook}"</p>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className={`w-full py-2.5 px-4 rounded-lg text-xs font-bold transition-colors inline-flex items-center justify-center ${
            isSelected
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700'
          }`}
        >
          {isSelected ? (
            <>
              <Check className="w-4 h-4 mr-1.5" /> Concept Chosen
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-1.5" /> Pick this Concept
            </>
          )}
        </button>
      </div>
    </div>
  );
};
