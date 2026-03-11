import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Github, CheckCircle, Brain, BarChart2, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface Props {
  subjectId: number;
}

const EvaluationInsightsPanel = ({ subjectId }: Props) => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/project/${subjectId}/evaluation?user_id=${user?.id}`);
        setData(res.data);
      } catch (err) {
        console.error('Failed to fetch evaluation insights', err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchData();
  }, [subjectId, user?.id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-border bg-card">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) return null;

  const sortedContributions = Object.entries(data.contribution_summary)
    .sort(([, a], [, b]) => (b as number) - (a as number));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20">
          <Trophy className="h-8 w-8 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-foreground tracking-tight">Project Evaluation Insights</h2>
          <p className="text-sm font-medium text-muted-foreground">Comprehensive team performance analytical dashboard</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Contribution Leaderboard */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border border-border bg-card p-6 shadow-sm"
        >
          <div className="mb-6 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
              <BarChart2 className="h-5 w-5 text-primary" />
              Team Leaderboard
            </h3>
          </div>
          <div className="space-y-4">
            {sortedContributions.map(([name, score], i) => (
              <div key={name} className="flex items-center gap-4">
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-black",
                  i === 0 ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                )}>
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="mb-1 flex justify-between">
                    <span className="text-sm font-bold text-foreground">{name}</span>
                    <span className="text-sm font-black text-primary">{score as number}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-secondary">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${score}%` }}
                      className="h-full rounded-full bg-primary"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* GitHub Contribution Summary */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-border bg-card p-6 shadow-sm"
        >
          <div className="mb-6 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
              <Github className="h-5 w-5 text-indigo-500" />
              GitHub Activity
            </h3>
          </div>
          <div className="space-y-4 group">
            {Object.entries(data.commit_summary).map(([name, commits]) => (
              <div key={name} className="flex items-center justify-between rounded-xl bg-accent/30 p-4 transition-colors hover:bg-accent/50">
                <span className="text-sm font-bold text-foreground">{name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black text-foreground">{commits as number}</span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Commits</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Phase Completion Status */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-border bg-card p-6 shadow-sm md:col-span-2"
        >
          <div className="mb-6">
            <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Phase Milestones
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
            {data.phase_performance.map((phase: any) => (
              <div key={phase.phase} className={cn(
                "rounded-xl border p-4 text-center transition-all",
                phase.status === 'Completed' ? "border-green-500/30 bg-green-500/5" : "border-border bg-background"
              )}>
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2">{phase.phase.split(' ')[0]}</p>
                <div className="flex justify-center mb-2">
                  {phase.status === 'Completed' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <div className="h-5 w-5 rounded-full border-2 border-border" />}
                </div>
                <p className="text-[10px] font-black text-foreground">{phase.status}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* AI Performance Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-8 shadow-md md:col-span-2"
        >
          <div className="mb-6 flex items-center gap-3">
             <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
                <Brain className="h-6 w-6 text-primary" />
             </div>
             <h3 className="text-xl font-black text-foreground tracking-tight">AI Evaluation Summary</h3>
          </div>
          <div className="relative rounded-2xl bg-background/50 p-8 border border-border/50">
            <div className="absolute -top-3 left-6 bg-primary px-3 py-1 rounded-full">
              <span className="text-[10px] font-black text-primary-foreground uppercase tracking-widest">Team Performance</span>
            </div>
            <p className="text-sm font-medium leading-relaxed italic text-foreground whitespace-pre-wrap">
              "{data.ai_summary}"
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default EvaluationInsightsPanel;
