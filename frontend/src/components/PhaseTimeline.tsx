import { Phase } from '@/store/projectStore';
import { Check, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  phases: Phase[];
}

const PhaseTimeline = ({ phases }: Props) => {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="mb-5 text-base font-semibold text-foreground">Phase Timeline</h3>
      <div className="flex items-center justify-between">
        {phases.map((phase, i) => (
          <div key={phase.week} className="flex flex-1 items-center">
            {/* Node */}
            <div className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all',
                  phase.status === 'completed' && 'bg-success text-success-foreground',
                  phase.status === 'current' && 'gradient-primary text-primary-foreground ring-4 ring-primary/20',
                  phase.status === 'upcoming' && 'border-2 border-border bg-card text-muted-foreground'
                )}
              >
                {phase.status === 'completed' ? (
                  <Check className="h-4 w-4" />
                ) : phase.status === 'current' ? (
                  <Clock className="h-4 w-4" />
                ) : (
                  <span>W{phase.week}</span>
                )}
              </div>
              <div className="text-center">
                <p className={cn(
                  'text-xs font-medium',
                  phase.status === 'current' ? 'text-primary' : 'text-foreground'
                )}>
                  {phase.title.length > 12 ? phase.title.slice(0, 10) + '…' : phase.title}
                </p>
                <p className="text-[10px] text-muted-foreground">Week {phase.week}</p>
              </div>
            </div>
            {/* Connector */}
            {i < phases.length - 1 && (
              <div className={cn(
                'mx-1 h-0.5 flex-1',
                phase.status === 'completed' ? 'bg-success' : 'bg-border'
              )} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PhaseTimeline;
