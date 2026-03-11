import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import AnalyticsCharts from '@/components/AnalyticsCharts';

const Analytics = () => {
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="mt-1 text-muted-foreground">Your contribution insights and performance metrics.</p>
        </motion.div>
        <AnalyticsCharts />
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
