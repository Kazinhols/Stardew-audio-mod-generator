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

const SetupTab = lazy(() => import('@/components/SetupTab').then(module => ({ default: module.SetupTab })));
const AudioTab = lazy(() => import('@/components/AudioTab').then(module => ({ default: module.AudioTab })));
const ScanTab = lazy(() => import('@/components/ScanTab').then(module => ({ default: module.ScanTab })));
const ExportTab = lazy(() => import('@/components/ExportTab').then(module => ({ default: module.ExportTab })));
const HelpTab = lazy(() => import('@/components/HelpTab').then(module => ({ default: module.HelpTab })));

function TabLoader() {
  const { theme } = useTheme();
  return (
    <div className={cn('flex flex-col items-center justify-center py-20', theme === 'dark' ? 'text-gray-500' : 'text-[#8b6914]')}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="text-4xl mb-3"
      >
        ⏳
      </motion.div>
      <p>Loading Tab...</p>
    </div>
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
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-3">
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
        </div>
        <div className="flex items-center gap-2">
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
        </div>
      </div>

      <Float>
        <h1 className={cn('text-center text-2xl sm:text-4xl mb-1 font-bold', theme === 'dark' ? 'text-white' : 'text-[#5c3d2e]')}>
          🎵 Stardew Audio Mod
        </h1>
      </Float>
      
      <p className={cn('text-center text-xs sm:text-sm mb-3 opacity-80', theme === 'dark' ? 'text-gray-400' : 'text-[#8b6914]')}>
        Generator v3.0 | Native Desktop
      </p>

      <div className={cn('flex justify-center gap-4 text-xs sm:text-sm mb-4 font-medium', theme === 'dark' ? 'text-gray-400' : 'text-[#8b6914]')}>
        <span>🎵 <AnimatedCounter value={state.audios.length} /> {language === 'pt' ? 'áudios' : 'audios'}</span>
        <span>•</span>
        <span className={state.dirty ? 'text-yellow-500' : 'text-green-500'}>
          {state.dirty ? '🟡 Unsaved' : '💾 Saved'}
        </span>
        {state.assetsFolder && <><span>•</span><span className="truncate max-w-[150px]">📂 {state.assetsFolder.split(/[/\\]/).pop()}</span></>}
      </div>

      <hr className={cn('border-0 h-0.5 mb-5', theme === 'dark' ? 'bg-gray-700' : 'bg-[#8b4513]/20')} />
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
    <div className="flex gap-1 sm:gap-2 mb-5 justify-center flex-wrap">
      {tabs.map((tab) => (
        <TabButton
          key={tab.id}
          tab={tab.id as any}
          label={tab.label}
          icon={tab.icon}
          active={state.activeTab === tab.id}
          onClick={() => setTab(tab.id as any)}
          counter={'counter' in tab ? tab.counter : undefined}
          shortcut={tab.shortcut}
        />
      ))}
    </div>
  );
});

function TabContent() {
  const { activeTab } = useAppState();
  
  return (
    <div className="min-h-[300px]">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
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

const StatusBar = memo(function StatusBar() {
  const { theme } = useTheme();
  const tauri = useTauri();
  
  return (
    <div className={cn('fixed bottom-0 left-0 right-0 p-1 px-3 text-[10px] flex justify-between z-50 pointer-events-none', theme === 'dark' ? 'text-gray-500' : 'text-[#8b6914]')}>
       <span>{tauri.isDesktop ? 'Ctrl+1-5: Tabs' : 'Web Version'}</span>
       <span>v3.0 | Tauri</span>
    </div>
  );
});

export function App() {
  const { toast } = useApp();
  const { theme } = useTheme();
  const { loading, loadingMessage } = useAppState();

  return (
    <motion.div 
      className={cn('min-h-screen p-2 sm:p-5 transition-colors duration-300', theme === 'dark' ? 'bg-gray-900' : 'bg-[#f0e6d2]')}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <LoadingOverlay visible={loading} message={loadingMessage} />

      <motion.div 
        className={cn(
          'max-w-[1200px] mx-auto border-2 sm:border-4 rounded-xl shadow-xl p-4 sm:p-6 transition-colors duration-300 overflow-hidden relative min-h-[85vh]',
          theme === 'dark'
            ? 'bg-gray-800 border-gray-600'
            : 'bg-[#f8ecc2] border-[#8b4513]'
        )}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
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

function LanguageToggle() {
  const { language, setLanguage } = useLanguage();
  const { theme } = useTheme();
  return (
    <div className={cn('flex rounded-full p-1 border', theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white/30 border-[#8b4513]/20')}>
      <button onClick={() => setLanguage('pt')} className={cn('text-xs px-2 py-0.5 rounded-full transition-all', language === 'pt' && 'bg-[#e07020] text-white')}>🇧🇷</button>
      <button onClick={() => setLanguage('en')} className={cn('text-xs px-2 py-0.5 rounded-full transition-all', language === 'en' && 'bg-[#e07020] text-white')}>🇺🇸</button>
    </div>
  );
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button onClick={toggleTheme} className="text-lg hover:scale-110 transition-transform">
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}