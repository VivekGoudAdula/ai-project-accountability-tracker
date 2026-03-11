import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { useAuthStore } from '@/store/authStore';
import DashboardLayout from '@/components/DashboardLayout';
import PhaseTimeline from '@/components/PhaseTimeline';
import TaskList from '@/components/TaskList';
import SubmissionForm from '@/components/SubmissionForm';
import { Users, FileText, ArrowLeft, Rocket, Loader2, Clock } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const ProjectWorkspace = () => {
  const { id } = useParams();
  const { user } = useAuthStore();
  const { subjects, phases, tasks, teamId, leaderId, teamMembers: storeMembers } = useProjectStore();
  const [initializing, setInitializing] = useState(false);
  const [initData, setInitData] = useState({ title: '', description: '' });
  
  const subject = subjects.find((s) => s.id === id);
  
  useEffect(() => {
    if (user?.id) {
      if (subjects.length === 0) {
        api.get(`/student/dashboard?user_id=${user.id}`)
          .then((res) => {
            useProjectStore.getState().setDashboardData(res.data);
          })
          .catch((err) => {
            console.error('Error fetching dashboard data:', err);
          });
      }
      
      // Fetch phase info
      useProjectStore.getState().fetchPhaseInfo();
      
      // Fetch tasks if subject is ready
      if (subject?.name && user?.id) {
        useProjectStore.getState().fetchTasks(Number(user.id), subject.name);
        if (teamId) {
          useProjectStore.getState().fetchSubmissions(teamId, subject.name);
        }
      }
    }
  }, [user?.id, subjects.length, subject?.name]);

  const handleInitialize = async () => {
    if (!initData.title || !initData.description) {
      toast.error('Please enter both title and description');
      return;
    }

    setInitializing(true);
    try {
      await api.post('/project/initialize', {
        user_id: user?.id,
        team_id: teamId,
        subject: subject.name,
        title: initData.title,
        description: initData.description,
      });
      toast.success('Project initialized!');
      // Refresh global store data
      const res = await api.get(`/student/dashboard?user_id=${user?.id}`);
      useProjectStore.getState().setDashboardData(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to initialize project');
    } finally {
      setInitializing(false);
    }
  };

  const isLeader = user?.id && leaderId ? Number(user.id) === leaderId : false;
  const isInitialized = !!subject?.projectTitle;

  const currentPhase = phases.find((p) => p.status === 'current');

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl">
        {/* Breadcrumb */}
        <Link to="/dashboard" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <span className="text-sm font-medium text-primary">{subject.name}</span>
          <h1 className="mt-1 text-2xl font-bold text-foreground">
            {subject.projectTitle || 'Project Workspace'}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {isInitialized 
              ? 'Track progress, submit deliverables, and collaborate with your team.'
              : 'Initialize your project to start tracking progress.'}
          </p>
        </motion.div>

        {/* Uninitialized View */}
        {!isInitialized ? (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              {isLeader ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-2xl border border-primary/20 bg-card p-8 shadow-xl"
                >
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary">
                    <Rocket className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">Initialize Your Project</h2>
                  <p className="mt-2 text-muted-foreground">As the Team Leader, you need to set a title and description for this subject to unlock the workspace.</p>
                  
                  <div className="mt-8 space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">Project Title</label>
                      <Input 
                        placeholder="e.g., AI-Powered Study Assistant" 
                        value={initData.title}
                        onChange={(e) => setInitData({ ...initData, title: e.target.value })}
                        className="bg-background"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">Short Description</label>
                      <Textarea 
                        placeholder="What are you building? (e.g., A tool that helps students manage their schedules using LLMs)" 
                        rows={4}
                        value={initData.description}
                        onChange={(e) => setInitData({ ...initData, description: e.target.value })}
                        className="bg-background"
                      />
                    </div>
                    <Button 
                      className="w-full h-11 gap-2 text-base" 
                      onClick={handleInitialize}
                      disabled={initializing}
                    >
                      {initializing ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" /> Initializing…
                        </>
                      ) : (
                        <>
                          <Rocket className="h-5 w-5" /> Launch Workspace
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/10 text-center p-10">
                  <Clock className="mb-4 h-12 w-12 text-muted-foreground opacity-20" />
                  <h2 className="text-lg font-semibold text-foreground">Waiting for Team Leader</h2>
                  <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto">
                    Your team leader needs to set the project title and description before the workspace becomes active.
                  </p>
                </div>
              )}
            </div>
            <div>
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="mb-4 text-sm font-semibold text-foreground">Meet Your Team</h3>
                <div className="space-y-4">
                  {storeMembers.map((m) => (
                    <div key={m.name} className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-primary text-xs font-bold text-primary-foreground">
                        {m.initials}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{m.name}</p>
                        <p className="text-xs text-muted-foreground">{m.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Initialized View */
          <>
            {/* Horizontal Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="mb-6"
            >
              <PhaseTimeline phases={phases} />
            </motion.div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Left Column */}
              <div className="space-y-6 lg:col-span-2">
                {/* Project Overview */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="rounded-xl border border-border bg-card p-6"
                >
                  <div className="mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <h3 className="text-base font-semibold text-foreground">Project Overview</h3>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      { label: 'Project Title', value: subject.projectTitle },
                      { label: 'Current Phase', value: `${currentPhase?.title} (Week ${currentPhase?.week})` },
                      { label: 'Progress', value: `${subject.progress}%` },
                      { label: 'Deadline', value: 'Sunday 11:59 PM' },
                    ].map((item) => (
                      <div key={item.label} className="rounded-lg border border-border bg-background p-3">
                        <p className="text-xs text-muted-foreground">{item.label}</p>
                        <p className="mt-1 text-sm font-medium text-foreground">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Team Members */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="rounded-xl border border-border bg-card p-6"
                >
                  <div className="mb-4 flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <h3 className="text-base font-semibold text-foreground">Team Members</h3>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {storeMembers.map((m) => (
                      <div key={m.name} className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
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

                {/* Submission Form */}
                <SubmissionForm currentWeek={currentPhase?.week || 7} subjectName={subject.name} />
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <TaskList tasks={tasks} />
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProjectWorkspace;
