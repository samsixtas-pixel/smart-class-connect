import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle } from 'lucide-react';

interface StatusAnimationProps {
  type: 'success' | 'error' | null;
  message: string;
}

export function StatusAnimation({ type, message }: StatusAnimationProps) {
  return (
    <AnimatePresence>
      {type && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          className={`flex items-center gap-3 rounded-xl p-4 ${
            type === 'success'
              ? 'bg-success/10 text-success border border-success/20'
              : 'bg-destructive/10 text-destructive border border-destructive/20'
          }`}
        >
          {type === 'success' ? (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}>
              <CheckCircle2 className="h-6 w-6" />
            </motion.div>
          ) : (
            <motion.div animate={{ x: [0, -5, 5, -5, 5, 0] }} transition={{ duration: 0.4 }}>
              <XCircle className="h-6 w-6" />
            </motion.div>
          )}
          <span className="text-sm font-medium">{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
