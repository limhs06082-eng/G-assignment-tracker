import {
  Assignment,
  AssignmentTemplate,
  BackupData,
  ClassGroup,
  Student,
  Submission,
  SubmissionStatus,
  Term,
} from '../types';

const STORAGE_KEYS = {
  TERMS: 'student_tracker_terms_v1',
  SELECTED_TERM_ID: 'student_tracker_selected_term_id_v1',
  CLASSES: 'student_tracker_classes_v1',
  STUDENTS: 'student_tracker_students_v1',
  ASSIGNMENTS: 'student_tracker_assignments_v1',
  SUBMISSIONS: 'student_tracker_submissions_v1',
  SELECTED_CLASS_ID: 'student_tracker_selected_class_id_v1',
  TEMPLATES: 'student_tracker_templates_v1',
};

// High-entropy ID generator to prevent collision during fast rapid operations
export function generateUniqueId(prefix: string = 'id'): string {
  const timestamp = Date.now();
  const rand1 = Math.random().toString(36).substring(2, 9);
  const rand2 = Math.random().toString(36).substring(2, 6);
  return `${prefix}_${timestamp}_${rand1}${rand2}`;
}

// Local timezone-safe YYYY-MM-DD date string
export function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Safe JSON Parse helper
function safeGet<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    const parsed = JSON.parse(item);
    return parsed !== null && parsed !== undefined ? parsed : fallback;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return fallback;
  }
}

// Validate and Clean Backup / App Data for total integrity
export function validateAndCleanData(raw: Partial<BackupData>): BackupData {
  const defaultTermId = raw.terms?.[0]?.id || DEFAULT_TERM.id;

  // 1. Terms
  const termsArr = Array.isArray(raw.terms) ? raw.terms : [];
  const validTerms: Term[] = termsArr.length > 0 ? termsArr : [DEFAULT_TERM];

  const termIds = new Set(validTerms.map((t) => t.id));

  // 2. Classes
  const classesArr = Array.isArray(raw.classes) ? raw.classes : [];
  const validClasses: ClassGroup[] = classesArr
    .filter((c) => c && typeof c === 'object' && c.id)
    .map((c) => ({
      ...c,
      termId: c.termId && termIds.has(c.termId) ? c.termId : defaultTermId,
      name: c.name || '무명 학급',
      createdAt: c.createdAt || new Date().toISOString(),
    }));

  const classIds = new Set(validClasses.map((c) => c.id));

  // 3. Students
  const studentsArr = Array.isArray(raw.students) ? raw.students : [];
  const validStudents: Student[] = studentsArr
    .filter((s) => s && typeof s === 'object' && s.id && s.name)
    .map((s) => ({
      ...s,
      classId: s.classId || (validClasses[0]?.id || 'class_default'),
      number: typeof s.number === 'number' && !isNaN(s.number) ? s.number : 1,
      name: String(s.name).trim(),
      status: s.status === 'inactive' ? 'inactive' : 'active',
      createdAt: s.createdAt || new Date().toISOString(),
    }));

  const studentIds = new Set(validStudents.map((s) => s.id));

  // 4. Assignments
  const asgArr = Array.isArray(raw.assignments) ? raw.assignments : [];
  const validAssignments: Assignment[] = asgArr
    .filter((a) => a && typeof a === 'object' && a.id && a.title)
    .map((a) => ({
      ...a,
      termId: a.termId && termIds.has(a.termId) ? a.termId : defaultTermId,
      title: String(a.title).trim(),
      status: a.status === 'closed' || a.status === 'archived' ? a.status : 'active',
      targetClassIds: Array.isArray(a.targetClassIds) && a.targetClassIds.length > 0 ? a.targetClassIds : ['all'],
      createdAt: a.createdAt || new Date().toISOString(),
    }));

  const assignmentIds = new Set(validAssignments.map((a) => a.id));

  // 5. Submissions (Deduplicate & Remove Orphans)
  const subArr = Array.isArray(raw.submissions) ? raw.submissions : [];
  const submissionMap = new Map<string, Submission>();

  subArr.forEach((sub) => {
    if (!sub || typeof sub !== 'object' || !sub.assignmentId || !sub.studentId) return;

    // Orphan check: only keep if assignment and student exist
    if (!assignmentIds.has(sub.assignmentId) || !studentIds.has(sub.studentId)) return;

    const subId = `${sub.assignmentId}_${sub.studentId}`;
    const status: SubmissionStatus = ['unsubmitted', 'submitted', 'supplement', 'completed'].includes(sub.status)
      ? sub.status
      : 'unsubmitted';

    submissionMap.set(subId, {
      id: subId,
      assignmentId: sub.assignmentId,
      studentId: sub.studentId,
      status,
      note: typeof sub.note === 'string' ? sub.note : '',
      updatedAt: sub.updatedAt || new Date().toISOString(),
    });
  });

  // 6. Templates
  const tmplArr = Array.isArray(raw.templates) ? raw.templates : [];
  const validTemplates: AssignmentTemplate[] =
    tmplArr.length > 0
      ? tmplArr.filter((t) => t && typeof t === 'object' && t.id && t.title)
      : DEFAULT_TEMPLATES;

  return {
    version: raw.version || '1.0.0',
    exportedAt: raw.exportedAt || new Date().toISOString(),
    schemaVersion: 3,
    terms: validTerms,
    classes: validClasses,
    students: validStudents,
    assignments: validAssignments,
    submissions: Array.from(submissionMap.values()),
    templates: validTemplates,
  };
}

function safeSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing ${key} to localStorage:`, error);
  }
}

export const DEFAULT_TERM: Term = {
  id: 'term_default_2026_2',
  schoolYear: '2026',
  semester: '2학기',
  name: '2026학년도 2학기',
  status: 'active',
  createdAt: new Date().toISOString(),
};

export const DEFAULT_TEMPLATES: AssignmentTemplate[] = [
  {
    id: 'tmpl_reading',
    title: '주간 독서 감상문',
    assignmentTitle: '독서 감상문',
    description: '이번 주에 읽은 도서 한 권을 선택하여 감상을 작성해 제출하세요.',
    targetClassIds: ['all'],
    dueRule: 'plus7',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tmpl_math',
    title: '수학 복습 학습지',
    assignmentTitle: '수학 학습지',
    description: '수학 단원 복습 학습지를 풀고 제출하세요.',
    targetClassIds: ['all'],
    dueRule: 'plus3',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tmpl_science',
    title: '과학 탐구 보고서',
    assignmentTitle: '과학 탐구 보고서',
    description: '실험 관찰 일지 및 탐구 결과를 작성하여 제출하세요.',
    targetClassIds: ['all'],
    dueRule: 'plus3',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tmpl_dictation',
    title: '받아쓰기 연습',
    assignmentTitle: '받아쓰기 틀린 낱말 고쳐 쓰기',
    description: '틀린 낱말을 3번씩 고쳐 쓰고 부모님 서명을 받아 제출하세요.',
    targetClassIds: ['all'],
    dueRule: 'plus1',
    createdAt: new Date().toISOString(),
  },
];

// Terms Load / Save
export function loadTerms(): Term[] {
  let terms = safeGet<Term[]>(STORAGE_KEYS.TERMS, []);
  if (terms.length === 0) {
    terms = [DEFAULT_TERM];
    saveTerms(terms);
  }
  return terms;
}

export function saveTerms(terms: Term[]): void {
  safeSet(STORAGE_KEYS.TERMS, terms);
}

export function loadSelectedTermId(): string {
  const terms = loadTerms();
  const savedId = safeGet<string>(STORAGE_KEYS.SELECTED_TERM_ID, '');
  if (savedId && terms.some((t) => t.id === savedId)) {
    return savedId;
  }
  // Return first active term, or first term
  const activeTerm = terms.find((t) => t.status === 'active') || terms[0];
  return activeTerm ? activeTerm.id : DEFAULT_TERM.id;
}

export function saveSelectedTermId(termId: string): void {
  safeSet(STORAGE_KEYS.SELECTED_TERM_ID, termId);
}

// Data loaders with Auto-Migration
export function loadClasses(): ClassGroup[] {
  const classes = safeGet<ClassGroup[]>(STORAGE_KEYS.CLASSES, []);
  const terms = loadTerms();
  const defaultTermId = terms[0]?.id || DEFAULT_TERM.id;

  let modified = false;
  const migratedClasses = classes.map((c) => {
    if (!c.termId) {
      modified = true;
      return { ...c, termId: defaultTermId };
    }
    return c;
  });

  if (modified) {
    saveClasses(migratedClasses);
  }

  return migratedClasses;
}

export function saveClasses(classes: ClassGroup[]): void {
  safeSet(STORAGE_KEYS.CLASSES, classes);
}

export function loadStudents(): Student[] {
  const students = safeGet<Student[]>(STORAGE_KEYS.STUDENTS, []);
  let modified = false;
  const migratedStudents = students.map((s) => {
    if (!s.status) {
      modified = true;
      return { ...s, status: 'active' as const };
    }
    return s;
  });

  if (modified) {
    saveStudents(migratedStudents);
  }

  return migratedStudents;
}

export function saveStudents(students: Student[]): void {
  safeSet(STORAGE_KEYS.STUDENTS, students);
}

export function loadAssignments(): Assignment[] {
  const list = safeGet<Assignment[]>(STORAGE_KEYS.ASSIGNMENTS, []);
  const terms = loadTerms();
  const defaultTermId = terms[0]?.id || DEFAULT_TERM.id;

  let modified = false;
  const migratedList = list.map((asg) => {
    let updatedAsg = { ...asg };
    if (!updatedAsg.status) {
      updatedAsg.status = 'active';
      modified = true;
    }
    if (!updatedAsg.termId) {
      updatedAsg.termId = defaultTermId;
      modified = true;
    }
    return updatedAsg;
  });

  if (modified) {
    saveAssignments(migratedList);
  }

  return migratedList;
}

export function saveAssignments(assignments: Assignment[]): void {
  safeSet(STORAGE_KEYS.ASSIGNMENTS, assignments);
}

export function loadSubmissions(): Submission[] {
  return safeGet<Submission[]>(STORAGE_KEYS.SUBMISSIONS, []);
}

export function saveSubmissions(submissions: Submission[]): void {
  safeSet(STORAGE_KEYS.SUBMISSIONS, submissions);
}

export function loadSelectedClassId(): string {
  return safeGet<string>(STORAGE_KEYS.SELECTED_CLASS_ID, '');
}

export function saveSelectedClassId(classId: string): void {
  safeSet(STORAGE_KEYS.SELECTED_CLASS_ID, classId);
}

// Templates Load / Save
export function loadTemplates(): AssignmentTemplate[] {
  let tmpls = safeGet<AssignmentTemplate[]>(STORAGE_KEYS.TEMPLATES, []);
  if (tmpls.length === 0) {
    tmpls = DEFAULT_TEMPLATES;
    saveTemplates(tmpls);
  }
  return tmpls;
}

export function saveTemplates(templates: AssignmentTemplate[]): void {
  safeSet(STORAGE_KEYS.TEMPLATES, templates);
}

// Generate Sample Data for First-time users or testing
export function generateSampleData(): {
  terms: Term[];
  classes: ClassGroup[];
  students: Student[];
  assignments: Assignment[];
  submissions: Submission[];
  templates: AssignmentTemplate[];
} {
  const now = new Date().toISOString();
  const today = new Date().toISOString().split('T')[0];

  const tomorrowObj = new Date();
  tomorrowObj.setDate(tomorrowObj.getDate() + 1);
  const tomorrow = tomorrowObj.toISOString().split('T')[0];

  const pastObj = new Date();
  pastObj.setDate(pastObj.getDate() - 2);
  const pastDate = pastObj.toISOString().split('T')[0];

  const termId = 'term_sample_2026_2';
  const terms: Term[] = [
    {
      id: termId,
      schoolYear: '2026',
      semester: '2학기',
      name: '2026학년도 2학기',
      status: 'active',
      createdAt: now,
    },
  ];

  const classId1 = 'class_sample_1';

  const classes: ClassGroup[] = [
    {
      id: classId1,
      termId: termId,
      name: '6학년 1반',
      createdAt: now,
    },
  ];

  const sampleStudentNames = ['김민준', '이서연', '박지우', '최유진', '정민호', '윤서아', '도현우', '한지아'];
  const students: Student[] = sampleStudentNames.map((name, index) => ({
    id: `student_sample_${index + 1}`,
    classId: classId1,
    number: index + 1,
    name,
    status: 'active' as const,
    createdAt: now,
  }));

  const assignments: Assignment[] = [
    {
      id: 'asg_sample_1',
      termId: termId,
      title: '독서 감상문',
      description: '이번 주 읽은 도서 한 권을 선택하여 A4 1장 이내로 작성해 제출하세요.',
      dueDate: today,
      createdAt: now,
      targetClassIds: ['all'],
      status: 'active',
    },
    {
      id: 'asg_sample_2',
      termId: termId,
      title: '수학 학습지',
      description: '단원평가 준비 수학 학습지 3쪽 풀이 제출',
      dueDate: tomorrow,
      createdAt: now,
      targetClassIds: ['all'],
      status: 'active',
    },
    {
      id: 'asg_sample_3',
      termId: termId,
      title: '과학 탐구 보고서',
      description: '식물 관찰 일지 및 탐구 결과 제출',
      dueDate: pastDate,
      createdAt: now,
      targetClassIds: ['all'],
      status: 'active',
    },
  ];

  // Pre-fill some submissions
  const initialStatuses: Record<string, { status: SubmissionStatus; note: string }> = {
    'asg_sample_1_student_sample_1': { status: 'completed', note: '' },
    'asg_sample_1_student_sample_2': { status: 'submitted', note: '' },
    'asg_sample_1_student_sample_3': { status: 'supplement', note: '사진 화질이 흐립니다. 다시 촬영해 주세요.' },
    'asg_sample_1_student_sample_4': { status: 'unsubmitted', note: '' },
    'asg_sample_1_student_sample_5': { status: 'completed', note: '' },

    'asg_sample_2_student_sample_1': { status: 'completed', note: '' },
    'asg_sample_2_student_sample_2': { status: 'unsubmitted', note: '' },
    'asg_sample_2_student_sample_3': { status: 'submitted', note: '' },

    'asg_sample_3_student_sample_1': { status: 'completed', note: '' },
    'asg_sample_3_student_sample_2': { status: 'completed', note: '' },
    'asg_sample_3_student_sample_3': { status: 'supplement', note: '실험 결론 부분 누락' },
  };

  const submissions: Submission[] = [];

  assignments.forEach((asg) => {
    students.forEach((stu) => {
      const subId = `${asg.id}_${stu.id}`;
      const preset = initialStatuses[subId] || { status: 'unsubmitted', note: '' };
      submissions.push({
        id: subId,
        assignmentId: asg.id,
        studentId: stu.id,
        status: preset.status,
        note: preset.note,
        updatedAt: now,
      });
    });
  });

  return { terms, classes, students, assignments, submissions, templates: DEFAULT_TEMPLATES };
}

// Clear all app data
export function clearAllData(): void {
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
}

// CSV Parsing Helper for Student Import
export interface ParsedStudentRow {
  className?: string;
  number: number;
  name: string;
}

export function parseStudentsCSV(csvText: string): ParsedStudentRow[] {
  const lines = csvText.split(/\r?\n/).map((line) => line.trim()).filter((line) => line.length > 0);
  if (lines.length === 0) return [];

  const results: ParsedStudentRow[] = [];

  let startIndex = 0;
  const firstLine = lines[0].toLowerCase();
  if (
    firstLine.includes('번호') ||
    firstLine.includes('이름') ||
    firstLine.includes('반') ||
    firstLine.includes('name') ||
    firstLine.includes('number')
  ) {
    startIndex = 1;
  }

  for (let i = startIndex; i < lines.length; i++) {
    const rawLine = lines[i];
    const parts = rawLine.includes(',')
      ? rawLine.split(',').map((p) => p.trim())
      : rawLine.includes('\t')
      ? rawLine.split('\t').map((p) => p.trim())
      : rawLine.split(/\s+/).map((p) => p.trim());

    if (parts.length === 0) continue;

    if (parts.length >= 3) {
      const className = parts[0];
      const num = parseInt(parts[1], 10);
      const name = parts[2];
      if (!isNaN(num) && name) {
        results.push({ className, number: num, name });
      }
    } else if (parts.length === 2) {
      const num = parseInt(parts[0], 10);
      const name = parts[1];
      if (!isNaN(num) && name) {
        results.push({ number: num, name });
      }
    } else if (parts.length === 1 && parts[0].length > 0) {
      results.push({ number: results.length + 1, name: parts[0] });
    }
  }

  return results;
}

// CSV Export Helper
export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]): void {
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row
        .map((cell) => {
          const str = String(cell ?? '');
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(',')
    ),
  ].join('\n');

  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// JSON Backup Download
export function downloadBackupJSON(backupData: BackupData): void {
  const jsonStr = JSON.stringify(
    {
      ...backupData,
      schemaVersion: 3,
    },
    null,
    2
  );
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const dateStr = new Date().toISOString().split('T')[0];
  const link = document.createElement('a');
  link.href = url;
  link.download = `student_tracker_backup_${dateStr}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
