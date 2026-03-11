import { create } from 'zustand';

export interface Subject {
  id: string;
  name: string;
  projectTitle?: string;
  currentPhase: number;
  progress: number;
}

export interface Phase {
  week: number;
  title: string;
  deadline: string;
  status: 'completed' | 'current' | 'upcoming';
}

export interface Task {
  id: string;
  member: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
}

interface ProjectState {
  subjects: Subject[];
  currentSubject: Subject | null;
  phases: Phase[];
  tasks: Task[];
  teamMembers: { name: string; initials: string; role: string }[];
  teamId: number | null;
  leaderId: number | null;
  message: string | null;
  setCurrentSubject: (s: Subject | null) => void;
  setSubjects: (s: Subject[]) => void;
  setDashboardData: (data: { 
    team_id?: number; 
    leader_id?: number; 
    members: { name: string }[]; 
    subjects: { id: number; subject: string; title: string | null }[];
    message?: string;
  }) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  subjects: [],
  currentSubject: null,
  phases: [
    { week: 6, title: 'Literature Survey', deadline: 'TBD', status: 'completed' },
    { week: 7, title: 'Project Design', deadline: 'TBD', status: 'current' },
    { week: 8, title: 'Implementation', deadline: 'TBD', status: 'upcoming' },
    { week: 9, title: 'Project Report', deadline: 'TBD', status: 'upcoming' },
    { week: 10, title: 'Presentation', deadline: 'TBD', status: 'upcoming' },
    { week: 11, title: 'Evaluation', deadline: 'TBD', status: 'upcoming' },
  ],
  tasks: [],
  teamMembers: [],
  teamId: null,
  leaderId: null,
  message: null,
  setCurrentSubject: (s) => set({ currentSubject: s }),
  setSubjects: (s) => set({ subjects: s }),
  setDashboardData: (data) => {
    const mappedSubjects: Subject[] = data.subjects.map((s) => ({
      id: String(s.id),
      name: s.subject,
      projectTitle: s.title || undefined,
      currentPhase: 7, 
      progress: s.title ? 15 : 0, 
    }));

    const mappedMembers = data.members.map((m) => ({
      name: m.name,
      initials: m.name.split(' ').map((n) => n[0]).join('').toUpperCase(),
      role: data.leader_id && data.leader_id === (m as any).id ? 'Team Leader' : 'Developer',
    }));

    set({
      subjects: mappedSubjects,
      teamMembers: mappedMembers,
      teamId: data.team_id || null,
      leaderId: data.leader_id || null,
      message: data.message || null,
    });
  },
}));
