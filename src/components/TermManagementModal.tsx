import React, { useState } from 'react';
import { Term, TermStatus } from '../types';
import { Calendar, Plus, Archive, RotateCcw, X, Check, Copy, AlertCircle } from 'lucide-react';

interface TermManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  terms: Term[];
  selectedTermId: string;
  onSelectTerm: (termId: string) => void;
  onCreateTerm: (
    schoolYear: string,
    semester: string,
    copyRoster: boolean
  ) => void;
  onUpdateTermStatus: (termId: string, status: TermStatus) => void;
  onDeleteTerm: (termId: string) => void;
}

export const TermManagementModal: React.FC<TermManagementModalProps> = ({
  isOpen,
  onClose,
  terms,
  selectedTermId,
  onSelectTerm,
  onCreateTerm,
  onUpdateTermStatus,
  onDeleteTerm,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [schoolYear, setSchoolYear] = useState('2027');
  const [semester, setSemester] = useState('1학기');
  const [copyRoster, setCopyRoster] = useState(true);

  if (!isOpen) return null;

  const handleSubmitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolYear.trim() || !semester.trim()) return;

    onCreateTerm(schoolYear.trim(), semester.trim(), copyRoster);
    setIsCreating(false);
    // Reset form for next time
    const nextYear = (parseInt(schoolYear, 10) || 2026) + 1;
    setSchoolYear(String(nextYear));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">학년도·학기 관리</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-6 max-h-[80vh] overflow-y-auto text-xs">
          {/* Create Term Trigger / Form */}
          {!isCreating ? (
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div>
                <h4 className="font-bold text-blue-900 text-sm">새로운 학기 추가하기</h4>
                <p className="text-blue-700 text-xs mt-0.5">
                  새 학기를 생성하여 이전 과제 기록과 분리하여 독립적으로 관리합니다.
                </p>
              </div>
              <button
                onClick={() => setIsCreating(true)}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>새 학기 만들기</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitCreate} className="bg-slate-50 border border-slate-300 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h4 className="font-bold text-slate-900 text-sm">새 학기 등록 정보</h4>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-slate-500 hover:text-slate-700 font-semibold"
                >
                  취소
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    학년도 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={schoolYear}
                    onChange={(e) => setSchoolYear(e.target.value)}
                    placeholder="예: 2027"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    학기 <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="1학기">1학기</option>
                    <option value="2학기">2학기</option>
                    <option value="여름방학">여름방학</option>
                    <option value="겨울방학">겨울방학</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  학생 명단 초기 설정
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-slate-200 cursor-pointer">
                    <input
                      type="radio"
                      name="copyRoster"
                      checked={copyRoster}
                      onChange={() => setCopyRoster(true)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="font-bold text-slate-800">현재 학기 학생 명단 복사</span>
                      <p className="text-[11px] text-slate-500">
                        기존 반 및 학생 번호/이름 명단을 새 학기로 복사하여 바로 시작합니다. (과제 및 제출 기록은 복사되지 않음)
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-slate-200 cursor-pointer">
                    <input
                      type="radio"
                      name="copyRoster"
                      checked={!copyRoster}
                      onChange={() => setCopyRoster(false)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="font-bold text-slate-800">빈 명단으로 시작</span>
                      <p className="text-[11px] text-slate-500">
                        학생과 반이 없는 상태에서 새롭게 반과 학생 명단을 등록합니다.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3.5 py-1.5 text-slate-600 bg-white border border-slate-300 rounded-lg font-semibold hover:bg-slate-100"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-2xs"
                >
                  새 학기 생성
                </button>
              </div>
            </form>
          )}

          {/* Terms List */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 text-xs flex items-center justify-between">
              <span>등록된 학기 목록 ({terms.length}개)</span>
              <span className="text-[11px] text-slate-500 font-normal">
                클릭 시 해당 학기로 전환됩니다.
              </span>
            </h4>

            <div className="space-y-2">
              {terms.map((term) => {
                const isSelected = term.id === selectedTermId;
                const isArchived = term.status === 'archived';

                return (
                  <div
                    key={term.id}
                    className={`border rounded-xl p-3.5 transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-500/20 shadow-2xs'
                        : isArchived
                        ? 'bg-slate-50 border-slate-200 opacity-80'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => onSelectTerm(term.id)}
                        className="text-left cursor-pointer group"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {term.name}
                          </span>
                          {isSelected && (
                            <span className="px-2 py-0.5 text-[10px] bg-blue-600 text-white font-bold rounded-full">
                              현재 선택됨
                            </span>
                          )}
                          {isArchived ? (
                            <span className="px-2 py-0.5 text-[10px] bg-amber-100 text-amber-800 border border-amber-300 font-bold rounded-full flex items-center gap-1">
                              <Archive className="w-3 h-3" />
                              보관됨 (읽기 전용)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold rounded-full">
                              사용 중
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          생성일: {new Date(term.createdAt).toLocaleDateString()}
                        </p>
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      {isArchived ? (
                        <button
                          type="button"
                          onClick={() => onUpdateTermStatus(term.id, 'active')}
                          className="px-2.5 py-1 text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="다시 활성화"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                          <span>다시 활성화</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onUpdateTermStatus(term.id, 'archived')}
                          className="px-2.5 py-1 text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="보관하기 (읽기 전용으로 설정)"
                        >
                          <Archive className="w-3.5 h-3.5 text-amber-700" />
                          <span>보관하기</span>
                        </button>
                      )}

                      {terms.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              confirm(
                                `'${term.name}' 학기를 삭제하시겠습니까?\n해당 학기의 반, 과제, 제출 상태 정보가 모두 삭제됩니다.`
                              )
                            ) {
                              onDeleteTerm(term.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          title="학기 삭제"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end px-5 py-3 border-t border-slate-100 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
