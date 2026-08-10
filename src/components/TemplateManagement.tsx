import React, { useState } from 'react';
import { AssignmentTemplate, ClassGroup, DueRuleType } from '../types';
import {
  FileCode2,
  Plus,
  Edit2,
  Copy,
  Trash2,
  Clock,
  X,
  Check,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface TemplateManagementProps {
  templates: AssignmentTemplate[];
  classes: ClassGroup[];
  onCreateTemplate: (data: Omit<AssignmentTemplate, 'id' | 'createdAt'>) => void;
  onUpdateTemplate: (id: string, data: Partial<Omit<AssignmentTemplate, 'id' | 'createdAt'>>) => void;
  onDeleteTemplate: (id: string) => void;
  onDuplicateTemplate: (id: string) => void;
}

export const TemplateManagement: React.FC<TemplateManagementProps> = ({
  templates,
  classes,
  onCreateTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
  onDuplicateTemplate,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetClassIds, setTargetClassIds] = useState<string[]>(['all']);
  const [dueRule, setDueRule] = useState<DueRuleType>('plus7');
  const [customDueDays, setCustomDueDays] = useState<number>(3);

  const openCreateModal = () => {
    setEditingId(null);
    setTitle('');
    setAssignmentTitle('');
    setDescription('');
    setTargetClassIds(['all']);
    setDueRule('plus7');
    setCustomDueDays(3);
    setIsModalOpen(true);
  };

  const openEditModal = (tmpl: AssignmentTemplate) => {
    setEditingId(tmpl.id);
    setTitle(tmpl.title);
    setAssignmentTitle(tmpl.assignmentTitle);
    setDescription(tmpl.description);
    setTargetClassIds(tmpl.targetClassIds || ['all']);
    setDueRule(tmpl.dueRule || 'plus7');
    setCustomDueDays(tmpl.customDueDays || 3);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !assignmentTitle.trim()) return;

    if (editingId) {
      onUpdateTemplate(editingId, {
        title: title.trim(),
        assignmentTitle: assignmentTitle.trim(),
        description: description.trim(),
        targetClassIds,
        dueRule,
        customDueDays: dueRule === 'custom' ? customDueDays : undefined,
      });
    } else {
      onCreateTemplate({
        title: title.trim(),
        assignmentTitle: assignmentTitle.trim(),
        description: description.trim(),
        targetClassIds,
        dueRule,
        customDueDays: dueRule === 'custom' ? customDueDays : undefined,
      });
    }

    closeModal();
  };

  const dueRuleLabels: Record<DueRuleType, string> = {
    none: '기한 없음',
    plus1: '생성일 + 1일',
    plus3: '생성일 + 3일',
    plus7: '생성일 + 7일',
    custom: `생성일 + N일`,
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <FileCode2 className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">과제 템플릿 관리</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            반복적으로 등록하는 과제 양식을 미리 저장해두고 학기 구분 없이 재사용하세요.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>새 템플릿 등록하기</span>
        </button>
      </div>

      {/* Templates List */}
      {templates.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
          <Sparkles className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">등록된 과제 템플릿이 없습니다.</p>
          <p className="text-xs text-slate-500 mt-1">
            주간 독서록, 수학 복습, 받아쓰기 등 자주 제출받는 과제를 템플릿으로 만들어 보세요.
          </p>
          <button
            onClick={openCreateModal}
            className="mt-4 px-4 py-2 bg-blue-600 text-white font-semibold text-xs rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            첫 템플릿 만들기
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((tmpl) => {
            const ruleText =
              tmpl.dueRule === 'custom'
                ? `생성일 + ${tmpl.customDueDays || 1}일`
                : dueRuleLabels[tmpl.dueRule || 'none'];

            return (
              <div
                key={tmpl.id}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:border-blue-300 transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">
                          템플릿
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {ruleText}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 leading-snug">
                        {tmpl.title}
                      </h3>
                      <p className="text-xs font-semibold text-slate-600">
                        과제명: {tmpl.assignmentTitle}
                      </p>
                    </div>
                  </div>

                  {tmpl.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      {tmpl.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="text-[11px] text-slate-400">
                    생성: {new Date(tmpl.createdAt).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onDuplicateTemplate(tmpl.id)}
                      className="px-2.5 py-1 text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                      title="복제"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>복제</span>
                    </button>
                    <button
                      onClick={() => openEditModal(tmpl)}
                      className="px-2.5 py-1 text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>수정</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`'${tmpl.title}' 템플릿을 삭제하시겠습니까?`)) {
                          onDeleteTemplate(tmpl.id);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                      title="삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">
                {editingId ? '템플릿 정보 수정' : '새 과제 템플릿 등록'}
              </h3>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  템플릿 명칭 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: 주간 독서 감상문 템플릿"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  생성될 실제 과제 제목 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={assignmentTitle}
                  onChange={(e) => setAssignmentTitle(e.target.value)}
                  placeholder="예: 독서 감상문"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  설명 및 제출 안내 (선택)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="학생들이 확인해야 할 세부 지시 사항을 적으세요."
                  rows={3}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    기본 제출기한 규칙
                  </label>
                  <select
                    value={dueRule}
                    onChange={(e) => setDueRule(e.target.value as DueRuleType)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold bg-white cursor-pointer"
                  >
                    <option value="none">기한 없음</option>
                    <option value="plus1">생성일 기준 +1일</option>
                    <option value="plus3">생성일 기준 +3일</option>
                    <option value="plus7">생성일 기준 +7일</option>
                    <option value="custom">직접 지정 (N일 후)</option>
                  </select>
                </div>

                {dueRule === 'custom' && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      지정 일수 (생성일 기준)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={customDueDays}
                      onChange={(e) => setCustomDueDays(parseInt(e.target.value, 10) || 1)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-2xs cursor-pointer"
                >
                  {editingId ? '수정 완료' : '템플릿 저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
