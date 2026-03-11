import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Brain, ArrowRight, Sparkles, Shield, BarChart3 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { toast } from '@/hooks/use-toast';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Minimum 6 characters'),
});

const registerSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email').refine(v => v.endsWith('@aurora.edu.in'), 'Must be an aurora.edu.in email'),
  password: z.string().min(6, 'Minimum 6 characters'),
  rollNumber: z.string().min(1, 'Roll number is required'),
  classSection: z.string().min(1, 'Select class section'),
  lgNumber: z.string().min(1, 'Select LG number'),
  skills: z.string().min(1, 'Enter your skills'),
  weeklyAvailability: z.string().min(1, 'Enter weekly availability'),
});

type LoginData = z.infer<typeof loginSchema>;
type RegisterData = z.infer<typeof registerSchema>;

const classSections = ['CSE 3A', 'CSE 3B', 'CSE 3C', 'AIML 3A', 'AIML 3B', 'DS 3A'];
const lgNumbers = Array.from({ length: 10 }, (_, i) => `LG ${i + 1}`);

const features = [
  { icon: Sparkles, text: 'AI-Powered Evaluation' },
  { icon: Shield, text: 'Academic Integrity' },
  { icon: BarChart3, text: 'Real-time Analytics' },
];

const AuthPage = ({ initialMode = 'login' }: { initialMode?: 'login' | 'register' }) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const [classSection, setClassSection] = useState('');
  const [lgNumber, setLgNumber] = useState('');

  const loginForm = useForm<LoginData>({ resolver: zodResolver(loginSchema) });
  const registerForm = useForm<RegisterData>({ resolver: zodResolver(registerSchema) });

  const onLogin = async (data: LoginData) => {
    try {
      const response = await api.post('/auth/login', data);
      const { user, message } = response.data;
      
      const storeUser = {
        id: user.id.toString(),
        name: user.name,
        email: data.email,
        rollNumber: user.roll_number || '',
        classSection: user.class_section || '',
        lgNumber: user.lg_number ? `LG ${user.lg_number}` : '',
        skills: user.skills || '',
        weeklyAvailability: user.availability || '',
      };

      login(storeUser, 'token-placeholder');
      toast({
        title: 'Success',
        description: message,
      });
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error.response?.data?.detail || 'Something went wrong. Please try again.',
      });
    }
  };

  const onRegister = async (data: RegisterData) => {
    try {
      const payload = {
        name: data.name,
        email: data.email,
        password: data.password,
        roll_number: data.rollNumber,
        class_section: data.classSection,
        lg_number: parseInt(data.lgNumber.replace('LG ', '')),
        skills: data.skills,
        availability: data.weeklyAvailability
      };

      const response = await api.post('/auth/register', payload);
      toast({
        title: 'Success',
        description: response.data.message,
      });
      
      setMode('login');
      loginForm.setValue('email', data.email);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Registration Failed',
        description: error.response?.data?.detail || 'Something went wrong. Please try again.',
      });
    }
  };

  const isLogin = mode === 'login';

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-accent/30 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative flex w-full max-w-[960px] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        style={{ minHeight: '600px' }}
      >
        {/* Sliding overlay panel */}
        <motion.div
          animate={{ x: isLogin ? '100%' : '0%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="absolute left-0 top-0 z-20 flex h-full w-1/2 flex-col items-center justify-center gradient-primary p-10 text-center"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center"
            >
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
                <Brain className="h-8 w-8 text-primary-foreground" />
              </div>
              <h2 className="text-3xl font-bold text-primary-foreground">
                {isLogin ? 'Welcome Back!' : 'Join Us!'}
              </h2>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-primary-foreground/80">
                {isLogin
                  ? 'Sign in to continue tracking your group project contributions with AI.'
                  : 'Create your account and start collaborating with your team today.'}
              </p>

              {/* Features */}
              <div className="mt-8 space-y-3">
                {features.map((f) => (
                  <div key={f.text} className="flex items-center gap-3 text-primary-foreground/90">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                      <f.icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">{f.text}</span>
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                onClick={() => setMode(isLogin ? 'register' : 'login')}
                className="mt-10 border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
              >
                {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
              </Button>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Login form (left half) */}
        <div className="flex w-1/2 items-center justify-center p-8">
          <AnimatePresence mode="wait">
            {isLogin && (
              <motion.div
                key="login-form"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="w-full max-w-sm"
              >
                <h1 className="text-2xl font-bold text-foreground">Sign In</h1>
                <p className="mt-1 text-sm text-muted-foreground">Enter your credentials to continue</p>

                <form onSubmit={loginForm.handleSubmit(onLogin)} className="mt-8 space-y-5">
                  <div>
                    <Label htmlFor="login-email">Email</Label>
                    <Input id="login-email" {...loginForm.register('email')} placeholder="name@aurora.edu.in" className="mt-1.5" />
                    {loginForm.formState.errors.email && <p className="mt-1 text-xs text-destructive">{loginForm.formState.errors.email.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="login-password">Password</Label>
                    <Input id="login-password" type="password" {...loginForm.register('password')} placeholder="••••••" className="mt-1.5" />
                    {loginForm.formState.errors.password && <p className="mt-1 text-xs text-destructive">{loginForm.formState.errors.password.message}</p>}
                  </div>
                  <div className="flex items-center justify-end">
                    <button type="button" className="text-xs text-primary hover:underline">Forgot password?</button>
                  </div>
                  <Button type="submit" className="w-full gap-2 gradient-primary border-0 text-primary-foreground" disabled={loginForm.formState.isSubmitting}>
                    Sign In <ArrowRight className="h-4 w-4" />
                  </Button>
                </form>

                {/* Mobile toggle */}
                <p className="mt-6 text-center text-sm text-muted-foreground lg:hidden">
                  Don't have an account?{' '}
                  <button onClick={() => setMode('register')} className="font-medium text-primary hover:underline">Sign Up</button>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Register form (right half) */}
        <div className="flex w-1/2 items-center justify-center p-8">
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                key="register-form"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="w-full max-w-sm"
              >
                <h1 className="text-2xl font-bold text-foreground">Create Account</h1>
                <p className="mt-1 text-sm text-muted-foreground">Join your LG group and start tracking</p>

                <form onSubmit={registerForm.handleSubmit(onRegister)} className="mt-6 space-y-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="reg-name" className="text-xs">Full Name</Label>
                      <Input id="reg-name" {...registerForm.register('name')} placeholder="John Doe" className="mt-1 h-9 text-sm" />
                      {registerForm.formState.errors.name && <p className="mt-0.5 text-[10px] text-destructive">{registerForm.formState.errors.name.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="reg-roll" className="text-xs">Roll Number</Label>
                      <Input id="reg-roll" {...registerForm.register('rollNumber')} placeholder="21CS001" className="mt-1 h-9 text-sm" />
                      {registerForm.formState.errors.rollNumber && <p className="mt-0.5 text-[10px] text-destructive">{registerForm.formState.errors.rollNumber.message}</p>}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="reg-email" className="text-xs">College Email</Label>
                    <Input id="reg-email" {...registerForm.register('email')} placeholder="name@aurora.edu.in" className="mt-1 h-9 text-sm" />
                    {registerForm.formState.errors.email && <p className="mt-0.5 text-[10px] text-destructive">{registerForm.formState.errors.email.message}</p>}
                  </div>

                  <div>
                    <Label htmlFor="reg-password" className="text-xs">Password</Label>
                    <Input id="reg-password" type="password" {...registerForm.register('password')} placeholder="••••••" className="mt-1 h-9 text-sm" />
                    {registerForm.formState.errors.password && <p className="mt-0.5 text-[10px] text-destructive">{registerForm.formState.errors.password.message}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Class Section</Label>
                      <Select value={classSection} onValueChange={(v) => { setClassSection(v); registerForm.setValue('classSection', v); }}>
                        <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {classSections.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {registerForm.formState.errors.classSection && <p className="mt-0.5 text-[10px] text-destructive">{registerForm.formState.errors.classSection.message}</p>}
                    </div>
                    <div>
                      <Label className="text-xs">LG Number</Label>
                      <Select value={lgNumber} onValueChange={(v) => { setLgNumber(v); registerForm.setValue('lgNumber', v); }}>
                        <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {lgNumbers.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {registerForm.formState.errors.lgNumber && <p className="mt-0.5 text-[10px] text-destructive">{registerForm.formState.errors.lgNumber.message}</p>}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="reg-skills" className="text-xs">Skills</Label>
                    <Textarea id="reg-skills" {...registerForm.register('skills')} placeholder="Python, React, Data Analysis..." className="mt-1 text-sm" rows={2} />
                    {registerForm.formState.errors.skills && <p className="mt-0.5 text-[10px] text-destructive">{registerForm.formState.errors.skills.message}</p>}
                  </div>

                  <div>
                    <Label htmlFor="reg-avail" className="text-xs">Weekly Availability</Label>
                    <Input id="reg-avail" {...registerForm.register('weeklyAvailability')} placeholder="e.g., 10 hours" className="mt-1 h-9 text-sm" />
                    {registerForm.formState.errors.weeklyAvailability && <p className="mt-0.5 text-[10px] text-destructive">{registerForm.formState.errors.weeklyAvailability.message}</p>}
                  </div>

                  <Button type="submit" className="w-full gap-2 gradient-primary border-0 text-primary-foreground" disabled={registerForm.formState.isSubmitting}>
                    Create Account <ArrowRight className="h-4 w-4" />
                  </Button>
                </form>

                {/* Mobile toggle */}
                <p className="mt-4 text-center text-sm text-muted-foreground lg:hidden">
                  Already have an account?{' '}
                  <button onClick={() => setMode('login')} className="font-medium text-primary hover:underline">Sign In</button>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
