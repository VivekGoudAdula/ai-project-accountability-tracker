import { useState } from 'react';
import { motion } from 'framer-motion';
import { Github, Code2, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { toast } from 'sonner';

interface Props {
  subjectId: string;
  onSuccess: (result: { score: number; feedback: string; status: string }) => void;
}

const ImplementationSubmission = ({ subjectId, onSuccess }: Props) => {
  const { user } = useAuthStore();
  const [githubLink, setGithubLink] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubLink.trim()) {
      toast.error('Please provide a GitHub repository link.');
      return;
    }
    if (!description.trim()) {
      toast.error('Please describe your implementation.');
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('user_id', String(user?.id));
      fd.append('subject_id', subjectId);
      fd.append('phase', 'Implementation');
      fd.append('description', description);
      fd.append('github_link', githubLink);

      const res = await api.post('/submission/create', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Implementation submitted!');
      onSuccess({ score: res.data.submission.ai_score, feedback: res.data.submission.ai_feedback, status: res.data.submission.status });
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.form onSubmit={handleSubmit} className="space-y-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center gap-3 mb-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15">
          <Code2 className="h-5 w-5 text-emerald-500" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">Implementation</p>
          <p className="text-[11px] text-muted-foreground">GitHub repository link + description</p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-foreground uppercase tracking-wider">Repository Link</label>
        <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-background px-4 h-12 transition-all focus-within:ring-2 focus-within:ring-primary/30">
          <Github className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            type="url"
            placeholder="https://github.com/team/project"
            value={githubLink}
            onChange={(e) => setGithubLink(e.target.value)}
            className="border-0 bg-transparent shadow-none focus-visible:ring-0 font-medium h-full"
            required
          />
        </div>
        <p className="text-[11px] text-muted-foreground">AI will analyze GitHub commit history for each team member.</p>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-foreground uppercase tracking-wider">Implementation Description</label>
        <Textarea
          placeholder="Describe what you implemented: features, technologies used, your personal contribution..."
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="bg-background border-border/50 focus:border-primary resize-none"
          required
        />
      </div>

      <Button type="submit" className="w-full h-12 gap-2 font-bold text-base shadow-lg shadow-primary/20" disabled={submitting}>
        {submitting ? <><Loader2 className="h-5 w-5 animate-spin" /> Submitting & Analyzing GitHub...</> : <><CheckCircle2 className="h-5 w-5" /> Submit Implementation</>}
      </Button>
    </motion.form>
  );
};

export default ImplementationSubmission;
