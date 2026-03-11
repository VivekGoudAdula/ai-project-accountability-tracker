import { useAuthStore } from '@/store/authStore';
import { useProjectStore } from '@/store/projectStore';
import { Bell, Calendar } from 'lucide-react';

const TopNavbar = () => {
  const { user } = useAuthStore();
  const { phases } = useProjectStore();
  const currentPhase = phases.find((p) => p.status === 'current');

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/80 px-6 backdrop-blur-xl">
      <div />
      <div className="flex items-center gap-4">
        {/* Phase Badge */}
        {currentPhase && (
          <div className="hidden items-center gap-2 rounded-lg border border-border bg-accent/50 px-3 py-1.5 sm:flex">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-foreground">
              Week {currentPhase.week}
            </span>
            <span className="text-xs text-muted-foreground">
              {currentPhase.title}
            </span>
          </div>
        )}

        {/* Notifications */}
        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-accent">
          <Bell className="h-4.5 w-4.5 text-muted-foreground" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
        </button>

        {/* User */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full gradient-primary text-xs font-bold text-primary-foreground">
            {user?.name?.charAt(0) || 'S'}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium leading-none text-foreground">{user?.name || 'Student'}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{user?.classSection || 'CSE 3A'}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;
