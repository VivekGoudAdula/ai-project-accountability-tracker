import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Brain, Shield, BarChart3, Users, Clock, Zap,
  CheckCircle2, ArrowRight, Sparkles, Award,
} from 'lucide-react';
import Navbar from '@/components/Navbar';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' },
  }),
};

const features = [
  { icon: Brain, title: 'AI-Powered Evaluation', desc: 'Prompt-engineered fairness assessment for every team member.' },
  { icon: Shield, title: 'Academic Integrity', desc: 'Ensures equal contribution tracking across all project phases.' },
  { icon: BarChart3, title: 'Real-time Analytics', desc: 'Visual dashboards showing contribution scores and progress.' },
  { icon: Users, title: 'Team Management', desc: 'Automatic team formation with LG-based grouping.' },
  { icon: Clock, title: 'Phase Tracking', desc: 'Week-by-week milestone tracking with deadline management.' },
  { icon: Zap, title: 'Smart Task Assignment', desc: 'AI distributes tasks based on skills and availability.' },
];

const workflow = [
  { step: '01', title: 'Register & Join LG', desc: 'Students register with college email and auto-join their LG group.' },
  { step: '02', title: 'Project Initialization', desc: 'Team leader sets up project details for each subject.' },
  { step: '03', title: 'Phase-wise Submissions', desc: 'Submit deliverables each week — from literature survey to presentation.' },
  { step: '04', title: 'AI Evaluation', desc: 'System evaluates fairness and generates contribution scores.' },
];

