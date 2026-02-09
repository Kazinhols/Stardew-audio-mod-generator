import { lazy, Suspense, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp, useAppState, useAppDispatch, useTauri } from '@/state/AppContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { TabButton } from '@/components/TabButton';
import { Toast } from '@/components/Toast';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { AnimatedButton, AnimatedCounter, Float } from '@/components/animations';
import { cn } from '@/utils/cn';

const SetupTab = lazy(() => import('@/components/SetupTab').then(m => ({ default: m.SetupTab })));
const AudioTab = lazy(() => import('@/components/AudioTab').then(m => ({ default: m.AudioTab })));
const ScanTab = lazy(() => import('@/components/ScanTab').then(m => ({ default: m.ScanTab })));
const ExportTab = lazy(() => import('@/components/ExportTab').then(m => ({ default: m.ExportTab })));
const HelpTab = lazy(() => import('@/components/HelpTab').then(m => ({ default: m.HelpTab })));

function TabLoader() {
  const { theme } = useTheme();
  return (
    <motion.div 
      className={cn('text-center py-16 text-xl', theme === 'dark' ? 'text-gray-500' : 'text-[#8b6914]')}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.span
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="inline-block text-3xl"
      >
        ⏳
      </motion.span>
      <p className="mt-2">Loading...</p>
    </motion.div>
  );
}

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
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-3">
        <motion.div 
          className="flex items-center gap-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <LanguageToggle />
          <ThemeToggle />
        </motion.div>
        <motion.div 
          className="flex items-center gap-2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <AnimatedButton 
            onClick={tauri.loadProject} 
            className={cn('px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition-all', theme === 'dark' ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-[#4a90d9] text-white hover:brightness-110')}
          >
            📂 {language === 'pt' ? 'Abrir' : 'Open'}
          </AnimatedButton>
          <AnimatedButton 
            onClick={tauri.saveProject} 
            className={cn('px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition-all', theme === 'dark' ? 'bg-green-600 text-white hover:bg-green-500' : 'bg-[#56a037] text-white hover:brightness-110')}
          >
            💾 {language === 'pt' ? 'Salvar' : 'Save'}
          </AnimatedButton>
          
          <AnimatedButton 
            onClick={() => dispatch({ type: 'RESET' })} 
            className={cn('px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition-all', theme === 'dark' ? 'bg-red-600 text-white hover:bg-red-500' : 'bg-[#e63e3e] text-white hover:brightness-110')}
          >
            🗑️ {language === 'pt' ? 'Novo' : 'New'}
          </AnimatedButton>
        </motion.div>
      </div>

      {}
      <Float>
        <h1 className={cn('text-center text-2xl sm:text-4xl mb-1', theme === 'dark' ? 'text-white' : 'text-[#5c3d2e]')}>
          🎵 Stardew Audio Mod Generator
        </h1>
      </Float>
      <motion.p 
        className={cn('text-center text-base sm:text-lg mb-1', theme === 'dark' ? 'text-gray-400' : 'text-[#8b6914]')}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        SDV 1.6+ | Content Patcher | Desktop Native
      </motion.p>

      {}
      <motion.div 
        className={cn('flex justify-center gap-4 text-sm mb-4', theme === 'dark' ? 'text-gray-400' : 'text-[#8b6914]')}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <span>🎵 <AnimatedCounter value={state.audios.length} /> {language === 'pt' ? 'áudios' : 'audios'}</span>
        <span>•</span>
        <motion.span
          key={state.dirty ? 'unsaved' : 'saved'}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          {state.dirty ? '🟡 Unsaved' : '💾 Saved'}
        </motion.span>
        {state.watching && <><span>•</span><span>👁️ Watching</span></>}
        {state.assetsFolder && <><span>•</span><span>📂 {state.assetsFolder.split(/[/\\]/).pop()}</span></>}
      </motion.div>

      <motion.hr 
        className={cn('border-0 h-0.5 mb-5', theme === 'dark' ? 'bg-gradient-to-r from-transparent via-gray-600 to-transparent' : 'bg-gradient-to-r from-transparent via-[#8b4513] to-transparent')}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      />
    </motion.div>
  );
});

