import React from 'react';
import { AlertCircle, RefreshCw, Cpu, X } from 'lucide-react';

interface ErrorDialogProps {
  message: string;
  onRetry: () => void;
  onSwitchToMock: () => void;
  onDismiss: () => void;
}

export const ErrorDialog: React.FC<ErrorDialogProps> = ({
  message,
  onRetry,
  onSwitchToMock,
  onDismiss,
}) => {
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in duration-200">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 text-rose-600">
            <div className="p-2 bg-rose-100 rounded-lg">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">API Execution Notice</h3>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="mt-4 text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono select-text">
          {message}
        </p>

        <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={onRetry}
            className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold inline-flex items-center justify-center"
          >
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Retry Request
          </button>
          <button
            type="button"
            onClick={onSwitchToMock}
            className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold inline-flex items-center justify-center shadow-sm"
          >
            <Cpu className="w-4 h-4 mr-1.5" />
            Switch to Mock Mode
          </button>
        </div>
      </div>
    </div>
  );
};
