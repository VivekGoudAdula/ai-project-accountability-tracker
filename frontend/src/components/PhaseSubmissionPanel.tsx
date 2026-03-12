import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Award, CheckCircle2, Clock, AlertCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useProjectStore } from '@/store/projectStore';

import LiteratureSubmission from './LiteratureSubmission';
import DesignSubmission from './DesignSubmission';
import ImplementationSubmission from './ImplementationSubmission';
import ReportSubmission from './ReportSubmission';
import PresentationSubmission from './PresentationSubmission';
import EvaluationInsightsPanel from './EvaluationInsightsPanel';

interface Props {
  subjectId: string;
  subjectName: string;
  currentPhase: string;
}

interface SubmitResult {
  score: number;
  feedback: string;
  status: string;
}

const phaseColors: Record<string, string> = {
  'Literature Survey': 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
  'Project Design': 'text-violet-500 bg-violet-500/10 border-violet-500/20',
  'Implementation': 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  'Project Report': 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  'Presentation': 'text-rose-500 bg-rose-500/10 border-rose-500/20',
  'Evaluation': 'text-primary bg-primary/10 border-primary/20',
};

const ScoreBadge = ({ score }: { score: number }) => {
  const color = score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className={cn('inline-flex items-center justify-center rounded-full px-4 py-1.5 text-white text-sm font-black', color)}>
      {score} / 100
    </div>
  );
};

const PhaseSubmissionPanel = ({ subjectId, subjectName, currentPhase }: Props) => {
  const { currentPhaseInfo, submissionHistory } = useProjectStore();
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);

  const isSubmissionOpen = currentPhaseInfo?.submission_open ?? true;

  // Check if already submitted for this phase from history
  const existingSubmission = submissionHistory.find(
    (s: any) => s.phase === currentPhase
  );

  const handleSuccess = (res: SubmitResult) => {
    setResult(res);
    setSubmitted(true);
  };

  const handleReset = () => {
    setSubmitted(false);
    setResult(null);
  };

  // Evaluation phase shows the insights panel, not a submission form
  if (currentPhase === 'Evaluation') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Award className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Evaluation Phase</h3>
            <p className="text-xs text-muted-foreground">Review your team's complete performance summary</p>
          </div>
        </div>
        <EvaluationInsightsPanel subjectId={Number(subjectId)} />
      </div>
    );
  }

  // If already submitted (from history) and no new submission
  const displaySubmission = existingSubmission && !submitted;

  const phaseColorClass = phaseColors[currentPhase] || 'text-primary bg-primary/10 border-primary/20';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden"
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between gap-4 border-b border-border/60 bg-card p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 transition-transform hover:scale-105">
            <Upload className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-foreground tracking-tight">Phase Submission</h3>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">{subjectName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Current Phase Badge */}
          <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold', phaseColorClass)}>
            <ChevronRight className="h-3 w-3" />
            {currentPhase}
          </span>

          {/* Submission Status */}
          {(submitted || existingSubmission) ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs font-bold text-green-600">
              <CheckCircle2 className="h-3 w-3" /> Submitted
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-400/30 bg-orange-400/10 px-3 py-1 text-xs font-bold text-orange-500">
              <Clock className="h-3 w-3" /> Pending
            </span>
          )}
        </div>
      </div>

      <div className="p-6">
        {/* Submission window closed banner */}
        {!isSubmissionOpen && !submitted && !existingSubmission && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-4">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
            <div>
              <p className="text-sm font-bold text-destructive">Submission Window Closed</p>
              <p className="text-xs text-muted-foreground mt-0.5">Submissions are accepted until Sunday 11:59 PM each week.</p>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* Already submitted – show existing result */}
          {displaySubmission && (
            <motion.div
              key="existing"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-5"
            >
              <div className="flex flex-col items-center gap-3 rounded-xl border border-green-500/20 bg-green-500/5 p-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/20">
                  <CheckCircle2 className="h-7 w-7 text-green-600" />
                </div>
                <p className="text-base font-bold text-foreground">Already Submitted</p>
                <p className="text-sm text-muted-foreground">You have already submitted for the <span className="font-semibold text-foreground">{currentPhase}</span> phase.</p>
              </div>

              {existingSubmission.ai_score != null && (
                <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-primary" />
                      <span className="text-sm font-bold text-foreground">AI Evaluation</span>
                    </div>
                    <ScoreBadge score={existingSubmission.ai_score} />
                  </div>
                  {existingSubmission.ai_feedback && (
                    <div className="rounded-xl bg-background/50 border border-border/50 p-4">
                      <p className="text-sm leading-relaxed text-foreground italic">"{existingSubmission.ai_feedback}"</p>
                    </div>
                  )}
                </div>
              )}

              {/* Resubmit button removed as per user request */}
            </motion.div>
          )}

          {/* New submission – success state */}
          {submitted && result && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-5"
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

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-6 shadow-md"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    <h4 className="text-base font-bold text-foreground">AI Evaluation Result</h4>
                  </div>
                  <ScoreBadge score={result.score} />
                </div>
                <div className="rounded-xl bg-background/50 p-5 border border-border/50">
                  <p className="text-sm leading-relaxed text-foreground italic whitespace-pre-wrap">"{result.feedback}"</p>
                </div>
                {/* Edit Submission button removed as per user request */}
              </motion.div>
            </motion.div>
          )}

          {/* Submission form */}
          {!submitted && !displaySubmission && (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {currentPhase === 'Literature Survey' && (
                <LiteratureSubmission subjectId={subjectId} onSuccess={handleSuccess} />
              )}
              {currentPhase === 'Project Design' && (
                <DesignSubmission subjectId={subjectId} onSuccess={handleSuccess} />
              )}
              {currentPhase === 'Implementation' && (
                <ImplementationSubmission subjectId={subjectId} onSuccess={handleSuccess} />
              )}
              {currentPhase === 'Project Report' && (
                <ReportSubmission subjectId={subjectId} onSuccess={handleSuccess} />
              )}
              {currentPhase === 'Presentation' && (
                <PresentationSubmission subjectId={subjectId} onSuccess={handleSuccess} />
              )}
              {!['Literature Survey', 'Project Design', 'Implementation', 'Project Report', 'Presentation'].includes(currentPhase) && (
                <div className="flex flex-col items-center gap-3 py-10 text-center text-muted-foreground">
                  <Clock className="h-10 w-10 opacity-30" />
                  <p className="text-sm font-medium">No submission required for this phase.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default PhaseSubmissionPanel;
