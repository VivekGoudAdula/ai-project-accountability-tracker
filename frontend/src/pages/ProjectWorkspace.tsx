import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { useAuthStore } from '@/store/authStore';
import DashboardLayout from '@/components/DashboardLayout';
import PhaseTimeline from '@/components/PhaseTimeline';
import TaskList from '@/components/TaskList';
import PhaseSubmissionPanel from '@/components/PhaseSubmissionPanel';
import PhaseTimer from '@/components/PhaseTimer';
import { Users, FileText, ArrowLeft, Rocket, Loader2, Clock, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const ProjectWorkspace = () => {
  const { id } = useParams();
  const { user } = useAuthStore();
  const { subjects, phases, tasks, leaderName, leaderId, teamMembers: storeMembers, currentPhaseInfo, teamSubmissionStatus } = useProjectStore();
  const [initializing, setInitializing] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [initData, setInitData] = useState({ title: '', description: '' });
  
  const subject = subjects.find((s) => s.id === id);
  
  useEffect(() => {
    if (!user?.id) return;
    
    const numericId = id ? Number(id) : NaN;
    if (isNaN(numericId)) return;

    if (subjects.length === 0) {
      setDashboardLoading(true);
      api.get(`/student/dashboard?user_id=${user.id}`)
        .then((res) => {
          useProjectStore.getState().setDashboardData(res.data);
        })
        .catch((err) => {
          console.error('Error fetching dashboard data:', err);
        })
        .finally(() => setDashboardLoading(false));
    }
    
    // Fetch tasks if subject is ready
    if (subject?.id) {
      useProjectStore.getState().fetchPhaseInfo(Number(user.id), numericId);
      useProjectStore.getState().fetchTasks(Number(user.id), numericId);
      useProjectStore.getState().fetchSubmissions(Number(user.id), numericId);
      useProjectStore.getState().fetchTeamSubmissionStatus(Number(user.id), numericId);
    }
    
    // Set up polling for phase progression
    let intervalId: NodeJS.Timeout;
    if (subject?.id && user?.id) {
      intervalId = setInterval(() => {
        useProjectStore.getState().fetchPhaseInfo(Number(user.id), numericId);
        useProjectStore.getState().fetchTeamSubmissionStatus(Number(user.id), numericId);
        // Refresh tasks and submissions seamlessly in background
        useProjectStore.getState().fetchTasks(Number(user.id), numericId);
        useProjectStore.getState().fetchSubmissions(Number(user.id), numericId);
      }, 5000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [user?.id, subjects.length, subject?.id, id]);

  const handleInitialize = async () => {
    if (!initData.title || !initData.description) {
      toast.error('Please enter both title and description');
      return;
    }

    setInitializing(true);
    try {
      await api.post(`/project/create?user_id=${user?.id}`, {
        subject_id: Number(subject?.id),
        title: initData.title,
        description: initData.description,
        class_section: user?.classSection,
        lg_number: Number(user?.lgNumber?.replace('LG ', ''))
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

  // Use leaderId (number) for reliable comparison; fall back to name if not loaded yet
  const isLeader = leaderId != null 
    ? Number(user?.id) === leaderId
    : user?.name === leaderName;
    
  // Show loader if dashboard is loading AND we don't know leadership yet
  const showInitLoader = dashboardLoading && leaderId == null;
  const isInitialized = !!subject?.projectTitle;

  const currentPhase = phases.find((p) => p.status === 'current');

  if (!subject) return (
    <DashboardLayout>
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl">
        {/* Breadcrumb */}
        <Link to="/dashboard" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {subject.name}
          </div>
          <h1 className="mt-2 text-3xl font-extrabold text-foreground tracking-tight">
            {subject.projectTitle || 'Project Workspace'}
          </h1>
          <p className="mt-2 text-muted-foreground text-lg">
            {isInitialized 
              ? 'Track progress, submit deliverables, and collaborate with your team.'
              : 'Initialize your project to start tracking progress.'}
          </p>
        </motion.div>

        {/* Uninitialized View */}
        {!isInitialized ? (
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              {isLeader ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-primary/20 bg-card p-10 shadow-2xl relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Rocket className="h-32 w-32" />
                  </div>
                  
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20">
                    <Rocket className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">Initialize Your Project</h2>
                  <p className="mt-3 text-muted-foreground text-base">As the Team Leader, you need to set a title and description for this subject to unlock the workspace for your entire team.</p>
                  
                  <div className="mt-10 space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-foreground uppercase tracking-tight">Project Title</label>
                      <Input 
                        placeholder="e.g., AI-Powered Study Assistant" 
                        value={initData.title}
                        onChange={(e) => setInitData({ ...initData, title: e.target.value })}
                        className="bg-background h-12 border-border/50 focus:border-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-foreground uppercase tracking-tight">Description</label>
                      <Textarea 
                        placeholder="What are you building? Describe the core goal and technology stack." 
                        rows={5}
                        value={initData.description}
                        onChange={(e) => setInitData({ ...initData, description: e.target.value })}
                        className="bg-background border-border/50 focus:border-primary resize-none"
                      />
                    </div>
                    <Button 
                      className="w-full h-14 gap-3 text-lg font-bold shadow-xl shadow-primary/20" 
                      onClick={handleInitialize}
                      disabled={initializing}
                    >
                      {initializing ? (
                        <>
                          <Loader2 className="h-6 w-6 animate-spin" /> Launching...
                        </>
                      ) : (
                        <>
                          <Rocket className="h-6 w-6" /> Launch Workspace
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              ) : showInitLoader ? (
                <div className="flex h-80 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/5">
                  <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
                  <p className="mt-4 text-sm text-muted-foreground">Loading team info...</p>
                </div>
              ) : (
                <div className="flex h-80 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/50 bg-card/5 text-center p-12">
                  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-secondary/50">
                    <Clock className="h-10 w-10 text-muted-foreground/40" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground italic">Waiting for Team Leader</h2>
                  <p className="mt-3 text-base text-muted-foreground max-w-sm mx-auto">
                    Your team leader <span className="text-primary font-bold">@{leaderName || 'Assigning...'}</span> needs to initialize the project before you can start collaborating.
                  </p>
                </div>
              )}
            </div>
            <div>
              <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">The Team</h3>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="space-y-5">
                  {storeMembers.map((m) => (
                    <div key={m.name} className="flex items-center gap-4 group">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                        <span className="text-xs font-bold">{m.initials}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-foreground">{m.name}</p>
                        <p className="text-xs text-muted-foreground font-medium">{m.role}</p>
                      </div>
                    </div>
                  ))}
                  {storeMembers.length < 3 && (
                    <div className="mt-4 rounded-lg bg-orange-500/5 border border-orange-500/20 p-4">
                      <p className="text-xs text-orange-600 font-medium leading-relaxed">
                        LG group is incomplete. Need {3 - storeMembers.length} more members to fully unlock all features.
                      </p>
                    </div>
                  )}
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
              className="mb-8"
            >
              <PhaseTimeline phases={phases} />
            </motion.div>

            <div className="grid gap-8 lg:grid-cols-3">
              {/* Left Column */}
              <div className="space-y-8 lg:col-span-2">
                {/* Project Overview */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="rounded-2xl border border-border bg-card p-8 shadow-sm"
                >
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground tracking-tight">Project Details</h3>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-border/50 bg-background/50 p-4 group transition-colors hover:border-primary/30">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Current Phase</p>
                          <p className="mt-2 text-base font-bold text-foreground">{currentPhaseInfo?.current_phase || subject.currentPhase}</p>
                        </div>
                        {currentPhaseInfo?.current_phase !== 'Evaluation' && currentPhaseInfo?.time_remaining !== undefined && (
                          <PhaseTimer initialTimeRemaining={currentPhaseInfo.time_remaining} />
                        )}
                      </div>
                    </div>
                    {[
                      { label: 'Progress Score', value: `${subject.progress}%`, subValue: 'Based on submissions' },
                      { label: 'Next Deadline', value: 'Manual Advance', highlight: true },
                      { label: 'Team Leader', value: leaderName || 'N/A' },
                    ].map((item) => (
                      <div key={item.label} className="rounded-xl border border-border/50 bg-background/50 p-4 group transition-colors hover:border-primary/30">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{item.label}</p>
                        <p className={`mt-2 text-base font-bold text-foreground ${item.highlight ? 'text-primary' : ''}`}>{item.value}</p>
                        {item.subValue && <p className="mt-1 text-[10px] text-muted-foreground font-medium">{item.subValue}</p>}
                      </div>
                    ))}
                  </div>

                  {/* Advance Phase Button */}
                  {currentPhaseInfo?.can_advance && (
                    <div className="mt-6">
                      <Button 
                        className="w-full h-12 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-900/20"
                        onClick={() => {
                          if (isLeader) {
                            useProjectStore.getState().advancePhase(Number(user?.id), Number(id));
                            toast.success(`Advanced to next phase!`);
                          } else {
                            toast.error(`Only the Team Leader (${leaderName}) can advance the phase.`);
                          }
                        }}
                      >
                        <Rocket className="h-4 w-4" /> Move to Next Phase: {phases[currentPhaseInfo.week_number + 1]?.title || 'Next'}
                      </Button>
                      {!isLeader && (
                        <p className="mt-2 text-[10px] text-center text-muted-foreground font-medium italic">
                          Waiting for Team Leader {leaderName} to click advance.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Submission Progress Sub-Panel */}
                  {currentPhaseInfo?.current_phase !== 'Evaluation' && (
                    <div className="mt-6 pt-6 border-t border-border/50">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-bold text-foreground tracking-tight">Phase Submission Progress</h4>
                        <span className="text-xs font-medium text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
                          {teamSubmissionStatus.filter(s => s.submitted).length} of 3 Submitted
                        </span>
                      </div>
                      <div className="flex flex-col gap-3">
                        {teamSubmissionStatus.map(member => (
                          <div key={member.id} className="flex items-center justify-between p-3 rounded-xl bg-background border border-border/40">
                            <span className="text-sm font-bold text-foreground">{member.name} {member.id === Number(user?.id) && "(You)"}</span>
                            {member.submitted ? (
                              <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-lg">
                                <CheckCircle2 className="h-4 w-4" />
                                <span className="text-xs font-bold">Submitted</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-muted-foreground bg-secondary px-3 py-1 rounded-lg">
                                <Clock className="h-4 w-4" />
                                <span className="text-xs font-bold">Pending</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>

                {/* Phase Submission Panel – handles all phases + evaluation */}
                <PhaseSubmissionPanel
                  subjectId={subject.id}
                  subjectName={subject.name}
                  currentPhase={subject.currentPhase}
                />
              </div>

              {/* Right Column */}
              <div className="space-y-8">
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
