import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Assignment, AssignmentStatus, ClassGroup, Student, Submission, SubmissionStatus } from '../types';
import { STATUS_CONFIG, STATUS_LIST, getNextStatus } from '../utils/statusConfig';
import { exportToCSV } from '../utils/storage';
import { NoteModal } from './NoteModal';
import {
  CheckSquare,
  Search,
  Printer,
  Download,
  CheckCircle2,
  AlertCircle,
  MessageSquareText,
  Clock,
  AlertTriangle,
  ChevronDown,
  Check,
  Zap,
  Copy,
  Keyboard,
  Filter,
  ArrowUpDown,
  RotateCcw,
  LayoutGrid,
  List,
} from 'lucide-react';

interface AssignmentViewProps {
  classes: ClassGroup[];
  students: Student[];
  assignments: Assignment[];
  submissions: Submission[];
  selectedClassId: string;
  initialAssignmentId?: string;
  initialFilterStatus?: SubmissionStatus | 'all';
  onUpdateSubmissionStatus: (assignmentId: string, studentId: string, status: SubmissionStatus, note?: string) => void;
  onBatchUpdateStatus: (assignmentId: string, studentIds: string[], status: SubmissionStatus) => void;
  onOpenPrintModal: (assignment: Assignment, students: Student[], submissions: Submission[]) => void;
  onCreateAssignmentModalOpen: () => void;
  onUpdateAssignmentStatus?: (assignmentId: string, status: AssignmentStatus) => void;
  onShowToast?: (message: string) => void;
}

