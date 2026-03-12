import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Layers, Upload, FileText, Loader2, CheckCircle2, X } from 'lucide-react';
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

const DropZone = ({
  label, accept, files, onFiles
}: { label: string; accept?: string; files: File[]; onFiles: (f: File[]) => void }) => {
  const ref = useRef<HTMLInputElement>(null);

  const remove = (idx: number) => onFiles(files.filter((_, i) => i !== idx));

  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-foreground uppercase tracking-wider">{label}</label>
      <div
        className={cn(
          "relative rounded-xl border-2 border-dashed border-border/60 bg-background/40 p-4 cursor-pointer transition-all",
          "hover:border-primary/60 hover:bg-primary/5 group"
        )}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); onFiles([...files, ...Array.from(e.dataTransfer.files)]); }}
        onClick={() => ref.current?.click()}
      >
        <input ref={ref} type="file" className="hidden" accept={accept} onChange={(e) => onFiles([...files, ...Array.from(e.target.files || [])])} />
        {files.length === 0 ? (
          <div className="flex items-center gap-3 py-1">
            <div className="rounded-full bg-muted p-2 group-hover:bg-primary/10 transition-colors">
              <Upload className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground group-hover:text-foreground">Click or drag & drop</p>
              <p className="text-[11px] text-muted-foreground">PDF, PNG, JPG up to 10MB</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/20 px-3 py-1.5">
                <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="flex-1 text-xs font-medium truncate">{f.name}</span>
                <button type="button" onClick={() => remove(i)} className="p-0.5 hover:text-destructive transition-colors">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const DesignSubmission = ({ subjectId, onSuccess }: Props) => {
  const { user } = useAuthStore();
  const [designDocs, setDesignDocs] = useState<File[]>([]);
  const [archDiagrams, setArchDiagrams] = useState<File[]>([]);
  const [useCaseDiagrams, setUseCaseDiagrams] = useState<File[]>([]);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error('Please describe your design decisions.');
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('user_id', String(user?.id));
      fd.append('subject_id', subjectId);
      fd.append('phase', 'Project Design');
      fd.append('description', description);
      [...designDocs, ...archDiagrams, ...useCaseDiagrams].forEach((f) => fd.append('files', f));

      const res = await api.post('/submission/create', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Project Design submitted!');
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
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/15">
          <Layers className="h-5 w-5 text-violet-500" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">Project Design</p>
          <p className="text-[11px] text-muted-foreground">Design document, architecture & use case diagrams</p>
        </div>
      </div>

      <DropZone label="Design Document" accept=".pdf,.docx" files={designDocs} onFiles={setDesignDocs} />
      <DropZone label="Architecture Diagram" accept=".pdf,.png,.jpg,.jpeg" files={archDiagrams} onFiles={setArchDiagrams} />
      <DropZone label="Use Case Diagram" accept=".pdf,.png,.jpg,.jpeg" files={useCaseDiagrams} onFiles={setUseCaseDiagrams} />

      <div className="space-y-2">
        <label className="text-xs font-bold text-foreground uppercase tracking-wider">Design Description</label>
        <Textarea
          placeholder="Describe the system design, architecture choices, and use cases you have documented..."
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="bg-background border-border/50 focus:border-primary resize-none"
          required
        />
      </div>

      <Button type="submit" className="w-full h-12 gap-2 font-bold text-base shadow-lg shadow-primary/20" disabled={submitting}>
        {submitting ? <><Loader2 className="h-5 w-5 animate-spin" /> Submitting & Evaluating...</> : <><CheckCircle2 className="h-5 w-5" /> Submit Project Design</>}
      </Button>
    </motion.form>
  );
};

export default DesignSubmission;
