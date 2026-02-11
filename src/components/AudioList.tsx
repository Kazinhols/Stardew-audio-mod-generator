import { motion, AnimatePresence } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import type { AudioEntry } from '@/types/audio';
import { cn } from '@/utils/cn';
import { AnimatedButton } from './animations';

interface AudioListProps {
  audios: AudioEntry[];
  onRemove: (index: number) => void;
  onClearAll: () => void;
  onNext: () => void;
}

const categoryBadgeColors: Record<string, { light: string; dark: string }> = {
  music: { light: 'bg-[#9b59b6]', dark: 'bg-purple-600' },
  ambient: { light: 'bg-[#607d8b]', dark: 'bg-slate-600' },
  sound: { light: 'bg-[#795548]', dark: 'bg-amber-700' },
  footstep: { light: 'bg-[#9e9e9e]', dark: 'bg-gray-500' },
};

export function AudioList({ audios, onRemove, onClearAll, onNext }: AudioListProps) {
  const { t } = useLanguage();
  const { theme } = useTheme();

  return (
    <motion.div className="mt-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <h3 className={cn('text-lg sm:text-xl font-bold mb-4', theme === 'dark' ? 'text-white' : 'text-[#5c3d2e]')}>
        📋 {t('audio.listTitle')} {audios.length > 0 && (
          <motion.span key={audios.length} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={theme === 'dark' ? 'text-gray-400' : 'text-[#8b6914]'}>
            ({audios.length})
          </motion.span>
        )}
      </h3>

      {audios.length === 0 ? (
        <motion.div className={cn('text-center py-10 text-lg sm:text-xl', theme === 'dark' ? 'text-gray-500' : 'text-[#8b6914]')} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <motion.span className="text-4xl sm:text-5xl block mb-4" animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>🎵</motion.span>
          {t('audio.emptyList')}<br />{t('audio.emptyListHint')}
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {audios.map((audio, index) => (
              <motion.div
                key={`${audio.id}-${index}`} layout
                initial={{ opacity: 0, x: -50, scale: 0.9 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 50, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25, delay: index * 0.05 }}
                whileHover={{ x: 5, transition: { duration: 0.2 } }}
                className={cn(
                  'border-2 p-3 sm:p-4 rounded-lg',
                  theme === 'dark' ? 'bg-gradient-to-r from-gray-800 to-gray-750 border-gray-600 hover:border-orange-500' : 'bg-gradient-to-r from-white to-[#f8f0d8] border-[#8b5a2b] hover:border-[#e07020]',
                  audio.type === 'replace' ? 'border-l-4 sm:border-l-5 border-l-[#e07020]' : 'border-l-4 sm:border-l-5 border-l-[#56a037]'
                )}
              >
                <div className="flex justify-between items-start mb-2.5">
                  <div className="flex-1 min-w-0">
                    <div className={cn('text-lg sm:text-xl font-bold truncate', theme === 'dark' ? 'text-white' : 'text-[#5c3d2e]')}>{audio.id}</div>
                    {audio.originalName && <div className={cn('text-sm sm:text-base truncate', theme === 'dark' ? 'text-gray-400' : 'text-[#8b6914]')}>📌 {audio.originalName}</div>}
                  </div>
                  <motion.button onClick={() => onRemove(index)} whileHover={{ scale: 1.15, rotate: 10 }} whileTap={{ scale: 0.9 }} className="bg-[#e63e3e] border-0 text-white w-8 h-8 sm:w-9 sm:h-9 rounded-md cursor-pointer text-lg flex items-center justify-center hover:bg-[#ff4444] transition-colors flex-shrink-0 ml-2">
                    <Trash2 size={16} />
                  </motion.button>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {audio.files.map((file, fileIndex) => (
                    <motion.span key={fileIndex} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: fileIndex * 0.05 }} className={cn('px-2 py-0.5 rounded-xl text-xs sm:text-sm', theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200')}>
                      📁 {file}
                    </motion.span>
                  ))}
                </div>

                <motion.div className="flex flex-wrap gap-1.5" initial="hidden" animate="visible" variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } }}>
                  <motion.span variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className={cn('px-2 py-0.5 sm:px-2.5 sm:py-1 rounded text-xs sm:text-sm text-white', audio.type === 'replace' ? 'bg-[#e07020]' : 'bg-[#4a90d9]')}>
                    {audio.type === 'replace' ? `🔄 ${t('audio.replace')}` : `➕ ${t('audio.new')}`}
                  </motion.span>
                  <motion.span variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className={cn('px-2 py-0.5 sm:px-2.5 sm:py-1 rounded text-xs sm:text-sm text-white', theme === 'dark' ? categoryBadgeColors[audio.category.toLowerCase()]?.dark || 'bg-gray-600' : categoryBadgeColors[audio.category.toLowerCase()]?.light || 'bg-gray-500')}>
                    {t(`category.${audio.category}`)}
                  </motion.span>
                  {audio.looped && <motion.span variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded text-xs sm:text-sm text-white bg-[#2196f3]">🔁 Loop</motion.span>}
                  {audio.jukebox && <motion.span variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded text-xs sm:text-sm text-white bg-[#56a037]">📻 Jukebox</motion.span>}
                  {audio.jukebox && !audio.jukebox.available && <motion.span variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded text-xs sm:text-sm text-white bg-[#e63e3e]">👁️ {t('audio.hidden')}</motion.span>}
                </motion.div>

                {audio.jukebox && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={cn('text-sm sm:text-base mt-2', theme === 'dark' ? 'text-gray-400' : 'text-[#8b6914]')}>📻 "{audio.jukebox.name}"</motion.div>}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <AnimatedButton onClick={onClearAll} disabled={audios.length === 0} className={cn('p-3 sm:p-3.5 text-xl sm:text-2xl text-white rounded-lg cursor-pointer flex items-center justify-center gap-2.5 shadow-md disabled:opacity-50 disabled:cursor-not-allowed', theme === 'dark' ? 'bg-gradient-to-b from-red-500 to-red-600 border-b-4 border-red-700' : 'bg-gradient-to-b from-[#e64e4e] to-[#c02020] border-b-4 border-[#901515]')}>
          🗑️ {t('audio.clearAll')}
        </AnimatedButton>
        <AnimatedButton onClick={onNext} className={cn('p-3 sm:p-3.5 text-xl sm:text-2xl text-white rounded-lg cursor-pointer flex items-center justify-center gap-2.5 shadow-md', theme === 'dark' ? 'bg-gradient-to-b from-blue-500 to-blue-600 border-b-4 border-blue-700' : 'bg-gradient-to-b from-[#5aa0e9] to-[#3a80c0] border-b-4 border-[#2a5a8a]')}>
          📦 {t('tab.export')} ➡️
        </AnimatedButton>
      </motion.div>
    </motion.div>
  );
}