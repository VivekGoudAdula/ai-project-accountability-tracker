import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import mascotImg from '@/assets/mascot.png';

const tips = [
  "Don't forget to submit before Sunday! ⏰",
  "Great progress! Keep it up! 🚀",
  "Need help? Check the analytics tab! 📊",
  "Teamwork makes the dream work! 🤝",
  "Your contribution score is looking good! ⭐",
  "Remember to push your code to GitHub! 💻",
  "Phase deadline is approaching! 📅",
];

const MascotBuddy = () => {
  const [showTip, setShowTip] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowTip(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (showTip) {
      const interval = setInterval(() => {
        setTipIndex((i) => (i + 1) % tips.length);
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [showTip]);

  if (minimized) {
    return (
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        onClick={() => setMinimized(false)}
        className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full bg-card border border-border shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
      >
        <img src={mascotImg} alt="Buddy mascot" className="h-9 w-9 object-contain" />
      </motion.button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {/* Speech bubble */}
      <AnimatePresence>
        {showTip && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="relative max-w-[220px] rounded-xl border border-border bg-card p-3 shadow-lg"
          >
            <button
              onClick={() => setMinimized(true)}
              className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs hover:bg-accent"
            >
              ✕
            </button>
            <p className="text-xs text-foreground leading-relaxed">{tips[tipIndex]}</p>
            {/* Triangle pointer */}
            <div className="absolute -bottom-2 right-6 h-0 w-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-border" />
            <div className="absolute -bottom-[7px] right-6 h-0 w-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-card" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mascot */}
      <motion.button
        onClick={() => setShowTip((v) => !v)}
        animate={{ y: [0, -6, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        className="h-16 w-16 cursor-pointer rounded-full bg-card border border-border shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow"
      >
        <img src={mascotImg} alt="Buddy - your AI assistant mascot" className="h-12 w-12 object-contain" />
      </motion.button>
    </div>
  );
};

export default MascotBuddy;
