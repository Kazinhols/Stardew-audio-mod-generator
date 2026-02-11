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
import { 
  FloatingParticles, 
  JunimoMascot, 
  SeasonalCorners, 
  WoodDivider, 
  GoldCounter, 
  DayNightIndicator 
} from '@/components/StardewDecorations';

const SetupTab = lazy(() => import('@/components/SetupTab').then(m => ({ default: m.SetupTab })));
const AudioTab = lazy(() => import('@/components/AudioTab').then(m => ({ default: m.AudioTab })));
const ScanTab = lazy(() => import('@/components/ScanTab').then(m => ({ default: m.ScanTab })));
const ExportTab = lazy(() => import('@/components/ExportTab').then(m => ({ default: m.ExportTab })));
const HelpTab = lazy(() => import('@/components/HelpTab').then(m => ({ default: m.HelpTab })));

function TabLoader() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  return (
    <div className={cn('flex flex-col items-center justify-center py-20', theme === 'dark' ? 'text-gray-500' : 'text-[#8b6914]')}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="text-4xl mb-3">⏳</motion.div>
      <p>{t('player.loading')}</p>
    </div>
  );
}

const HeaderBar = memo(function HeaderBar() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const state = useAppState();
  const dispatch = useAppDispatch();
  const tauri = useTauri();

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="relative z-20">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-4">
        <div className="flex items-center gap-3 order-2 sm:order-1">
          <LanguageToggle />
          <DayNightIndicator />
        </div>
        
        <div className="flex items-center gap-2 order-1 sm:order-2">
          <AnimatedButton 
            onClick={tauri.loadProject} 
            className="header-btn header-btn-open"
          >
            📂 {t('app.open')}
          </AnimatedButton>
          <AnimatedButton 
            onClick={tauri.saveProject} 
            className="header-btn header-btn-save"
          >
            💾 {t('app.save')}
          </AnimatedButton>
          <AnimatedButton 
            onClick={() => dispatch({ type: 'RESET' })} 
            className="header-btn header-btn-new"
          >
            🗑️ {t('app.new')}
          </AnimatedButton>
        </div>
      </div>

      <Float>
        <h1 className={cn(
          'text-center text-2xl sm:text-4xl mb-2 font-bold select-none',
          theme === 'dark' 
            ? 'text-neon-green hologram-effect font-pixel'
            : 'text-[#5c3d2e] sdv-title-glow font-pixel'
        )}>
          {theme === 'dark' ? '🎵 Stardew Audio' : '🌾 Stardew Audio 🌾'}
        </h1>
      </Float>

      <p className={cn(
        'text-center text-xs sm:text-sm mb-3 select-none',
        theme === 'dark' 
          ? 'text-neon-cyan'
          : 'text-[#6bc048] font-semibold'
      )}>
        Mod Generator v3.0 | {tauri.isDesktop ? t('app.nativeDesktop') : t('app.webEdition')}
      </p>

      <div className="flex justify-center items-center gap-4 mb-4">
        <GoldCounter value={state.audios.length} label={t('app.audios')} />
        
        <span className={cn('text-xs font-bold px-2 py-1 rounded', state.dirty ? 'bg-yellow-500/20 text-yellow-500' : 'bg-green-500/20 text-green-500')}>
          {state.dirty ? t('app.unsaved') : t('app.saved')}
        </span>
        
        {state.assetsFolder && (
          <span className={cn('text-xs truncate max-w-[150px] opacity-70', theme === 'dark' ? 'text-gray-400' : 'text-[#8b6914]')}>
            📂 {state.assetsFolder.split(/[/\\]/).pop()}
          </span>
        )}
      </div>

      <WoodDivider />
    </motion.div>
  );
});

