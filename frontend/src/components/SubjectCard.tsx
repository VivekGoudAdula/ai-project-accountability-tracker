import { motion } from 'framer-motion';
import { useProjectStore, Subject } from '@/store/projectStore';
import { BookOpen, Code, Brain, FileText, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const iconMap: Record<string, React.ElementType> = {
  'Prompt Engineering': Brain,
  'NLP': FileText,
  'Software Engineering': Code,
  'XAI': BookOpen,
  'Data Warehousing & Data Mining': Database,
};

const colorMap: Record<string, string> = {
  'Prompt Engineering': 'from-primary to-[hsl(262,83%,58%)]',
  'NLP': 'from-[hsl(217,91%,60%)] to-[hsl(199,89%,48%)]',
  'Software Engineering': 'from-[hsl(160,84%,39%)] to-[hsl(168,80%,35%)]',
  'XAI': 'from-[hsl(25,95%,53%)] to-[hsl(38,92%,50%)]',
  'Data Warehousing & Data Mining': 'from-[hsl(350,89%,60%)] to-[hsl(330,81%,60%)]',
};

const phaseNames: Record<number, string> = {
  6: 'Literature Survey',
  7: 'Project Design',
  8: 'Implementation',
  9: 'Project Report',
  10: 'Presentation',
  11: 'Evaluation',
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
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={handleClick}
      className="group cursor-pointer overflow-hidden rounded-xl border border-border bg-card transition-shadow duration-300 hover:shadow-lg"
    >
      {/* Gradient top border */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${gradient}`} />
      <div className="p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${gradient}`}>
            <Icon className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-foreground">{subject.name}</h3>
            {subject.projectTitle && (
              <p className="truncate text-xs text-muted-foreground">{subject.projectTitle}</p>
            )}
          </div>
        </div>
        
        <div className="mb-3 flex items-center justify-between">
          <span className="rounded-md border border-border bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {phaseNames[subject.currentPhase] || `Week ${subject.currentPhase}`}
          </span>
          <span className="text-xs font-semibold text-foreground">{subject.progress}%</span>
        </div>
        
        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
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
