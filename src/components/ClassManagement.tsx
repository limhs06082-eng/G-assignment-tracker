import React, { useState } from 'react';
import { ClassGroup, Student, StudentStatus } from '../types';
import {
  Users,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  FileSpreadsheet,
  FileText,
  UserPlus,
  School,
  AlertCircle,
  CheckCircle2,
  UserX,
  UserCheck2,
} from 'lucide-react';

interface ClassManagementProps {
  classes: ClassGroup[];
  students: Student[];
  selectedClassId: string;
  onSelectClass: (classId: string) => void;
  onCreateClass: (name: string) => void;
  onUpdateClass: (classId: string, name: string) => void;
  onDeleteClass: (classId: string) => void;
  onCreateStudent: (
    classId: string,
    number: number,
    name: string,
    includeExistingAssignments?: boolean
  ) => void;
  onBatchCreateStudents: (
    classId: string,
    studentList: { number: number; name: string }[],
    includeExistingAssignments?: boolean
  ) => void;
  onUpdateStudent: (
    studentId: string,
    number: number,
    name: string,
    status?: StudentStatus
  ) => void;
  onDeleteStudent: (studentId: string, mode: 'inactivate' | 'delete') => void;
  onOpenCSVImportModal: () => void;
}

export const ClassManagement: React.FC<ClassManagementProps> = ({
  classes,
  students,
  selectedClassId,
  onSelectClass,
  onCreateClass,
  onUpdateClass,
  onDeleteClass,
  onCreateStudent,
  onBatchCreateStudents,
  onUpdateStudent,
  onDeleteStudent,
  onOpenCSVImportModal,
}) => {
  // Class creation state
  const [isCreatingClass, setIsCreatingClass] = useState(false);
  const [newClassName, setNewClassName] = useState('');

  // Class editing state
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [editingClassName, setEditingClassName] = useState('');

  // Single student creation state
  const [newStudentNumber, setNewStudentNumber] = useState<number | ''>('');
  const [newStudentName, setNewStudentName] = useState('');
  const [includeExistingAssignments, setIncludeExistingAssignments] = useState(true);

  // Batch text area student paste state
  const [isBatchPasteOpen, setIsBatchPasteOpen] = useState(false);
  const [batchText, setBatchText] = useState('');

  // Editing student state
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editingStudentNumber, setEditingStudentNumber] = useState<number>(1);
  const [editingStudentName, setEditingStudentName] = useState('');
  const [editingStudentStatus, setEditingStudentStatus] = useState<StudentStatus>('active');

  // Deletion Choice Modal state
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);

  const currentClass = classes.find((c) => c.id === selectedClassId) || (classes.length > 0 ? classes[0] : null);
  const currentClassStudents = currentClass
    ? students.filter((s) => s.classId === currentClass.id).sort((a, b) => a.number - b.number)
    : [];

  // Suggest next student number
  const nextStudentNumber = currentClassStudents.length > 0
    ? Math.max(...currentClassStudents.map((s) => s.number)) + 1
    : 1;

  // Handle Class Creation
  const handleSaveNewClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    onCreateClass(newClassName.trim());
    setNewClassName('');
    setIsCreatingClass(false);
  };

  // Handle Class Editing
  const handleSaveEditClass = (classId: string) => {
    if (!editingClassName.trim()) return;
    onUpdateClass(classId, editingClassName.trim());
    setEditingClassId(null);
  };

  // Handle Single Student Creation
  const handleAddSingleStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentClass || !newStudentName.trim()) return;

    const num = typeof newStudentNumber === 'number' ? newStudentNumber : nextStudentNumber;
    onCreateStudent(currentClass.id, num, newStudentName.trim(), includeExistingAssignments);
    setNewStudentName('');
    setNewStudentNumber(num + 1);
  };

  // Handle Batch Text Paste
  const handleProcessBatchText = () => {
    if (!currentClass || !batchText.trim()) return;

    const lines = batchText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    const parsedList: { number: number; name: string }[] = [];

    let autoNum = nextStudentNumber;

    lines.forEach((line) => {
      if (line.includes(',')) {
        const parts = line.split(',').map((p) => p.trim());
        const num = parseInt(parts[0], 10);
        const name = parts[1] || '';
        if (!isNaN(num) && name) {
          parsedList.push({ number: num, name });
        }
      } else if (line.includes('\t')) {
        const parts = line.split('\t').map((p) => p.trim());
        const num = parseInt(parts[0], 10);
        const name = parts[1] || '';
        if (!isNaN(num) && name) {
          parsedList.push({ number: num, name });
        }
      } else {
        parsedList.push({ number: autoNum++, name: line });
      }
    });

    if (parsedList.length > 0) {
      onBatchCreateStudents(currentClass.id, parsedList, includeExistingAssignments);
      setBatchText('');
      setIsBatchPasteOpen(false);
    }
  };

  // Handle Student Editing
  const handleSaveEditStudent = (studentId: string) => {
    if (!editingStudentName.trim()) return;
    onUpdateStudent(studentId, editingStudentNumber, editingStudentName.trim(), editingStudentStatus);
    setEditingStudentId(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Section: Class Selector & Manage Classes */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <School className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">학급(반) 및 학생 명단 관리</h2>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsCreatingClass(true)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>새 반 만들기</span>
            </button>
            <button
              onClick={onOpenCSVImportModal}
              className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>CSV로 불러오기</span>
            </button>
          </div>
        </div>

        {/* Class List Badges */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-t border-slate-100 pt-3">
          {classes.map((cls) => {
            const isSelected = cls.id === currentClass?.id;
            const isEditing = editingClassId === cls.id;

            if (isEditing) {
              return (
                <div key={cls.id} className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-300">
                  <input
                    type="text"
                    value={editingClassName}
                    onChange={(e) => setEditingClassName(e.target.value)}
                    className="px-2 py-1 text-xs border border-slate-300 rounded bg-white font-bold text-slate-900 w-28 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    autoFocus
                  />
                  <button
                    onClick={() => handleSaveEditClass(cls.id)}
                    className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
                    title="저장"
                  >
                    <Save className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setEditingClassId(null)}
                    className="p-1 text-slate-400 hover:bg-slate-200 rounded cursor-pointer"
                    title="취소"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            }

            return (
              <div
                key={cls.id}
                onClick={() => onSelectClass(cls.id)}
                className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 border ${
                  isSelected
                    ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-2xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{cls.name}</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  ({students.filter((s) => s.classId === cls.id).length}명)
                </span>
                <div className="flex items-center gap-0.5 ml-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingClassId(cls.id);
                      setEditingClassName(cls.name);
                    }}
                    className="p-0.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-200 cursor-pointer"
                    title="반 이름 수정"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  {classes.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`'${cls.name}'을(를) 삭제하시겠습니까? 소속된 학생 및 해당 반 기록도 영향을 받습니다.`)) {
                          onDeleteClass(cls.id);
                        }
                      }}
                      className="p-0.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 cursor-pointer"
                      title="반 삭제"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Inline Create Class */}
        {isCreatingClass && (
          <form onSubmit={handleSaveNewClass} className="bg-indigo-50/60 border border-indigo-200 p-3 rounded-lg flex items-center gap-2">
            <input
              type="text"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              placeholder="예: 6학년 1반, 1학년 3반"
              className="px-3 py-1.5 text-xs border border-indigo-300 rounded-md bg-white font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-1 max-w-xs"
              autoFocus
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-indigo-600 text-white font-semibold text-xs rounded-md hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              추가
            </button>
            <button
              type="button"
              onClick={() => setIsCreatingClass(false)}
              className="px-3 py-1.5 bg-white text-slate-600 border border-slate-300 font-semibold text-xs rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
            >
              취소
            </button>
          </form>
        )}
      </div>

      {/* Student List & Add Controls for Current Class */}
      {currentClass && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                [{currentClass.name}] 학생 명단 ({currentClassStudents.length}명)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                학생 번호와 이름을 간편하게 추가하고 전출/휴학 시 비활성화할 수 있습니다.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsBatchPasteOpen(!isBatchPasteOpen)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 border border-slate-300 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-slate-600" />
                <span>여러 명 한꺼번에 붙여넣기</span>
              </button>
            </div>
          </div>

          {/* Batch Text Paste Area */}
          {isBatchPasteOpen && (
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  여러 줄 텍스트로 한꺼번에 학생 등록하기
                </span>
                <button
                  onClick={() => setIsBatchPasteOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-500">
                한 줄에 한 명씩 입력하세요. <br />
                형식: <code className="bg-white px-1 py-0.5 rounded border border-slate-200 text-indigo-700 font-bold">1,김민준</code> 또는 <code className="bg-white px-1 py-0.5 rounded border border-slate-200 text-indigo-700 font-bold">김민준</code>
              </p>

              <textarea
                value={batchText}
                onChange={(e) => setBatchText(e.target.value)}
                placeholder={`1,김민준\n2,이서연\n3,박지우\n4,최유진`}
                rows={5}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeExistingAssignments}
                    onChange={(e) => setIncludeExistingAssignments(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>기존 진행 중인 과제에도 이 신규 학생들 포함 (기본 미제출 처리)</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsBatchPasteOpen(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleProcessBatchText}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-2xs"
                  >
                    명단 일괄 등록
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Single Student Add Input Bar */}
          <form onSubmit={handleAddSingleStudent} className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-3">
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-bold text-slate-600 shrink-0">학생 추가:</span>
                <input
                  type="number"
                  value={newStudentNumber === '' ? '' : newStudentNumber}
                  onChange={(e) =>
                    setNewStudentNumber(e.target.value === '' ? '' : parseInt(e.target.value, 10))
                  }
                  placeholder={`번호 (${nextStudentNumber})`}
                  min={1}
                  className="w-20 px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <input
                type="text"
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                placeholder="학생 이름 입력 (예: 김민준)"
                className="w-full sm:flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <button
                type="submit"
                className="w-full sm:w-auto px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1 shrink-0 shadow-2xs cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>학생 등록</span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 pt-1 border-t border-slate-200/60">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeExistingAssignments}
                  onChange={(e) => setIncludeExistingAssignments(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>[전입생 옵션] 기존 진행 중인 과제에도 이 학생 포함하기 (기본 미제출 상태 생성)</span>
              </label>
            </div>
          </form>

          {/* Current Student Grid / Table */}
          {currentClassStudents.length === 0 ? (
            <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">등록된 학생이 없습니다.</p>
              <p className="text-xs text-slate-500 mt-1">
                위 입력창에서 학생을 직접 추가하거나 CSV 파일을 불러와 주세요.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {currentClassStudents.map((student) => {
                const isEditing = editingStudentId === student.id;
                const isInactive = student.status === 'inactive';

                if (isEditing) {
                  return (
                    <div
                      key={student.id}
                      className="p-2.5 bg-indigo-50 border border-indigo-300 rounded-lg space-y-2"
                    >
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={editingStudentNumber}
                          onChange={(e) => setEditingStudentNumber(parseInt(e.target.value, 10) || 1)}
                          className="w-12 px-1.5 py-1 text-xs font-bold border border-indigo-300 rounded bg-white text-center"
                        />
                        <input
                          type="text"
                          value={editingStudentName}
                          onChange={(e) => setEditingStudentName(e.target.value)}
                          className="flex-1 px-2 py-1 text-xs font-bold border border-indigo-300 rounded bg-white"
                          autoFocus
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <select
                          value={editingStudentStatus}
                          onChange={(e) => setEditingStudentStatus(e.target.value as StudentStatus)}
                          className="text-xs px-2 py-1 bg-white border border-indigo-300 rounded font-semibold"
                        >
                          <option value="active">재학 중 (활성)</option>
                          <option value="inactive">비활성 (전출/휴학)</option>
                        </select>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleSaveEditStudent(student.id)}
                            className="p-1 text-emerald-600 hover:bg-emerald-100 rounded cursor-pointer"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingStudentId(null)}
                            className="p-1 text-slate-400 hover:bg-slate-200 rounded cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={student.id}
                    className={`p-2.5 border rounded-lg transition-colors flex items-center justify-between group ${
                      isInactive
                        ? 'bg-slate-100/70 border-slate-200 text-slate-400'
                        : 'bg-slate-50 border-slate-200/90 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-6 h-6 rounded font-bold text-xs flex items-center justify-center shrink-0 ${
                        isInactive ? 'bg-slate-200 text-slate-500' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {student.number}
                      </span>
                      <div className="truncate">
                        <span className={`text-sm font-bold truncate block ${isInactive ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                          {student.name}
                        </span>
                        {isInactive && (
                          <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-1 rounded">
                            비활성 (전출)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setEditingStudentId(student.id);
                          setEditingStudentNumber(student.number);
                          setEditingStudentName(student.name);
                          setEditingStudentStatus(student.status || 'active');
                        }}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-200 cursor-pointer"
                        title="수정"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingStudent(student)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 cursor-pointer"
                        title="삭제 / 비활성화 옵션"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Delete / Inactivate Options Dialog Modal */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 p-5 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-2 text-rose-600 font-bold text-base border-b border-slate-100 pb-3">
              <AlertCircle className="w-5 h-5" />
              <h3>학생 처리 방식 선택</h3>
            </div>

            <p className="text-xs text-slate-600">
              <strong className="text-slate-900">{deletingStudent.number}번 {deletingStudent.name}</strong> 학생을 어떻게 처리하시겠습니까?
            </p>

            <div className="space-y-2.5">
              <button
                onClick={() => {
                  onDeleteStudent(deletingStudent.id, 'inactivate');
                  setDeletingStudent(null);
                }}
                className="w-full text-left p-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl text-xs transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2 font-bold text-amber-900 group-hover:text-amber-950">
                  <UserX className="w-4 h-4 text-amber-700" />
                  <span>1. 비활성화 (전출/휴학 - 추천)</span>
                </div>
                <p className="text-[11px] text-amber-700 mt-1 pl-6">
                  학생을 목록에서 비활성화 처리하고 과거에 등록된 과제 제출 기록은 그대로 안전하게 보존합니다.
                </p>
              </button>

              <button
                onClick={() => {
                  if (confirm(`'${deletingStudent.name}' 학생의 모든 과거 과제 제출 기록이 영구적으로 삭제됩니다. 진행하시겠습니까?`)) {
                    onDeleteStudent(deletingStudent.id, 'delete');
                    setDeletingStudent(null);
                  }
                }}
                className="w-full text-left p-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2 font-bold text-rose-900 group-hover:text-rose-950">
                  <Trash2 className="w-4 h-4 text-rose-700" />
                  <span>2. 완전 삭제</span>
                </div>
                <p className="text-[11px] text-rose-700 mt-1 pl-6">
                  학생 정보 및 해당 학생의 모든 과제 제출 기록을 완전히 영구 삭제합니다.
                </p>
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setDeletingStudent(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
