import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Link as LinkIcon, FileText, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface Props {
  currentWeek: number;
}

const phaseFields: Record<number, { label: string; fields: { name: string; type: 'file' | 'text' | 'textarea' | 'url'; label: string }[] }> = {
  6: {
    label: 'Literature Survey',
    fields: [
      { name: 'papers', type: 'file', label: 'Upload papers collected' },
      { name: 'lsDocument', type: 'file', label: 'Upload LS document' },
      { name: 'summary', type: 'textarea', label: 'Write summary' },
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
  8: {
    label: 'Implementation',
    fields: [
      { name: 'githubLink', type: 'url', label: 'GitHub repository link' },
    ],
  },
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

const SubmissionForm = ({ currentWeek }: Props) => {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const phase = phaseFields[currentWeek];

  const now = new Date();
  const dayOfWeek = now.getDay();
  const isPastDeadline = dayOfWeek >= 1 && dayOfWeek <= 6 && false; // simplified for demo

  if (!phase) return null;

  if (isPastDeadline) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
        <div className="flex items-center gap-3 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <p className="font-medium">Submission closed for this phase.</p>
        </div>
      </div>
    );
  }

  if (phase.fields.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <p className="text-muted-foreground">No submissions required for this phase.</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1500));
    setSubmitting(false);
    setSubmitted(true);
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
            <p className="text-sm text-muted-foreground">Your deliverables have been submitted successfully.</p>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            {phase.fields.map((field) => (
              <div key={field.name}>
                <label className="mb-2 block text-sm font-medium text-foreground">{field.label}</label>
                {field.type === 'file' && (
                  <div className="group relative flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border bg-background p-6 transition-colors hover:border-primary/50 hover:bg-accent/30">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <Upload className="h-8 w-8 text-muted-foreground group-hover:text-primary" />
                      <p className="text-sm text-muted-foreground">Drag & drop or <span className="font-medium text-primary">browse files</span></p>
                    </div>
                    <input type="file" className="absolute inset-0 cursor-pointer opacity-0" />
                  </div>
                )}
                {field.type === 'url' && (
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3">
                    <LinkIcon className="h-4 w-4 text-muted-foreground" />
                    <Input placeholder="https://github.com/..." className="border-0 bg-transparent shadow-none focus-visible:ring-0" />
                  </div>
                )}
                {field.type === 'textarea' && (
                  <Textarea placeholder="Write your summary here..." rows={4} className="bg-background" />
                )}
                {field.type === 'text' && (
                  <Input placeholder={field.label} className="bg-background" />
                )}
              </div>
            ))}
            <Button type="submit" className="w-full gap-2" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" /> Submit Deliverables
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
