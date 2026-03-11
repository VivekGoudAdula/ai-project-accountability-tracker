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
          className="mb-6 flex items-center justify-between rounded-xl border border-border bg-card p-5"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary">
              <Clock className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Current Phase</p>
              <p className="text-lg font-bold text-foreground">{currentPhase?.title || 'Project Design'} (Week {currentPhase?.week || 7})</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-4 py-2 sm:flex">
            <AlertCircle className="h-4 w-4 text-warning" />
            <div>
              <p className="text-xs font-medium text-foreground">Deadline</p>
              <p className="text-xs text-muted-foreground">Sunday 11:59 PM</p>
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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
