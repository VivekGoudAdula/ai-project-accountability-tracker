import { motion } from 'framer-motion';
import { Task, useProjectStore } from '@/store/projectStore';
import { useAuthStore } from '@/store/authStore';
import { CheckCircle2, Clock, Circle, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  tasks: Task[];
}

const statusConfig = {
  completed: { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10', badge: 'bg-success/15 text-success', label: 'Done' },
  'in-progress': { icon: Clock, color: 'text-primary', bg: 'bg-accent', badge: 'bg-primary/10 text-primary', label: 'In Progress' },
  pending: { icon: Circle, color: 'text-muted-foreground', bg: 'bg-secondary', badge: 'bg-secondary text-muted-foreground', label: 'Pending' },
};

const TaskList = ({ tasks }: Props) => {
  const { teamMembers, currentPhaseInfo } = useProjectStore();
  const { user } = useAuthStore();

  const getMemberName = (id: number) => {
    const member = teamMembers.find(m => m.id === id);
    return member ? member.name : `Member ${id}`;
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h3 className="mb-1 text-base font-semibold text-foreground">
        Team Tasks — {currentPhaseInfo?.current_phase || 'Current Phase'}
      </h3>
      <p className="mb-4 text-xs text-muted-foreground">AI-divided work for the current phase</p>
      
      <div className="space-y-3">
        {tasks.map((task, i) => {
          const config = (statusConfig as any)[task.status] || statusConfig.pending;
          const Icon = config.icon;
          const isOwnTask = Number(user?.id) === task.member_id;
          const memberName = getMemberName(task.member_id);

          return (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={cn(
                "rounded-lg border p-3 transition-colors",
                isOwnTask 
                  ? "border-primary/30 bg-primary/5 ring-1 ring-primary/10" 
                  : "border-border bg-background hover:bg-accent/30"
              )}
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full",
                    isOwnTask ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                  )}>
                    {isOwnTask ? <User className="h-3 w-3" /> : <span className="text-[10px] font-bold">{memberName[0]}</span>}
                  </div>
                  <span className={cn(
                    "text-sm font-bold",
                    isOwnTask ? "text-primary" : "text-foreground"
                  )}>
                    {isOwnTask ? "Your Task" : memberName}
                  </span>
                </div>
                <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', config.badge)}>
                  {config.label}
                </span>
              </div>
              <p className={cn(
                "pl-8 text-xs leading-relaxed",
                isOwnTask ? "font-medium text-foreground" : "text-muted-foreground"
              )}>
                {task.description}
              </p>
            </motion.div>
          );
        })}
        {tasks.length === 0 && (
          <div className="flex h-32 flex-col items-center justify-center rounded-lg border border-dashed border-border text-center p-4">
            <p className="text-sm text-muted-foreground italic">No tasks assigned for this phase yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskList;
