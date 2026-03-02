import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ThemeToggle } from '@/components/ThemeToggle';
import { GraduationCap, UserPlus, LogIn, ArrowRight, Shield, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.15, duration: 0.6 } }),
};

const features = [
  { icon: CheckCircle, title: 'Instant Sign-in', desc: 'Students enter a 6-digit code to sign attendance instantly.' },
  { icon: Shield, title: 'Secure Codes', desc: 'Unique 6-digit codes prevent unauthorized access.' },
  { icon: Clock, title: 'Time-Limited', desc: 'Sessions expire after 10 minutes automatically.' },
];

const HomePage = () => {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated background */}
      <div className="animated-gradient-bg fixed inset-0 opacity-20" />
      <div className="fixed inset-0 bg-background/60 backdrop-blur-sm" />

      <div className="relative z-10">
        {/* Nav */}
        <nav className="flex items-center justify-between p-4 md:p-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold font-['Space_Grotesk']">SmartAttend</span>
          </motion.div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/login">
              <Button variant="ghost" size="sm"><LogIn className="mr-1 h-4 w-4" />Login</Button>
            </Link>
            <Link to="/register">
              <Button size="sm"><UserPlus className="mr-1 h-4 w-4" />Register</Button>
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <main className="container mx-auto px-4 py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
              <span className="glass inline-block rounded-full px-4 py-1.5 text-xs font-medium text-primary mb-6">
                ✨ Smart School Attendance System
              </span>
            </motion.div>

            <motion.h1
              custom={1}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="mb-6 text-4xl font-extrabold leading-tight md:text-6xl"
            >
              Attendance Made{' '}
              <span className="gradient-text">Effortless</span>
            </motion.h1>

            <motion.p
              custom={2}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="mb-10 text-lg text-muted-foreground md:text-xl"
            >
              Real-time attendance tracking. Teachers generate codes, students sign in — all from their phones, anywhere.
            </motion.p>

            <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible" className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link to="/register">
                <Button size="lg" className="gradient-bg border-0 text-white px-8 text-base font-semibold shadow-lg hover:shadow-xl transition-shadow">
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="glass px-8 text-base font-semibold">
                  Sign In
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Feature cards */}
          <div className="mx-auto mt-20 grid max-w-4xl gap-6 md:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                custom={i + 4}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="glass rounded-2xl p-6 text-center cursor-default"
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl gradient-bg">
                  <f.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="mb-2 text-lg font-bold">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default HomePage;
