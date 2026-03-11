import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Link as LinkIcon, FileText, AlertCircle, CheckCircle2, Loader2, Clock as ClockIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/store/authStore';
import { useProjectStore } from '@/store/projectStore';
import api from '@/lib/api';
import { toast } from 'sonner';

interface Props {
  currentWeek: number;
  subjectName: string;
}

const phaseFields: Record<number, { label: string; fields: { name: string; type: 'file' | 'text' | 'textarea' | 'url'; label: string }[] }> = {
  6: {
    label: 'Literature Survey',
    fields: [
      { name: 'lsDocument', type: 'file', label: 'Upload LS document' },
    ],
  },
  7: {
    label: 'Project Design',
    fields: [
      { name: 'designDoc', type: 'file', label: 'Upload design document' },
      { name: 'architecture', type: 'file', label: 'Upload architecture diagram' },
      { name: 'useCase', type: 'file', label: 'Upload use case diagram' },
    ],
  },
  8: { label: 'Implementation', fields: [] },
  9: {
    label: 'Project Report',
    fields: [
      { name: 'report', type: 'file', label: 'Upload report document' },
    ],
  },
  10: {
    label: 'Presentation',
    fields: [
      { name: 'ppt', type: 'file', label: 'Upload PPT slides' },
    ],
  },
  11: {
    label: 'Evaluation',
    fields: [],
  },
};

const SubmissionForm = ({ currentWeek, subjectName }: Props) => {
  const { user } = useAuthStore();
  const { currentPhaseInfo, subjects } = useProjectStore();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    tasksDone: '',
    hoursSpent: '',
    githubLink: '',
    file: null as File | null
  });

  const subject = subjects.find(s => s.name === subjectName);
  const phase = phaseFields[currentWeek];
  const isSubmissionOpen = currentPhaseInfo?.submission_open;

  if (!phase) return null;

  if (!isSubmissionOpen) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
        <div className="flex items-center gap-3 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <p className="font-medium">Submission closed for this phase (Deadline: Sunday 11:59 PM).</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tasksDone || !formData.hoursSpent) {
      toast.error('Please fill in tasks completed and hours spent.');
      return;
    }

    if (!user?.classSection || !user?.lgNumber || !subject?.id) {
      toast.error('User or subject information missing');
      return;
    }

    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('class_section', user.classSection);
      data.append('lg_number', user.lgNumber.replace('LG ', ''));
      data.append('user_id', String(user?.id));
      data.append('subject_id', subject.id);
      data.append('phase', phase.label);
      data.append('tasks_done', formData.tasksDone);
      data.append('hours_spent', formData.hoursSpent);
      if (formData.githubLink) data.append('github_link', formData.githubLink);
      if (formData.file) data.append('file', formData.file);

      await api.post('/submission/create', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setSubmitted(true);
      toast.success('Submission successful!');
    } catch (err: any) {
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
      <div className="mb-2 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Upload className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground tracking-tight">
            Week {currentWeek}: {phase.label}
          </h3>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Phase Submission</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {submitted ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 flex flex-col items-center gap-4 rounded-xl border border-green-500/20 bg-green-500/5 p-10 text-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">Submission Received!</p>
              <p className="mt-2 text-sm text-muted-foreground max-w-xs">Your work has been submitted successfully and is being evaluated by the AI engine.</p>
            </div>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={handleSubmit}
            className="mt-8 space-y-6"
          >
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground uppercase tracking-tight">Tasks Completed</label>
              <Textarea 
                placeholder="What specific components or features did you implement?" 
                value={formData.tasksDone}
                onChange={(e) => setFormData({ ...formData, tasksDone: e.target.value })}
                className="bg-background border-border/50 focus:border-primary resize-none"
                rows={4}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-foreground uppercase tracking-tight">Hours Consumed</label>
              <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-border/50 bg-background px-4 h-12">
                <ClockIcon className="h-4 w-4 text-muted-foreground" />
                <Input 
                  type="number" 
                  placeholder="e.g., 5" 
                  value={formData.hoursSpent}
                  onChange={(e) => setFormData({ ...formData, hoursSpent: e.target.value })}
                  className="border-0 bg-transparent shadow-none focus-visible:ring-0 font-medium" 
                />
              </div>
            </div>

            {currentWeek === 8 && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground uppercase tracking-tight">Repository Evidence (GitHub Mirror)</label>
                <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-background px-4 h-12">
                  <LinkIcon className="h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="https://github.com/v-goud/my-project" 
                    value={formData.githubLink}
                    onChange={(e) => setFormData({ ...formData, githubLink: e.target.value })}
                    className="border-0 bg-transparent shadow-none focus-visible:ring-0 font-medium" 
                  />
                </div>
              </div>
            )}

            {phase.fields.length > 0 && phase.fields.map((field) => (
              <div key={field.name} className="space-y-2">
                <label className="text-xs font-bold text-foreground uppercase tracking-tight">{field.label}</label>
                {field.type === 'file' && (
                  <div className="group relative flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-border/50 bg-background/50 p-6 transition-all hover:border-primary hover:bg-primary/5">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <Upload className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                      <p className="text-sm font-semibold text-muted-foreground group-hover:text-foreground">
                        {formData.file ? formData.file.name : "Select or Drop File"}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Max 10MB</p>
                    </div>
                    <input 
                      type="file" 
                      className="absolute inset-0 cursor-pointer opacity-0" 
                      onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                    />
                  </div>
                )}
              </div>
            ))}

            <Button type="submit" className="w-full h-14 gap-3 text-base font-bold shadow-lg shadow-primary/20" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" /> Evaluating Work...
                </>
              ) : (
                <>
                  <FileText className="h-5 w-5" /> Submit for Evaluation
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
