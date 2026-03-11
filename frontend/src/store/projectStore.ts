import { create } from 'zustand';
import api from '@/lib/api';

export interface Subject {
  id: string;
  name: string;
  projectTitle?: string;
  currentPhase: string;
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
  leaderName: string | null;
  message: string | null;
  currentPhaseInfo: { week_number: number; current_phase: string; submission_open: boolean } | null;
  submissionHistory: any[];
  setCurrentSubject: (s: Subject | null) => void;
  setSubjects: (s: Subject[]) => void;
  setDashboardData: (data: any) => void;
  fetchPhaseInfo: () => Promise<void>;
  fetchTasks: (userId: number, subjectId: number) => Promise<void>;
  fetchSubmissions: (classSection: string, lgNumber: number, subjectId: number) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  subjects: [],
  currentSubject: null,
  phases: [],
  tasks: [],
  teamMembers: [],
  leaderName: null,
  message: null,
  currentPhaseInfo: null,
  submissionHistory: [],
  setCurrentSubject: (s) => set({ currentSubject: s }),
  setSubjects: (s) => set({ subjects: s }),
  setDashboardData: (data) => {
    const mappedSubjects: Subject[] = data.subjects.map((s: any) => ({
      id: String(s.id),
      name: s.name,
      projectTitle: s.project_title || undefined,
      currentPhase: s.phase || 'Phase 1: Project Setup',
      progress: s.progress || 0,
    }));

    const mappedMembers = data.team_members.map((name: string) => ({
      name: name,
      initials: name.split(' ').map((n: string) => n[0]).join('').toUpperCase(),
      role: name === data.leader ? 'Team Leader' : 'Team Member',
    }));

    set({
      subjects: mappedSubjects,
      teamMembers: mappedMembers,
      leaderName: data.leader || null,
      message: data.team_members.length < 3 ? "Wait for 3 members to join your LG" : null,
    });
  },
  fetchPhaseInfo: async () => {
    try {
      const res = await api.get('/phase/current');
      const info = res.data;
      
      const phaseMap = info.phase_map;
      const phases: Phase[] = Object.entries(phaseMap).map(([week, title]: [string, any]) => {
        const weekNum = parseInt(week);
        let status: 'completed' | 'current' | 'upcoming' = 'upcoming';
        if (weekNum < info.week_number) status = 'completed';
        else if (weekNum === info.week_number) status = 'current';
        
        return {
          week: weekNum,
          title: title as string,
          deadline: 'Sunday 11:59 PM',
          status
        };
      });

      set({ 
        phases, 
        currentPhaseInfo: {
          week_number: info.week_number,
          current_phase: info.current_phase,
          submission_open: info.submission_open
        }
      });
    } catch (err) {
      console.error('Failed to fetch phase info', err);
    }
  },
  fetchTasks: async (userId: number, subjectId: number) => {
    try {
      const res = await api.get(`/tasks?user_id=${userId}&subject_id=${subjectId}`);
      
      const mappedTasks: Task[] = res.data.map((t: any) => {
        return {
          id: String(t.id),
          member: `Member ${t.member_id}`,
          description: t.task,
          status: 'pending'
        };
      });
      set({ tasks: mappedTasks });
    } catch (err) {
      console.error('Failed to fetch tasks', err);
    }
  },
  fetchSubmissions: async (classSection: string, lgNumber: number, subjectId: number) => {
    try {
      const res = await api.get(`/submission/history?class_section=${classSection}&lg_number=${lgNumber}&subject_id=${subjectId}`);
      set({ submissionHistory: res.data });
    } catch (err) {
      console.error('Failed to fetch submission history', err);
    }
  }
}));
