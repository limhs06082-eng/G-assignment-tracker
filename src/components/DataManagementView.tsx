import React, { useState } from 'react';
import { Assignment, BackupData, ClassGroup, Student, Submission } from '../types';
import { downloadBackupJSON } from '../utils/storage';
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

interface DataManagementViewProps {
  classes: ClassGroup[];
  students: Student[];
  assignments: Assignment[];
  submissions: Submission[];
  onLoadSampleData: () => void;
  onRestoreBackupJSON: (data: BackupData) => void;
  onClearAllData: () => void;
}

export const DataManagementView: React.FC<DataManagementViewProps> = ({
  classes,
  students,
  assignments,
  submissions,
  onLoadSampleData,
  onRestoreBackupJSON,
  onClearAllData,
}) => {
  const [restoreMessage, setRestoreMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Handle Backup JSON Download
  const handleDownloadBackup = () => {
    const backup: BackupData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      classes,
      students,
      assignments,
      submissions,
    };
    downloadBackupJSON(backup);
  };

  // Handle Restore JSON File
  const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRestoreMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content) as BackupData;

        // Basic validation check
        if (!parsed || !Array.isArray(parsed.classes) || !Array.isArray(parsed.students) || !Array.isArray(parsed.assignments)) {
          throw new Error('백업 파일 구조가 올바르지 않습니다.');
        }

        if (confirm('현재 저장된 모든 데이터가 백업 파일 내용으로 덮어씌워집니다. 계속하시겠습니까?')) {
          onRestoreBackupJSON(parsed);
          setRestoreMessage({
            type: 'success',
            text: `백업 파일 복원이 완료되었습니다. (반 ${parsed.classes.length}개, 학생 ${parsed.students.length}명, 과제 ${parsed.assignments.length}개)`,
          });
        }
      } catch (err: any) {
        setRestoreMessage({
          type: 'error',
          text: `파일 복원 오류: ${err?.message || '유효하지 않은 JSON 백업 파일입니다.'}`,
        });
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleResetData = () => {
    if (confirm('경고: 브라우저에 저장된 반, 학생, 과제 및 제출 현황 기록이 모두 삭제됩니다. 정말 초기화하시겠습니까?')) {
      if (confirm('초기화하면 데이터를 복구할 수 없습니다. 계속하시겠습니까?')) {
        onClearAllData();
        setRestoreMessage({
          type: 'success',
          text: '모든 데이터가 성공적으로 초기화되었습니다.',
        });
      }
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <div className="flex items-center gap-2 mb-1">
          <Database className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-slate-900">데이터 관리 및 안전 백업</h2>
        </div>
        <p className="text-xs text-slate-500">
          모든 데이터는 브라우저 내(LocalStorage)에 안전하게 보관됩니다. 기기 변경이나 만약의 상황에 대비하여 주기적으로 백업 파일을 다운로드해 두세요.
        </p>

        {/* System Data Counts Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100 text-center">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80">
            <span className="text-xs text-slate-500 font-semibold block">등록된 학급</span>
            <span className="text-lg font-bold text-slate-900">{classes.length}개 반</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80">
            <span className="text-xs text-slate-500 font-semibold block">등록된 학생</span>
            <span className="text-lg font-bold text-slate-900">{students.length}명</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80">
            <span className="text-xs text-slate-500 font-semibold block">등록된 과제</span>
            <span className="text-lg font-bold text-slate-900">{assignments.length}개</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80">
            <span className="text-xs text-slate-500 font-semibold block">저장된 제출 기록</span>
            <span className="text-lg font-bold text-slate-900">{submissions.length}건</span>
          </div>
        </div>
      </div>

      {restoreMessage && (
        <div
          className={`p-4 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            restoreMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {restoreMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span>{restoreMessage.text}</span>
        </div>
      )}

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Backup JSON */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">데이터 백업 파일 저장</h3>
              <p className="text-xs text-slate-500">현재 모든 학급, 과제, 제출 현황을 JSON 백업 파일로 저장합니다.</p>
            </div>
          </div>
          <button
            onClick={handleDownloadBackup}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-2xs"
          >
            <Download className="w-4 h-4" />
            <span>백업 파일(JSON) 다운로드</span>
          </button>
        </div>

        {/* Restore JSON */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">백업 파일 복원</h3>
              <p className="text-xs text-slate-500">이전에 내려받은 JSON 백업 파일을 불러옵니다.</p>
            </div>
          </div>
          <label className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-2xs cursor-pointer text-center">
            <Upload className="w-4 h-4" />
            <span>백업 파일 선택 및 복원</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileRestore}
              className="hidden"
            />
          </label>
        </div>

        {/* Load Sample Data */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">예시 데이터 불러오기</h3>
              <p className="text-xs text-slate-500">체험 및 테스트용 6학년 1반 예시 학급 및 과제를 불러옵니다.</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (confirm('예시 데이터를 불러오시겠습니까?')) {
                onLoadSampleData();
                setRestoreMessage({
                  type: 'success',
                  text: '예시 데이터(6학년 1반, 과제 3개, 학생 8명)가 적용되었습니다.',
                });
              }
            }}
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-2xs"
          >
            <Sparkles className="w-4 h-4" />
            <span>예시 데이터로 새로고침</span>
          </button>
        </div>

        {/* Clear All Data */}
        <div className="bg-white border border-rose-200 rounded-xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-rose-900">전체 데이터 초기화</h3>
              <p className="text-xs text-slate-500">저장된 모든 학급, 학생, 과제, 제출 현황을 삭제합니다.</p>
            </div>
          </div>
          <button
            onClick={handleResetData}
            className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-2xs"
          >
            <Trash2 className="w-4 h-4" />
            <span>모든 데이터 초기화</span>
          </button>
        </div>
      </div>
    </div>
  );
};
