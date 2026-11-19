import React, { useState, useEffect } from 'react';
import { Persona } from '../types';
import { User, Plus, X, AlertTriangle } from 'lucide-react';

interface PersonaCardProps {
  persona: Persona;
  allPersonas: Persona[];
  onChange: (updated: Persona) => void;
}

export const PersonaCard: React.FC<PersonaCardProps> = ({
  persona,
  allPersonas,
  onChange,
}) => {
  const [newPainPoint, setNewPainPoint] = useState('');

  // Local state for motivations text to allow smooth typing with commas
  const [motivationsText, setMotivationsText] = useState(
    persona.motivations.join(', ')
  );

  // Synchronize when persona.motivations changes externally
  useEffect(() => {
    const currentParsed = motivationsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const propsMatch =
      currentParsed.length === persona.motivations.length &&
      currentParsed.every((val, idx) => val === persona.motivations[idx]);

    if (!propsMatch) {
      setMotivationsText(persona.motivations.join(', '));
    }
  }, [persona.motivations]);

  const handleMotivationsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setMotivationsText(text);
    const parsed = text
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    updateField('motivations', parsed);
  };

  const handleMotivationsBlur = () => {
    const parsed = motivationsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    setMotivationsText(parsed.join(', '));
    updateField('motivations', parsed);
  };

  const updateField = <K extends keyof Persona>(field: K, value: Persona[K]) => {
    onChange({ ...persona, [field]: value });
  };

  const addPainPoint = () => {
    if (!newPainPoint.trim()) return;
    updateField('pain_points', [...persona.pain_points, newPainPoint.trim()]);
    setNewPainPoint('');
  };

  const removePainPoint = (index: number) => {
    updateField('pain_points', persona.pain_points.filter((_, i) => i !== index));
  };

  // Check if any OTHER persona shares the same first pain point
  const firstPain = persona.pain_points[0]?.trim().toLowerCase() || '';
  const hasCollision = allPersonas.some(
    (p) =>
      p.id !== persona.id &&
      p.pain_points[0]?.trim().toLowerCase() === firstPain &&
      firstPain !== ''
  );

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{persona.name}</h3>
              <p className="text-[11px] text-slate-500">{persona.role}</p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 rounded text-slate-600">
            {persona.id}
          </span>
        </div>

        {hasCollision && (
          <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-start space-x-2 text-amber-800 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Duplicate Lead Angle:</strong> Another persona shares this first pain point. The system will automatically select the next unassigned pain point for distinct tailoring.
            </span>
          </div>
        )}

        {/* Persona Details Editable Inputs */}
        <div className="mt-3 space-y-2.5">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">Role Description</label>
            <input
              type="text"
              value={persona.role}
              onChange={(e) => updateField('role', e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">Preferred Tone</label>
            <input
              type="text"
              value={persona.preferred_tone}
              onChange={(e) => updateField('preferred_tone', e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">
              Motivations (comma separated)
            </label>
            <input
              type="text"
              value={motivationsText}
              onChange={handleMotivationsChange}
              onBlur={handleMotivationsBlur}
              placeholder="e.g. professional reliability, productivity"
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Pain Points List */}
        <div className="mt-3">
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
            Pain Points (Top point = Lead Campaign Angle)
          </label>
          <ul className="space-y-1.5 mb-2">
            {persona.pain_points.map((pt, idx) => (
              <li
                key={idx}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded text-xs border ${
                  idx === 0
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950 font-medium'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <div className="flex items-center space-x-1.5 overflow-hidden">
                  <span className="text-[10px] font-bold text-slate-400">#{idx + 1}</span>
                  <span className="truncate">{pt}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removePainPoint(idx)}
                  className="text-slate-400 hover:text-rose-600 ml-1.5 shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
          <div className="flex space-x-1.5">
            <input
              type="text"
              placeholder="Add pain point..."
              value={newPainPoint}
              onChange={(e) => setNewPainPoint(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addPainPoint();
                }
              }}
              className="flex-1 px-2 py-1 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <button
              type="button"
              onClick={addPainPoint}
              className="px-2.5 py-1 bg-slate-700 hover:bg-slate-800 text-white rounded text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
