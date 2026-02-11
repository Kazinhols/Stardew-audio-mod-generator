import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { useTheme } from '@/contexts/ThemeContext';
import type { TabType } from '@/types/audio';

interface TabButtonProps {
  tab: TabType;
  label: string;
  icon: string;
  active: boolean;
  onClick: () => void;
  counter?: number;
  shortcut?: string;
}

export function TabButton({ label, icon, active, onClick, counter, shortcut }: TabButtonProps) {
  const { theme } = useTheme();

  return (
    <motion.button
      onClick={onClick}
      title={shortcut}
      whileHover={{ scale: 1.05, y: -3 }}
      whileTap={{ scale: 0.95, y: 0 }}
      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
      className={cn(
        'pixel-btn px-3 sm:px-5 py-2 sm:py-3 rounded-t-lg text-base sm:text-lg cursor-pointer relative group font-bold',
        active
          ? theme === 'dark'
            ? 'bg-gradient-to-b from-amber-500 to-amber-700 text-white border-amber-900 shadow-lg shadow-amber-500/20'
            : 'bg-gradient-to-b from-[#e07020] to-[#c06018] text-white border-[#8b3a10] shadow-lg shadow-[#e07020]/20'
          : theme === 'dark'
            ? 'bg-gradient-to-b from-gray-700 to-gray-800 text-gray-400 border-gray-600 hover:text-gray-200 hover:from-gray-600'
            : 'bg-gradient-to-b from-[#e8d9a0] to-[#d6c08d] text-[#5c3d2e] border-[#8b5a2b] hover:from-[#f0e5b5]'
      )}
    >
      <span className="flex items-center gap-1.5">
        <motion.span
          animate={active ? { 
            rotate: [0, 15, -15, 10, -10, 0],
            scale: [1, 1.2, 1],
          } : {}}
          transition={{ duration: 0.6 }}
          className="text-lg sm:text-xl"
        >
          {icon}
        </motion.span>
        <span className="hidden sm:inline text-shadow-pixel">{label}</span>

        {/* Counter badge */}
        <AnimatePresence mode="wait">
          {counter !== undefined && counter > 0 && (
            <motion.span
              key={counter}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              className={cn(
                'ml-0.5 sm:ml-1.5 px-2 py-0.5 rounded-full text-xs sm:text-sm font-bold',
                active
                  ? 'bg-white/25 text-white'
                  : theme === 'dark'
                    ? 'bg-amber-600/80 text-white'
                    : 'bg-[#e07020] text-white'
              )}
            >
              {counter}
            </motion.span>
          )}
        </AnimatePresence>
      </span>

      {/* Active glow indicator */}
      {active && (
        <motion.div
          layoutId="activeTabGlow"
          className={cn(
            'absolute -bottom-1 left-1 right-1 h-1 rounded-full',
            theme === 'dark'
              ? 'bg-amber-400 shadow-lg shadow-amber-400/50'
              : 'bg-[#e07020] shadow-lg shadow-[#e07020]/50'
          )}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}

      {/* Pixel sparkle on active */}
      {active && (
        <motion.span
          className="absolute -top-1 -right-1 text-xs pointer-events-none"
          animate={{
            opacity: [0, 1, 0],
            scale: [0.5, 1, 0.5],
            rotate: [0, 180, 360],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          ✨
        </motion.span>
      )}

      {/* Shortcut tooltip */}
      {shortcut && (
        <div
          className={cn(
            'absolute -bottom-7 left-1/2 -translate-x-1/2 text-[9px] px-2 py-0.5 rounded whitespace-nowrap pointer-events-none hidden md:block opacity-0 group-hover:opacity-100 transition-opacity font-pixel',
            theme === 'dark' ? 'bg-gray-900 text-amber-300 border border-gray-700' : 'bg-[#5c3d2e] text-[#f8ecc2] border border-[#8b5a2b]'
          )}
        >
          {shortcut}
        </div>
      )}
    </motion.button>
  );
}
