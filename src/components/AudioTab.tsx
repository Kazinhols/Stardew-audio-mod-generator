import { memo, useCallback, useMemo } from 'react';
import { useAppState, useAppDispatch, useTauri, useToastCtx } from '@/state/AppContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { AudioForm } from './AudioForm';
import { AudioList } from './AudioList';
import type { AudioEntry } from '@/types/audio';

function getFileFormat(filename: string): string {
  return (filename.split('.').pop() || 'ogg').toUpperCase();
}

export const AudioTab = memo(function AudioTab() {
  const state = useAppState();
  const { audios, scanResult } = state;
  const dispatch = useAppDispatch();
  const tauri = useTauri();
  const { showToast } = useToastCtx();
  const { t } = useLanguage();

  const scannedFiles = useMemo(() => {
    if (!scanResult?.files) return [];
    return scanResult.files.filter(f => {
      const fmt = getFileFormat(f.name);
      return fmt === 'OGG' ? f.is_vorbis : true;
    });
  }, [scanResult]);

  const handleAdd = useCallback((audio: AudioEntry) => {
    dispatch({ type: 'ADD_AUDIO', payload: audio });
  }, [dispatch]);

  const handleRemove = useCallback(async (index: number) => {
    const ok = await tauri.showConfirm(t('audio.removeConfirm'));
    if (ok) {
      dispatch({ type: 'REMOVE_AUDIO', payload: index });
      showToast(`🗑️ ${t('audio.removed')}`, 'success');
    }
  }, [dispatch, tauri, showToast, t]);

  const handleClearAll = useCallback(async () => {
    if (audios.length === 0) return;
    const ok = await tauri.showConfirm(t('audio.clearConfirm'));
    if (ok) {
      dispatch({ type: 'CLEAR_AUDIOS' });
      showToast(`🗑️ ${t('audio.listCleared')}`, 'success');
    }
  }, [audios.length, dispatch, tauri, showToast, t]);

  const handleNext = useCallback(() => {
    dispatch({ type: 'SET_TAB', payload: 'export' });
  }, [dispatch]);

  return (
    <div className="animate-fade-in space-y-4">
      <AudioForm onAdd={handleAdd} existingIds={audios.map(a => a.id)} showToast={showToast} scannedFiles={scannedFiles} />
      <AudioList audios={audios} onRemove={handleRemove} onClearAll={handleClearAll} onNext={handleNext} />
    </div>
  );
});