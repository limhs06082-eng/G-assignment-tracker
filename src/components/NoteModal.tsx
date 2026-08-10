import React, { useState, useEffect } from 'react';
import { X, Save, MessageSquareText } from 'lucide-react';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  assignmentTitle: string;
  initialNote: string;
  onSave: (note: string) => void;
}

export const NoteModal: React.FC<NoteModalProps> = ({
  isOpen,
  onClose,
  studentName,
  assignmentTitle,
  initialNote,
  onSave,
}) => {
  const [note, setNote] = useState(initialNote);

  useEffect(() => {
    setNote(initialNote);
  }, [initialNote, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(note);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2 text-slate-800 font-semibold text-base">
            <MessageSquareText className="w-5 h-5 text-indigo-600" />
            <span>보완 메모 작성</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200/70 text-sm">
            <div className="text-slate-500 text-xs font-medium">과제: <span className="text-slate-800 font-semibold">{assignmentTitle}</span></div>
            <div className="text-slate-500 text-xs font-medium mt-1">학생: <span className="text-indigo-700 font-bold">{studentName}</span></div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              보완 요청 내용 또는 메모
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="예: 사진 화질이 흐림, 2쪽 문제 풀이 누락 등 보완할 점을 적어주세요."
              rows={4}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-400"
              autoFocus
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3.5 bg-slate-50 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Save className="w-4 h-4" />
            저장하기
          </button>
        </div>
      </div>
    </div>
  );
};
