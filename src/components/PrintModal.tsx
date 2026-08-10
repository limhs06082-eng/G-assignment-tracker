import React, { useEffect } from 'react';
import { Assignment, Student, Submission } from '../types';
import { STATUS_CONFIG } from '../utils/statusConfig';
import { Printer, X } from 'lucide-react';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: Assignment | null;
  students: Student[];
  submissions: Submission[];
  classNameTitle: string;
}

export const PrintModal: React.FC<PrintModalProps> = ({
  isOpen,
  onClose,
  assignment,
  students,
  submissions,
  classNameTitle,
}) => {
  if (!isOpen || !assignment) return null;

  const handleTriggerPrint = () => {
    window.print();
  };

  const submissionMap = new Map<string, Submission>();
  submissions.forEach((sub) => {
    if (sub.assignmentId === assignment.id) {
      submissionMap.set(sub.studentId, sub);
    }
  });

  const printDateStr = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 print:p-0 print:static print:bg-white">
      {/* Container - Styled as A4 preview on screen */}
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
        {/* Header - Screen only */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50 print:hidden shrink-0">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">A4 인쇄용 서식 미리보기</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleTriggerPrint}
              className="px-3 py-1.5 bg-indigo-600 text-white font-semibold text-xs rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Printer className="w-4 h-4" />
              <span>지금 인쇄하기</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Print Content Area */}
        <div className="p-8 overflow-y-auto print:p-0 print:overflow-visible text-black font-sans">
          {/* Printable Report Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-6 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">
              [{assignment.title}] 제출 현황표
            </h1>
            <div className="flex items-center justify-between text-xs text-slate-600 font-medium px-1">
              <span>학급: <strong>{classNameTitle}</strong></span>
              <span>제출 기한: <strong>{assignment.dueDate || '미지정'}</strong></span>
              <span>출력일: <strong>{printDateStr}</strong></span>
            </div>
          </div>

          {/* Printable Table */}
          <table className="w-full text-left border-collapse border border-slate-300 text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold">
                <th className="border border-slate-300 p-2.5 text-center w-12">번호</th>
                <th className="border border-slate-300 p-2.5 text-center w-28">이름</th>
                <th className="border border-slate-300 p-2.5 text-center w-24">제출 상태</th>
                <th className="border border-slate-300 p-2.5">보완 메모 / 비고</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const sub = submissionMap.get(student.id);
                const statusKey = sub ? sub.status : 'unsubmitted';
                const statusMeta = STATUS_CONFIG[statusKey];

                return (
                  <tr key={student.id} className="border-b border-slate-200">
                    <td className="border border-slate-300 p-2 text-center font-medium">
                      {student.number}
                    </td>
                    <td className="border border-slate-300 p-2 text-center font-bold">
                      {student.name}
                    </td>
                    <td className="border border-slate-300 p-2 text-center font-bold">
                      <span className={`px-2 py-0.5 rounded text-[11px] ${statusMeta.badgeBg} ${statusMeta.badgeText}`}>
                        {statusMeta.label}
                      </span>
                    </td>
                    <td className="border border-slate-300 p-2 text-slate-700">
                      {sub?.note || ''}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Footer signature / note */}
          <div className="mt-8 text-right text-xs text-slate-500 font-medium">
            담임교사 확인: ___________________ (인)
          </div>
        </div>
      </div>
    </div>
  );
};