const TabNavigation = memo(function TabNavigation() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const tauri = useTauri();
  const { t } = useLanguage();

  const setTab = useCallback((tab: typeof state.activeTab) => {
    dispatch({ type: 'SET_TAB', payload: tab });
  }, [dispatch]);

  const tabs = [
    { id: 'setup', label: t('tab.setup'), icon: '📋', shortcut: 'Ctrl+1' },
    { id: 'audio', label: t('tab.audio'), icon: '🎶', shortcut: 'Ctrl+2', counter: state.audios.length },
    ...(tauri.isDesktop ? [{ id: 'scan', label: 'Scanner', icon: '🔍', shortcut: 'Ctrl+3' }] : []),
    { id: 'export', label: t('tab.export'), icon: '📦', shortcut: tauri.isDesktop ? 'Ctrl+4' : 'Ctrl+3' },
    { id: 'help', label: t('tab.help'), icon: '❓', shortcut: tauri.isDesktop ? 'Ctrl+5' : 'Ctrl+4' },
  ] as const;

  return (
    <div className="flex gap-1 sm:gap-2 mb-5 justify-center flex-wrap relative z-20">
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
    <div className="min-h-[300px] relative z-20">
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
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
  const { t } = useLanguage();
  const tauri = useTauri();
  return (
    <div className={cn('fixed bottom-0 left-0 right-0 p-1 px-3 text-[10px] flex justify-between z-50 pointer-events-none select-none', theme === 'dark' ? 'text-gray-500 bg-black/40 backdrop-blur-sm' : 'text-[#8b6914] bg-[#fdf6e3]/60 backdrop-blur-sm')}>
      <span>{tauri.isDesktop ? t('app.desktopShortcuts') : t('app.webShortcuts')}</span>
      <span>v3.0 | {tauri.isDesktop ? 'Tauri' : 'Web'}</span>
    </div>
  );
});

export function App() {
  const { toast } = useApp();
  const { theme } = useTheme();
  const { loading, loadingMessage } = useAppState();

  return (
    <motion.div 
      className={cn(
        'min-h-screen p-2 sm:p-5 transition-colors duration-500 overflow-hidden relative',
        theme === 'dark' 
          ? 'bg-[#05050a]'
          : 'bg-[#e6d7b9]'
      )} 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
    >
      <FloatingParticles />
      <SeasonalCorners />
      <JunimoMascot />
      
      <LoadingOverlay visible={loading} message={loadingMessage} />
      
      <motion.div 
        className={cn(
          'max-w-[1200px] mx-auto rounded-2xl shadow-2xl p-4 sm:p-6 transition-all duration-500 relative min-h-[85vh] z-10',
          theme === 'dark' 
            ? 'cyber-panel neon-border'
            : 'sdv-panel'
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
      <Toast message={toast.message} type={toast.type} visible={toast.visible} />
    </motion.div>
  );
}

function LanguageToggle() {
  const { language, setLanguage } = useLanguage();
  const { theme } = useTheme();
  return (
    <div className={cn(
      'flex rounded-full p-1 border-2 transition-colors',
      theme === 'dark' 
        ? 'bg-gray-800/80 border-cyber-green/50'
        : 'bg-[#fdf6e3]/80 border-[#8b4513]/30 shadow-sm'
    )}>
      <button 
        onClick={() => setLanguage('pt')} 
        className={cn(
          'text-sm px-2.5 py-1 rounded-full transition-all font-medium',
          language === 'pt' 
            ? theme === 'dark'
              ? 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg'
              : 'bg-gradient-to-b from-[#6bc048] to-[#4a9030] text-white shadow-md'
            : 'hover:bg-black/5 opacity-60 hover:opacity-100'
        )}
      >
        🇧🇷
      </button>
      <button 
        onClick={() => setLanguage('en')} 
        className={cn(
          'text-sm px-2.5 py-1 rounded-full transition-all font-medium',
          language === 'en' 
            ? theme === 'dark'
              ? 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg'
              : 'bg-gradient-to-b from-[#6bc048] to-[#4a9030] text-white shadow-md'
            : 'hover:bg-black/5 opacity-60 hover:opacity-100'
        )}
      >
        🇺🇸
      </button>
    </div>
  );
}