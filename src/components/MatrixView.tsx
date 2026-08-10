import React, { useState, useMemo } from 'react';
import {
  Assignment,
  AssignmentStatus,
  ClassGroup,
  Student,
  StudentStatus,
  Submission,
  SubmissionStatus,
  Term,
} from '../types';
import { STATUS_CONFIG } from '../utils/statusConfig';
import {
  Grid,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface MatrixViewProps {
  classes: ClassGroup[];
  students: Student[];
  assignments: Assignment[];
  submissions: Submission[];
  selectedClassId: string;
  currentTerm?: Term;
  onUpdateSubmissionStatus: (
    assignmentId: string,
    studentId: string,
    status: SubmissionStatus
  ) => void;
}

export const MatrixView: React.FC<MatrixViewProps> = ({
  classes,
  students,
  assignments,
  submissions,
  selectedClassId,
  currentTerm,
  onUpdateSubmissionStatus,
}) => {
  // Filter States
  const [assignmentFilter, setAssignmentFilter] = useState<'active' | 'active_closed' | 'all'>('active');
  const [studentFilter, setStudentFilter] = useState<StudentStatus | 'all'>('active');
  const [searchQuery, setSearchQuery] = useState('');

  // Cell Popover State
  const [activeCell, setActiveCell] = useState<{
    assignmentId: string;
    studentId: string;
  } | null>(null);

  // Filtered Assignments
  const filteredAssignments = useMemo(() => {
    let list = assignments;

    if (currentTerm) {
      list = list.filter((a) => !a.termId || a.termId === currentTerm.id);
    }

    if (selectedClassId && selectedClassId !== 'all') {
      list = list.filter(
        (a) => a.targetClassIds.includes('all') || a.targetClassIds.includes(selectedClassId)
      );
    }

    if (assignmentFilter === 'active') {
      list = list.filter((a) => (a.status || 'active') === 'active');
    } else if (assignmentFilter === 'active_closed') {
      list = list.filter((a) => (a.status || 'active') !== 'archived');
    }

    // Sort by created date or due date
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [assignments, currentTerm, selectedClassId, assignmentFilter]);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    let list = students;

    if (selectedClassId && selectedClassId !== 'all') {
      list = list.filter((s) => s.classId === selectedClassId);
    }

    if (studentFilter !== 'all') {
      list = list.filter((s) => (s.status || 'active') === studentFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((s) => s.name.toLowerCase().includes(q));
    }

    return list.sort((a, b) => {
      if (a.classId !== b.classId) return a.classId.localeCompare(b.classId);
      return a.number - b.number;
    });
  }, [students, selectedClassId, studentFilter, searchQuery]);

  // Submission Map
  const submissionMap = useMemo(() => {
    const map = new Map<string, SubmissionStatus>();
    submissions.forEach((sub) => {
      map.set(`${sub.assignmentId}_${sub.studentId}`, sub.status);
    });
    return map;
  }, [submissions]);

  const handleCellClick = (assignmentId: string, studentId: string) => {
    if (activeCell?.assignmentId === assignmentId && activeCell?.studentId === studentId) {
      setActiveCell(null);
    } else {
      setActiveCell({ assignmentId, studentId });
    }
  };

  const handleSelectStatus = (status: SubmissionStatus) => {
    if (!activeCell) return;
    onUpdateSubmissionStatus(activeCell.assignmentId, activeCell.studentId, status);
    setActiveCell(null);
  };

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Grid className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">
              반 전체 제출 현황판 (매트릭스 보기)
            </h2>
            {currentTerm && (
              <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold rounded-full">
                ※ {currentTerm.name}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {selectedClass ? selectedClass.name : '전체 학급'}의 모든 과제와 학생 제출 상태를 가로·세로 표 형태로 한눈에 조회하고 빠르게 수정합니다.
          </p>
        </div>

        {/* Status Legend */}
        <div className="flex items-center gap-2 flex-wrap text-xs bg-slate-50 p-2 rounded-lg border border-slate-200">
          {(['unsubmitted', 'submitted', 'supplement', 'completed'] as SubmissionStatus[]).map((st) => {
            const conf = STATUS_CONFIG[st];
            return (
              <div key={st} className="flex items-center gap-1 font-semibold px-2 py-0.5 rounded bg-white border border-slate-200">
                <span className={`w-2 h-2 rounded-full ${conf.dotColor}`} />
                <span>{conf.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        {/* Assignment Filter & Student Filter */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-700">과제 필터:</span>
            <select
              value={assignmentFilter}
              onChange={(e) => setAssignmentFilter(e.target.value as any)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="active">진행 중 과제만</option>
              <option value="active_closed">마감 과제 포함</option>
              <option value="all">보관 과제까지 포함</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-700">학생 필터:</span>
            <select
              value={studentFilter}
              onChange={(e) => setStudentFilter(e.target.value as any)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="active">재학 중 학생만</option>
              <option value="all">전체 학생 (비활성 포함)</option>
              <option value="inactive">비활성 학생만</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-56">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="학생 이름 검색..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          />
        </div>
      </div>

      {/* Matrix Table */}
      {filteredStudents.length === 0 || filteredAssignments.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
          <Grid className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">
            {filteredStudents.length === 0 ? '표시할 학생이 없습니다.' : '표시할 과제가 없습니다.'}
          </p>
          <p className="text-xs text-slate-500 mt-1">상단의 필터나 학생/과제 등록 정보를 확인하세요.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden relative">
          <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
            <table className="w-full border-collapse text-xs select-none">
              {/* Sticky Table Header */}
              <thead className="bg-slate-100 sticky top-0 z-20 border-b border-slate-200 shadow-2xs">
                <tr>
                  {/* Sticky Top-Left Corner Cell */}
                  <th className="sticky left-0 top-0 z-30 bg-slate-100 p-3 text-slate-700 font-bold border-r border-slate-200 min-w-[130px] w-[130px] text-left shadow-xs">
                    학생 \ 과제
                  </th>

                  {/* Assignment Column Headers */}
                  {filteredAssignments.map((asg) => {
                    const st = asg.status || 'active';
                    return (
                      <th
                        key={asg.id}
                        className="p-3 font-bold text-slate-800 border-r border-slate-200 min-w-[140px] max-w-[180px] text-left align-top"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            {st === 'active' && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded">
                                진행중
                              </span>
                            )}
                            {st === 'closed' && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded">
                                마감됨
                              </span>
                            )}
                            {st === 'archived' && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 bg-purple-100 text-purple-800 rounded">
                                보관됨
                              </span>
                            )}
                          </div>
                          <div className="font-bold text-slate-900 truncate" title={asg.title}>
                            {asg.title}
                          </div>
                          {asg.dueDate && (
                            <div className="text-[10px] font-normal text-slate-500 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>~{asg.dueDate.substring(5)}</span>
                            </div>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student) => {
                  const isInactive = student.status === 'inactive';

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Sticky Left Student Name Column */}
                      <td className="sticky left-0 z-10 bg-white hover:bg-slate-50 p-2.5 font-bold border-r border-slate-200 min-w-[130px] w-[130px] text-slate-900 shadow-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500 w-5 text-right font-semibold">{student.number}.</span>
                          <span className="truncate">{student.name}</span>
                          {isInactive && (
                            <span className="text-[9px] bg-slate-200 text-slate-600 px-1 py-0.2 rounded font-semibold">
                              비활성
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Cells for each Assignment */}
                      {filteredAssignments.map((asg) => {
                        const cellKey = `${asg.id}_${student.id}`;
                        const currentStatus = submissionMap.get(cellKey) || 'unsubmitted';
                        const conf = STATUS_CONFIG[currentStatus];
                        const isSelectedCell =
                          activeCell?.assignmentId === asg.id && activeCell?.studentId === student.id;

                        return (
                          <td
                            key={asg.id}
                            onClick={() => handleCellClick(asg.id, student.id)}
                            className={`p-2 border-r border-slate-100 text-center relative cursor-pointer hover:bg-blue-50/60 transition-colors ${
                              isSelectedCell ? 'ring-2 ring-blue-500 bg-blue-50 z-20' : ''
                            }`}
                          >
                            <span
                              className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md text-xs font-bold transition-all shadow-2xs ${conf.badgeBg} ${conf.badgeText} border ${conf.border}`}
                            >
                              {conf.label}
                            </span>

                            {/* Cell Popover Status Selector */}
                            {isSelectedCell && (
                              <div
                                className="absolute left-1/2 -translate-x-1/2 top-full mt-1 z-40 bg-white border border-slate-300 rounded-xl shadow-xl p-2 w-36 space-y-1 animate-in fade-in zoom-in duration-100"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="text-[10px] font-bold text-slate-400 px-1 text-left border-b border-slate-100 pb-1">
                                  {student.name} → 상태 선택
                                </div>
                                {(['completed', 'submitted', 'supplement', 'unsubmitted'] as SubmissionStatus[]).map(
                                  (st) => {
                                    const stConf = STATUS_CONFIG[st];
                                    return (
                                      <button
                                        key={st}
                                        onClick={() => handleSelectStatus(st)}
                                        className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                                          currentStatus === st
                                            ? 'bg-blue-50 text-blue-700'
                                            : 'hover:bg-slate-100 text-slate-700'
                                        }`}
                                      >
                                        <span className={`w-2 h-2 rounded-full ${stConf.dotColor}`} />
                                        <span>{stConf.label}</span>
                                      </button>
                                    );
                                  }
                                )}
                              </div>
                            )}
                          </td>
                        );
                      })}
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
