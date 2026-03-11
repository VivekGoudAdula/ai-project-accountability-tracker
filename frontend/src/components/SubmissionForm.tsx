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
  const { teamId, currentPhaseInfo } = useProjectStore();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    tasksDone: '',
    hoursSpent: '',
    githubLink: '',
    file: null as File | null
  });

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

    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('team_id', String(teamId));
      data.append('user_id', String(user?.id));
      data.append('subject', subjectName);
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
      className="rounded-xl border border-border bg-card p-6"
    >
      <div className="mb-1 flex items-center gap-2">
        <Upload className="h-5 w-5 text-primary" />
        <h3 className="text-base font-semibold text-foreground">
          Submit — Week {currentWeek}: {phase.label}
        </h3>
      </div>
      <p className="mb-5 text-xs text-muted-foreground">Deadline: Sunday 11:59 PM</p>

      <AnimatePresence mode="wait">
        {submitted ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-3 rounded-lg border border-success/30 bg-success/5 p-8"
          >
            <CheckCircle2 className="h-12 w-12 text-success" />
            <p className="text-lg font-semibold text-foreground">Submission received!</p>
            <p className="text-sm text-muted-foreground">Your work has been submitted for AI evaluation.</p>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Tasks Completed</label>
              <Textarea 
                placeholder="What specific tasks did you finish?" 
                value={formData.tasksDone}
                onChange={(e) => setFormData({ ...formData, tasksDone: e.target.value })}
                className="bg-background"
                rows={3}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Hours Spent</label>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3">
                <ClockIcon className="h-4 w-4 text-muted-foreground" />
                <Input 
                  type="number" 
                  placeholder="e.g., 5" 
                  value={formData.hoursSpent}
                  onChange={(e) => setFormData({ ...formData, hoursSpent: e.target.value })}
                  className="border-0 bg-transparent shadow-none focus-visible:ring-0" 
                />
              </div>
            </div>

            {currentWeek === 8 && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">GitHub Link</label>
                <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3">
                  <LinkIcon className="h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="https://github.com/..." 
                    value={formData.githubLink}
                    onChange={(e) => setFormData({ ...formData, githubLink: e.target.value })}
                    className="border-0 bg-transparent shadow-none focus-visible:ring-0" 
                  />
                </div>
              </div>
            )}

            {phase.fields.length > 0 && phase.fields.map((field) => (
              <div key={field.name}>
                <label className="mb-1.5 block text-sm font-medium text-foreground">{field.label}</label>
                {field.type === 'file' && (
                  <div className="group relative flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border bg-background p-4 transition-colors hover:border-primary/50 hover:bg-accent/30">
                    <div className="flex flex-col items-center gap-1 text-center">
                      <Upload className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
                      <p className="text-xs text-muted-foreground">
                        {formData.file ? formData.file.name : "Click to upload file"}
                      </p>
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

            <Button type="submit" className="w-full gap-2 mt-2" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Evaluating…
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" /> Submit & Evaluation
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
