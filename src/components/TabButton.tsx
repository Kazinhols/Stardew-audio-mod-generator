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
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className={cn(
        'px-4 sm:px-5 py-2 sm:py-3 border-3 rounded-t-lg text-lg sm:text-xl cursor-pointer transition-colors relative group',
        active
          ? theme === 'dark'
            ? 'bg-gradient-to-b from-orange-500 to-orange-600 text-white border-gray-600'
            : 'bg-gradient-to-b from-[#e07020] to-[#c06018] text-white border-[#8b5a2b]'
          : theme === 'dark'
            ? 'bg-gradient-to-b from-gray-700 to-gray-800 text-gray-300 border-gray-600 hover:from-gray-600 hover:to-gray-700'
            : 'bg-gradient-to-b from-[#e8d9a0] to-[#d6c08d] text-[#5c3d2e] border-[#8b5a2b] hover:from-[#f0e5b5] hover:to-[#e0d0a0]'
      )}
    >
      <span className="flex items-center gap-1">
        <motion.span
          animate={active ? { rotate: [0, 10, -10, 0] } : {}}
          transition={{ duration: 0.5 }}
        >
          {icon}
        </motion.span>
        {label}
        
        <AnimatePresence mode="wait">
          {counter !== undefined && counter > 0 && (
            <motion.span
              key={counter}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              className={cn(
                "ml-1 sm:ml-2 px-2 py-0.5 rounded-xl text-sm sm:text-base",
                theme === 'dark' ? 'bg-orange-600 text-white' : 'bg-[#e07020] text-white'
              )}
            >
              {counter}
            </motion.span>
          )}
        </AnimatePresence>
      </span>
      
      {}
      {active && (
        <motion.div
          layoutId="activeTab"
          className={cn(
            "absolute -bottom-1 left-0 right-0 h-1 rounded-full",
            theme === 'dark' ? 'bg-orange-400' : 'bg-[#e07020]'
          )}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      )}
      
      {}
      {shortcut && (
        <motion.span 
          initial={{ opacity: 0, y: 5 }}
          whileHover={{ opacity: 1, y: 0 }}
          className={cn(
            "absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs px-2 py-0.5 rounded whitespace-nowrap pointer-events-none hidden md:block",
            theme === 'dark' ? 'bg-gray-900 text-gray-300' : 'bg-black/80 text-white'
          )}
        >
          {shortcut}
        </motion.span>
      )}
    </motion.button>
  );
}