export const AssignmentView: React.FC<AssignmentViewProps> = ({
  classes,
  students,
  assignments,
  submissions,
  selectedClassId,
  initialAssignmentId,
  initialFilterStatus = 'all',
  onUpdateSubmissionStatus,
  onBatchUpdateStatus,
  onOpenPrintModal,
  onCreateAssignmentModalOpen,
  onUpdateAssignmentStatus,
  onShowToast,
}) => {
  // Submission Check Mode state
  const [isCheckMode, setIsCheckMode] = useState(false);

  // Student list display mode ('grid' for 2 columns, 'table' for traditional table)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Assignment list filter tab ('active' | 'closed' | 'archived' | 'all')
  const [assignmentStatusFilter, setAssignmentStatusFilter] = useState<AssignmentStatus | 'all'>('active');

  // Assignment sort order ('updated' | 'dueDate' | 'title' | 'createdAt')
  const [assignmentSortOrder, setAssignmentSortOrder] = useState<'updated' | 'dueDate' | 'title' | 'createdAt'>('updated');

  // Assignment search query
  const [assignmentSearchQuery, setAssignmentSearchQuery] = useState('');

  // Filter assignments for selected class
  const classAssignments = useMemo(() => {
    if (!selectedClassId || selectedClassId === 'all') return assignments;
    return assignments.filter(
      (a) => a.targetClassIds.includes('all') || a.targetClassIds.includes(selectedClassId)
    );
  }, [assignments, selectedClassId]);

  // Filtered & Sorted available assignments
  const availableAssignments = useMemo(() => {
    let result = classAssignments;

    // Filter by assignment status
    if (assignmentStatusFilter !== 'all') {
      result = result.filter((a) => (a.status || 'active') === assignmentStatusFilter);
    }

    // Filter by search query
    if (assignmentSearchQuery.trim()) {
      const q = assignmentSearchQuery.trim().toLowerCase();
      result = result.filter((a) => a.title.toLowerCase().includes(q));
    }

    // Sort
    return [...result].sort((a, b) => {
      if (assignmentSortOrder === 'dueDate') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      }
      if (assignmentSortOrder === 'title') {
        return a.title.localeCompare(b.title);
      }
      if (assignmentSortOrder === 'createdAt') {
        return b.createdAt.localeCompare(a.createdAt);
      }
      // Default: 'updated' (most recently updated assignment based on submission timestamp or creation)
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [classAssignments, assignmentStatusFilter, assignmentSearchQuery, assignmentSortOrder]);

  // Active assignment state
  const [activeAssignmentId, setActiveAssignmentId] = useState<string>(() => {
    if (initialAssignmentId && classAssignments.some((a) => a.id === initialAssignmentId)) {
      return initialAssignmentId;
    }
    return classAssignments.length > 0 ? classAssignments[0].id : '';
  });

  // Ensure activeAssignmentId points to a valid assignment
  const activeAssignment = useMemo(() => {
    const found = classAssignments.find((a) => a.id === activeAssignmentId);
    if (found) return found;
    return availableAssignments.length > 0 ? availableAssignments[0] : (classAssignments[0] || null);
  }, [classAssignments, availableAssignments, activeAssignmentId]);

  // Filter tab state for student submissions ('all' | 'unsubmitted' | 'submitted' | 'supplement' | 'completed')
  const [filterStatus, setFilterStatus] = useState<SubmissionStatus | 'all'>(initialFilterStatus);

  // Student Search query state
  const [searchQuery, setSearchQuery] = useState('');

  // Selected student IDs for batch actions
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Keyboard navigation focused student index
  const [focusedStudentIndex, setFocusedStudentIndex] = useState<number | null>(null);

  // Local Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    if (onShowToast) {
      onShowToast(msg);
    } else {
      setToastMessage(msg);
      setTimeout(() => {
        setToastMessage(null);
      }, 3000);
    }
  };

  // Note Modal state
  const [noteModalState, setNoteModalState] = useState<{
    isOpen: boolean;
    studentId: string;
    studentName: string;
    initialNote: string;
  }>({
    isOpen: false,
    studentId: '',
    studentName: '',
    initialNote: '',
  });

  // Target Students for current class
  const classStudents = useMemo(() => {
    if (!selectedClassId || selectedClassId === 'all') return students;
    return students.filter((s) => s.classId === selectedClassId);
  }, [students, selectedClassId]);

  // Sorted students by number
  const sortedStudents = useMemo(() => {
    return [...classStudents].sort((a, b) => a.number - b.number);
  }, [classStudents]);

  // Map of studentId -> submission
  const submissionMap = useMemo(() => {
    if (!activeAssignment) return new Map<string, Submission>();
    const map = new Map<string, Submission>();
    submissions.forEach((sub) => {
      if (sub.assignmentId === activeAssignment.id) {
        map.set(sub.studentId, sub);
      }
    });
    return map;
  }, [submissions, activeAssignment]);

  // Counts by status for current assignment
  const statusCounts = useMemo(() => {
    const counts = {
      all: sortedStudents.length,
      unsubmitted: 0,
      submitted: 0,
      supplement: 0,
      completed: 0,
    };

    sortedStudents.forEach((stu) => {
      const sub = submissionMap.get(stu.id);
      const st: SubmissionStatus = sub ? sub.status : 'unsubmitted';
      counts[st]++;
    });

    return counts;
  }, [sortedStudents, submissionMap]);

  // Filtered student list by search & filterStatus
  const displayedStudents = useMemo(() => {
    return sortedStudents.filter((stu) => {
      const sub = submissionMap.get(stu.id);
      const st: SubmissionStatus = sub ? sub.status : 'unsubmitted';

      // Status filter
      if (filterStatus !== 'all' && st !== filterStatus) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesName = stu.name.toLowerCase().includes(q);
        const matchesNum = stu.number.toString().includes(q);
        return matchesName || matchesNum;
      }

      return true;
    });
  }, [sortedStudents, submissionMap, filterStatus, searchQuery]);

  // Keyboard shortcut listener for fast 1-click status updates
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is inside an input, textarea, or select
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT' ||
          activeEl.getAttribute('contenteditable') === 'true')
      ) {
        return;
      }

      if (focusedStudentIndex === null || focusedStudentIndex < 0 || focusedStudentIndex >= displayedStudents.length) {
        return;
      }

      const targetStudent = displayedStudents[focusedStudentIndex];
      if (!targetStudent || !activeAssignment) return;

      if (e.key === '1') {
        e.preventDefault();
        onUpdateSubmissionStatus(activeAssignment.id, targetStudent.id, 'unsubmitted');
        triggerToast(`${targetStudent.name} → 미제출`);
      } else if (e.key === '2') {
        e.preventDefault();
        onUpdateSubmissionStatus(activeAssignment.id, targetStudent.id, 'submitted');
        triggerToast(`${targetStudent.name} → 제출`);
      } else if (e.key === '3') {
        e.preventDefault();
        onUpdateSubmissionStatus(activeAssignment.id, targetStudent.id, 'supplement');
        triggerToast(`${targetStudent.name} → 보완`);
      } else if (e.key === '4') {
        e.preventDefault();
        onUpdateSubmissionStatus(activeAssignment.id, targetStudent.id, 'completed');
        triggerToast(`${targetStudent.name} → 완료`);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedStudentIndex((prev) => (prev !== null && prev < displayedStudents.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedStudentIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedStudentIndex, displayedStudents, activeAssignment, onUpdateSubmissionStatus]);

  // Submission Check Mode student click handler
  const handleStudentRowClickInCheckMode = (student: Student) => {
    if (!activeAssignment) return;
    const sub = submissionMap.get(student.id);
    const currentStatus = sub ? sub.status : 'unsubmitted';

    if (currentStatus === 'unsubmitted') {
      onUpdateSubmissionStatus(activeAssignment.id, student.id, 'submitted');
      triggerToast(`${student.name} → 제출`);
    } else if (currentStatus === 'submitted' || currentStatus === 'completed') {
      triggerToast(`${student.name}님은 이미 [${STATUS_CONFIG[currentStatus].label}] 상태입니다.`);
    } else if (currentStatus === 'supplement') {
      triggerToast(`${student.name}님은 보완 필요 상태입니다. 상태 버튼으로 직접 처리해주세요.`);
    }
  };

  // Checkbox handling
  const isAllSelected =
    displayedStudents.length > 0 &&
    displayedStudents.every((s) => selectedStudentIds.includes(s.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(displayedStudents.map((s) => s.id));
    }
  };

  const handleToggleSelectStudent = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  // Batch status update handler
  const handleApplyBatchStatus = (status: SubmissionStatus) => {
    if (!activeAssignment || selectedStudentIds.length === 0) return;
    onBatchUpdateStatus(activeAssignment.id, selectedStudentIds, status);
    const label = STATUS_CONFIG[status].label;
    triggerToast(`${selectedStudentIds.length}명의 상태가 [${label}](으)로 변경되었습니다.`);
    setSelectedStudentIds([]);
  };

  // Copy student lists (Unsubmitted & Supplement)
  const unsubmittedStudents = useMemo(() => {
    return sortedStudents.filter((s) => {
      const sub = submissionMap.get(s.id);
      return !sub || sub.status === 'unsubmitted';
    });
  }, [sortedStudents, submissionMap]);

  const supplementStudents = useMemo(() => {
    return sortedStudents.filter((s) => {
      const sub = submissionMap.get(s.id);
      return sub && sub.status === 'supplement';
    });
  }, [sortedStudents, submissionMap]);

  const handleCopyList = (list: Student[], mode: 'full' | 'numbers' | 'names', listName: string) => {
    if (list.length === 0) {
      triggerToast(`${listName} 학생이 없습니다.`);
      return;
    }

    let textToCopy = '';
    if (mode === 'full') {
      textToCopy = list.map((s) => `${s.number}번 ${s.name}`).join(', ');
    } else if (mode === 'numbers') {
      textToCopy = list.map((s) => s.number).join(', ');
    } else if (mode === 'names') {
      textToCopy = list.map((s) => s.name).join(', ');
    }

    navigator.clipboard.writeText(textToCopy).then(() => {
      triggerToast(`${listName} 명단 (${mode === 'full' ? '전체' : mode === 'numbers' ? '번호만' : '이름만'}) 복사되었습니다.`);
    });
  };

  // Export current assignment to CSV
  const handleExportCSV = () => {
    if (!activeAssignment) return;

    const headers = ['반', '번호', '이름', '과제명', '제출기한', '상태', '보완메모', '최종수정시각'];
    const rows = sortedStudents.map((stu) => {
      const sub = submissionMap.get(stu.id);
      const st: SubmissionStatus = sub ? sub.status : 'unsubmitted';
      const statusLabel = STATUS_CONFIG[st].label;
      const classObj = classes.find((c) => c.id === stu.classId);
      const className = classObj ? classObj.name : '';

      return [
        className,
        stu.number,
        stu.name,
        activeAssignment.title,
        activeAssignment.dueDate || '없음',
        statusLabel,
        sub?.note || '',
        sub?.updatedAt ? new Date(sub.updatedAt).toLocaleString() : '',
      ];
    });

    const filename = `${activeAssignment.title}_제출현황_${new Date().toISOString().split('T')[0]}.csv`;
    exportToCSV(filename, headers, rows);
    triggerToast('CSV 파일이 내려받아졌습니다.');
  };

  // Format short timestamp
  const formatShortTimestamp = (isoStr?: string) => {
    if (!isoStr) return '';
    try {
      const date = new Date(isoStr);
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      const hours = String(date.getHours()).padStart(2, '0');
      const mins = String(date.getMinutes()).padStart(2, '0');
      if (isToday) return `${hours}:${mins}`;
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${month}.${day} ${hours}:${mins}`;
    } catch {
      return '';
    }
  };

  // Overdue check
  const todayStr = new Date().toISOString().split('T')[0];
  const isAssignmentOverdue =
    activeAssignment?.dueDate && activeAssignment.dueDate < todayStr;

  if (classAssignments.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center max-w-xl mx-auto my-8">
        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
          <CheckSquare className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900 mb-1">
          현재 선택된 반에 등록된 과제가 없습니다.
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          새 과제를 등록하면 학생들의 제출 현황을 간편하게 관리할 수 있습니다.
        </p>
        <button
          onClick={onCreateAssignmentModalOpen}
          className="px-4 py-2 bg-blue-600 text-white font-semibold text-xs rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
        >
          <span>새 과제 등록하기</span>
        </button>
      </div>
    );
  }

  if (!activeAssignment) return null;

  return (
    <div className="space-y-4">
      {/* Toast Notification (if local) */}
      {toastMessage && !onShowToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-lg text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 duration-200 flex items-center gap-2 border border-slate-700">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Controls: Assignment Filters, Selector & Submission Check Mode Toggle */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs space-y-4">
        {/* Row 1: Assignment Filter Tabs & Check Mode Switch */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto">
            <span className="text-xs font-bold text-slate-500 mr-1.5 shrink-0">과제 분류:</span>
            {(['active', 'closed', 'archived', 'all'] as const).map((st) => {
              const labels = {
                active: '진행 중',
                closed: '마감됨',
                archived: '보관됨',
                all: '전체',
              };
              const isActive = assignmentStatusFilter === st;
              return (
                <button
                  key={st}
                  onClick={() => setAssignmentStatusFilter(st)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {labels[st]}
                </button>
              );
            })}
          </div>

          {/* Submission Check Mode Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCheckMode(!isCheckMode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                isCheckMode
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs ring-2 ring-emerald-300'
                  : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              <Zap className={`w-3.5 h-3.5 ${isCheckMode ? 'text-amber-300 fill-amber-300' : 'text-slate-500'}`} />
              <span>제출 체크 모드 {isCheckMode ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>

        {/* Row 2: Active Assignment Selection Dropdown & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <span className="text-xs font-bold text-slate-500 shrink-0">과제 선택:</span>
            <div className="relative flex-1 max-w-md">
              <select
                value={activeAssignment.id}
                onChange={(e) => {
                  setActiveAssignmentId(e.target.value);
                  setSelectedStudentIds([]);
                }}
                className="w-full bg-slate-50 text-slate-900 text-sm font-bold py-2 px-3 pr-8 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none shadow-2xs"
              >
                {availableAssignments.map((asg) => {
                  const statusTag = (asg.status || 'active') === 'closed' ? '[마감] ' : (asg.status || 'active') === 'archived' ? '[보관] ' : '';
                  return (
                    <option key={asg.id} value={asg.id}>
                      {statusTag}{asg.title} {asg.dueDate ? `(~${asg.dueDate})` : ''}
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Quick Assignment Status Change */}
            {onUpdateAssignmentStatus && (
              <select
                value={activeAssignment.status || 'active'}
                onChange={(e) =>
                  onUpdateAssignmentStatus(activeAssignment.id, e.target.value as AssignmentStatus)
                }
                className="bg-slate-100 text-slate-700 text-xs font-semibold py-2 px-2.5 rounded-lg border border-slate-300 focus:outline-none cursor-pointer"
                title="과제 상태 변경"
              >
                <option value="active">상태: 진행 중</option>
                <option value="closed">상태: 마감</option>
                <option value="archived">상태: 보관</option>
              </select>
            )}
          </div>

          {/* Actions: Print & Export CSV */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              onClick={() => onOpenPrintModal(activeAssignment, sortedStudents, Array.from(submissionMap.values()))}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 border border-slate-300 cursor-pointer"
              title="A4 인쇄용 서식 출력"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>현황표 인쇄</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 border border-slate-300 cursor-pointer"
              title="CSV 엑셀 파일 내보내기"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>CSV 내보내기</span>
            </button>
          </div>
        </div>

        {/* Active Assignment Info Header */}
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-extrabold text-slate-900">{activeAssignment.title}</h2>
              {activeAssignment.dueDate && (
                <span
                  className={`px-2 py-0.5 text-xs font-bold rounded ${
                    isAssignmentOverdue
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {isAssignmentOverdue ? `기한 초과 (${activeAssignment.dueDate})` : `~${activeAssignment.dueDate} 마감`}
                </span>
              )}
            </div>
            {activeAssignment.description && (
              <p className="text-xs text-slate-600">{activeAssignment.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0 text-xs font-semibold text-slate-600">
            <span>대상 학생: {sortedStudents.length}명</span>
          </div>
        </div>

        {/* Submission Check Mode Banner if active */}
        {isCheckMode && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg text-xs font-bold flex items-center justify-between animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-600 fill-emerald-600" />
              <span>[제출 체크 모드 활성화] 학생 이름을 한 번 누르면 바로 '제출' 처리됩니다.</span>
            </div>
            <button
              onClick={() => setIsCheckMode(false)}
              className="text-emerald-700 hover:underline text-xs cursor-pointer"
            >
              모드 끄기
            </button>
          </div>
        )}
      </div>

      {/* Roster Summary Card (Unsubmitted & Supplement Student Lists & Copy Buttons) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Unsubmitted List */}
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
                <span>미제출 ({unsubmittedStudents.length}명)</span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleCopyList(unsubmittedStudents, 'full', '미제출')}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>명단 복사</span>
                </button>
                <button
                  onClick={() => handleCopyList(unsubmittedStudents, 'numbers', '미제출')}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded border border-slate-200 transition-colors cursor-pointer"
                >
                  번호만
                </button>
                <button
                  onClick={() => handleCopyList(unsubmittedStudents, 'names', '미제출')}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded border border-slate-200 transition-colors cursor-pointer"
                >
                  이름만
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 line-clamp-2">
              {unsubmittedStudents.length > 0
                ? unsubmittedStudents.map((s) => `${s.number}번 ${s.name}`).join(', ')
                : '미제출 학생이 없습니다.'}
            </p>
          </div>

          {/* Supplement List */}
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-orange-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-orange-600" />
                <span>보완 필요 ({supplementStudents.length}명)</span>
              </span>
              {supplementStudents.length > 0 && (
                <button
                  onClick={() => handleCopyList(supplementStudents, 'full', '보완')}
                  className="px-2 py-0.5 bg-orange-50 hover:bg-orange-100 text-orange-800 text-[11px] font-semibold rounded border border-orange-200 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>보완 명단 복사</span>
                </button>
              )}
            </div>
            <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 line-clamp-2">
              {supplementStudents.length > 0
                ? supplementStudents.map((s) => `${s.number}번 ${s.name}`).join(', ')
                : '보완 학생이 없습니다.'}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Submission Status Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            전체 ({statusCounts.all})
          </button>

          {STATUS_LIST.map((st) => {
            const config = STATUS_CONFIG[st];
            const isActive = filterStatus === st;
            const count = statusCounts[st];

            return (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{config.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Student Search Box */}
        <div className="relative w-full md:w-56">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="학생 이름 또는 번호 검색..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Batch Actions Bar (Shows when checkboxes checked) */}
      {selectedStudentIds.length > 0 && (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-md flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-150 border border-slate-700">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold">{selectedStudentIds.length}명 선택됨</span>
            <button
              onClick={() => setSelectedStudentIds([])}
              className="text-xs text-slate-300 underline hover:text-white ml-2 cursor-pointer"
            >
              선택 해제
            </button>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-slate-300 mr-1">일괄 변경:</span>
            {STATUS_LIST.map((st) => (
              <button
                key={st}
                onClick={() => handleApplyBatchStatus(st)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-semibold transition-colors border border-slate-700 cursor-pointer"
              >
                {STATUS_CONFIG[st].label}로
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Student Submissions Compact Grid (2-Column Cards Default) */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        {/* Layout Mode Control Bar */}
        <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer font-bold select-none text-slate-700">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={handleToggleSelectAll}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
              />
              <span>전체 선택</span>
            </label>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500 font-semibold">총 {displayedStudents.length}명</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>2열 카드</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>표 보기</span>
            </button>
          </div>
        </div>

        {/* 2-Column Grid Layout (Default - Ultra Compact with inline status buttons next to student name) */}
        {viewMode === 'grid' ? (
          <div className="p-3 bg-slate-50/50">
            {displayedStudents.length === 0 ? (
              <div className="p-8 text-center text-slate-500 bg-white rounded-lg border border-slate-200 text-xs font-semibold">
                조건에 해당하는 학생이 없습니다.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
                {displayedStudents.map((student, index) => {
                  const sub = submissionMap.get(student.id);
                  const currentStatus: SubmissionStatus = sub ? sub.status : 'unsubmitted';
                  const note = sub?.note || '';
                  const isChecked = selectedStudentIds.includes(student.id);
                  const isFocused = focusedStudentIndex === index;

                  return (
                    <div
                      key={student.id}
                      onClick={() => {
                        setFocusedStudentIndex(index);
                        if (isCheckMode) handleStudentRowClickInCheckMode(student);
                      }}
                      className={`bg-white rounded-lg border px-3 py-2 transition-all cursor-pointer relative shadow-2xs flex flex-col gap-1.5 ${
                        isFocused
                          ? 'border-blue-500 ring-2 ring-blue-400 bg-blue-50/30'
                          : isChecked
                          ? 'border-blue-400 bg-blue-50/20'
                          : 'border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
                      }`}
                    >
                      {/* Compact Single-Line Row */}
                      <div className="flex items-center justify-between gap-1.5">
                        {/* Left: Checkbox, Number, Student Name & Inline Status Buttons */}
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleSelectStudent(student.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer shrink-0"
                          />
                          <span className="font-mono text-xs font-bold text-slate-400 shrink-0">
                            {String(student.number).padStart(2, '0')}
                          </span>
                          <span className="font-extrabold text-xs text-slate-900 truncate shrink-0 max-w-[70px] sm:max-w-[90px]">
                            {student.name}
                          </span>

                          {/* 1-Click Status Buttons right next to name */}
                          <div className="flex items-center gap-1 shrink-0 overflow-x-auto no-scrollbar" onClick={(e) => e.stopPropagation()}>
                            {STATUS_LIST.map((st) => {
                              const config = STATUS_CONFIG[st];
                              const isSelected = currentStatus === st;

                              return (
                                <button
                                  key={st}
                                  onClick={() => {
                                    onUpdateSubmissionStatus(activeAssignment.id, student.id, st);
                                    triggerToast(`${student.name} → ${config.label}`);
                                  }}
                                  className={`py-1 px-2 rounded-md text-[11px] font-bold transition-all cursor-pointer border text-center whitespace-nowrap ${
                                    isSelected
                                      ? `${config.buttonBg} ${config.badgeBorder} shadow-2xs ring-1 ${config.activeRing}`
                                      : 'bg-slate-50 text-slate-500 border-slate-200/80 hover:bg-slate-100 hover:text-slate-800'
                                  }`}
                                >
                                  {config.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Right: Timestamp & Note Button */}
                        <div className="flex items-center gap-1 shrink-0">
                          {sub?.updatedAt && (
                            <span className="text-[10px] text-slate-400 font-mono hidden xl:inline">
                              {formatShortTimestamp(sub.updatedAt)}
                            </span>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setNoteModalState({
                                isOpen: true,
                                studentId: student.id,
                                studentName: student.name,
                                initialNote: note,
                              });
                            }}
                            className={`p-1 rounded transition-colors cursor-pointer ${
                              note
                                ? 'text-amber-600 bg-amber-50 font-bold border border-amber-200'
                                : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'
                            }`}
                            title={note ? `보완 메모: ${note}` : '보완 메모 작성'}
                          >
                            <MessageSquareText className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Note snippet if present */}
                      {note && (
                        <div className="bg-amber-50/90 border border-amber-200/90 rounded-md px-2 py-0.5 text-[11px] text-amber-900 font-medium flex items-center gap-1.5 ml-6">
                          <span className="font-bold shrink-0 text-amber-700">[메모]</span>
                          <span className="truncate">{note}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Table View Mode */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleToggleSelectAll}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    />
                  </th>
                  <th className="p-3 w-14 text-center">번호</th>
                  <th className="p-3">이름</th>
                  <th className="p-3 w-64 text-center">상태 변경 (1-Click)</th>
                  <th className="p-3 w-32 text-center">최종 수정</th>
                  <th className="p-3 w-16 text-center">메모</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {displayedStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      조건에 해당하는 학생이 없습니다.
                    </td>
                  </tr>
                ) : (
                  displayedStudents.map((student, index) => {
                    const sub = submissionMap.get(student.id);
                    const currentStatus: SubmissionStatus = sub ? sub.status : 'unsubmitted';
                    const note = sub?.note || '';
                    const isChecked = selectedStudentIds.includes(student.id);
                    const isFocused = focusedStudentIndex === index;

                    return (
                      <tr
                        key={student.id}
                        onClick={() => {
                          setFocusedStudentIndex(index);
                          if (isCheckMode) handleStudentRowClickInCheckMode(student);
                        }}
                        className={`transition-colors cursor-pointer ${
                          isFocused
                            ? 'bg-blue-50/80 ring-1 ring-blue-300'
                            : isChecked
                            ? 'bg-blue-50/40'
                            : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleSelectStudent(student.id)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                          />
                        </td>
                        <td className="p-3 text-center font-mono text-slate-500 font-bold">
                          {String(student.number).padStart(2, '0')}
                        </td>
                        <td className="p-3 font-semibold text-slate-900">
                          <div className="flex items-center gap-1.5">
                            <span>{student.name}</span>
                            {isCheckMode && currentStatus === 'unsubmitted' && (
                              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                클릭 시 제출
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-2 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            {STATUS_LIST.map((st) => {
                              const config = STATUS_CONFIG[st];
                              const isSelected = currentStatus === st;

                              return (
                                <button
                                  key={st}
                                  onClick={() => {
                                    onUpdateSubmissionStatus(activeAssignment.id, student.id, st);
                                    triggerToast(`${student.name} → ${config.label}`);
                                  }}
                                  className={`px-2 py-1 rounded text-[11px] font-bold transition-all cursor-pointer border ${
                                    isSelected
                                      ? `${config.buttonBg} ${config.badgeBorder} shadow-2xs scale-105`
                                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-800'
                                  }`}
                                >
                                  {config.label}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                        <td className="p-3 text-center text-slate-400 font-mono text-[11px]">
                          {formatShortTimestamp(sub?.updatedAt) || '-'}
                        </td>
                        <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() =>
                              setNoteModalState({
                                isOpen: true,
                                studentId: student.id,
                                studentName: student.name,
                                initialNote: note,
                              })
                            }
                            className={`p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer ${
                              note ? 'text-amber-600 font-bold' : 'text-slate-300 hover:text-slate-500'
                            }`}
                            title={note ? `보완 메모: ${note}` : '보완 메모 작성'}
                          >
                            <MessageSquareText className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer: Keyboard shortcut guide legend */}
        <div className="bg-slate-50 px-4 py-2 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Keyboard className="w-3.5 h-3.5 text-slate-400" />
            <span>키보드 단축키: [1: 미제출 | 2: 제출 | 3: 보완 | 4: 완료 | ↑↓: 학생 선택]</span>
          </div>
          <span>총 {displayedStudents.length}명 표시됨</span>
        </div>
      </div>

      {/* Note Modal */}
      {noteModalState.isOpen && (
        <NoteModal
          isOpen={noteModalState.isOpen}
          onClose={() => setNoteModalState((prev) => ({ ...prev, isOpen: false }))}
          studentName={noteModalState.studentName}
          initialNote={noteModalState.initialNote}
          onSaveNote={(noteText) => {
            onUpdateSubmissionStatus(
              activeAssignment.id,
              noteModalState.studentId,
              submissionMap.get(noteModalState.studentId)?.status || 'supplement',
              noteText
            );
            triggerToast(`${noteModalState.studentName} 메모가 저장되었습니다.`);
          }}
        />
      )}
    </div>
  );
};
