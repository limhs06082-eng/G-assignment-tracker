import React, { useState, useMemo } from 'react';
import { Assignment, ClassGroup, Student, Submission, Term } from '../types';
import {
  Users,
  Search,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
  BarChart3,
  Sparkles,
} from 'lucide-react';

interface StudentSummaryViewProps {
  classes: ClassGroup[];
  students: Student[];
  assignments: Assignment[];
  submissions: Submission[];
  selectedClassId: string;
  currentTerm?: Term;
  onSelectStudent: (studentId: string) => void;
}

type SortOption =
  | 'number'
  | 'name'
  | 'unsubmitted'
  | 'supplement'
  | 'completionRateAsc'
  | 'completionRateDesc';

export const StudentSummaryView: React.FC<StudentSummaryViewProps> = ({
  classes,
  students,
  assignments,
  submissions,
  selectedClassId,
  currentTerm,
  onSelectStudent,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('number');
  const [showInactive, setShowInactive] = useState(false);

  // Filter students by selected class & inactive status
  const filteredStudents = useMemo(() => {
    let list = students;

    if (selectedClassId && selectedClassId !== 'all') {
      list = list.filter((s) => s.classId === selectedClassId);
    }

    if (!showInactive) {
      list = list.filter((s) => (s.status || 'active') === 'active');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((s) => s.name.toLowerCase().includes(q));
    }

    return list;
  }, [students, selectedClassId, showInactive, searchQuery]);

  // Current term active assignments
  const termAssignments = useMemo(() => {
    if (!currentTerm) return assignments;
    return assignments.filter((a) => !a.termId || a.termId === currentTerm.id);
  }, [assignments, currentTerm]);

  // Compute stats per student
  const studentStats = useMemo(() => {
    const totalAssignmentsCount = termAssignments.length;

    const statsList = filteredStudents.map((student) => {
      // Find submissions for this student across termAssignments
      const studentSubs = submissions.filter(
        (sub) =>
          sub.studentId === student.id &&
          termAssignments.some((a) => a.id === sub.assignmentId)
      );

      const statusMap = new Map<string, string>();
      studentSubs.forEach((s) => statusMap.set(s.assignmentId, s.status));

      let completed = 0;
      let submitted = 0;
      let supplement = 0;
      let unsubmitted = 0;

      termAssignments.forEach((asg) => {
        const st = statusMap.get(asg.id) || 'unsubmitted';
        if (st === 'completed') completed++;
        else if (st === 'submitted') submitted++;
        else if (st === 'supplement') supplement++;
        else unsubmitted++;
      });

      const rate =
        totalAssignmentsCount > 0
          ? Math.round((completed / totalAssignmentsCount) * 100)
          : 0;

      return {
        student,
        completed,
        submitted,
        supplement,
        unsubmitted,
        rate,
        totalAssignmentsCount,
      };
    });

    // Apply Sorting
    return [...statsList].sort((a, b) => {
      if (sortBy === 'number') {
        if (a.student.classId !== b.student.classId) {
          return a.student.classId.localeCompare(b.student.classId);
        }
        return a.student.number - b.student.number;
      }
      if (sortBy === 'name') {
        return a.student.name.localeCompare(b.student.name);
      }
      if (sortBy === 'unsubmitted') {
        return b.unsubmitted - a.unsubmitted;
      }
      if (sortBy === 'supplement') {
        return b.supplement - a.supplement;
      }
      if (sortBy === 'completionRateAsc') {
        return a.rate - b.rate;
      }
      if (sortBy === 'completionRateDesc') {
        return b.rate - a.rate;
      }
      return 0;
    });
  }, [filteredStudents, termAssignments, submissions, sortBy]);

  // Overall class averages
  const overallClassStats = useMemo(() => {
    if (studentStats.length === 0) {
      return { totalStudents: 0, avgRate: 0, totalUnsubmitted: 0, totalSupplement: 0 };
    }
    const sumRate = studentStats.reduce((acc, curr) => acc + curr.rate, 0);
    const avgRate = Math.round(sumRate / studentStats.length);

    const totalUnsubmitted = studentStats.reduce((acc, curr) => acc + curr.unsubmitted, 0);
    const totalSupplement = studentStats.reduce((acc, curr) => acc + curr.supplement, 0);

    return {
      totalStudents: studentStats.length,
      avgRate,
      totalUnsubmitted,
      totalSupplement,
    };
  }, [studentStats]);

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">
              학생별 누적 제출 현황 요약
            </h2>
            {currentTerm && (
              <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold rounded-full">
                ※ {currentTerm.name} 기준
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {selectedClass ? selectedClass.name : '전체 학급'} 학생들의 누적 과제 제출 및 완료 상태를 종합적으로 확인합니다.
          </p>
        </div>

        {/* Stats Summary Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-center">
            <p className="text-slate-500 text-[11px] font-medium">대상 학생</p>
            <p className="text-base font-bold text-slate-900">{overallClassStats.totalStudents}명</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-center">
            <p className="text-emerald-700 text-[11px] font-medium">평균 완료율</p>
            <p className="text-base font-bold text-emerald-800">{overallClassStats.avgRate}%</p>
          </div>
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-2.5 text-center">
            <p className="text-rose-700 text-[11px] font-medium">총 미제출</p>
            <p className="text-base font-bold text-rose-800">{overallClassStats.totalUnsubmitted}건</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-center">
            <p className="text-amber-700 text-[11px] font-medium">총 보완필요</p>
            <p className="text-base font-bold text-amber-800">{overallClassStats.totalSupplement}건</p>
          </div>
        </div>
      </div>

      {/* Filter and Sort Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="학생 이름 검색..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          <label className="flex items-center gap-1.5 font-semibold text-slate-600 cursor-pointer select-none whitespace-nowrap">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span>비활성 학생 포함</span>
          </label>
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium whitespace-nowrap">정렬:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="number">번호순</option>
            <option value="name">이름순</option>
            <option value="unsubmitted">미제출 많은 순</option>
            <option value="supplement">보완 많은 순</option>
            <option value="completionRateAsc">완료율 낮은 순</option>
            <option value="completionRateDesc">완료율 높은 순</option>
          </select>
        </div>
      </div>

      {/* Summary Table */}
      {studentStats.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
          <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">학생 정보가 없습니다.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="py-3 px-4 w-16 text-center">번호</th>
                  <th className="py-3 px-4">이름</th>
                  <th className="py-3 px-4 text-center text-emerald-700">완료</th>
                  <th className="py-3 px-4 text-center text-blue-700">제출</th>
                  <th className="py-3 px-4 text-center text-rose-700">미제출</th>
                  <th className="py-3 px-4 text-center text-amber-700">보완</th>
                  <th className="py-3 px-4 text-center">완료율 (%)</th>
                  <th className="py-3 px-4 w-20 text-center">상세</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {studentStats.map(({ student, completed, submitted, unsubmitted, supplement, rate, totalAssignmentsCount }) => {
                  const isInactive = student.status === 'inactive';
                  const classObj = classes.find((c) => c.id === student.classId);

                  return (
                    <tr
                      key={student.id}
                      onClick={() => onSelectStudent(student.id)}
                      className={`hover:bg-blue-50/50 transition-colors cursor-pointer ${
                        isInactive ? 'bg-slate-50/60 text-slate-400' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-center font-bold text-slate-700">
                        {student.number}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span>{student.name}</span>
                          {selectedClassId === 'all' && classObj && (
                            <span className="text-[10px] font-normal text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                              {classObj.name}
                            </span>
                          )}
                          {isInactive && (
                            <span className="text-[10px] bg-slate-200 text-slate-600 font-semibold px-1.5 py-0.2 rounded">
                              비활성
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {completed}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {submitted}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`font-bold px-2 py-0.5 rounded border ${
                            unsubmitted > 0
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-slate-50 text-slate-400 border-slate-200'
                          }`}
                        >
                          {unsubmitted}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`font-bold px-2 py-0.5 rounded border ${
                            supplement > 0
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-slate-50 text-slate-400 border-slate-200'
                          }`}
                        >
                          {supplement}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 bg-slate-200 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${rate}%` }}
                            />
                          </div>
                          <span className="font-bold text-slate-800 text-xs w-9 text-right">
                            {rate}%
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          className="p-1 text-slate-400 hover:text-blue-600 transition-colors inline-flex items-center"
                          title="학생별 개별 현황 보기"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
