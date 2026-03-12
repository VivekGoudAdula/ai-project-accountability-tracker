import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Presentation, Upload, FileText, Loader2, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Props {
  subjectId: string;
  onSuccess: (result: { score: number; feedback: string; status: string }) => void;
}

const PresentationSubmission = ({ subjectId, onSuccess }: Props) => {
  const { user } = useAuthStore();
  const [files, setFiles] = useState<File[]>([]);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const removeFile = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error('Please describe your presentation.');
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('user_id', String(user?.id));
      fd.append('subject_id', subjectId);
      fd.append('phase', 'Presentation');
      fd.append('description', description);
      files.forEach((f) => fd.append('files', f));

      const res = await api.post('/submission/create', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Presentation submitted!');
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
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/15">
          <Presentation className="h-5 w-5 text-rose-500" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">Presentation</p>
          <p className="text-[11px] text-muted-foreground">Upload your PPT slides</p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-foreground uppercase tracking-wider">PPT Slides</label>
        <div
          className={cn(
            "relative rounded-xl border-2 border-dashed border-border/60 bg-background/40 p-5 cursor-pointer transition-all",
            "hover:border-primary/60 hover:bg-primary/5 group"
          )}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); setFiles([...files, ...Array.from(e.dataTransfer.files)]); }}
          onClick={() => ref.current?.click()}
        >
          <input
            ref={ref}
            type="file"
            className="hidden"
            multiple
            accept=".ppt,.pptx,.pdf"
            onChange={(e) => setFiles([...files, ...Array.from(e.target.files || [])])}
          />
          {files.length === 0 ? (
            <div className="flex flex-col items-center gap-2 text-center py-4">
              <div className="rounded-full bg-muted p-4 group-hover:bg-primary/10 transition-colors">
                <Upload className="h-7 w-7 text-muted-foreground group-hover:text-primary" />
              </div>
              <p className="text-sm font-semibold text-muted-foreground group-hover:text-foreground">Upload PPT or PDF slides</p>
              <p className="text-[11px] text-muted-foreground">PPTX, PPT, PDF up to 25MB</p>
            </div>
          ) : (
            <div className="space-y-1.5" onClick={(e) => e.stopPropagation()}>
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg bg-primary/5 border border-primary/20 px-3 py-2">
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                  <span className="flex-1 text-xs font-medium truncate">{f.name}</span>
                  <button type="button" onClick={() => removeFile(i)} className="p-0.5 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-foreground uppercase tracking-wider">Presentation Notes</label>
        <Textarea
          placeholder="Describe what your presentation covers, key slides, and your individual contribution to the presentation..."
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="bg-background border-border/50 focus:border-primary resize-none"
          required
        />
      </div>

      <Button type="submit" className="w-full h-12 gap-2 font-bold text-base shadow-lg shadow-primary/20" disabled={submitting}>
        {submitting ? <><Loader2 className="h-5 w-5 animate-spin" /> Submitting & Evaluating...</> : <><CheckCircle2 className="h-5 w-5" /> Submit Presentation</>}
      </Button>
    </motion.form>
  );
};

export default PresentationSubmission;
