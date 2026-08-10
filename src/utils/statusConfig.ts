import { SubmissionStatus } from '../types';

export interface StatusMeta {
  key: SubmissionStatus;
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  buttonBg: string;
  buttonHover: string;
  activeRing: string;
  dotColor: string;
  description: string;
}

export const STATUS_CONFIG: Record<SubmissionStatus, StatusMeta> = {
  unsubmitted: {
    key: 'unsubmitted',
    label: '미제출',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-600',
    badgeBorder: 'border-slate-200',
    buttonBg: 'bg-slate-200 text-slate-800',
    buttonHover: 'hover:bg-slate-300',
    activeRing: 'ring-slate-400',
    dotColor: 'bg-slate-400',
    description: '과제를 아직 제출하지 않았습니다.',
  },
  submitted: {
    key: 'submitted',
    label: '제출',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-200',
    buttonBg: 'bg-blue-100 text-blue-800',
    buttonHover: 'hover:bg-blue-200',
    activeRing: 'ring-blue-400',
    dotColor: 'bg-blue-500',
    description: '과제를 제출하여 검토 대기 중입니다.',
  },
  supplement: {
    key: 'supplement',
    label: '보완',
    badgeBg: 'bg-orange-100',
    badgeText: 'text-orange-700',
    badgeBorder: 'border-orange-200',
    buttonBg: 'bg-orange-100 text-orange-900',
    buttonHover: 'hover:bg-orange-200',
    activeRing: 'ring-orange-400',
    dotColor: 'bg-orange-500',
    description: '내용 보완 또는 다시 제출이 필요합니다.',
  },
  completed: {
    key: 'completed',
    label: '완료',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
    buttonBg: 'bg-emerald-100 text-emerald-800',
    buttonHover: 'hover:bg-emerald-200',
    activeRing: 'ring-emerald-400',
    dotColor: 'bg-emerald-500',
    description: '과제 확인이 완료되었습니다.',
  },
};

export const STATUS_LIST: SubmissionStatus[] = ['unsubmitted', 'submitted', 'supplement', 'completed'];

export function getNextStatus(current: SubmissionStatus): SubmissionStatus {
  switch (current) {
    case 'unsubmitted':
      return 'submitted';
    case 'submitted':
      return 'completed';
    case 'supplement':
      return 'completed';
    case 'completed':
      return 'unsubmitted';
    default:
      return 'submitted';
  }
}
