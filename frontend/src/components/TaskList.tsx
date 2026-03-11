import { motion } from 'framer-motion';
import { Task } from '@/store/projectStore';
import { CheckCircle2, Clock, Circle } from 'lucide-react';
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
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="mb-1 text-base font-semibold text-foreground">AI-Assigned Tasks</h3>
      <p className="mb-4 text-xs text-muted-foreground">Tasks generated for the current phase</p>
      <div className="space-y-3">
        {tasks.map((task, i) => {
          const config = statusConfig[task.status];
          const Icon = config.icon;
          return (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="rounded-lg border border-border bg-background p-3 transition-colors hover:bg-accent/30"
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={cn('h-4 w-4', config.color)} />
                  <span className="text-sm font-medium text-foreground">{task.member}</span>
                </div>
                <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', config.badge)}>
                  {config.label}
                </span>
              </div>
              <p className="pl-6 text-xs text-muted-foreground">{task.description}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default TaskList;
