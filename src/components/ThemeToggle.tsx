import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { toggleTheme, initTheme } from '@/lib/theme';
import { motion } from 'framer-motion';

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    initTheme();
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.1 }}
      onClick={() => {
        toggleTheme();
        setIsDark(!isDark);
      }}
      className="glass rounded-full p-3 transition-colors"
      aria-label="Toggle dark mode"
    >
      {isDark ? <Sun className="h-5 w-5 text-warning" /> : <Moon className="h-5 w-5 text-primary" />}
    </motion.button>
  );
}
