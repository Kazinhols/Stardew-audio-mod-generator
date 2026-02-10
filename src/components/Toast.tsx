import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import type { ToastType } from '@/types/audio';

interface ToastProps {
  message: string;
  type: ToastType;
  visible: boolean;
}

const toastStyles: Record<ToastType, { bg: string; icon: string; border: string }> = {
  success: {
    bg: 'bg-gradient-to-r from-green-700 to-green-600',
    icon: '✅',
    border: 'border-green-400',
  },
  error: {
    bg: 'bg-gradient-to-r from-red-700 to-red-600',
    icon: '❌',
    border: 'border-red-400',
  },
  info: {
    bg: 'bg-gradient-to-r from-blue-700 to-blue-600',
    icon: '💡',
    border: 'border-blue-400',
  },
  warning: {
    bg: 'bg-gradient-to-r from-amber-700 to-amber-600',
    icon: '⚠️',
    border: 'border-amber-400',
  },
};

export function Toast({ message, type, visible }: ToastProps) {
  const style = toastStyles[type];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.8, x: '-50%' }}
          animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
          exit={{ opacity: 0, y: 30, scale: 0.8, x: '-50%' }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className={cn(
            'fixed bottom-8 left-1/2 px-5 py-3 rounded-lg text-white text-base z-[100] flex items-center gap-3 pixel-border-sm border-2 font-bold',
            style.bg,
            style.border
          )}
        >
          {/* Icon with bounce */}
          <motion.span
            initial={{ rotate: -180, scale: 0 }}
            animate={{ rotate: 0, scale: [0, 1.3, 1] }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 500 }}
            className="text-xl"
          >
            {style.icon}
          </motion.span>

          {/* Message with pixel shadow */}
          <span className="text-shadow-pixel">{message}</span>

          {/* Decorative sparkle */}
          <motion.span
            className="text-sm"
            animate={{
              opacity: [1, 0.5, 1],
              rotate: [0, 180, 360],
              scale: [1, 0.8, 1],
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            ✨
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
