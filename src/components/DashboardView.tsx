import React from 'react';
import { Assignment, ClassGroup, Student, Submission, SubmissionStatus, Term, ViewTab } from '../types';
import { STATUS_CONFIG } from '../utils/statusConfig';
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Sparkles,
  Calendar,
  AlertTriangle,
  Users,
  Plus,
  CheckSquare,
} from 'lucide-react';

interface DashboardViewProps {
  classes: ClassGroup[];
  students: Student[];
  assignments: Assignment[];
  submissions: Submission[];
  selectedClassId: string;
  currentTerm?: Term;
  onNavigateTab: (tab: ViewTab, filterStatus?: SubmissionStatus | 'all', targetAssignmentId?: string) => void;
  onLoadSampleData: () => void;
  onCreateClassModalOpen: () => void;
  onCreateAssignmentModalOpen: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  classes,
  students,
  assignments,
  submissions,
  selectedClassId,
  currentTerm,
  onNavigateTab,
  onLoadSampleData,
  onCreateClassModalOpen,
  onCreateAssignmentModalOpen,
}) => {
  const currentClass = classes.find((c) => c.id === selectedClassId);

  // Filter students in current class (only active students by default)
  const filteredStudents = (
    selectedClassId && selectedClassId !== 'all'
      ? students.filter((s) => s.classId === selectedClassId)
      : students
  ).filter((s) => (s.status || 'active') === 'active');

  const studentIds = new Set(filteredStudents.map((s) => s.id));

  // Filter assignments applicable to current term and class
  const termAssignments = currentTerm
    ? assignments.filter((a) => !a.termId || a.termId === currentTerm.id)
    : assignments;

  const activeAssignments = (
    selectedClassId && selectedClassId !== 'all'
      ? termAssignments.filter(
          (a) => a.targetClassIds.includes('all') || a.targetClassIds.includes(selectedClassId)
        )
      : termAssignments
  ).filter((a) => (a.status || 'active') === 'active');

  const allApplicableAssignments = selectedClassId && selectedClassId !== 'all'
    ? termAssignments.filter(
        (a) => a.targetClassIds.includes('all') || a.targetClassIds.includes(selectedClassId)
      )
    : termAssignments;

  // Due date calculations
  const todayStr = new Date().toISOString().split('T')[0];

  const dueTodayAssignments = activeAssignments.filter((a) => a.dueDate === todayStr);
  const overdueAssignments = activeAssignments.filter((a) => a.dueDate && a.dueDate < todayStr);

  // Calculate unsubmitted and supplement counts across active assignments
  let activeUnsubmittedCount = 0;
  let activeSupplementCount = 0;

  activeAssignments.forEach((asg) => {
    filteredStudents.forEach((stu) => {
      const sub = submissions.find((s) => s.assignmentId === asg.id && s.studentId === stu.id);
      const status = sub ? sub.status : 'unsubmitted';
      if (status === 'unsubmitted') activeUnsubmittedCount++;
      if (status === 'supplement') activeSupplementCount++;
    });
  });

  // Empty state handling
  if (classes.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 shadow-2xs">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            등록된 반과 학생 정보가 없습니다.
          </h2>
          <p className="text-slate-600 mb-8 max-w-md mx-auto text-sm">
            먼저 학급(반)과 학생 명단을 등록하면 제출 현황을 빠르게 점검할 수 있습니다.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onCreateClassModalOpen}
              className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              새 반 및 학생 등록하기
            </button>
            <button
              onClick={onLoadSampleData}
              className="w-full sm:w-auto px-5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-sm rounded-xl border border-emerald-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              예시 데이터 둘러보기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Class Info */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
              <span>오늘의 대시보드</span>
              <span>•</span>
              <span>{currentTerm ? currentTerm.name : '학기'}</span>
              <span>•</span>
              <span>{currentClass ? currentClass.name : '전체 반'}</span>
            </div>
            <h1 className="text-xl font-extrabold text-slate-900">
              오늘 확인해야 할 학급 제출 업무
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              등록 학생: {filteredStudents.length}명 | 진행 중 과제: {activeAssignments.length}개
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateTab('assignment')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>과제별 제출 확인</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* "Today's Tasks" (오늘 해야 할 일) Focus Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-blue-600" />
            <span>오늘 해야 할 일 (진행 중 과제 기준)</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Card 1: Due Today */}
          <div
            onClick={() => {
              if (dueTodayAssignments.length > 0) {
                onNavigateTab('assignment', 'all', dueTodayAssignments[0].id);
              } else {
                onNavigateTab('assignment', 'all');
              }
            }}
            className="bg-white border border-slate-200 hover:border-blue-500 rounded-lg p-4 shadow-2xs hover:shadow-xs transition-all cursor-pointer border-l-4 border-l-blue-600 group"
          >
            <div className="flex items-center justify-between text-slate-600 mb-1">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">오늘 마감</span>
              <Calendar className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-black text-slate-900">{dueTodayAssignments.length}개</div>
            <div className="text-xs text-slate-500 mt-1 truncate">
              {dueTodayAssignments.length > 0
                ? dueTodayAssignments.map((a) => a.title).join(', ')
                : '오늘 마감 예정 과제 없음'}
            </div>
          </div>

          {/* Card 2: Overdue */}
          <div
            onClick={() => {
              if (overdueAssignments.length > 0) {
                onNavigateTab('assignment', 'unsubmitted', overdueAssignments[0].id);
              } else {
                onNavigateTab('assignment', 'unsubmitted');
              }
            }}
            className="bg-white border border-slate-200 hover:border-rose-400 rounded-lg p-4 shadow-2xs hover:shadow-xs transition-all cursor-pointer border-l-4 border-l-rose-500 group"
          >
            <div className="flex items-center justify-between text-slate-600 mb-1">
              <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">기한 초과</span>
              <AlertTriangle className="w-4 h-4 text-rose-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-black text-rose-700">{overdueAssignments.length}개</div>
            <div className="text-xs text-slate-500 mt-1 truncate">
              {overdueAssignments.length > 0
                ? overdueAssignments.map((a) => a.title).join(', ')
                : '기한 초과 과제 없음'}
            </div>
          </div>

          {/* Card 3: Unsubmitted Students */}
          <div
            onClick={() => onNavigateTab('assignment', 'unsubmitted')}
            className="bg-white border border-slate-200 hover:border-slate-400 rounded-lg p-4 shadow-2xs hover:shadow-xs transition-all cursor-pointer border-l-4 border-l-slate-500 group"
          >
            <div className="flex items-center justify-between text-slate-600 mb-1">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">미제출 학생</span>
              <AlertCircle className="w-4 h-4 text-slate-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-black text-slate-800">{activeUnsubmittedCount}명</div>
            <div className="text-xs text-slate-500 mt-1">
              진행 중 과제 미제출 총 건수
            </div>
          </div>

          {/* Card 4: Supplement Required */}
          <div
            onClick={() => onNavigateTab('assignment', 'supplement')}
            className="bg-white border border-slate-200 hover:border-orange-400 rounded-lg p-4 shadow-2xs hover:shadow-xs transition-all cursor-pointer border-l-4 border-l-orange-500 group"
          >
            <div className="flex items-center justify-between text-slate-600 mb-1">
              <span className="text-xs font-bold text-orange-700 uppercase tracking-wider">보완 필요</span>
              <Clock className="w-4 h-4 text-orange-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-black text-orange-700">{activeSupplementCount}명</div>
            <div className="text-xs text-slate-500 mt-1">
              재제출 및 수정 요청 학생
            </div>
          </div>
        </div>
      </div>

      {/* Recent Assignments (최근 과제) Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span>최근 과제 및 제출 현황</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              과제를 클릭하면 해당 과제의 학생별 제출 현황으로 바로 이동합니다.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onCreateAssignmentModalOpen}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              새 과제 추가
            </button>
          </div>
        </div>

        {allApplicableAssignments.length === 0 ? (
          <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
            <p className="text-sm font-semibold text-slate-700 mb-1">등록된 과제가 없습니다.</p>
            <p className="text-xs text-slate-500 mb-3">
              우측 상단의 "새 과제 추가" 버튼을 눌러 과제를 작성해보세요.
            </p>
            <button
              onClick={onCreateAssignmentModalOpen}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-semibold hover:bg-blue-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              과제 만들기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allApplicableAssignments.map((asg) => {
              const status = asg.status || 'active';

              // Counts for this assignment
              let unsubmitted = 0;
              let submitted = 0;
              let supplement = 0;
              let completed = 0;

              filteredStudents.forEach((stu) => {
                const sub = submissions.find((s) => s.assignmentId === asg.id && s.studentId === stu.id);
                const st = sub ? sub.status : 'unsubmitted';
                if (st === 'unsubmitted') unsubmitted++;
                else if (st === 'submitted') submitted++;
                else if (st === 'supplement') supplement++;
                else if (st === 'completed') completed++;
              });

              const totalStudents = filteredStudents.length;

              // Due date badge
              let dueDateBadge = null;
              if (asg.dueDate) {
                if (asg.dueDate === todayStr) {
                  dueDateBadge = (
                    <span className="px-2 py-0.5 text-[11px] font-bold bg-amber-100 text-amber-800 rounded border border-amber-200">
                      오늘 마감
                    </span>
                  );
                } else if (asg.dueDate < todayStr) {
                  dueDateBadge = (
                    <span className="px-2 py-0.5 text-[11px] font-bold bg-rose-100 text-rose-800 rounded border border-rose-200">
                      기한 초과 ({asg.dueDate})
                    </span>
                  );
                } else {
                  dueDateBadge = (
                    <span className="px-2 py-0.5 text-[11px] font-medium bg-slate-100 text-slate-600 rounded border border-slate-200">
                      ~{asg.dueDate} 마감
                    </span>
                  );
                }
              }

              // Status badge
              let statusBadge = (
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-blue-50 text-blue-700 rounded border border-blue-200">
                  진행 중
                </span>
              );
              if (status === 'closed') {
                statusBadge = (
                  <span className="px-2 py-0.5 text-[11px] font-semibold bg-slate-100 text-slate-700 rounded border border-slate-200">
                    마감됨
                  </span>
                );
              } else if (status === 'archived') {
                statusBadge = (
                  <span className="px-2 py-0.5 text-[11px] font-semibold bg-purple-50 text-purple-700 rounded border border-purple-200">
                    보관됨
                  </span>
                );
              }

              return (
                <div
                  key={asg.id}
                  onClick={() => onNavigateTab('assignment', 'all', asg.id)}
                  className="bg-white border border-slate-200 hover:border-blue-500 rounded-lg p-4 transition-all shadow-2xs hover:shadow-xs cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {statusBadge}
                        {dueDateBadge}
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors" />
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                      {asg.title}
                    </h3>

                    {asg.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {asg.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden flex">
                      <div
                        className="bg-emerald-500 h-full"
                        style={{ width: `${(completed / (totalStudents || 1)) * 100}%` }}
                      />
                      <div
                        className="bg-blue-500 h-full"
                        style={{ width: `${(submitted / (totalStudents || 1)) * 100}%` }}
                      />
                      <div
                        className="bg-orange-400 h-full"
                        style={{ width: `${(supplement / (totalStudents || 1)) * 100}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                      <span>완료/제출: {completed + submitted}/{totalStudents}</span>
                      <div className="flex items-center gap-2">
                        {unsubmitted > 0 && (
                          <span className="text-slate-600">미제출 <strong className="text-slate-900">{unsubmitted}</strong></span>
                        )}
                        {supplement > 0 && (
                          <span className="text-orange-600">보완 <strong className="text-orange-700">{supplement}</strong></span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
