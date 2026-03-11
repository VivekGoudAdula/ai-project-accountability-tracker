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
  teamMembers: { name: string; initials: string; role: string; id: number }[];
  teamId: number | null;
  leaderId: number | null;
  message: string | null;
  currentPhaseInfo: { week_number: number; current_phase: string; submission_open: boolean } | null;
  submissionHistory: any[];
  setCurrentSubject: (s: Subject | null) => void;
  setSubjects: (s: Subject[]) => void;
  setDashboardData: (data: any) => void;
  fetchPhaseInfo: () => Promise<void>;
  fetchTasks: (userId: number, subject: string) => Promise<void>;
  fetchSubmissions: (teamId: number, subject: string) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  subjects: [],
  currentSubject: null,
  phases: [],
  tasks: [],
  teamMembers: [],
  teamId: null,
  leaderId: null,
  message: null,
  currentPhaseInfo: null,
  submissionHistory: [],
  setCurrentSubject: (s) => set({ currentSubject: s }),
  setSubjects: (s) => set({ subjects: s }),
  setDashboardData: (data) => {
    const mappedSubjects: Subject[] = data.subjects.map((s: any) => ({
      id: String(s.id),
      name: s.subject,
      projectTitle: s.title || undefined,
      currentPhase: 6, // default
      progress: s.title ? 15 : 0,
    }));

    const mappedMembers = data.members.map((m: any) => ({
      id: m.id,
      name: m.name,
      initials: m.name.split(' ').map((n: string) => n[0]).join('').toUpperCase(),
      role: data.leader_id && data.leader_id === m.id ? 'Team Leader' : 'Developer',
    }));

    set({
      subjects: mappedSubjects,
      teamMembers: mappedMembers,
      teamId: data.team_id || null,
      leaderId: data.leader_id || null,
      message: data.message || null,
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
  fetchTasks: async (userId: number, subject: string) => {
    try {
      const res = await api.get(`/tasks?user_id=${userId}&subject=${subject}`);
      const members = get().teamMembers;
      
      const mappedTasks: Task[] = res.data.map((t: any) => {
        const member = members.find(m => m.id === t.member_id);
        return {
          id: String(t.id),
          member: member ? member.name : `Member ${t.member_id}`,
          description: t.task,
          status: 'pending' // Default status for now
        };
      });
      set({ tasks: mappedTasks });
    } catch (err) {
      console.error('Failed to fetch tasks', err);
    }
  },
  fetchSubmissions: async (teamId: number, subject: string) => {
    try {
      const res = await api.get(`/submission/history?team_id=${teamId}&subject=${subject}`);
      set({ submissionHistory: res.data });
    } catch (err) {
      console.error('Failed to fetch submission history', err);
    }
  }
}));
