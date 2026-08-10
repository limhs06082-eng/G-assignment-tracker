import React, { useState, useMemo } from 'react';
import { Assignment, AssignmentStatus, AssignmentTemplate, ClassGroup, Submission } from '../types';
import {
  FolderKanban,
  Plus,
  Edit2,
  Copy,
  Trash2,
  Calendar,
  Users,
  Check,
  X,
  FileText,
  Clock,
  AlertTriangle,
  Search,
  ArrowUpDown,
  Sparkles,
  FileCode2,
} from 'lucide-react';

interface AssignmentManagementProps {
  assignments: Assignment[];
  classes: ClassGroup[];
  submissions: Submission[];
  templates?: AssignmentTemplate[];
  onCreateAssignment: (data: Omit<Assignment, 'id' | 'createdAt'>) => void;
  onUpdateAssignment: (id: string, data: Partial<Omit<Assignment, 'id' | 'createdAt'>>) => void;
  onDeleteAssignment: (id: string) => void;
  onDuplicateAssignment: (id: string) => void;
  onSaveAsTemplate?: (data: { title: string; assignmentTitle: string; description: string; dueRule: any }) => void;
  isOpenModalImmediately?: boolean;
  onCloseModalImmediately?: () => void;
}

export const AssignmentManagement: React.FC<AssignmentManagementProps> = ({
  assignments,
  classes,
  submissions,
  templates = [],
  onCreateAssignment,
  onUpdateAssignment,
  onDeleteAssignment,
  onDuplicateAssignment,
  onSaveAsTemplate,
  isOpenModalImmediately = false,
  onCloseModalImmediately,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(isOpenModalImmediately);
  const [isTemplatePickerOpen, setIsTemplatePickerOpen] = useState(false);

  // Filter & Search & Sort states
  const [statusFilter, setStatusFilter] = useState<AssignmentStatus | 'all'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'updated' | 'dueDate' | 'title' | 'createdAt'>('updated');

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<AssignmentStatus>('active');
  const [targetClassIds, setTargetClassIds] = useState<string[]>(['all']);

  const openCreateModal = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setDueDate('');
    setStatus('active');
    setTargetClassIds(['all']);
    setIsModalOpen(true);
  };

  const applyTemplate = (tmpl: AssignmentTemplate) => {
    setEditingId(null);
    setTitle(tmpl.assignmentTitle);
    setDescription(tmpl.description);
    setTargetClassIds(tmpl.targetClassIds || ['all']);
    setStatus('active');

    // Compute due date based on rule
    const today = new Date();
    if (tmpl.dueRule === 'plus1') {
      today.setDate(today.getDate() + 1);
      setDueDate(today.toISOString().split('T')[0]);
    } else if (tmpl.dueRule === 'plus3') {
      today.setDate(today.getDate() + 3);
      setDueDate(today.toISOString().split('T')[0]);
    } else if (tmpl.dueRule === 'plus7') {
      today.setDate(today.getDate() + 7);
      setDueDate(today.toISOString().split('T')[0]);
    } else if (tmpl.dueRule === 'custom' && tmpl.customDueDays) {
      today.setDate(today.getDate() + tmpl.customDueDays);
      setDueDate(today.toISOString().split('T')[0]);
    } else {
      setDueDate('');
    }

    setIsTemplatePickerOpen(false);
    setIsModalOpen(true);
  };

  const openEditModal = (assignment: Assignment) => {
    setEditingId(assignment.id);
    setTitle(assignment.title);
    setDescription(assignment.description);
    setDueDate(assignment.dueDate || '');
    setStatus(assignment.status || 'active');
    setTargetClassIds(assignment.targetClassIds);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    if (onCloseModalImmediately) {
      onCloseModalImmediately();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingId) {
      onUpdateAssignment(editingId, {
        title: title.trim(),
        description: description.trim(),
        dueDate,
        status,
        targetClassIds,
      });
    } else {
      onCreateAssignment({
        title: title.trim(),
        description: description.trim(),
        dueDate,
        status,
        targetClassIds,
      });
    }

    closeModal();
  };

  const handleDelete = (assignment: Assignment) => {
    const linkedSubmissions = submissions.filter((s) => s.assignmentId === assignment.id);
    const msg = linkedSubmissions.length > 0
      ? `'${assignment.title}' 과제를 삭제하시겠습니까?\n기록된 제출 현황 ${linkedSubmissions.length}건도 함께 삭제됩니다.`
      : `'${assignment.title}' 과제를 삭제하시겠습니까?`;

    if (confirm(msg)) {
      onDeleteAssignment(assignment.id);
    }
  };

  // Filtered & Sorted assignments
  const filteredAssignments = useMemo(() => {
    let result = assignments;

    if (statusFilter !== 'all') {
      result = result.filter((a) => (a.status || 'active') === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((a) => a.title.toLowerCase().includes(q));
    }

    return [...result].sort((a, b) => {
      if (sortOrder === 'dueDate') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      }
      if (sortOrder === 'title') {
        return a.title.localeCompare(b.title);
      }
      if (sortOrder === 'createdAt') {
        return b.createdAt.localeCompare(a.createdAt);
      }
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [assignments, statusFilter, searchQuery, sortOrder]);

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">과제 목록 및 등록 관리</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            진행 중, 마감, 보관 과제를 분류하고 제출 기한을 수정합니다.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {templates.length > 0 && (
            <button
              onClick={() => setIsTemplatePickerOpen(true)}
              className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <FileCode2 className="w-4 h-4 text-indigo-600" />
              <span>템플릿에서 생성</span>
            </button>
          )}

          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>새 과제 추가하기</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search / Sort Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {(['active', 'closed', 'archived', 'all'] as const).map((st) => {
            const labels = {
              active: '진행 중',
              closed: '마감됨',
              archived: '보관됨',
              all: '전체',
            };

            const count = st === 'all'
              ? assignments.length
              : assignments.filter((a) => (a.status || 'active') === st).length;

            const isActive = statusFilter === st;

            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{labels[st]}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Sort controls */}
        <div className="flex items-center gap-2">
          {/* Sort Selector */}
          <div className="relative">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="pl-2.5 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="updated">최근 수정순</option>
              <option value="dueDate">제출 기한순</option>
              <option value="createdAt">생성일순</option>
              <option value="title">과제명순</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="과제명 검색..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>
        </div>
      </div>

      {/* Assignment List Grid */}
      {filteredAssignments.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
          <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">해당 조건의 과제가 없습니다.</p>
          <button
            onClick={openCreateModal}
            className="mt-3 px-4 py-2 bg-blue-600 text-white font-semibold text-xs rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            과제 추가하기
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAssignments.map((assignment) => {
            const currentStatus = assignment.status || 'active';
            const isOverdue = assignment.dueDate && assignment.dueDate < todayStr;
            const targetClassesNames = assignment.targetClassIds.includes('all')
              ? '전체 반'
              : classes
                  .filter((c) => assignment.targetClassIds.includes(c.id))
                  .map((c) => c.name)
                  .join(', ') || '지정 반';

            return (
              <div
                key={assignment.id}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:border-blue-300 transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        {currentStatus === 'active' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">
                            진행 중
                          </span>
                        )}
                        {currentStatus === 'closed' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                            마감됨
                          </span>
                        )}
                        {currentStatus === 'archived' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-50 text-purple-700 rounded border border-purple-200">
                            보관됨
                          </span>
                        )}
                        <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                          {targetClassesNames}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 leading-snug">
                        {assignment.title}
                      </h3>
                    </div>

                    {/* Quick Status Toggle Dropdown */}
                    <select
                      value={currentStatus}
                      onChange={(e) =>
                        onUpdateAssignment(assignment.id, { status: e.target.value as AssignmentStatus })
                      }
                      className="text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200 rounded px-2 py-1 focus:outline-none cursor-pointer"
                    >
                      <option value="active">진행 중</option>
                      <option value="closed">마감</option>
                      <option value="archived">보관</option>
                    </select>
                  </div>

                  {assignment.description && (
                    <p className="text-xs text-slate-600 line-clamp-2">
                      {assignment.description}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      제출 기한:{' '}
                      <strong className={isOverdue ? 'text-rose-600' : 'text-slate-800'}>
                        {assignment.dueDate || '없음'}
                      </strong>
                    </span>
                    {isOverdue && (
                      <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-1.5 py-0.2 rounded flex items-center gap-0.5">
                        <AlertTriangle className="w-3 h-3" />
                        기한 초과
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="text-[11px] text-slate-400">
                    생성: {new Date(assignment.createdAt).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onDuplicateAssignment(assignment.id)}
                      className="px-2.5 py-1 text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                      title="동일한 내용으로 복제"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>복제</span>
                    </button>
                    <button
                      onClick={() => openEditModal(assignment)}
                      className="px-2.5 py-1 text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>수정</span>
                    </button>
                    <button
                      onClick={() => handleDelete(assignment)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                      title="과제 삭제"
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

      {/* Template Picker Modal */}
      {isTemplatePickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <FileCode2 className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">템플릿 선택</h3>
              </div>
              <button
                onClick={() => setIsTemplatePickerOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto text-xs">
              {templates.length === 0 ? (
                <p className="text-center text-slate-500 py-6">저장된 템플릿이 없습니다.</p>
              ) : (
                templates.map((tmpl) => (
                  <div
                    key={tmpl.id}
                    onClick={() => applyTemplate(tmpl)}
                    className="p-3 border border-slate-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50/50 cursor-pointer transition-all space-y-1"
                  >
                    <div className="font-bold text-slate-900 text-sm">{tmpl.title}</div>
                    <div className="text-xs text-slate-600 font-semibold">
                      과제명: {tmpl.assignmentTitle}
                    </div>
                    {tmpl.description && (
                      <p className="text-[11px] text-slate-500 line-clamp-1">{tmpl.description}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">
                {editingId ? '과제 정보 수정' : '새 과제 추가'}
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
                  과제명 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: 독서 감상문, 수학 학습지 3쪽"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  설명 및 제출 안내 (선택)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="학생들이 확인해야 할 세부 지시 사항이나 준비물을 적으세요."
                  rows={3}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    제출 기한 (선택)
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    과제 상태
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as AssignmentStatus)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold bg-white cursor-pointer"
                  >
                    <option value="active">진행 중</option>
                    <option value="closed">마감</option>
                    <option value="archived">보관</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    대상 학급(반)
                  </label>
                  <select
                    value={targetClassIds[0] || 'all'}
                    onChange={(e) => setTargetClassIds([e.target.value])}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold bg-white cursor-pointer"
                  >
                    <option value="all">전체 반</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                {onSaveAsTemplate && title.trim() ? (
                  <button
                    type="button"
                    onClick={() => {
                      onSaveAsTemplate({
                        title: `${title.trim()} 템플릿`,
                        assignmentTitle: title.trim(),
                        description: description.trim(),
                        dueRule: 'plus7',
                      });
                      alert(`'${title.trim()}' 템플릿으로 저장되었습니다.`);
                    }}
                    className="text-indigo-600 hover:text-indigo-800 font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <FileCode2 className="w-3.5 h-3.5" />
                    <span>템플릿으로 저장</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
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
                    {editingId ? '수정 완료' : '과제 등록'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
