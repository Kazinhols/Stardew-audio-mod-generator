import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import type { ToastType } from '@/types/audio';

interface ToastProps {
  message: string;
  type: ToastType;
  visible: boolean;
}

const colors: Record<ToastType, string> = {
  success: 'bg-[#56a037]',
  error: 'bg-[#e63e3e]',
  info: 'bg-[#4a90d9]',
  warning: 'bg-[#e07020]',
};

const icons: Record<ToastType, string> = {
  success: '✅',
  error: '❌',
  info: 'ℹ️',
  warning: '⚠️',
};

export function Toast({ message, type, visible }: ToastProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className={cn(
            'fixed bottom-5 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg text-white text-lg z-50 shadow-lg flex items-center gap-2',
            colors[type]
          )}
        >
          <motion.span
            initial={{ rotate: -180, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 500 }}
          >
            {icons[type]}
          </motion.span>
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
