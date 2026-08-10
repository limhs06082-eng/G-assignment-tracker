export type SubmissionStatus = 'unsubmitted' | 'submitted' | 'supplement' | 'completed';

export type AssignmentStatus = 'active' | 'closed' | 'archived';

export type TermStatus = 'active' | 'archived';

export type StudentStatus = 'active' | 'inactive';

export type DueRuleType = 'none' | 'plus1' | 'plus3' | 'plus7' | 'custom';

export interface Term {
  id: string;
  schoolYear: string; // e.g. "2026"
  semester: string;   // e.g. "2학기"
  name: string;       // e.g. "2026학년도 2학기"
  status: TermStatus; // 'active' | 'archived'
  createdAt: string;
}

export interface ClassGroup {
  id: string;
  termId: string; // 학기 ID
  name: string;
  createdAt: string;
}

export interface Student {
  id: string;
  classId: string;
  number: number; // 학생 번호
  name: string; // 학생 이름
  status?: StudentStatus; // 'active' (default) | 'inactive'
  createdAt: string;
}

export interface Assignment {
  id: string;
  termId?: string; // 학기 ID
  title: string;
  description: string;
  dueDate: string; // YYYY-MM-DD or empty
  createdAt: string;
  targetClassIds: string[]; // ['all'] or array of classIds
  status?: AssignmentStatus; // 'active' | 'closed' | 'archived'
}

export interface Submission {
  id: string; // `${assignmentId}_${studentId}`
  assignmentId: string;
  studentId: string;
  status: SubmissionStatus;
  note: string; // 보완 메모 등
  updatedAt: string;
}

export interface AssignmentTemplate {
  id: string;
  title: string;           // 템플릿 명칭 (예: "주간 독서 감상문")
  assignmentTitle: string; // 과제 제목 (예: "독서 감상문")
  description: string;     // 설명 및 제출 안내
  targetClassIds: string[];// 기본 대상 반
  dueRule: DueRuleType;    // 기한 설정 방식
  customDueDays?: number;  // custom 설정일 경우 일수
  createdAt: string;
}

export interface UndoAction {
  id: string;
  timestamp: number;
  description: string; // e.g. "김민준 → 제출"
  previousSubmissions: Submission[];
}

export interface ToastMessage {
  id: string;
  message: string;
  undoActionId?: string;
  type?: 'info' | 'success' | 'warning';
}

export interface BackupData {
  version: string;
  schemaVersion?: number; // schemaVersion: 3
  exportedAt: string;
  terms?: Term[];
  selectedTermId?: string;
  classes: ClassGroup[];
  students: Student[];
  assignments: Assignment[];
  submissions: Submission[];
  templates?: AssignmentTemplate[];
}

export type ViewTab =
  | 'dashboard'
  | 'assignment'
  | 'student'
  | 'student_summary'
  | 'matrix'
  | 'assignments_manage'
  | 'templates_manage'
  | 'classes_manage'
  | 'data_manage';

