import React, { useState, useMemo } from 'react';
import { Assignment, ClassGroup, Student, Submission, SubmissionStatus, Term } from '../types';
import { STATUS_CONFIG, STATUS_LIST } from '../utils/statusConfig';
import { NoteModal } from './NoteModal';
import {
  Users,
  Search,
  MessageSquareText,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronDown,
  Filter,
} from 'lucide-react';

interface StudentViewProps {
  classes: ClassGroup[];
  students: Student[];
  assignments: Assignment[];
  submissions: Submission[];
  selectedClassId: string;
  currentTerm?: Term;
  initialStudentId?: string;
  onUpdateSubmissionStatus: (
    assignmentId: string,
    studentId: string,
    status: SubmissionStatus,
    note?: string
  ) => void;
}

export const StudentView: React.FC<StudentViewProps> = ({
  classes,
  students,
  assignments,
  submissions,
  selectedClassId,
  currentTerm,
  initialStudentId,
  onUpdateSubmissionStatus,
}) => {
  // Students for selected class
  const classStudents = useMemo(() => {
    if (!selectedClassId || selectedClassId === 'all') return students;
    return students.filter((s) => s.classId === selectedClassId);
  }, [students, selectedClassId]);

  const sortedStudents = useMemo(() => {
    return [...classStudents].sort((a, b) => a.number - b.number);
  }, [classStudents]);

  // Selected Student
  const [selectedStudentId, setSelectedStudentId] = useState<string>(() => {
    if (initialStudentId && sortedStudents.some((s) => s.id === initialStudentId)) {
      return initialStudentId;
    }
    return sortedStudents.length > 0 ? sortedStudents[0].id : '';
  });

  const activeStudent = useMemo(() => {
    const found = sortedStudents.find((s) => s.id === selectedStudentId);
    if (found) return found;
    return sortedStudents.length > 0 ? sortedStudents[0] : null;
  }, [sortedStudents, selectedStudentId]);

  // Filter tabs for assignment status: 'all' | SubmissionStatus
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | 'all'>('all');

  // Note Modal state
  const [noteModalState, setNoteModalState] = useState<{
    isOpen: boolean;
    assignmentId: string;
    assignmentTitle: string;
    initialNote: string;
  }>({
    isOpen: false,
    assignmentId: '',
    assignmentTitle: '',
    initialNote: '',
  });

  // Target Assignments for active student's class in current term
  const applicableAssignments = useMemo(() => {
    if (!activeStudent) return [];
    let list = assignments.filter(
      (a) =>
        a.targetClassIds.includes('all') ||
        a.targetClassIds.includes(activeStudent.classId)
    );

    if (currentTerm) {
      list = list.filter((a) => !a.termId || a.termId === currentTerm.id);
    }

    return list;
  }, [assignments, activeStudent, currentTerm]);

  // Map of assignmentId -> submission for active student
  const studentSubmissionsMap = useMemo(() => {
    if (!activeStudent) return new Map<string, Submission>();
    const map = new Map<string, Submission>();
    submissions.forEach((sub) => {
      if (sub.studentId === activeStudent.id) {
        map.set(sub.assignmentId, sub);
      }
    });
    return map;
  }, [submissions, activeStudent]);

  // Student summary metrics
  const metrics = useMemo(() => {
    let unsubmitted = 0;
    let submitted = 0;
    let supplement = 0;
    let completed = 0;

    applicableAssignments.forEach((asg) => {
      const sub = studentSubmissionsMap.get(asg.id);
      const st: SubmissionStatus = sub ? sub.status : 'unsubmitted';
      if (st === 'unsubmitted') unsubmitted++;
      else if (st === 'submitted') submitted++;
      else if (st === 'supplement') supplement++;
      else if (st === 'completed') completed++;
    });

    const total = applicableAssignments.length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      unsubmitted,
      submitted,
      supplement,
      completed,
      rate,
    };
  }, [applicableAssignments, studentSubmissionsMap]);

  // Filtered Assignment List based on statusFilter
  const filteredAssignments = useMemo(() => {
    if (statusFilter === 'all') return applicableAssignments;
    return applicableAssignments.filter((asg) => {
      const sub = studentSubmissionsMap.get(asg.id);
      const st: SubmissionStatus = sub ? sub.status : 'unsubmitted';
      return st === statusFilter;
    });
  }, [applicableAssignments, studentSubmissionsMap, statusFilter]);

  const todayStr = new Date().toISOString().split('T')[0];

  if (sortedStudents.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center max-w-xl mx-auto my-8">
        <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <h3 className="text-base font-bold text-slate-900 mb-1">
          선택한 반에 등록된 학생이 없습니다.
        </h3>
        <p className="text-xs text-slate-500">
          [반·학생 관리] 메뉴에서 학생 명단을 먼저 추가해 주세요.
        </p>
      </div>
    );
  }

  if (!activeStudent) return null;

  const currentStudentClass = classes.find((c) => c.id === activeStudent.classId);
  const isInactive = activeStudent.status === 'inactive';

  return (
    <div className="space-y-4">
      {/* Student Selector Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 text-blue-700 font-bold rounded-xl flex items-center justify-center text-base shrink-0">
              {activeStudent.number}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">{activeStudent.name}</h2>
                {currentStudentClass && (
                  <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                    {currentStudentClass.name}
                  </span>
                )}
                {isInactive && (
                  <span className="text-xs font-bold px-2 py-0.5 bg-slate-200 text-slate-700 rounded">
                    비활성 학생
                  </span>
                )}
                {currentTerm && (
                  <span className="text-xs font-bold px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
                    ※ 현재 학기 기준 ({currentTerm.name})
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                학생 한 명의 누적 제출 상태 및 이력을 종합적으로 점검합니다.
              </p>
            </div>
          </div>

          {/* Student Selector Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 shrink-0">학생 선택:</span>
            <div className="relative w-56">
              <select
                value={activeStudent.id}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full bg-slate-50 text-slate-900 text-sm font-bold py-2 px-3 pr-8 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none shadow-2xs"
              >
                {sortedStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.number}번 {s.name} {s.status === 'inactive' ? '(비활성)' : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Student Metrics Header */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mt-4 pt-4 border-t border-slate-100">
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 text-center">
            <div className="text-xs text-slate-500 font-medium">전체 과제</div>
            <div className="text-lg font-bold text-slate-900 mt-0.5">{metrics.total}개</div>
          </div>
          <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-200/60 text-center">
            <div className="text-xs text-emerald-700 font-semibold">{STATUS_CONFIG.completed.label}</div>
            <div className="text-lg font-bold text-emerald-800 mt-0.5">{metrics.completed}개</div>
          </div>
          <div className="bg-blue-50 p-2.5 rounded-lg border border-blue-200/60 text-center">
            <div className="text-xs text-blue-700 font-semibold">{STATUS_CONFIG.submitted.label}</div>
            <div className="text-lg font-bold text-blue-800 mt-0.5">{metrics.submitted}개</div>
          </div>
          <div className="bg-rose-50 p-2.5 rounded-lg border border-rose-200/60 text-center">
            <div className="text-xs text-rose-700 font-semibold">{STATUS_CONFIG.unsubmitted.label}</div>
            <div className="text-lg font-bold text-rose-800 mt-0.5">{metrics.unsubmitted}개</div>
          </div>
          <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200/60 text-center">
            <div className="text-xs text-amber-800 font-semibold">{STATUS_CONFIG.supplement.label}</div>
            <div className="text-lg font-bold text-amber-900 mt-0.5">{metrics.supplement}개</div>
          </div>
          <div className="bg-blue-600 text-white p-2.5 rounded-lg text-center col-span-2 sm:col-span-1 shadow-2xs">
            <div className="text-xs font-bold text-blue-100">완료율</div>
            <div className="text-lg font-extrabold mt-0.5">{metrics.rate}%</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Assignment Status List */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-slate-800">
            {activeStudent.name} 학생 과제 제출 내역 ({filteredAssignments.length}/{applicableAssignments.length})
          </h3>

          {/* Filter tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                statusFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              전체 ({applicableAssignments.length})
            </button>
            <button
              onClick={() => setStatusFilter('unsubmitted')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                statusFilter === 'unsubmitted'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              미제출 ({metrics.unsubmitted})
            </button>
            <button
              onClick={() => setStatusFilter('supplement')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                statusFilter === 'supplement'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              보완 ({metrics.supplement})
            </button>
            <button
              onClick={() => setStatusFilter('submitted')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                statusFilter === 'submitted'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
              }`}
            >
              제출 ({metrics.submitted})
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                statusFilter === 'completed'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              완료 ({metrics.completed})
            </button>
          </div>
        </div>

        {filteredAssignments.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            해당 상태의 과제가 없습니다.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredAssignments.map((assignment) => {
              const submission = studentSubmissionsMap.get(assignment.id);
              const currentStatus: SubmissionStatus = submission ? submission.status : 'unsubmitted';
              const currentNote = submission?.note || '';
              const isOverdue = assignment.dueDate && assignment.dueDate < todayStr && currentStatus === 'unsubmitted';

              return (
                <div
                  key={assignment.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-bold text-slate-900">
                        {assignment.title}
                      </span>
                      {assignment.dueDate && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-medium ${
                            isOverdue
                              ? 'bg-rose-100 text-rose-800 font-bold'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {isOverdue ? '⚠ 기한 초과' : `기한: ${assignment.dueDate}`}
                        </span>
                      )}
                    </div>
                    {assignment.description && (
                      <p className="text-xs text-slate-500 line-clamp-1">
                        {assignment.description}
                      </p>
                    )}
                  </div>

                  {/* Status Change Buttons */}
                  <div className="flex items-center gap-3 shrink-0 flex-wrap">
                    <div className="flex items-center gap-1">
                      {STATUS_LIST.map((st) => {
                        const meta = STATUS_CONFIG[st];
                        const isCurrent = currentStatus === st;

                        return (
                          <button
                            key={st}
                            onClick={() =>
                              onUpdateSubmissionStatus(
                                assignment.id,
                                activeStudent.id,
                                st,
                                currentNote
                              )
                            }
                            className={`px-2.5 py-1 rounded-md font-bold text-xs transition-all border cursor-pointer ${
                              isCurrent
                                ? `${meta.buttonBg} ${meta.badgeBorder} ring-2 ${meta.activeRing} shadow-2xs`
                                : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            {meta.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Supplement Note Button */}
                    <button
                      onClick={() =>
                        setNoteModalState({
                          isOpen: true,
                          assignmentId: assignment.id,
                          assignmentTitle: assignment.title,
                          initialNote: currentNote,
                        })
                      }
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs border transition-colors cursor-pointer ${
                        currentNote
                          ? 'bg-amber-50 text-amber-900 border-amber-300 font-semibold'
                          : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <MessageSquareText className="w-3.5 h-3.5" />
                      <span>{currentNote ? '메모 수정' : '+ 메모'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Note Modal */}
      <NoteModal
        isOpen={noteModalState.isOpen}
        onClose={() => setNoteModalState((prev) => ({ ...prev, isOpen: false }))}
        studentName={activeStudent.name}
        assignmentTitle={noteModalState.assignmentTitle}
        initialNote={noteModalState.initialNote}
        onSave={(newNote) => {
          onUpdateSubmissionStatus(
            noteModalState.assignmentId,
            activeStudent.id,
            studentSubmissionsMap.get(noteModalState.assignmentId)?.status || 'supplement',
            newNote
          );
        }}
      />
    </div>
  );
};
