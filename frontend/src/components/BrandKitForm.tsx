import React, { useState, useEffect } from 'react';
import { BrandKit } from '../types';
import { Plus, X, ShieldAlert, Sparkles, Sliders } from 'lucide-react';

interface BrandKitFormProps {
  brandKit: BrandKit;
  onChange: (updated: BrandKit) => void;
}

export const BrandKitForm: React.FC<BrandKitFormProps> = ({ brandKit, onChange }) => {
  const [newBanned, setNewBanned] = useState('');
  const [newFeature, setNewFeature] = useState('');
  const [newExample, setNewExample] = useState('');

  // Local state for voice adjectives text to allow smooth typing with commas
  const [voiceAdjectivesText, setVoiceAdjectivesText] = useState(
    brandKit.voice_adjectives.join(', ')
  );

  // Synchronize when brandKit.voice_adjectives changes externally (e.g. Load Sample Data)
  useEffect(() => {
    const currentParsed = voiceAdjectivesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const propsMatch =
      currentParsed.length === brandKit.voice_adjectives.length &&
      currentParsed.every((val, idx) => val === brandKit.voice_adjectives[idx]);

    if (!propsMatch) {
      setVoiceAdjectivesText(brandKit.voice_adjectives.join(', '));
    }
  }, [brandKit.voice_adjectives]);

  const handleVoiceAdjectivesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setVoiceAdjectivesText(text);
    const parsed = text
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    updateField('voice_adjectives', parsed);
  };

  const handleVoiceAdjectivesBlur = () => {
    const parsed = voiceAdjectivesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    setVoiceAdjectivesText(parsed.join(', '));
    updateField('voice_adjectives', parsed);
  };

  const updateField = <K extends keyof BrandKit>(field: K, value: BrandKit[K]) => {
    onChange({ ...brandKit, [field]: value });
  };

  const updatePostRule = (key: keyof BrandKit['channel_rules']['post'], val: number) => {
    onChange({
      ...brandKit,
      channel_rules: {
        ...brandKit.channel_rules,
        post: { ...brandKit.channel_rules.post, [key]: val },
      },
    });
  };

  const updateEmailRule = (key: keyof BrandKit['channel_rules']['email'], val: number) => {
    onChange({
      ...brandKit,
      channel_rules: {
        ...brandKit.channel_rules,
        email: { ...brandKit.channel_rules.email, [key]: val },
      },
    });
  };

  const addBannedTerm = () => {
    if (!newBanned.trim()) return;
    const termsToAdd = newBanned
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t && !brandKit.banned_terms.includes(t));
    if (termsToAdd.length > 0) {
      updateField('banned_terms', [...brandKit.banned_terms, ...termsToAdd]);
    }
    setNewBanned('');
  };

  const removeBannedTerm = (term: string) => {
    updateField('banned_terms', brandKit.banned_terms.filter((t) => t !== term));
  };

  const addFeature = () => {
    if (!newFeature.trim()) return;
    updateField('product_features', [...brandKit.product_features, newFeature.trim()]);
    setNewFeature('');
  };

  const removeFeature = (index: number) => {
    updateField('product_features', brandKit.product_features.filter((_, i) => i !== index));
  };

  const addExample = () => {
    if (!newExample.trim()) return;
    updateField('example_lines', [...brandKit.example_lines, newExample.trim()]);
    setNewExample('');
  };

  const removeExample = (index: number) => {
    updateField('example_lines', brandKit.example_lines.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
      <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
        <Sparkles className="w-5 h-5 text-emerald-600" />
        <h2 className="text-xl font-bold text-slate-900">Brand Kit & Constraints</h2>
      </div>

      {/* Row 1: Names & Tagline */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Brand Name
          </label>
          <input
            type="text"
            value={brandKit.brand_name}
            onChange={(e) => updateField('brand_name', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Product Name
          </label>
          <input
            type="text"
            value={brandKit.product_name}
            onChange={(e) => updateField('product_name', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Tagline
          </label>
          <input
            type="text"
            value={brandKit.tagline}
            onChange={(e) => updateField('tagline', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Voice Summary & Adjectives */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Voice Adjectives (comma separated)
          </label>
          <input
            type="text"
            value={voiceAdjectivesText}
            onChange={handleVoiceAdjectivesChange}
            onBlur={handleVoiceAdjectivesBlur}
            placeholder="e.g. smart, reliable, warm, minimalist"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Voice Summary
          </label>
          <input
            type="text"
            value={brandKit.voice_summary}
            onChange={(e) => updateField('voice_summary', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Banned Terms Tag Input */}
      <div className="bg-rose-50/50 border border-rose-100 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <ShieldAlert className="w-4 h-4 text-rose-600" />
          <label className="text-xs font-bold uppercase tracking-wider text-rose-800">
            Banned Terms & Phrases (Deterministic Check)
          </label>
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {brandKit.banned_terms.map((term) => (
            <span
              key={term}
              className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-rose-100 text-rose-800 border border-rose-200"
            >
              {term}
              <button
                type="button"
                onClick={() => removeBannedTerm(term)}
                className="ml-1.5 text-rose-600 hover:text-rose-900"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Add forbidden term (e.g. cheap, miracle)..."
            value={newBanned}
            onChange={(e) => setNewBanned(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addBannedTerm();
              }
            }}
            className="flex-1 px-3 py-1.5 border border-rose-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
          <button
            type="button"
            onClick={addBannedTerm}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold inline-flex items-center"
          >
            <Plus className="w-4 h-4 mr-1" /> Add Term
          </button>
        </div>
      </div>

      {/* Product Features List */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
          True Product Features (Copy may only claim these features)
        </label>
        <ul className="space-y-2 mb-3">
          {brandKit.product_features.map((feat, idx) => (
            <li
              key={idx}
              className="flex items-center justify-between px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700"
            >
              <span>{feat}</span>
              <button
                type="button"
                onClick={() => removeFeature(idx)}
                className="text-slate-400 hover:text-rose-600 ml-2"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Add a verified product feature..."
            value={newFeature}
            onChange={(e) => setNewFeature(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addFeature();
              }
            }}
            className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="button"
            onClick={addFeature}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold inline-flex items-center"
          >
            <Plus className="w-4 h-4 mr-1" /> Add Feature
          </button>
        </div>
      </div>

      {/* Example On-Brand Lines List */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
          Example On-Brand Lines (Guides tone and copy style)
        </label>
        <ul className="space-y-2 mb-3">
          {brandKit.example_lines.map((line, idx) => (
            <li
              key={idx}
              className="flex items-center justify-between px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs italic text-slate-700"
            >
              <span>"{line}"</span>
              <button
                type="button"
                onClick={() => removeExample(idx)}
                className="text-slate-400 hover:text-rose-600 ml-2"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Add an on-brand example line..."
            value={newExample}
            onChange={(e) => setNewExample(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addExample();
              }
            }}
            className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="button"
            onClick={addExample}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold inline-flex items-center"
          >
            <Plus className="w-4 h-4 mr-1" /> Add Line
          </button>
        </div>
      </div>

      {/* Channel Limits Section */}
      <div className="border-t border-slate-100 pt-4">
        <div className="flex items-center space-x-2 mb-3">
          <Sliders className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-900">Deterministic Channel Limits</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Social Max Chars
            </label>
            <input
              type="number"
              value={brandKit.channel_rules.post.max_chars}
              onChange={(e) => updatePostRule('max_chars', parseInt(e.target.value) || 0)}
              className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-xs font-mono"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Min Hashtags
            </label>
            <input
              type="number"
              value={brandKit.channel_rules.post.hashtags_min}
              onChange={(e) => updatePostRule('hashtags_min', parseInt(e.target.value) || 0)}
              className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-xs font-mono"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Max Hashtags
            </label>
            <input
              type="number"
              value={brandKit.channel_rules.post.hashtags_max}
              onChange={(e) => updatePostRule('hashtags_max', parseInt(e.target.value) || 0)}
              className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-xs font-mono"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Email Subj Max Chars
            </label>
            <input
              type="number"
              value={brandKit.channel_rules.email.subject_max_chars}
              onChange={(e) => updateEmailRule('subject_max_chars', parseInt(e.target.value) || 0)}
              className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-xs font-mono"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Email Min Words
            </label>
            <input
              type="number"
              value={brandKit.channel_rules.email.body_min_words}
              onChange={(e) => updateEmailRule('body_min_words', parseInt(e.target.value) || 0)}
              className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-xs font-mono"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Email Max Words
            </label>
            <input
              type="number"
              value={brandKit.channel_rules.email.body_max_words}
              onChange={(e) => updateEmailRule('body_max_words', parseInt(e.target.value) || 0)}
              className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-xs font-mono"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
