import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface Props {
  initialTimeRemaining: number;
}

const PhaseTimer = ({ initialTimeRemaining }: Props) => {
  const [timeLeft, setTimeLeft] = useState(initialTimeRemaining);

  useEffect(() => {
    setTimeLeft(initialTimeRemaining);
  }, [initialTimeRemaining]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLeft]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  const isDanger = timeLeft < 60; // less than 1 min

  if (timeLeft === 0) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-orange-500/10 px-4 py-2 text-orange-600 border border-orange-500/20">
        <Clock className="h-4 w-4" />
        <span className="text-sm font-bold">Phase Complete / Timeout</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 rounded-xl px-4 py-2 border ${
      isDanger 
        ? 'bg-red-500/10 text-red-600 border-red-500/20' 
        : 'bg-primary/10 text-primary border-primary/20'
    }`}>
      <Clock className={`h-4 w-4 ${isDanger ? 'animate-pulse' : ''}`} />
      <span className="text-sm font-bold tracking-widest">{formattedTime}</span>
    </div>
  );
};

export default PhaseTimer;