const TabNavigation = memo(function TabNavigation() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const tauri = useTauri();
  const { t, language } = useLanguage();

  const setTab = useCallback((tab: typeof state.activeTab) => {
    dispatch({ type: 'SET_TAB', payload: tab });
  }, [dispatch]);

  const tabs = [
    { id: 'setup', label: t('tab.setup'), icon: '📋', shortcut: 'Ctrl+1' },
    { id: 'audio', label: t('tab.audio'), icon: '🎶', shortcut: 'Ctrl+2', counter: state.audios.length },
    ...(tauri.isDesktop ? [{ id: 'scan', label: language === 'pt' ? 'Scanner' : 'Scanner', icon: '🔍', shortcut: 'Ctrl+3' }] : []),
    { id: 'export', label: t('tab.export'), icon: '📦', shortcut: tauri.isDesktop ? 'Ctrl+4' : 'Ctrl+3' },
    { id: 'help', label: t('tab.help'), icon: '❓', shortcut: tauri.isDesktop ? 'Ctrl+5' : 'Ctrl+4' },
  ] as const;

  return (
    <motion.div 
      className="flex gap-1 sm:gap-2 mb-5 justify-center flex-wrap"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.08, delayChildren: 0.2 }
        }
      }}
    >
      {tabs.map((tab) => (
        <motion.div
          key={tab.id}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
        >
          <TabButton
            tab={tab.id as any}
            label={tab.label}
            icon={tab.icon}
            active={state.activeTab === tab.id}
            onClick={() => setTab(tab.id as any)}
            counter={'counter' in tab ? tab.counter : undefined}
            shortcut={tab.shortcut}
          />
        </motion.div>
      ))}
    </motion.div>
  );
});

function TabContent() {
  const { activeTab } = useAppState();
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
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
  );
}

const StatusBar = memo(function StatusBar() {
  const { theme } = useTheme();
  const tauri = useTauri();
  
  return (
    <>
      <motion.div 
        className={cn('fixed bottom-2.5 right-2.5 px-3 py-1 rounded text-xs', theme === 'dark' ? 'bg-gray-700 text-green-400' : 'bg-black/70 text-[#a1ef5e]')}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        {tauri.isDesktop ? '🦀 Tauri Desktop' : '🌐 Web'} | v3.0
      </motion.div>
      <motion.div 
        className={cn('fixed bottom-2.5 left-2.5 px-3 py-1 rounded text-xs hidden md:block', theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-black/70 text-white/70')}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        {}
        {tauri.isDesktop ? 'Ctrl+1-5' : 'Ctrl+1-4'}: Tabs | Ctrl+S: Save | Ctrl+O: Open
      </motion.div>
    </>
  );
});

export function App() {
  const { toast } = useApp();
  const { theme } = useTheme();
  const { loading, loadingMessage } = useAppState();

  return (
    <motion.div 
      className={cn('min-h-screen p-3 sm:p-5 transition-colors', theme === 'dark' ? 'bg-gray-900' : '')}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <LoadingOverlay visible={loading} message={loadingMessage} />

      <motion.div 
        className={cn(
          'max-w-[1200px] mx-auto border-4 rounded-2xl shadow-2xl p-4 sm:p-6 transition-colors',
          theme === 'dark'
            ? 'bg-gray-800 border-gray-600'
            : 'bg-[#f8ecc2] border-[#8b4513] shadow-[inset_0_0_30px_rgba(139,69,19,0.2),0_15px_40px_rgba(0,0,0,0.6)]'
        )}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <HeaderBar />
        <TabNavigation />
        <TabContent />
      </motion.div>

      <StatusBar />
      <Toast {...toast} />
    </motion.div>
  );
}

// ====== Inline small components with animations ======
function LanguageToggle() {
  const { language, setLanguage } = useLanguage();
  const { theme } = useTheme();
  return (
    <div className={cn('flex items-center gap-1 rounded-full p-1', theme === 'dark' ? 'bg-gray-700' : 'bg-black/20')}>
      <motion.button 
        onClick={() => setLanguage('pt')} 
        className={cn('px-2.5 py-0.5 rounded-full text-sm transition-all', language === 'pt' ? 'bg-[#e07020] text-white' : theme === 'dark' ? 'text-gray-400' : 'text-white/70')}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        🇧🇷
      </motion.button>
      <motion.button 
        onClick={() => setLanguage('en')} 
        className={cn('px-2.5 py-0.5 rounded-full text-sm transition-all', language === 'en' ? 'bg-[#e07020] text-white' : theme === 'dark' ? 'text-gray-400' : 'text-white/70')}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        🇺🇸
      </motion.button>
    </div>
  );
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <motion.button 
      onClick={toggleTheme} 
      className={cn('p-2 rounded-full transition-all', theme === 'dark' ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' : 'bg-black/20 text-white hover:bg-black/30')}
      whileHover={{ scale: 1.1, rotate: 15 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.span
        key={theme}
        initial={{ rotate: -180, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        exit={{ rotate: 180, opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </motion.span>
    </motion.button>
  );
}