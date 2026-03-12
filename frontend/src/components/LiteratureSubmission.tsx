import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Upload, FileText, Loader2, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/store/authStore';
import { useProjectStore } from '@/store/projectStore';
import api from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Props {
  subjectId: string;
  onSuccess: (result: { score: number; feedback: string; status: string }) => void;
}

const DropZone = ({
  label, accept, multiple = false, files, onFiles
}: {
  label: string; accept?: string; multiple?: boolean; files: File[]; onFiles: (f: File[]) => void;
}) => {
  const ref = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files);
    onFiles(multiple ? [...files, ...dropped] : [dropped[0]]);
  };

  const removeFile = (idx: number) => {
    onFiles(files.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      <label className="text-xs font-bold text-foreground uppercase tracking-wider">{label}</label>
      <div
        className={cn(
          "relative rounded-xl border-2 border-dashed border-border/60 bg-background/40 p-5 transition-all cursor-pointer",
          "hover:border-primary/60 hover:bg-primary/5 group"
        )}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => ref.current?.click()}
      >
        <input
          ref={ref}
          type="file"
          className="hidden"
          multiple={multiple}
          accept={accept}
          onChange={(e) => {
            const picked = Array.from(e.target.files || []);
            onFiles(multiple ? [...files, ...picked] : [picked[0]]);
          }}
        />
        {files.length === 0 ? (
          <div className="flex flex-col items-center gap-2 text-center py-2">
            <div className="rounded-full bg-muted p-3 group-hover:bg-primary/10 transition-colors">
              <Upload className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <p className="text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
              Click or drag & drop
            </p>
            <p className="text-[11px] text-muted-foreground">PDF, DOCX, PNG, JPG up to 10MB</p>
          </div>
        ) : (
          <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg bg-primary/5 border border-primary/20 px-3 py-2">
                <FileText className="h-4 w-4 text-primary shrink-0" />
                <span className="flex-1 text-xs font-medium text-foreground truncate">{f.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="rounded-full p-0.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <p className="text-center text-[11px] text-muted-foreground pt-1">Click or drop more files to add</p>
          </div>
        )}
      </div>
    </div>
  );
};

const LiteratureSubmission = ({ subjectId, onSuccess }: Props) => {
  const { user } = useAuthStore();
  const [researchPapers, setResearchPapers] = useState<File[]>([]);
  const [lsDocFiles, setLsDocFiles] = useState<File[]>([]);
  const [summary, setSummary] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim()) {
      toast.error('Please write a summary of your literature survey work.');
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('user_id', String(user?.id));
      fd.append('subject_id', subjectId);
      fd.append('phase', 'Literature Survey');
      fd.append('description', summary);
      researchPapers.forEach((f) => fd.append('files', f));
      lsDocFiles.forEach((f) => fd.append('files', f));

      const res = await api.post('/submission/create', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Literature Survey submitted!');
      onSuccess({ score: res.data.submission.ai_score, feedback: res.data.submission.ai_feedback, status: res.data.submission.status });
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.form onSubmit={handleSubmit} className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center gap-3 mb-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/15">
          <BookOpen className="h-5 w-5 text-indigo-500" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">Literature Survey</p>
          <p className="text-[11px] text-muted-foreground">Upload research papers, LS document & summary</p>
        </div>
      </div>

      <DropZone label="Research Papers (multiple allowed)" multiple accept=".pdf,.docx,.doc" files={researchPapers} onFiles={setResearchPapers} />
      <DropZone label="Literature Survey Document" accept=".pdf,.docx,.doc" files={lsDocFiles} onFiles={setLsDocFiles} />

      <div className="space-y-2">
        <label className="text-xs font-bold text-foreground uppercase tracking-wider">Summary of Work</label>
        <Textarea
          placeholder="Describe what research papers you reviewed, key findings, and how they relate to your project..."
          rows={5}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          className="bg-background border-border/50 focus:border-primary resize-none"
          required
        />
      </div>

      <Button type="submit" className="w-full h-12 gap-2 font-bold text-base shadow-lg shadow-primary/20" disabled={submitting}>
        {submitting ? <><Loader2 className="h-5 w-5 animate-spin" /> Submitting & Evaluating...</> : <><CheckCircle2 className="h-5 w-5" /> Submit Literature Survey</>}
      </Button>
    </motion.form>
  );
};

export default LiteratureSubmission;
