import { memo, useCallback } from 'react';
import { useAppState, useAppDispatch, useTauri, useToastCtx } from '@/state/AppContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { AudioForm } from './AudioForm';
import { AudioList } from './AudioList';
import type { AudioEntry } from '@/types/audio';

export const AudioTab = memo(function AudioTab() {
  const { audios } = useAppState();
  const dispatch = useAppDispatch();
  const tauri = useTauri();
  const { showToast } = useToastCtx();
  const { t } = useLanguage();

  const handleAdd = useCallback((audio: AudioEntry) => {
    dispatch({ type: 'ADD_AUDIO', payload: audio });
  }, [dispatch]);

  const handleRemove = useCallback(async (index: number) => {
    const ok = await tauri.showConfirm(t('confirm.removeAudio'));
    if (ok) {
      dispatch({ type: 'REMOVE_AUDIO', payload: index });
      showToast(t('toast.audioRemoved'), 'success');
    }
  }, [dispatch, tauri, showToast, t]);

  const handleClearAll = useCallback(async () => {
    if (audios.length === 0) return;
    const ok = await tauri.showConfirm(t('confirm.clearAll'));
    if (ok) {
      dispatch({ type: 'CLEAR_AUDIOS' });
      showToast(t('toast.listCleared'), 'success');
    }
  }, [audios.length, dispatch, tauri, showToast, t]);

  const handleNext = useCallback(() => {
    dispatch({ type: 'SET_TAB', payload: 'export' });
  }, [dispatch]);

  return (
    <div className="animate-fade-in">
      <AudioForm
        onAdd={handleAdd}
        existingIds={audios.map(a => a.id)}
        showToast={showToast}
      />
      <AudioList
        audios={audios}
        onRemove={handleRemove}
        onClearAll={handleClearAll}
        onNext={handleNext}
      />
    </div>
  );
});
