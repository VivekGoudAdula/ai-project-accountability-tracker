import { motion } from 'framer-motion';
import { useProjectStore, Subject } from '@/store/projectStore';
import { BookOpen, Code, Brain, FileText, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const iconMap: Record<string, React.ElementType> = {
  'Prompt Engineering': Brain,
  'NLP': FileText,
  'Software Engineering': Code,
  'XAI': BookOpen,
  'Data Warehousing and Data Mining': Database,
};

const colorMap: Record<string, string> = {
  'Prompt Engineering': 'from-primary to-[hsl(262,83%,58%)]',
  'NLP': 'from-[hsl(217,91%,60%)] to-[hsl(199,89%,48%)]',
  'Software Engineering': 'from-[hsl(160,84%,39%)] to-[hsl(168,80%,35%)]',
  'XAI': 'from-[hsl(25,95%,53%)] to-[hsl(38,92%,50%)]',
  'Data Warehousing and Data Mining': 'from-[hsl(350,89%,60%)] to-[hsl(330,81%,60%)]',
};

interface Props {
  subject: Subject;
}

const SubjectCard = ({ subject }: Props) => {
  const { setCurrentSubject } = useProjectStore();
  const navigate = useNavigate();
  const Icon = iconMap[subject.name] || BookOpen;
  const gradient = colorMap[subject.name] || 'from-primary to-[hsl(262,83%,58%)]';

  const handleClick = () => {
    setCurrentSubject(subject);
    navigate(`/project/${subject.id}`);
  };

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className="group cursor-pointer overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:shadow-xl hover:border-primary/50"
    >
      {/* Gradient top border */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${gradient}`} />
      <div className="p-6">
        <div className="mb-5 flex items-center gap-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-lg shadow-black/10`}>
            <Icon className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-bold text-foreground">{subject.name}</h3>
            {subject.projectTitle ? (
              <p className="truncate text-xs text-primary font-medium">{subject.projectTitle}</p>
            ) : (
              <p className="truncate text-xs text-muted-foreground italic">Project not initialized</p>
            )}
          </div>
        </div>
        
        <div className="mb-3 flex items-center justify-between">
          <span className="rounded-full bg-secondary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {subject.currentPhase}
          </span>
          <span className="text-sm font-bold text-foreground">{subject.progress}%</span>
        </div>
        
        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary/50">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${subject.progress}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={`h-full rounded-full bg-gradient-to-r ${gradient}`}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default SubjectCard;
