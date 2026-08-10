import React, { useState, useEffect, useMemo } from 'react';
import {
  Assignment,
  AssignmentStatus,
  AssignmentTemplate,
  BackupData,
  ClassGroup,
  Student,
  StudentStatus,
  Submission,
  SubmissionStatus,
  Term,
  ToastMessage,
  UndoAction,
  ViewTab,
} from './types';
import {
  loadClasses,
  saveClasses,
  loadStudents,
  saveStudents,
  loadAssignments,
  saveAssignments,
  loadSubmissions,
  saveSubmissions,
  loadSelectedClassId,
  saveSelectedClassId,
  loadTerms,
  saveTerms,
  loadSelectedTermId,
  saveSelectedTermId,
  loadTemplates,
  saveTemplates,
  generateSampleData,
  clearAllData,
  ParsedStudentRow,
  generateUniqueId,
  getTodayString,
  validateAndCleanData,
} from './utils/storage';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { AssignmentView } from './components/AssignmentView';
import { StudentView } from './components/StudentView';
import { ClassManagement } from './components/ClassManagement';
import { AssignmentManagement } from './components/AssignmentManagement';
import { DataManagementView } from './components/DataManagementView';
import { StudentSummaryView } from './components/StudentSummaryView';
import { MatrixView } from './components/MatrixView';
import { TemplateManagement } from './components/TemplateManagement';
import { TermManagementModal } from './components/TermManagementModal';
import { CSVImportModal } from './components/CSVImportModal';
import { PrintModal } from './components/PrintModal';
import { ToastContainer } from './components/ToastContainer';
import { STATUS_CONFIG } from './utils/statusConfig';

