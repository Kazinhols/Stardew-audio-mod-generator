import { lazy, Suspense, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp, useAppState, useAppDispatch, useTauri } from '@/state/AppContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { TabButton } from '@/components/TabButton';
import { Toast } from '@/components/Toast';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { AnimatedButton, AnimatedCounter } from '@/components/animations';
import {
  FloatingParticles,
  JunimoMascot,
  SeasonalCorners,
  WoodDivider,
  GoldCounter,
  DayNightIndicator,
} from '@/components/StardewDecorations';
import { cn } from '@/utils/cn';

const SetupTab = lazy(() => import('@/components/SetupTab').then(m => ({ default: m.SetupTab })));
const AudioTab = lazy(() => import('@/components/AudioTab').then(m => ({ default: m.AudioTab })));
const ScanTab = lazy(() => import('@/components/ScanTab').then(m => ({ default: m.ScanTab })));
const ExportTab = lazy(() => import('@/components/ExportTab').then(m => ({ default: m.ExportTab })));
const HelpTab = lazy(() => import('@/components/HelpTab').then(m => ({ default: m.HelpTab })));

function TabLoader() {
  const { theme } = useTheme();
  return (
    <div className={cn('flex flex-col items-center justify-center py-20', theme === 'dark' ? 'text-gray-500' : 'text-[#8b6914]')}>
      <motion.div
        className="text-5xl mb-4"
        animate={{
          y: [0, -15, 0],
          rotate: [0, 10, -10, 0],
        }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        🎵
      </motion.div>
      <motion.div
        className="flex gap-1"
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.15 } },
          hidden: {},
        }}
      >
        {['L', 'o', 'a', 'd', 'i', 'n', 'g', '.', '.', '.'].map((c, i) => (
          <motion.span
            key={i}
            className="font-pixel text-xs"
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: { opacity: 1, y: 0 },
            }}
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
          >
            {c}
          </motion.span>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Header ──────────────────────────────────────────────────
const HeaderBar = memo(function HeaderBar() {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const state = useAppState();
  const dispatch = useAppDispatch();
  const tauri = useTauri();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-4">
        <div className="flex items-center gap-3">
          <LanguageToggle />
          <DayNightIndicator />
        </div>
        <div className="flex items-center gap-2">
          <AnimatedButton
            onClick={tauri.loadProject}
            className={cn(
              'pixel-btn px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5',
              theme === 'dark'
                ? 'bg-blue-700 text-white border-blue-900 hover:bg-blue-600'
                : 'bg-[#5aa0e9] text-white border-[#3a70b0] hover:bg-[#4a90d9]'
            )}
          >
            📂 {language === 'pt' ? 'Abrir' : 'Open'}
          </AnimatedButton>
          <AnimatedButton
            onClick={tauri.saveProject}
            className={cn(
              'pixel-btn px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5',
              theme === 'dark'
                ? 'bg-green-700 text-white border-green-900 hover:bg-green-600'
                : 'bg-[#56a037] text-white border-[#2d5a20] hover:bg-[#4a9030]'
            )}
          >
            💾 {language === 'pt' ? 'Salvar' : 'Save'}
          </AnimatedButton>
          <AnimatedButton
            onClick={() => dispatch({ type: 'RESET' })}
            className={cn(
              'pixel-btn px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5',
              theme === 'dark'
                ? 'bg-red-700 text-white border-red-900 hover:bg-red-600'
                : 'bg-[#e63e3e] text-white border-[#a02020] hover:bg-[#d03030]'
            )}
          >
            🗑️ {language === 'pt' ? 'Novo' : 'New'}
          </AnimatedButton>
        </div>
      </div>

      {/* Title with pixel art feel */}
      <div className="text-center mb-2">
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <h1
            className={cn(
              'font-pixel text-xl sm:text-2xl md:text-3xl text-shadow-pixel leading-relaxed',
              theme === 'dark' ? 'text-amber-300' : 'text-[#5c3d2e]'
            )}
          >
            <motion.span
              className="inline-block"
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🎵
            </motion.span>
            {' '}Stardew Audio{' '}
            <motion.span
              className="inline-block"
              animate={{ rotate: [0, -15, 15, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            >
              🎵
            </motion.span>
          </h1>
        </motion.div>

        <motion.p
          className={cn(
            'text-xs sm:text-sm mt-1 opacity-70',
            theme === 'dark' ? 'text-amber-400/60' : 'text-[#8b6914]'
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 0.3 }}
        >
          Mod Generator v3.0 | {tauri.isDesktop ? '🖥️ Desktop' : '🌐 Web'}
        </motion.p>
      </div>

      {/* Stats bar */}
      <div className="flex justify-center items-center gap-3 flex-wrap mb-3 mt-3">
        <GoldCounter
          value={state.audios.length}
          label={language === 'pt' ? 'áudios' : 'audios'}
        />

        <motion.div
          className={cn(
            'flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold border',
            state.dirty
              ? theme === 'dark'
                ? 'bg-yellow-900/30 text-yellow-300 border-yellow-700/50'
                : 'bg-yellow-100 text-yellow-700 border-yellow-400/40'
              : theme === 'dark'
                ? 'bg-green-900/30 text-green-300 border-green-700/50'
                : 'bg-green-100 text-green-700 border-green-400/40'
          )}
          animate={state.dirty ? { scale: [1, 1.03, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {state.dirty ? '🟡' : '💾'}
          <span>{state.dirty ? (language === 'pt' ? 'Não salvo' : 'Unsaved') : (language === 'pt' ? 'Salvo' : 'Saved')}</span>
        </motion.div>

        {state.assetsFolder && (
          <div className={cn(
            'flex items-center gap-1 px-3 py-1 rounded-full text-xs border truncate max-w-[180px]',
            theme === 'dark'
              ? 'bg-blue-900/30 text-blue-300 border-blue-700/50'
              : 'bg-blue-100 text-blue-700 border-blue-400/40'
          )}>
            📂 {state.assetsFolder.split(/[/\\]/).pop()}
          </div>
        )}
      </div>

      <WoodDivider />
    </motion.div>
  );
});

// ─── Tab Navigation ──────────────────────────────────────────
const TabNavigation = memo(function TabNavigation() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const tauri = useTauri();
  const { t, language } = useLanguage();

  const setTab = useCallback((tab: typeof state.activeTab) => {
    dispatch({ type: 'SET_TAB', payload: tab });
  }, [dispatch]);

  const tabs = [
    { id: 'setup' as const, label: t('tab.setup'), icon: '📋', shortcut: 'Ctrl+1' },
    { id: 'audio' as const, label: t('tab.audio'), icon: '🎶', shortcut: 'Ctrl+2', counter: state.audios.length },
    ...(tauri.isDesktop ? [{ id: 'scan' as const, label: language === 'pt' ? 'Scanner' : 'Scanner', icon: '🔍', shortcut: 'Ctrl+3' }] : []),
    { id: 'export' as const, label: t('tab.export'), icon: '📦', shortcut: tauri.isDesktop ? 'Ctrl+4' : 'Ctrl+3' },
    { id: 'help' as const, label: t('tab.help'), icon: '❓', shortcut: tauri.isDesktop ? 'Ctrl+5' : 'Ctrl+4' },
  ];

  return (
    <div className="flex gap-1.5 sm:gap-2 mb-5 justify-center flex-wrap">
      {tabs.map((tab, i) => (
        <motion.div
          key={tab.id}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + i * 0.08, type: 'spring', stiffness: 300 }}
        >
          <TabButton
            tab={tab.id}
            label={tab.label}
            icon={tab.icon}
            active={state.activeTab === tab.id}
            onClick={() => setTab(tab.id)}
            counter={'counter' in tab ? tab.counter : undefined}
            shortcut={tab.shortcut}
          />
        </motion.div>
      ))}
    </div>
  );
});

// ─── Tab Content with transitions ────────────────────────────
function TabContent() {
  const { activeTab } = useAppState();

  return (
    <div className="min-h-[300px]">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <Suspense fallback={<TabLoader />}>
            {activeTab === 'setup' && <SetupTab />}
            {activeTab === 'audio' && <AudioTab />}
            {activeTab === 'scan' && <ScanTab />}
            {activeTab === 'export' && <ExportTab />}
            {activeTab === 'help' && <HelpTab />}
          </Suspense>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── Status Bar ──────────────────────────────────────────────
const StatusBar = memo(function StatusBar() {
  const { theme } = useTheme();
  const tauri = useTauri();

  return (
    <motion.div
      className={cn(
        'fixed bottom-0 left-0 right-0 px-3 py-1 text-[10px] flex justify-between items-center z-50 pointer-events-none backdrop-blur-sm',
        theme === 'dark'
          ? 'bg-gray-900/60 text-gray-500'
          : 'bg-[#f0e6d2]/60 text-[#8b6914]'
      )}
      initial={{ y: 20 }}
      animate={{ y: 0 }}
      transition={{ delay: 1 }}
    >
      <span className="font-pixel" style={{ fontSize: '7px' }}>
        {tauri.isDesktop ? 'Ctrl+1-5: Tabs | Ctrl+S/O' : '🌐 Web | Cross-Save'}
      </span>
      <span className="flex items-center gap-1">
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        >
          ⭐
        </motion.span>
        <span className="font-pixel" style={{ fontSize: '7px' }}>
          v3.0 | {tauri.isDesktop ? 'Tauri+Rust' : 'React'}
        </span>
      </span>
    </motion.div>
  );
});

// ─── Main App ────────────────────────────────────────────────
export function App() {
  const { toast } = useApp();
  const { theme } = useTheme();
  const { loading, loadingMessage } = useAppState();

  return (
    <div
      className={cn(
        'min-h-screen transition-colors duration-500 relative overflow-hidden',
        theme === 'dark' ? 'night-sky' : 'parchment-bg'
      )}
    >
      {/* Background decorations */}
      <FloatingParticles />
      <SeasonalCorners />

      {/* Loading overlay */}
      <LoadingOverlay visible={loading} message={loadingMessage} />

      {/* Main content */}
      <motion.div
        className="relative z-10 p-2 sm:p-4 md:p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className={cn(
            'max-w-[1200px] mx-auto rounded-xl overflow-hidden relative min-h-[85vh] pixel-border',
            theme === 'dark'
              ? 'bg-gray-800/95 border-gray-600'
              : 'bg-[#f8ecc2]/95 border-[#8b4513]'
          )}
          initial={{ y: 30, opacity: 0, scale: 0.97 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          {/* Decorative wooden top strip */}
          <div
            className={cn(
              'h-2 w-full',
              theme === 'dark'
                ? 'bg-gradient-to-r from-gray-700 via-amber-800/50 to-gray-700'
                : 'bg-gradient-to-r from-[#8b5a2b] via-[#c4956a] to-[#8b5a2b]'
            )}
          />

          <div className="p-4 sm:p-6">
            <HeaderBar />
            <TabNavigation />
            <TabContent />
          </div>

          {/* Bottom wooden strip */}
          <div
            className={cn(
              'h-2 w-full mt-4',
              theme === 'dark'
                ? 'bg-gradient-to-r from-gray-700 via-amber-800/50 to-gray-700'
                : 'bg-gradient-to-r from-[#8b5a2b] via-[#c4956a] to-[#8b5a2b]'
            )}
          />
        </motion.div>
      </motion.div>

      {/* Junimo mascot */}
      <JunimoMascot />

      {/* Status bar */}
      <StatusBar />

      {/* Toast */}
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
      />
    </div>
  );
}

// ─── Language Toggle ─────────────────────────────────────────
function LanguageToggle() {
  const { language, setLanguage } = useLanguage();
  const { theme } = useTheme();

  return (
    <div
      className={cn(
        'flex rounded-full p-0.5 border-2 overflow-hidden',
        theme === 'dark'
          ? 'bg-gray-800 border-gray-600'
          : 'bg-white/40 border-[#8b5a2b]/30'
      )}
    >
      <motion.button
        onClick={() => setLanguage('pt')}
        className={cn(
          'text-sm px-2.5 py-1 rounded-full transition-all',
          language === 'pt' && (theme === 'dark'
            ? 'bg-amber-600 text-white shadow-inner'
            : 'bg-[#e07020] text-white shadow-inner')
        )}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        🇧🇷
      </motion.button>
      <motion.button
        onClick={() => setLanguage('en')}
        className={cn(
          'text-sm px-2.5 py-1 rounded-full transition-all',
          language === 'en' && (theme === 'dark'
            ? 'bg-amber-600 text-white shadow-inner'
            : 'bg-[#e07020] text-white shadow-inner')
        )}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        🇺🇸
      </motion.button>
    </div>
  );
}
