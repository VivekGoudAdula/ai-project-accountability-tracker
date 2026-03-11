import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useProjectStore } from '@/store/projectStore';
import DashboardLayout from '@/components/DashboardLayout';
import SubjectCard from '@/components/SubjectCard';
import { User, BookOpen, Calendar, Users, Clock, AlertCircle } from 'lucide-react';
import api from '@/lib/api';

const Dashboard = () => {
  const { user } = useAuthStore();
  const { subjects, phases, teamMembers, message, setDashboardData } = useProjectStore();
  const currentPhase = phases.find((p) => p.status === 'current');

  useEffect(() => {
    if (user?.id) {
      api.get(`/student/dashboard?user_id=${user.id}`)
        .then((res) => {
          setDashboardData(res.data);
        })
        .catch((err) => {
          console.error('Error fetching dashboard data:', err);
        });
      
      // Fetch current phase info
      useProjectStore.getState().fetchPhaseInfo();
    }
  }, [user?.id, setDashboardData]);

  const stats = [
    { icon: User, label: 'Roll Number', value: user?.rollNumber || 'Not set', color: 'from-primary to-[hsl(262,83%,58%)]' },
    { icon: BookOpen, label: 'Class Section', value: user?.classSection || 'Not set', color: 'from-[hsl(217,91%,60%)] to-[hsl(199,89%,48%)]' },
    { icon: Users, label: 'LG Group', value: user?.lgNumber || 'Not set', color: 'from-[hsl(160,84%,39%)] to-[hsl(168,80%,35%)]' },
    { icon: Calendar, label: 'Current Phase', value: `Week ${currentPhase?.week || 7}`, color: 'from-[hsl(25,95%,53%)] to-[hsl(38,92%,50%)]' },
  ];

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold text-foreground">Welcome back, {user?.name || 'Student'} 👋</h1>
          <p className="mt-1 text-muted-foreground">Here's an overview of your projects and progress.</p>
        </motion.div>

        {/* Phase Status Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-8 grid gap-4 lg:grid-cols-3"
        >
          <div className="lg:col-span-2 flex items-center justify-between rounded-2xl border border-primary/20 bg-card p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20">
                <Clock className="h-7 w-7 text-primary-foreground" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Active Phase</p>
                <p className="text-xl font-black text-foreground">{currentPhase?.title || 'Literature Survey'} <span className="text-primary text-sm">(Week {currentPhase?.week || 6})</span></p>
              </div>
            </div>
            <div className="hidden items-center gap-2 rounded-xl border border-warning/30 bg-warning/5 px-5 py-3 sm:flex">
              <AlertCircle className="h-5 w-5 text-warning" />
              <div>
                <p className="text-[10px] font-bold text-foreground uppercase tracking-tight">Deadline</p>
                <p className="text-xs font-medium text-warning">Sunday 11:59 PM</p>
              </div>
            </div>
          </div>
          
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Next Milestone</p>
            <div className="flex items-center gap-3">
              <div className="h-2 flex-1 rounded-full bg-secondary">
                <div 
                  className="h-full rounded-full bg-primary" 
                  style={{ width: `${((currentPhase?.week || 6) - 5) / 6 * 100}%` }} 
                />
              </div>
              <span className="text-xs font-bold text-foreground">{Math.round(((currentPhase?.week || 6) - 5) / 6 * 100)}%</span>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="group rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${item.color}`}>
                  <item.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="font-semibold text-foreground">{item.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Team Members */}
        {teamMembers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8 rounded-xl border border-border bg-card p-6"
          >
            <h2 className="mb-4 text-base font-semibold text-foreground">Team Members</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {teamMembers.map((m) => (
                <div key={m.name} className="flex items-center gap-3 rounded-lg border border-border bg-background p-3 transition-colors hover:bg-accent/30">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full gradient-primary text-xs font-bold text-primary-foreground">
                    {m.initials}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Subject Cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="mb-4 text-base font-semibold text-foreground" id="subjects">Subjects</h2>
          {message ? (
            <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/10 text-center p-8">
              <Users className="mb-4 h-12 w-12 text-muted-foreground opacity-20" />
              <p className="text-lg font-medium text-foreground">{message}</p>
              <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
                Your LG group needs 3 members to unlock subject workspaces. 
                Share your LG number with classmates to form a team!
              </p>
            </div>
          ) : subjects.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {subjects.map((s) => (
                <SubjectCard key={s.id} subject={s} />
              ))}
            </div>
          ) : (
            <div className="flex h-32 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/20 italic text-muted-foreground">
              <p>No subjects added yet.</p>
              <p className="text-xs">Projects will appear here once your team is fully formed.</p>
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