export default function App() {
  // State initialization from LocalStorage
  const [classes, setClasses] = useState<ClassGroup[]>(() => loadClasses());
  const [students, setStudents] = useState<Student[]>(() => loadStudents());
  const [assignments, setAssignments] = useState<Assignment[]>(() => loadAssignments());
  const [submissions, setSubmissions] = useState<Submission[]>(() => loadSubmissions());
  const [selectedClassId, setSelectedClassId] = useState<string>(() => loadSelectedClassId());

  // Phase 3 state
  const [terms, setTerms] = useState<Term[]>(() => loadTerms());
  const [currentTermId, setCurrentTermId] = useState<string>(() => loadSelectedTermId());
  const [templates, setTemplates] = useState<AssignmentTemplate[]>(() => loadTemplates());

  // App View Navigation State
  const [currentTab, setCurrentTab] = useState<ViewTab>('dashboard');
  const [assignmentFilterStatus, setAssignmentFilterStatus] = useState<SubmissionStatus | 'all'>('all');
  const [targetAssignmentId, setTargetAssignmentId] = useState<string | undefined>(undefined);

  // Undo & Toast state
  const [undoStack, setUndoStack] = useState<UndoAction[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modal States
  const [isCSVImportModalOpen, setIsCSVImportModalOpen] = useState(false);
  const [isCreateAssignmentModalOpen, setIsCreateAssignmentModalOpen] = useState(false);
  const [isTermModalOpen, setIsTermModalOpen] = useState(false);
  const [printModalState, setPrintModalState] = useState<{
    isOpen: boolean;
    assignment: Assignment | null;
    students: Student[];
    submissions: Submission[];
  }>({
    isOpen: false,
    assignment: null,
    students: [],
    submissions: [],
  });

  // Derived current term
  const currentTerm = useMemo(() => {
    return terms.find((t) => t.id === currentTermId) || terms[0] || null;
  }, [terms, currentTermId]);

  // Save selectedClassId & currentTermId
  useEffect(() => {
    saveSelectedClassId(selectedClassId);
  }, [selectedClassId]);

  useEffect(() => {
    saveSelectedTermId(currentTermId);
  }, [currentTermId]);

  // Set default selectedClassId if empty and classes exist
  useEffect(() => {
    if ((!selectedClassId || !classes.some((c) => c.id === selectedClassId)) && classes.length > 0) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  // Helper for Toasts
  const addToast = (
    message: string,
    undoActionId?: string,
    type: 'info' | 'success' | 'warning' = 'info'
  ) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastMessage = { id, message, undoActionId, type };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handlePerformUndo = (undoActionId: string) => {
    const actionIdx = undoStack.findIndex((a) => a.id === undoActionId);
    if (actionIdx < 0) return;

    const targetAction = undoStack[actionIdx];
    setSubmissions(targetAction.previousSubmissions);
    saveSubmissions(targetAction.previousSubmissions);

    setUndoStack((prev) => prev.filter((_, idx) => idx > actionIdx));
    addToast(`'${targetAction.description}' 변경을 되돌렸습니다.`, undefined, 'success');
  };

  // Term Handlers
  const handleSelectTerm = (termId: string) => {
    setCurrentTermId(termId);
    const selected = terms.find((t) => t.id === termId);
    if (selected) {
      addToast(`'${selected.name}'(으)로 학기가 전환되었습니다.`, undefined, 'info');
    }
  };

  const handleCreateTerm = (data: Omit<Term, 'id'>) => {
    const newTerm: Term = {
      id: `term_${Date.now()}`,
      ...data,
    };
    const updated = [...terms, newTerm];
    setTerms(updated);
    saveTerms(updated);
    setCurrentTermId(newTerm.id);
    addToast(`'${newTerm.name}' 학기가 생성되었습니다.`, undefined, 'success');
  };

  const handleUpdateTerm = (termId: string, data: Partial<Omit<Term, 'id'>>) => {
    const updated = terms.map((t) => (t.id === termId ? { ...t, ...data } : t));
    setTerms(updated);
    saveTerms(updated);
    addToast('학기 정보가 수정되었습니다.');
  };

  const handleArchiveTerm = (termId: string, isArchived: boolean) => {
    const updated = terms.map((t) => (t.id === termId ? { ...t, isArchived } : t));
    setTerms(updated);
    saveTerms(updated);
    addToast(isArchived ? '학기가 보관 처리되었습니다.' : '학기 보관이 해제되었습니다.');
  };

  // Template Handlers
  const handleCreateTemplate = (data: Omit<AssignmentTemplate, 'id' | 'createdAt'>) => {
    const newTmpl: AssignmentTemplate = {
      id: `tmpl_${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString(),
    };
    const updated = [...templates, newTmpl];
    setTemplates(updated);
    saveTemplates(updated);
    addToast(`'${newTmpl.title}' 템플릿이 저장되었습니다.`, undefined, 'success');
  };

  const handleUpdateTemplate = (id: string, data: Partial<Omit<AssignmentTemplate, 'id' | 'createdAt'>>) => {
    const updated = templates.map((t) => (t.id === id ? { ...t, ...data } : t));
    setTemplates(updated);
    saveTemplates(updated);
    addToast('템플릿이 수정되었습니다.');
  };

  const handleDeleteTemplate = (id: string) => {
    const updated = templates.filter((t) => t.id !== id);
    setTemplates(updated);
    saveTemplates(updated);
    addToast('템플릿이 삭제되었습니다.');
  };

  // Handle Load Sample Data
  const handleLoadSampleData = () => {
    const sample = generateSampleData();
    setClasses(sample.classes);
    saveClasses(sample.classes);

    setStudents(sample.students);
    saveStudents(sample.students);

    setAssignments(sample.assignments);
    saveAssignments(sample.assignments);

    setSubmissions(sample.submissions);
    saveSubmissions(sample.submissions);

    if (sample.terms) {
      setTerms(sample.terms);
      saveTerms(sample.terms);
      if (sample.terms.length > 0) {
        setCurrentTermId(sample.terms[0].id);
      }
    }

    if (sample.templates) {
      setTemplates(sample.templates);
      saveTemplates(sample.templates);
    }

    if (sample.classes.length > 0) {
      setSelectedClassId(sample.classes[0].id);
    }

    addToast('예시 데이터가 복원되었습니다.', undefined, 'success');
  };

  // Submission update handler (single)
  const handleUpdateSubmissionStatus = (
    assignmentId: string,
    studentId: string,
    status: SubmissionStatus,
    note?: string
  ) => {
    const subId = `${assignmentId}_${studentId}`;
    const now = new Date().toISOString();

    const undoId = `undo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const student = students.find((s) => s.id === studentId);
    const studentName = student ? student.name : '학생';
    const statusLabel = STATUS_CONFIG[status].label;
    const desc = `${studentName} → ${statusLabel}`;

    const undoAction: UndoAction = {
      id: undoId,
      timestamp: Date.now(),
      description: desc,
      previousSubmissions: [...submissions],
    };

    setUndoStack((prev) => [undoAction, ...prev.slice(0, 14)]);

    setSubmissions((prev) => {
      const existingIdx = prev.findIndex((s) => s.id === subId);
      let updatedList: Submission[];

      if (existingIdx >= 0) {
        updatedList = [...prev];
        updatedList[existingIdx] = {
          ...updatedList[existingIdx],
          status,
          note: note !== undefined ? note : updatedList[existingIdx].note,
          updatedAt: now,
        };
      } else {
        const newSub: Submission = {
          id: subId,
          assignmentId,
          studentId,
          status,
          note: note || '',
          updatedAt: now,
        };
        updatedList = [...prev, newSub];
      }

      saveSubmissions(updatedList);
      return updatedList;
    });

    addToast(`${desc} 변경됨`, undoId, 'info');
  };

  // Submission update handler (batch)
  const handleBatchUpdateStatus = (
    assignmentId: string,
    studentIds: string[],
    status: SubmissionStatus
  ) => {
    const now = new Date().toISOString();
    const statusLabel = STATUS_CONFIG[status].label;
    const desc = `${studentIds.length}명 → ${statusLabel}`;

    const undoId = `undo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const undoAction: UndoAction = {
      id: undoId,
      timestamp: Date.now(),
      description: desc,
      previousSubmissions: [...submissions],
    };

    setUndoStack((prev) => [undoAction, ...prev.slice(0, 14)]);

    setSubmissions((prev) => {
      const map = new Map<string, Submission>(prev.map((s) => [s.id, s]));

      studentIds.forEach((sId) => {
        const subId = `${assignmentId}_${sId}`;
        const existing = map.get(subId);

        if (existing) {
          map.set(subId, {
            ...existing,
            status,
            updatedAt: now,
          });
        } else {
          map.set(subId, {
            id: subId,
            assignmentId,
            studentId: sId,
            status,
            note: '',
            updatedAt: now,
          });
        }
      });

      const updatedList = Array.from(map.values());
      saveSubmissions(updatedList);
      return updatedList;
    });

    addToast(`${desc} 상태 변경 완료`, undoId, 'info');
  };

  // Class Management Handlers
  const handleCreateClass = (name: string) => {
    const newClass: ClassGroup = {
      id: `class_${Date.now()}`,
      termId: currentTermId,
      name,
      createdAt: new Date().toISOString(),
    };
    const updated = [...classes, newClass];
    setClasses(updated);
    saveClasses(updated);
    setSelectedClassId(newClass.id);
    addToast(`'${name}' 반이 생성되었습니다.`, undefined, 'success');
  };

  const handleUpdateClass = (classId: string, name: string) => {
    const updated = classes.map((c) => (c.id === classId ? { ...c, name } : c));
    setClasses(updated);
    saveClasses(updated);
    addToast('반 이름이 수정되었습니다.');
  };

  const handleDeleteClass = (classId: string) => {
    const updatedClasses = classes.filter((c) => c.id !== classId);
    setClasses(updatedClasses);
    saveClasses(updatedClasses);

    const updatedStudents = students.filter((s) => s.classId !== classId);
    setStudents(updatedStudents);
    saveStudents(updatedStudents);

    if (selectedClassId === classId) {
      setSelectedClassId(updatedClasses.length > 0 ? updatedClasses[0].id : '');
    }

    addToast('반이 삭제되었습니다.');
  };

  // Student Management Handlers with Transfer-in & Inactivate Options
  const handleCreateStudent = (
    classId: string,
    number: number,
    name: string,
    includeExistingAssignments: boolean = true
  ) => {
    const now = new Date().toISOString();
    const newStudent: Student = {
      id: `stu_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      classId,
      number,
      name,
      status: 'active',
      createdAt: now,
    };

    const updatedStudents = [...students, newStudent];
    setStudents(updatedStudents);
    saveStudents(updatedStudents);

    // If option checked, create default 'unsubmitted' records for active assignments in this class/term
    if (includeExistingAssignments) {
      const activeTermAssignments = assignments.filter((a) =>
        (!a.termId || a.termId === currentTermId) &&
        ((a.status || 'active') === 'active') &&
        (a.targetClassIds.includes('all') || a.targetClassIds.includes(classId))
      );

      if (activeTermAssignments.length > 0) {
        setSubmissions((prevSub) => {
          const map = new Map<string, Submission>(prevSub.map((s) => [s.id, s]));

          activeTermAssignments.forEach((asg) => {
            const subId = `${asg.id}_${newStudent.id}`;
            if (!map.has(subId)) {
              map.set(subId, {
                id: subId,
                assignmentId: asg.id,
                studentId: newStudent.id,
                status: 'unsubmitted',
                note: '전입/신규 추가',
                updatedAt: now,
              });
            }
          });

          const newList = Array.from(map.values());
          saveSubmissions(newList);
          return newList;
        });
      }
    }

    addToast(`${number}번 ${name} 학생이 추가되었습니다.`);
  };

  const handleBatchCreateStudents = (
    classId: string,
    studentList: { number: number; name: string }[],
    includeExistingAssignments: boolean = true
  ) => {
    const now = new Date().toISOString();
    const newStudents: Student[] = studentList.map((item, idx) => ({
      id: `stu_${Date.now()}_batch_${idx}`,
      classId,
      number: item.number,
      name: item.name.trim(),
      status: 'active',
      createdAt: now,
    }));

    const updatedStudents = [...students, ...newStudents];
    setStudents(updatedStudents);
    saveStudents(updatedStudents);

    if (includeExistingAssignments) {
      const activeTermAssignments = assignments.filter((a) =>
        (!a.termId || a.termId === currentTermId) &&
        ((a.status || 'active') === 'active') &&
        (a.targetClassIds.includes('all') || a.targetClassIds.includes(classId))
      );

      if (activeTermAssignments.length > 0) {
        setSubmissions((prevSub) => {
          const map = new Map<string, Submission>(prevSub.map((s) => [s.id, s]));

          newStudents.forEach((stu) => {
            activeTermAssignments.forEach((asg) => {
              const subId = `${asg.id}_${stu.id}`;
              if (!map.has(subId)) {
                map.set(subId, {
                  id: subId,
                  assignmentId: asg.id,
                  studentId: stu.id,
                  status: 'unsubmitted',
                  note: '전입/신규 추가',
                  updatedAt: now,
                });
              }
            });
          });

          const newList = Array.from(map.values());
          saveSubmissions(newList);
          return newList;
        });
      }
    }

    addToast(`${newStudents.length}명의 학생이 한 번에 추가되었습니다.`);
  };

  const handleUpdateStudent = (
    studentId: string,
    number: number,
    name: string,
    status?: StudentStatus
  ) => {
    const updated = students.map((s) =>
      s.id === studentId ? { ...s, number, name, status: status || s.status || 'active' } : s
    );
    setStudents(updated);
    saveStudents(updated);
    addToast('학생 정보가 수정되었습니다.');
  };

  const handleDeleteStudent = (studentId: string, mode: 'inactivate' | 'delete') => {
    if (mode === 'inactivate') {
      const updated = students.map((s) => (s.id === studentId ? { ...s, status: 'inactive' as StudentStatus } : s));
      setStudents(updated);
      saveStudents(updated);
      addToast('학생이 비활성화(전출) 처리되었습니다. 제출 기록은 보존됩니다.');
    } else {
      const updatedStudents = students.filter((s) => s.id !== studentId);
      setStudents(updatedStudents);
      saveStudents(updatedStudents);

      const updatedSubs = submissions.filter((sub) => sub.studentId !== studentId);
      setSubmissions(updatedSubs);
      saveSubmissions(updatedSubs);

      addToast('학생 및 관련 제출 기록이 완전 삭제되었습니다.');
    }
  };

  // CSV Import Confirm Handler
  const handleConfirmCSVImport = (targetClassId: string, parsedRows: ParsedStudentRow[]) => {
    const now = new Date().toISOString();
    const newStudents: Student[] = parsedRows.map((row, idx) => ({
      id: `stu_${Date.now()}_csv_${idx}`,
      classId: targetClassId,
      number: row.number,
      name: row.name,
      status: 'active',
      createdAt: now,
    }));

    const updated = [...students, ...newStudents];
    setStudents(updated);
    saveStudents(updated);
    addToast(`${newStudents.length}명의 학생 명단을 불러왔습니다.`, undefined, 'success');
  };

  // Assignment Management Handlers
  const handleCreateAssignment = (data: Omit<Assignment, 'id' | 'createdAt'>) => {
    const newAsg: Assignment = {
      id: `asg_${Date.now()}`,
      termId: currentTermId,
      status: 'active',
      ...data,
      createdAt: new Date().toISOString(),
    };
    const updated = [...assignments, newAsg];
    setAssignments(updated);
    saveAssignments(updated);
    addToast(`'${newAsg.title}' 과제가 생성되었습니다.`, undefined, 'success');
  };

  const handleUpdateAssignment = (
    id: string,
    data: Partial<Omit<Assignment, 'id' | 'createdAt'>>
  ) => {
    const updated = assignments.map((a) => (a.id === id ? { ...a, ...data } : a));
    setAssignments(updated);
    saveAssignments(updated);
    addToast('과제 정보가 수정되었습니다.');
  };

  const handleUpdateAssignmentStatus = (id: string, status: AssignmentStatus) => {
    const statusLabels = { active: '진행 중', closed: '마감', archived: '보관' };
    const updated = assignments.map((a) => (a.id === id ? { ...a, status } : a));
    setAssignments(updated);
    saveAssignments(updated);
    addToast(`과제 상태가 [${statusLabels[status]}](으)로 변경되었습니다.`);
  };

  const handleDeleteAssignment = (id: string) => {
    const updatedAsg = assignments.filter((a) => a.id !== id);
    setAssignments(updatedAsg);
    saveAssignments(updatedAsg);

    const updatedSubs = submissions.filter((s) => s.assignmentId !== id);
    setSubmissions(updatedSubs);
    saveSubmissions(updatedSubs);

    addToast('과제가 삭제되었습니다.');
  };

  const handleDuplicateAssignment = (id: string) => {
    const original = assignments.find((a) => a.id === id);
    if (!original) return;

    const duplicate: Assignment = {
      ...original,
      id: `asg_${Date.now()}`,
      termId: currentTermId,
      title: `${original.title} (복사본)`,
      createdAt: new Date().toISOString(),
    };

    const updated = [...assignments, duplicate];
    setAssignments(updated);
    saveAssignments(updated);
    addToast('과제가 복제되었습니다.');
  };

  // Backup JSON Restore Handler
  const handleRestoreBackupJSON = (backup: BackupData) => {
    setClasses(backup.classes || []);
    saveClasses(backup.classes || []);

    setStudents(backup.students || []);
    saveStudents(backup.students || []);

    const normAssignments = (backup.assignments || []).map((a) => ({
      ...a,
      status: a.status || 'active',
    }));
    setAssignments(normAssignments);
    saveAssignments(normAssignments);

    setSubmissions(backup.submissions || []);
    saveSubmissions(backup.submissions || []);

    if (backup.terms && backup.terms.length > 0) {
      setTerms(backup.terms);
      saveTerms(backup.terms);
      setCurrentTermId(backup.terms[0].id);
    }

    if (backup.templates) {
      setTemplates(backup.templates);
      saveTemplates(backup.templates);
    }

    if (backup.classes && backup.classes.length > 0) {
      setSelectedClassId(backup.classes[0].id);
    }

    addToast('백업 데이터가 성공적으로 복원되었습니다.', undefined, 'success');
  };

  // Clear All Data Handler
  const handleClearAllData = () => {
    clearAllData();
    setClasses([]);
    setStudents([]);
    setAssignments([]);
    setSubmissions([]);
    setSelectedClassId('');
    addToast('모든 데이터가 초기화되었습니다.');
  };

  // Quick Navigate Helper from Dashboard
  const handleNavigateTab = (
    tab: ViewTab,
    filterStatus: SubmissionStatus | 'all' = 'all',
    targetAssignmentIdParam?: string
  ) => {
    setAssignmentFilterStatus(filterStatus);
    if (targetAssignmentIdParam) {
      setTargetAssignmentId(targetAssignmentIdParam);
    }
    setCurrentTab(tab);
  };

  // Selected class title for print
  const selectedClassObj = classes.find((c) => c.id === selectedClassId);
  const printClassName = selectedClassObj ? selectedClassObj.name : '전체 학급';

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans flex flex-col antialiased">
      {/* App Header */}
      <Header
        classes={classes}
        selectedClassId={selectedClassId}
        onSelectClass={setSelectedClassId}
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setAssignmentFilterStatus('all');
          setCurrentTab(tab);
        }}
        terms={terms}
        currentTermId={currentTermId}
        onSelectTerm={handleSelectTerm}
        onOpenTermModal={() => setIsTermModalOpen(true)}
        onLoadSampleData={handleLoadSampleData}
        onCreateClassModalOpen={() => setCurrentTab('classes_manage')}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'dashboard' && (
          <DashboardView
            classes={classes}
            students={students}
            assignments={assignments}
            submissions={submissions}
            selectedClassId={selectedClassId}
            currentTerm={currentTerm || undefined}
            onNavigateTab={handleNavigateTab}
            onLoadSampleData={handleLoadSampleData}
            onCreateClassModalOpen={() => setCurrentTab('classes_manage')}
            onCreateAssignmentModalOpen={() => setIsCreateAssignmentModalOpen(true)}
          />
        )}

        {currentTab === 'assignment' && (
          <AssignmentView
            classes={classes}
            students={students}
            assignments={assignments.filter((a) => !a.termId || a.termId === currentTermId)}
            submissions={submissions}
            selectedClassId={selectedClassId}
            initialAssignmentId={targetAssignmentId}
            initialFilterStatus={assignmentFilterStatus}
            onUpdateSubmissionStatus={handleUpdateSubmissionStatus}
            onBatchUpdateStatus={handleBatchUpdateStatus}
            onOpenPrintModal={(asg, stus, subs) =>
              setPrintModalState({
                isOpen: true,
                assignment: asg,
                students: stus,
                submissions: subs,
              })
            }
            onCreateAssignmentModalOpen={() => {
              setCurrentTab('assignments_manage');
              setIsCreateAssignmentModalOpen(true);
            }}
            onUpdateAssignmentStatus={handleUpdateAssignmentStatus}
            onShowToast={(msg) => addToast(msg, undefined, 'info')}
          />
        )}

        {currentTab === 'student' && (
          <StudentView
            classes={classes}
            students={students}
            assignments={assignments.filter((a) => !a.termId || a.termId === currentTermId)}
            submissions={submissions}
            selectedClassId={selectedClassId}
            onUpdateSubmissionStatus={handleUpdateSubmissionStatus}
          />
        )}

        {currentTab === 'student_summary' && (
          <StudentSummaryView
            classes={classes}
            students={students}
            assignments={assignments}
            submissions={submissions}
            selectedClassId={selectedClassId}
            terms={terms}
            currentTermId={currentTermId}
            onNavigateToStudentView={(studentId) => {
              setCurrentTab('student');
            }}
          />
        )}

        {currentTab === 'matrix' && (
          <MatrixView
            classes={classes}
            students={students}
            assignments={assignments.filter((a) => !a.termId || a.termId === currentTermId)}
            submissions={submissions}
            selectedClassId={selectedClassId}
            onUpdateSubmissionStatus={handleUpdateSubmissionStatus}
          />
        )}

        {currentTab === 'templates_manage' && (
          <TemplateManagement
            templates={templates}
            onCreateTemplate={handleCreateTemplate}
            onUpdateTemplate={handleUpdateTemplate}
            onDeleteTemplate={handleDeleteTemplate}
            onCreateAssignmentFromTemplate={(tmpl) => {
              handleCreateAssignment({
                title: tmpl.assignmentTitle,
                description: tmpl.description,
                status: 'active',
                targetClassIds: tmpl.targetClassIds || ['all'],
                dueDate: (() => {
                  const today = new Date();
                  if (tmpl.dueRule === 'plus1') {
                    today.setDate(today.getDate() + 1);
                    return today.toISOString().split('T')[0];
                  }
                  if (tmpl.dueRule === 'plus3') {
                    today.setDate(today.getDate() + 3);
                    return today.toISOString().split('T')[0];
                  }
                  if (tmpl.dueRule === 'plus7') {
                    today.setDate(today.getDate() + 7);
                    return today.toISOString().split('T')[0];
                  }
                  if (tmpl.dueRule === 'custom' && tmpl.customDueDays) {
                    today.setDate(today.getDate() + tmpl.customDueDays);
                    return today.toISOString().split('T')[0];
                  }
                  return '';
                })(),
              });
              setCurrentTab('assignment');
            }}
          />
        )}

        {currentTab === 'assignments_manage' && (
          <AssignmentManagement
            assignments={assignments.filter((a) => !a.termId || a.termId === currentTermId)}
            classes={classes}
            submissions={submissions}
            templates={templates}
            onCreateAssignment={handleCreateAssignment}
            onUpdateAssignment={handleUpdateAssignment}
            onDeleteAssignment={handleDeleteAssignment}
            onDuplicateAssignment={handleDuplicateAssignment}
            onSaveAsTemplate={(data) => handleCreateTemplate(data)}
            isOpenModalImmediately={isCreateAssignmentModalOpen}
            onCloseModalImmediately={() => setIsCreateAssignmentModalOpen(false)}
          />
        )}

        {currentTab === 'classes_manage' && (
          <ClassManagement
            classes={classes}
            students={students}
            selectedClassId={selectedClassId}
            onSelectClass={setSelectedClassId}
            onCreateClass={handleCreateClass}
            onUpdateClass={handleUpdateClass}
            onDeleteClass={handleDeleteClass}
            onCreateStudent={handleCreateStudent}
            onBatchCreateStudents={handleBatchCreateStudents}
            onUpdateStudent={handleUpdateStudent}
            onDeleteStudent={handleDeleteStudent}
            onOpenCSVImportModal={() => setIsCSVImportModalOpen(true)}
          />
        )}

        {currentTab === 'data_manage' && (
          <DataManagementView
            classes={classes}
            students={students}
            assignments={assignments}
            submissions={submissions}
            onLoadSampleData={handleLoadSampleData}
            onRestoreBackupJSON={handleRestoreBackupJSON}
            onClearAllData={handleClearAllData}
          />
        )}
      </main>

      {/* CSV Student Import Modal */}
      <CSVImportModal
        isOpen={isCSVImportModalOpen}
        onClose={() => setIsCSVImportModalOpen(false)}
        classes={classes}
        selectedClassId={selectedClassId}
        onConfirmImport={handleConfirmCSVImport}
      />

      {/* Term Management Modal */}
      <TermManagementModal
        isOpen={isTermModalOpen}
        onClose={() => setIsTermModalOpen(false)}
        terms={terms}
        currentTermId={currentTermId}
        onSelectTerm={handleSelectTerm}
        onCreateTerm={handleCreateTerm}
        onUpdateTerm={handleUpdateTerm}
        onArchiveTerm={handleArchiveTerm}
      />

      {/* A4 Printable Report Modal */}
      <PrintModal
        isOpen={printModalState.isOpen}
        onClose={() => setPrintModalState((prev) => ({ ...prev, isOpen: false }))}
        assignment={printModalState.assignment}
        students={printModalState.students}
        submissions={printModalState.submissions}
        classNameTitle={printClassName}
      />

      {/* Toast & Undo Floating Bar */}
      <ToastContainer
        toasts={toasts}
        onDismiss={handleDismissToast}
        onUndo={handlePerformUndo}
      />
    </div>
  );
}
