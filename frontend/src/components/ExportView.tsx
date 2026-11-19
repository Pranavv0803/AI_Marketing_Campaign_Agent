import React, { useState } from 'react';
import { Campaign } from '../types';
import { exportCampaign } from '../api/client';
import { FileText, Code2, ArrowLeft, Sparkles } from 'lucide-react';

interface ExportViewProps {
  campaign: Campaign;
  onBackToCampaign: () => void;
}

export const ExportView: React.FC<ExportViewProps> = ({ campaign, onBackToCampaign }) => {
  const [downloading, setDownloading] = useState<'md' | 'json' | null>(null);
  const [previewFormat, setPreviewFormat] = useState<'md' | 'json'>('md');

  const handleDownload = async (format: 'markdown' | 'json') => {
    try {
      setDownloading(format === 'markdown' ? 'md' : 'json');
      const res = await exportCampaign(campaign, format);
      const blob = new Blob([res.content], { type: res.mime_type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Export failed: ${err}`);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header and Download Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white border border-slate-200 rounded-xl p-6 shadow-sm gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            Campaign Package Ready
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Export the complete campaign hierarchy including brand kit, personas, concept, tailored copy, scores, and rule check logs.
          </p>
        </div>
        <div className="flex items-center space-x-3 shrink-0">
          <button
            type="button"
            onClick={onBackToCampaign}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold inline-flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Assets
          </button>
          <button
            type="button"
            disabled={downloading !== null}
            onClick={() => handleDownload('markdown')}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold inline-flex items-center shadow-sm disabled:opacity-50"
          >
            <FileText className="w-4 h-4 mr-1.5" />
            {downloading === 'md' ? 'Preparing...' : 'Export Markdown (.md)'}
          </button>
          <button
            type="button"
            disabled={downloading !== null}
            onClick={() => handleDownload('json')}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold inline-flex items-center shadow-sm disabled:opacity-50"
          >
            <Code2 className="w-4 h-4 mr-1.5" />
            {downloading === 'json' ? 'Preparing...' : 'Export JSON (.json)'}
          </button>
        </div>
      </div>

      {/* Summary Stats Card */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
          <span className="block text-[11px] font-bold uppercase text-slate-400">Brand</span>
          <span className="text-base font-bold text-slate-900">{campaign.brand_kit.brand_name}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
          <span className="block text-[11px] font-bold uppercase text-slate-400">Personas</span>
          <span className="text-base font-bold text-slate-900">{campaign.personas.length} Audience Segments</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
          <span className="block text-[11px] font-bold uppercase text-slate-400">Total Assets</span>
          <span className="text-base font-bold text-slate-900">{campaign.pieces.length} Tailored Pieces</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
          <span className="block text-[11px] font-bold uppercase text-slate-400">Rule Pass Rate</span>
          <span className="text-base font-bold text-emerald-600">
            {Math.round(
              (campaign.pieces.filter((p) => p.status !== 'failing').length /
                (campaign.pieces.length || 1)) *
                100
            )}
            % Compliant
          </span>
        </div>
      </div>

      {/* Preview Section */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 bg-slate-50">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Export Preview ({previewFormat === 'md' ? 'Markdown' : 'Raw JSON'})
          </span>
          <div className="flex space-x-1">
            <button
              type="button"
              onClick={() => setPreviewFormat('md')}
              className={`px-3 py-1 rounded text-xs font-medium ${
                previewFormat === 'md' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'text-slate-500'
              }`}
            >
              Markdown
            </button>
            <button
              type="button"
              onClick={() => setPreviewFormat('json')}
              className={`px-3 py-1 rounded text-xs font-medium ${
                previewFormat === 'json' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'text-slate-500'
              }`}
            >
              JSON
            </button>
          </div>
        </div>
        <pre className="p-6 text-xs font-mono text-slate-800 bg-slate-50/50 max-h-96 overflow-y-auto whitespace-pre-wrap leading-relaxed select-text">
          {previewFormat === 'json'
            ? JSON.stringify(campaign, null, 2)
            : `# Campaign: ${campaign.brand_kit.brand_name} - ${campaign.brand_kit.product_name}\n\nConcept: ${campaign.concept.name}\nKey Message: ${campaign.concept.key_message}\n\nAssets:\n` +
              campaign.pieces
                .map(
                  (p) =>
                    `### Persona: ${p.persona_id} | Channel: ${p.channel}\n${p.assembled_text}\nScore: ${p.judge.score}/5 | Status: ${p.status}`
                )
                .join('\n\n')}
        </pre>
      </div>
    </div>
  );
};
