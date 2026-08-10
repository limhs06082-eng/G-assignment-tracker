import React from 'react';
import { ClassGroup, Term, ViewTab } from '../types';
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  BarChart3,
  Grid,
  FolderKanban,
  FileCode2,
  UserCheck,
  Database,
  School,
  PlusCircle,
  Sparkles,
  Calendar,
  Archive,
  Lock,
  ChevronDown,
} from 'lucide-react';

interface HeaderProps {
  terms: Term[];
  selectedTermId: string;
  onSelectTerm: (termId: string) => void;
  onOpenTermModal: () => void;
  classes: ClassGroup[];
  selectedClassId: string;
  onSelectClass: (classId: string) => void;
  currentTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  onLoadSampleData?: () => void;
  onCreateClassModalOpen?: () => void;
  onReactivateTerm?: (termId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  terms,
  selectedTermId,
  onSelectTerm,
  onOpenTermModal,
  classes,
  selectedClassId,
  onSelectClass,
  currentTab,
  onSelectTab,
  onLoadSampleData,
  onCreateClassModalOpen,
  onReactivateTerm,
}) => {
  const navItems: { tab: ViewTab; label: string; icon: React.ReactNode }[] = [
    {
      tab: 'dashboard',
      label: '오늘의 현황',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      tab: 'assignment',
      label: '과제별 보기',
      icon: <CheckSquare className="w-4 h-4" />,
    },
    {
      tab: 'student',
      label: '학생별 보기',
      icon: <Users className="w-4 h-4" />,
    },
    {
      tab: 'student_summary',
      label: '전체 요약',
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      tab: 'matrix',
      label: '전체 현황판',
      icon: <Grid className="w-4 h-4" />,
    },
    {
      tab: 'assignments_manage',
      label: '과제 관리',
      icon: <FolderKanban className="w-4 h-4" />,
    },
    {
      tab: 'templates_manage',
      label: '템플릿',
      icon: <FileCode2 className="w-4 h-4" />,
    },
    {
      tab: 'classes_manage',
      label: '반·학생 관리',
      icon: <UserCheck className="w-4 h-4" />,
    },
    {
      tab: 'data_manage',
      label: '데이터·백업',
      icon: <Database className="w-4 h-4" />,
    },
  ];

  const currentTerm = terms.find((t) => t.id === selectedTermId) || terms[0];
  const isTermArchived = currentTerm?.status === 'archived' || currentTerm?.isArchived === true;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs print:hidden">
      {/* Top Banner Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between py-3 border-b border-slate-100 gap-3">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-xs shrink-0">
              <School className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-snug">
                학생 자료·과제 제출 현황 정리기
              </h1>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">
                교사를 위한 학년도·학기 단위 제출 현황 관리 시스템
              </p>
            </div>
          </div>

          {/* Controls Bar: Term Dropdown & Class Dropdown */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Term Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-300">
              <Calendar className="w-3.5 h-3.5 text-blue-600 hidden sm:inline" />
              <select
                value={selectedTermId}
                onChange={(e) => onSelectTerm(e.target.value)}
                className="bg-white text-slate-900 font-bold text-xs py-1 px-2.5 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer"
              >
                {terms.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} {t.status === 'archived' ? '(보관됨)' : ''}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={onOpenTermModal}
                className="px-2 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-100/70 rounded transition-colors"
                title="학기 관리 및 새 학기 추가"
              >
                학기 관리
              </button>
            </div>

            {/* Class Selector */}
            {classes.length > 0 ? (
              <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-300">
                <span className="text-xs font-semibold text-slate-600 pl-1 hidden sm:inline">
                  반:
                </span>
                <select
                  value={selectedClassId}
                  onChange={(e) => onSelectClass(e.target.value)}
                  className="bg-white text-slate-900 font-bold text-xs py-1 px-2.5 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer"
                >
                  <option value="all">전체 반 보기</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {onCreateClassModalOpen && (
                  <button
                    onClick={onCreateClassModalOpen}
                    className="flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    새 반 만들기
                  </button>
                )}
                {onLoadSampleData && (
                  <button
                    onClick={onLoadSampleData}
                    className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    예시 데이터
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-none">
          {navItems.map((item) => {
            const isActive = currentTab === item.tab;
            return (
              <button
                key={item.tab}
                onClick={() => onSelectTab(item.tab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent'
                }`}
              >
                <span className={isActive ? 'text-blue-600' : 'text-slate-400'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Archived Term Notice Banner */}
      {isTermArchived && (
        <div className="bg-amber-500/10 border-t border-b border-amber-300 text-amber-900 px-4 py-2 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-700" />
              <span>
                <strong>{currentTerm?.name}</strong> 은(는) 보관된 학기입니다. 현재 <strong>읽기 전용 모드</strong>로 열람 중입니다.
              </span>
            </div>
            {onReactivateTerm && (
              <button
                onClick={() => onReactivateTerm(currentTerm.id)}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold transition-colors cursor-pointer"
              >
                다시 활성화하기
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
