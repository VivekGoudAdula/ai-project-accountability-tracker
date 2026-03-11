import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Link as LinkIcon, FileText, AlertCircle, CheckCircle2, Loader2, Clock as ClockIcon, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/store/authStore';
import { useProjectStore } from '@/store/projectStore';
import api from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Props {
  currentWeek: number;
  subjectName: string;
}

const phaseRules: Record<number, { label: string; fields: { name: string; type: 'file' | 'text' | 'textarea' | 'url'; label: string }[] }> = {
  6: {
    label: 'Literature Survey',
    fields: [
      { name: 'researchPapers', type: 'file', label: 'Upload research papers' },
      { name: 'lsDocument', type: 'file', label: 'Upload LS document' },
    ],
  },
  7: {
    label: 'Project Design',
    fields: [
      { name: 'designDoc', type: 'file', label: 'Design document' },
      { name: 'architecture', type: 'file', label: 'Architecture diagram' },
      { name: 'useCase', type: 'file', label: 'Use case diagram' },
    ],
  },
  8: { label: 'Implementation', fields: [{ name: 'github_link', type: 'url', label: 'GitHub Repository Link' }] },
  9: {
    label: 'Project Report',
    fields: [
      { name: 'report', type: 'file', label: 'Project Report PDF' },
    ],
  },
  10: {
    label: 'Presentation',
    fields: [
      { name: 'ppt', type: 'file', label: 'PPT slides' },
    ],
  },
  11: {
    label: 'Evaluation',
    fields: [],
  },
};

const SubmissionForm = ({ currentWeek, subjectName }: Props) => {
  const { user } = useAuthStore();
  const { currentPhaseInfo, subjects, tasks } = useProjectStore();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState<{ score: number; feedback: string } | null>(null);
  const [formData, setFormData] = useState({
    description: '',
    githubLink: '',
    file: null as File | null
  });

  const subject = subjects.find(s => s.name === subjectName);
  const rules = phaseRules[currentWeek];
  const isSubmissionOpen = currentPhaseInfo?.submission_open;
  
  const myTask = tasks.find(t => t.member_id === Number(user?.id))?.description;

  if (!rules) return null;

  if (!isSubmissionOpen) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 shadow-sm">
        <div className="flex items-center gap-3 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <p className="font-medium">Submission closed for this phase (Deadline: Sunday 11:59 PM).</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description) {
      toast.error('Please describe your contribution.');
      return;
    }

    if (!user?.id || !subject?.id) {
      toast.error('User or subject information missing');
      return;
    }

    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('user_id', String(user.id));
      data.append('subject_id', subject.id);
      data.append('phase', rules.label);
      data.append('description', formData.description);
      if (formData.githubLink) data.append('github_link', formData.githubLink);
      if (formData.file) data.append('file', formData.file);

      const res = await api.post('/submission/create', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const sub = res.data.submission;
      setEvaluation({
        score: sub.ai_score,
        feedback: sub.ai_feedback
      });
      
      setSubmitted(true);
      toast.success('Submission successful!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-8 shadow-sm"
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border/50 pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-transform hover:scale-105">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-foreground tracking-tight">
              Phase Submission
            </h3>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{rules.label} (Week {currentWeek})</p>
          </div>
        </div>
        {myTask && (
          <div className="rounded-lg bg-accent/50 px-4 py-2 border border-border/50">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Assigned Task</p>
            <p className="text-xs font-semibold text-foreground">{myTask}</p>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {submitted ? (
          <motion.div
            key="evaluation"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex flex-col items-center gap-4 rounded-xl border border-green-500/20 bg-green-500/5 p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">Submission Successful!</p>
                <p className="mt-1 text-sm text-muted-foreground">Your work has been received and evaluated by the AI engine.</p>
              </div>
            </div>

            {evaluation && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-8 shadow-md"
              >
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    <h4 className="text-lg font-bold text-foreground">AI Evaluation Result</h4>
                  </div>
                  <div className="flex items-center justify-center rounded-full bg-primary px-4 py-1">
                    <span className="text-sm font-black text-primary-foreground">{evaluation.score} / 100</span>
                  </div>
                </div>
                <div className="rounded-xl bg-background/50 p-6 border border-border/50">
                  <p className="text-sm leading-relaxed text-foreground italic whitespace-pre-wrap">"{evaluation.feedback}"</p>
                </div>
                <Button 
                  variant="outline" 
                  className="mt-6 w-full font-bold"
                  onClick={() => setSubmitted(false)}
                >
                  Edit Submission
                </Button>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground uppercase tracking-tight">Summary of Work (Required)</label>
              <Textarea 
                placeholder="Briefly describe what you have accomplished in this phase..." 
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-background border-border/50 focus:border-primary resize-none min-h-[120px]"
              />
            </div>

            {currentWeek === 8 && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground uppercase tracking-tight">GitHub Repository Link</label>
                <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-background px-4 h-12 transition-all focus-within:ring-2 focus-within:ring-primary/20">
                  <LinkIcon className="h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="https://github.com/username/repo" 
                    value={formData.githubLink}
                    onChange={(e) => setFormData({ ...formData, githubLink: e.target.value })}
                    className="border-0 bg-transparent shadow-none focus-visible:ring-0 font-medium" 
                  />
                </div>
              </div>
            )}

            {rules.fields.filter(f => f.type === 'file').length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground uppercase tracking-tight">Upload Deliverables</label>
                <div className="group relative flex min-h-[160px] cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-border/50 bg-background/50 p-6 transition-all hover:border-primary hover:bg-primary/5">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="rounded-full bg-muted p-4 group-hover:bg-primary/10 transition-colors">
                      <Upload className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                        {formData.file ? formData.file.name : "Choose files or drag and drop"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">PDF, JPEG, or PNG up to 10MB</p>
                    </div>
                  </div>
                  <input 
                    type="file" 
                    className="absolute inset-0 cursor-pointer opacity-0" 
                    onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                  />
                </div>
              </div>
            )}

            <Button type="submit" className="w-full h-14 gap-3 text-base font-black shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin" /> Analyzing Submission...
                </>
              ) : (
                <>
                  <FileText className="h-5 w-5" /> Submit Phase Work
                </>
              )}
            </Button>
          </motion.form>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SubmissionForm;
