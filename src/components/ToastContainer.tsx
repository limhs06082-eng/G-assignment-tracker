import React from 'react';
import { ToastMessage } from '../types';
import { RotateCcw, X, CheckCircle2, AlertCircle, Info } from 'lucide-react';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
  onUndo: (undoActionId: string) => void;
}

export function ToastContainer({ toasts, onDismiss, onUndo }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 max-w-md w-full px-4 pointer-events-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            className="pointer-events-auto bg-slate-900/95 text-white shadow-xl rounded-lg p-3 border border-slate-800 flex items-center justify-between gap-3 text-sm animate-in fade-in slide-in-from-bottom-3 duration-200"
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              {isWarning && <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />}
              {!isSuccess && !isWarning && <Info className="w-4 h-4 text-blue-400 shrink-0" />}
              <span className="font-medium truncate">{toast.message}</span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {toast.undoActionId && (
                <button
                  onClick={() => {
                    onUndo(toast.undoActionId!);
                    onDismiss(toast.id);
                  }}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>되돌리기</span>
                </button>
              )}
              <button
                onClick={() => onDismiss(toast.id)}
                className="text-slate-400 hover:text-white p-0.5 rounded transition-colors cursor-pointer"
                aria-label="닫기"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
