import React, { useState } from 'react';
import { ClassGroup } from '../types';
import { parseStudentsCSV, ParsedStudentRow } from '../utils/storage';
import { FileSpreadsheet, Upload, AlertCircle, X, Check, Users } from 'lucide-react';

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: ClassGroup[];
  selectedClassId: string;
  onConfirmImport: (targetClassId: string, parsedRows: ParsedStudentRow[]) => void;
}

export const CSVImportModal: React.FC<CSVImportModalProps> = ({
  isOpen,
  onClose,
  classes,
  selectedClassId,
  onConfirmImport,
}) => {
  const [csvText, setCsvText] = useState('');
  const [targetClassId, setTargetClassId] = useState<string>(() => {
    return selectedClassId && selectedClassId !== 'all' ? selectedClassId : classes[0]?.id || '';
  });
  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setCsvText(content);
        handlePreview(content);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  // Preview CSV parsing
  const handlePreview = (textToParse: string = csvText) => {
    setErrorMsg(null);
    if (!textToParse.trim()) {
      setErrorMsg('CSV 파일이 비어있거나 텍스트를 입력하지 않았습니다.');
      return;
    }

    const rows = parseStudentsCSV(textToParse);
    if (rows.length === 0) {
      setErrorMsg('올바른 학생 명단 형식을 찾을 수 없습니다. (형식: 번호,이름 또는 반,번호,이름)');
      return;
    }

    setParsedRows(rows);
  };

  const handleConfirm = () => {
    if (!parsedRows || parsedRows.length === 0) return;
    if (!targetClassId) {
      setErrorMsg('학생을 추가할 반을 선택해 주세요.');
      return;
    }

    onConfirmImport(targetClassId, parsedRows);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900">CSV 학생 명단 불러오기</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {/* Target Class Selector */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              학생을 등록할 학급(반) 선택
            </label>
            <select
              value={targetClassId}
              onChange={(e) => setTargetClassId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold bg-white"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {!parsedRows ? (
            /* Upload & Paste Form */
            <div className="space-y-3">
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-emerald-500 bg-slate-50/50 transition-colors">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700 mb-1">
                  CSV 파일 업로드
                </p>
                <p className="text-[11px] text-slate-400 mb-3">
                  지원 형식: <code className="bg-white px-1 py-0.5 rounded border">번호,이름</code> 또는 <code className="bg-white px-1 py-0.5 rounded border">반,번호,이름</code>
                </p>
                <label className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg cursor-pointer transition-colors inline-block text-xs">
                  파일 선택
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  또는 CSV 텍스트 직접 붙여넣기
                </label>
                <textarea
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder={`번호,이름\n1,김민준\n2,이서연\n3,박지우`}
                  rows={4}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              {errorMsg && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => handlePreview()}
                  className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  미리보기 확인
                </button>
              </div>
            </div>
          ) : (
            /* Preview Step */
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-700" />
                  <span className="font-bold text-emerald-900">
                    총 {parsedRows.length}명의 학생을 불러옵니다.
                  </span>
                </div>
                <button
                  onClick={() => setParsedRows(null)}
                  className="text-xs text-emerald-700 underline font-medium hover:text-emerald-950"
                >
                  다시 입력
                </button>
              </div>

              <div className="border border-slate-200 rounded-lg max-h-56 overflow-y-auto divide-y divide-slate-100 bg-white">
                {parsedRows.map((row, idx) => (
                  <div key={idx} className="p-2 flex items-center justify-between text-xs px-3">
                    <span className="font-semibold text-slate-500">{row.number}번</span>
                    <span className="font-bold text-slate-900">{row.name}</span>
                    {row.className && (
                      <span className="text-[10px] text-slate-400">({row.className})</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-[11px]">
                💡 [불러오기] 버튼을 누르면 선택한 반에 학생 명단이 등록됩니다.
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3.5 bg-slate-50 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
          >
            취소
          </button>
          {parsedRows && (
            <button
              type="button"
              onClick={handleConfirm}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-2xs flex items-center gap-1"
            >
              <Check className="w-4 h-4" />
              불러오기 완료
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
