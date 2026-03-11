import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar,
} from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, Clock, Target } from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { useAuthStore } from '@/store/authStore';

const tooltipStyle = {
  backgroundColor: 'hsl(0, 0%, 100%)',
  border: '1px solid hsl(220, 13%, 91%)',
  borderRadius: '10px',
  boxShadow: '0 4px 12px rgb(0 0 0 / 0.08)',
  fontSize: '12px',
};

const AnalyticsCharts = () => {
  const { user } = useAuthStore();
  const { submissionHistory } = useProjectStore();

  // Filter for current user's data
  const userSubmissions = submissionHistory.filter(s => s.user_id === user?.id).reverse();

  const contributionTrend = userSubmissions.map(s => ({
    week: s.phase.split(' ').map((p: string) => p[0]).join(''),
    score: s.ai_score || 0
  }));

  const hoursPerPhase = userSubmissions.map(s => ({
    phase: s.phase,
    hours: s.hours_spent || 0
  }));

  // Mock radar data based on avg scores if not enough real data
  const avgScore = userSubmissions.length > 0 
    ? userSubmissions.reduce((acc, s) => acc + (s.ai_score || 0), 0) / userSubmissions.length 
    : 0;

  const radarData = [
    { skill: 'Contribution', value: avgScore || 20 },
    { skill: 'Consistency', value: avgScore > 80 ? 90 : 60 },
    { skill: 'Technical', value: avgScore > 70 ? 85 : 55 },
    { skill: 'Documentation', value: 75 },
    { skill: 'Timeliness', value: 95 },
  ];

  const hasData = userSubmissions.length > 0;

  if (!hasData) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/20 text-muted-foreground">
        <Target className="mb-3 h-8 w-8 opacity-20" />
        <p className="font-medium">No analytics data available</p>
        <p className="text-xs">Data will appear here once you start submitting project deliverables.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border bg-card p-6"
      >
        <div className="mb-5 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="text-base font-semibold text-foreground">Contribution Score Trend</h3>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={contributionTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 93%)" />
            <XAxis dataKey="week" stroke="hsl(215, 16%, 57%)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(215, 16%, 57%)" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line
              type="monotone"
              dataKey="score"
              stroke="hsl(239, 84%, 67%)"
              strokeWidth={2.5}
              dot={{ fill: 'hsl(239, 84%, 67%)', r: 4, strokeWidth: 2, stroke: 'white' }}
              activeDot={{ r: 6, stroke: 'hsl(239, 84%, 67%)', strokeWidth: 2, fill: 'white' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border border-border bg-card p-6"
      >
        <div className="mb-5 flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <h3 className="text-base font-semibold text-foreground">Hours Worked Per Phase</h3>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={hoursPerPhase}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 93%)" />
            <XAxis dataKey="phase" stroke="hsl(215, 16%, 57%)" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(215, 16%, 57%)" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="hours" fill="hsl(239, 84%, 67%)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl border border-border bg-card p-6 lg:col-span-2"
      >
        <div className="mb-5 flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <h3 className="text-base font-semibold text-foreground">Contribution Radar Chart</h3>
        </div>
        <div className="mx-auto max-w-lg">
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="hsl(220, 13%, 91%)" />
              <PolarAngleAxis dataKey="skill" stroke="hsl(215, 16%, 47%)" fontSize={12} />
              <PolarRadiusAxis stroke="hsl(220, 13%, 91%)" fontSize={10} />
              <Radar
                dataKey="value"
                stroke="hsl(239, 84%, 67%)"
                fill="hsl(239, 84%, 67%)"
                fillOpacity={0.15}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
};

export default AnalyticsCharts;
