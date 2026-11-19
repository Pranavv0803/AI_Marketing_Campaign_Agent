import React from 'react';
import { Settings, Sparkles, Columns, Download, Check } from 'lucide-react';

interface StepperProps {
  currentStep: number;
  onSelectStep: (step: number) => void;
  maxStepUnlocked: number;
  isMockMode?: boolean;
  onToggleMockMode?: () => void;
}

export const Stepper: React.FC<StepperProps> = ({
  currentStep,
  onSelectStep,
  maxStepUnlocked,
  isMockMode,
  onToggleMockMode,
}) => {
  const steps = [
    { id: 1, name: '1. Brand & Personas', icon: Settings },
    { id: 2, name: '2. Concepts', icon: Sparkles },
    { id: 3, name: '3. Persona Campaign', icon: Columns },
    { id: 4, name: '4. Export', icon: Download },
  ];

  return (
    <nav
      aria-label="Progress"
      className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 sm:px-6 py-3 sm:py-3.5 shadow-xs transition-shadow"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        {/* Step Items */}
        <ol className="flex items-center justify-between flex-1 space-x-1 sm:space-x-3">
          {steps.map((step) => {
            const Icon = step.icon;
            const isCurrent = step.id === currentStep;
            const isCompleted = step.id < currentStep;
            const isUnlocked = step.id <= maxStepUnlocked;

            return (
              <li key={step.name} className="flex-1">
                <button
                  type="button"
                  disabled={!isUnlocked}
                  onClick={() => onSelectStep(step.id)}
                  className={`group flex items-center w-full focus:outline-none transition-all py-1 px-2 rounded-lg ${!isUnlocked ? 'cursor-not-allowed opacity-40' : 'cursor-pointer hover:bg-white/80'
                    } ${isCurrent ? 'bg-white shadow-xs' : ''}`}
                >
                  <span
                    className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 font-semibold text-xs transition-colors shrink-0 ${isCurrent
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-100'
                      : isCompleted
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-slate-300 bg-white text-slate-400 group-hover:border-slate-400'
                      }`}
                  >
                    {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : <Icon className="w-3.5 h-3.5" />}
                  </span>
                  <span
                    className={`ml-2 text-xs sm:text-sm font-medium tracking-tight transition-colors truncate hidden sm:inline ${isCurrent ? 'text-emerald-950 font-bold' : isCompleted ? 'text-slate-800' : 'text-slate-500'
                      }`}
                  >
                    {step.name}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        {/* Live / Mock Mode Toggle Badge if passed to Stepper */}
        {onToggleMockMode && (
          <div className="flex items-center justify-end pl-2 shrink-0">
            <button
              type="button"
              onClick={onToggleMockMode}
              title="Click to toggle between Live OpenAI API and Offline Mock Mode"
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${isMockMode
                ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 shadow-xs'
                : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 shadow-xs'
                }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${isMockMode ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'
                  }`}
              />
              <span>{isMockMode ? 'Mode: Mock (Offline)' : 'Mode: Live OpenAI'}</span>
              <span className="text-[10px] text-slate-400 font-normal ml-0.5 hidden sm:inline">(toggle)</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};
