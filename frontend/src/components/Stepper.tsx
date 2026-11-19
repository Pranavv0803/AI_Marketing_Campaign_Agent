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
  isMockMode = false,
  onToggleMockMode,
}) => {
  const steps = [
    { id: 1, name: '1. Brand & Personas', icon: Settings },
    { id: 2, name: '2. Concepts', icon: Sparkles },
    { id: 3, name: '3. Persona Campaign', icon: Columns },
    { id: 4, name: '4. Export', icon: Download },
  ];

  return (
    <nav aria-label="Progress" className="w-full bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Step Items */}
        <ol className="flex items-center justify-between flex-1 space-x-2 sm:space-x-4">
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
                  className={`group flex items-center w-full focus:outline-none transition-colors ${
                    !isUnlocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                  }`}
                >
                  <span
                    className={`flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 font-semibold text-xs sm:text-sm transition-colors ${
                      isCurrent
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-200'
                        : isCompleted
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-slate-300 bg-white text-slate-500 group-hover:border-slate-400'
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" /> : <Icon className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </span>
                  <span
                    className={`ml-2 sm:ml-3 text-xs sm:text-sm font-medium tracking-tight transition-colors hidden md:inline ${
                      isCurrent ? 'text-emerald-900 font-bold' : isCompleted ? 'text-slate-800' : 'text-slate-500'
                    }`}
                  >
                    {step.name}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        {/* Live / Mock Mode Toggle Badge */}
        {onToggleMockMode && (
          <div className="flex items-center justify-end pl-2">
            <button
              type="button"
              onClick={onToggleMockMode}
              title="Click to toggle between Live OpenAI API and Offline Mock Mode"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                isMockMode
                  ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 shadow-sm'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 shadow-sm'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isMockMode ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'
                }`}
              />
              <span>{isMockMode ? 'Mode: Mock (Offline)' : 'Mode: Live OpenAI'}</span>
              <span className="text-[10px] text-slate-400 font-normal ml-0.5">(toggle)</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};