const benefits = [
  'Eliminates free-rider problem in group projects',
  'Transparent contribution tracking for faculty',
  'AI-generated fair task distribution',
  'Phase-wise deadline management',
  'Skill-based task assignment',
  'Comprehensive analytics & reports',
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-24 pt-20 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-60 -top-60 h-[600px] w-[600px] rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-primary/5 blur-3xl" />
        </div>
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <div>
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
              <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground shadow-sm">
                <Sparkles className="h-4 w-4 text-primary" /> Powered by Prompt Engineering
              </span>
            </motion.div>
            <motion.h1
              initial="hidden" animate="visible" variants={fadeUp} custom={1}
              className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-[3.5rem]"
            >
              AI Group Project{' '}
              <span className="gradient-text">Accountability Tracker</span>
            </motion.h1>
            <motion.p
              initial="hidden" animate="visible" variants={fadeUp} custom={2}
              className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground"
            >
              A prompt-engineered system that ensures fairness in academic group projects.
              Track contributions, manage phases, and evaluate teams with AI.
            </motion.p>
            <motion.div
              initial="hidden" animate="visible" variants={fadeUp} custom={3}
              className="mt-10 flex gap-4"
            >
              <Link to="/register" className="flex items-center gap-2">
                <Button size="lg" className="gap-2 px-8 text-base gradient-primary border-0 text-primary-foreground hover:opacity-90">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="px-8 text-base">
                  Login
                </Button>
              </Link>
            </motion.div>
          </div>
          {/* Right side illustration */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="hidden lg:block"
          >
            <div className="relative rounded-2xl border border-border bg-card shadow-xl">
              {/* Window chrome */}
              <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                <div className="h-3 w-3 rounded-full bg-destructive/60" />
                <div className="h-3 w-3 rounded-full bg-warning/60" />
                <div className="h-3 w-3 rounded-full bg-success/60" />
                <span className="ml-3 text-xs text-muted-foreground">GroupTrackAI — Dashboard</span>
              </div>

              <div className="p-5">
                {/* Mini stat cards */}
                <div className="mb-4 grid grid-cols-3 gap-2.5">
                  {[
                    { label: 'Active Projects', value: '5', change: '+2 this week', color: 'text-primary' },
                    { label: 'Contribution', value: '87%', change: '↑ 12%', color: 'text-success' },
                    { label: 'Deadline', value: 'Sun', change: '11:59 PM', color: 'text-warning' },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-lg border border-border bg-background p-2.5">
                      <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                      <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                      <p className="text-[10px] text-muted-foreground">{stat.change}</p>
                    </div>
                  ))}
                </div>

                {/* Subject rows */}
                <div className="mb-4 space-y-2">
                  {[
                    { name: 'Prompt Engineering', phase: 'Literature Survey', progress: 65, gradient: 'from-primary to-[hsl(262,83%,58%)]' },
                    { name: 'NLP', phase: 'Project Design', progress: 45, gradient: 'from-[hsl(217,91%,60%)] to-[hsl(199,89%,48%)]' },
                    { name: 'Software Engineering', phase: 'Implementation', progress: 80, gradient: 'from-[hsl(160,84%,39%)] to-[hsl(168,80%,35%)]' },
                  ].map((item) => (
                    <div key={item.name} className="flex items-center gap-3 rounded-lg border border-border bg-background p-2.5">
                      <div className={`h-8 w-8 flex-shrink-0 rounded-lg bg-gradient-to-br ${item.gradient}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="truncate text-xs font-medium text-foreground">{item.name}</p>
                          <span className="ml-2 text-[10px] font-semibold text-foreground">{item.progress}%</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">{item.phase}</p>
                        <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-secondary">
                          <div className={`h-full rounded-full bg-gradient-to-r ${item.gradient}`} style={{ width: `${item.progress}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Mini chart */}
                <div className="rounded-lg border border-border bg-background p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-[10px] font-medium text-foreground">Contribution Trend</p>
                    <p className="text-[10px] text-success">+12% ↑</p>
                  </div>
                  <div className="flex h-16 items-end gap-1.5">
                    {[35, 50, 42, 65, 58, 72, 68, 85, 78, 90].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t bg-primary/80 transition-all"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                  <div className="mt-1 flex justify-between">
                    <span className="text-[8px] text-muted-foreground">W6</span>
                    <span className="text-[8px] text-muted-foreground">W10</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-20 sm:px-6 lg:px-8" id="features">
        <div className="mx-auto max-w-6xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">Powerful Features</h2>
            <p className="mt-4 text-lg text-muted-foreground">Everything you need to manage and evaluate group projects fairly.</p>
          </motion.div>
          <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className="group rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent transition-colors group-hover:bg-primary/10">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-base font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Academic Workflow */}
      <section className="border-y border-border bg-card/50 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">Academic Workflow</h2>
            <p className="mt-4 text-lg text-muted-foreground">Structured 6-week project lifecycle from research to evaluation.</p>
          </motion.div>
          <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {['Literature Survey', 'Project Design', 'Implementation', 'Project Report', 'Presentation', 'Evaluation'].map((phase, i) => (
              <motion.div
                key={phase}
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition-all hover:shadow-md"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg gradient-primary text-sm font-bold text-primary-foreground">
                  W{i + 6}
                </div>
                <div>
                  <p className="font-medium text-foreground">{phase}</p>
                  <p className="text-xs text-muted-foreground">Week {i + 6}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">How It Works</h2>
            <p className="mt-4 text-lg text-muted-foreground">Simple 4-step process from registration to evaluation.</p>
          </motion.div>
          <div className="mt-16 space-y-6">
            {workflow.map((w, i) => (
              <motion.div
                key={w.step}
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className="flex gap-5 rounded-xl border border-border bg-card p-5 transition-all hover:shadow-md"
              >
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl gradient-primary text-lg font-bold text-primary-foreground">
                  {w.step}
                </div>
                <div className="pt-1">
                  <h3 className="text-base font-semibold text-foreground">{w.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{w.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="border-y border-border bg-card/50 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">Benefits</h2>
            <p className="mt-4 text-lg text-muted-foreground">Why institutions choose our accountability tracker.</p>
          </motion.div>
          <div className="mt-12 grid gap-3 sm:grid-cols-2">
            {benefits.map((b, i) => (
              <motion.div
                key={b}
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:shadow-sm"
              >
                <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-success" />
                <span className="text-sm font-medium text-foreground">{b}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <Award className="mx-auto mb-4 h-12 w-12 text-primary" />
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">Ready to ensure fair collaboration?</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Join your classmates and start tracking contributions today.
            </p>
            <div className="mt-8">
              <Link to="/register">
                <Button size="lg" className="gap-2 px-8 text-base gradient-primary border-0 text-primary-foreground hover:opacity-90">
                  Get Started Free <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card px-4 py-8">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-sm text-muted-foreground">© 2026 GroupTrackAI. Built for academic excellence.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
