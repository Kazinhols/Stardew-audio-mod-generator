import { memo, useCallback } from 'react';
import { useAppState, useAppDispatch } from '@/state/AppContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import type { ModConfig } from '@/types/audio';
import { cn } from '@/utils/cn';

export const SetupTab = memo(function SetupTab() {
  const { modConfig } = useAppState();
  const dispatch = useAppDispatch();
  const { t } = useLanguage();
  const { theme } = useTheme();

  const onUpdate = useCallback((updates: Partial<ModConfig>) => {
    dispatch({ type: 'SET_CONFIG', payload: updates });
  }, [dispatch]);

  const onNext = useCallback(() => {
    dispatch({ type: 'SET_TAB', payload: 'audio' });
  }, [dispatch]);

  const inputClass = cn(
    'w-full p-3 text-base sm:text-lg border-3 rounded-md transition-all',
    theme === 'dark'
      ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
      : 'bg-[#fff8e1] border-[#8b5a2b] text-[#4e2a04] focus:border-[#4a90d9] focus:bg-[#fffef5]'
  );
  const labelClass = cn('block mb-1.5 font-bold text-lg sm:text-xl', theme === 'dark' ? 'text-gray-200' : 'text-[#5c3d2e]');
  const smallClass = cn('font-normal text-xs sm:text-sm', theme === 'dark' ? 'text-gray-400' : 'text-[#8b6914]');
  const formGroupClass = cn('p-4 rounded-xl border-2 mb-4', theme === 'dark' ? 'bg-gray-700/50 border-gray-600' : 'bg-white/60 border-[#8b4513]/30');

  return (
    <div className="animate-fade-in">
      <div className={cn('border-2 rounded-xl p-4 mb-5', theme === 'dark' ? 'bg-gradient-to-r from-green-900/30 to-green-800/30 border-green-600' : 'bg-gradient-to-r from-[#e8f5e9] to-[#f1f8e9] border-[#56a037]')}>
        <h3 className={cn('text-xl font-bold mb-2', theme === 'dark' ? 'text-green-400' : 'text-[#56a037]')}>📌 {t('setup.title')}</h3>
        <p className={cn('text-base sm:text-lg', theme === 'dark' ? 'text-gray-300' : '')}>{t('setup.description')}</p>
      </div>

      <div className={formGroupClass}>
        <label className={labelClass}>🏷️ {t('setup.uniqueId')} <small className={smallClass}>({t('setup.uniqueIdHint')})</small></label>
        <input type="text" value={modConfig.modId} onChange={e => onUpdate({ modId: e.target.value })} placeholder="Ex: MeuNick.MusicasDaFazenda" className={inputClass} />
      </div>

      <div className={formGroupClass}>
        <label className={labelClass}>📝 {t('setup.modName')}</label>
        <input type="text" value={modConfig.modName} onChange={e => onUpdate({ modName: e.target.value })} className={inputClass} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className={formGroupClass}>
          <label className={labelClass}>👤 {t('setup.author')}</label>
          <input type="text" value={modConfig.modAuthor} onChange={e => onUpdate({ modAuthor: e.target.value })} className={inputClass} />
        </div>
        <div className={formGroupClass}>
          <label className={labelClass}>🔢 {t('setup.version')}</label>
          <input type="text" value={modConfig.modVersion} onChange={e => onUpdate({ modVersion: e.target.value })} className={inputClass} />
        </div>
      </div>

      <div className={cn(formGroupClass, 'mb-5')}>
        <label className={labelClass}>📄 {t('setup.description_field')}</label>
        <input type="text" value={modConfig.modDescription} onChange={e => onUpdate({ modDescription: e.target.value })} className={inputClass} />
      </div>

      <button onClick={onNext} className={cn('w-full p-3 sm:p-3.5 text-xl sm:text-2xl text-white rounded-lg cursor-pointer flex items-center justify-center gap-2.5 shadow-md transition-all hover:-translate-y-0.5 hover:brightness-110', theme === 'dark' ? 'bg-gradient-to-b from-orange-500 to-orange-600 border-b-4 border-orange-700' : 'bg-gradient-to-b from-[#e07020] to-[#d06010] border-b-4 border-[#a04808]')}>
        {t('setup.next')} ➡️
      </button>
    </div>
  );
});
