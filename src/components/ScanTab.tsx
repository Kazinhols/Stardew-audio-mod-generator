import { memo, useState, useCallback, useMemo } from 'react';
import { useAppState, useAppDispatch, useTauri, useToastCtx } from '@/state/AppContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/utils/cn';
import { AudioPlayer, PlayButton } from './AudioPlayer';
import { AudioConverter } from './AudioConverter';
import type { AudioFileInfo, AudioEntry } from '@/types/audio';
import { originalAudios } from '@/data/originalAudios';

function getFileFormat(filename: string): string {
  return (filename.split('.').pop() || 'ogg').toUpperCase();
}

export const ScanTab = memo(function ScanTab() {
  const { assetsFolder, scanResult, watching, selectedScanFiles } = useAppState();
  const dispatch = useAppDispatch();
  const tauri = useTauri();
  const { showToast } = useToastCtx();
  const { t } = useLanguage();
  const { theme } = useTheme();

  const [scanLoading, setScanLoading] = useState(false);
  const [playingFile, setPlayingFile] = useState<AudioFileInfo | null>(null);

  const handleScanFolder = useCallback(async () => {
    setScanLoading(true);
    try { await tauri.scanFolder(); } catch (err) { console.error(err); }
    setScanLoading(false);
  }, [tauri]);

  const handleRescan = useCallback(async () => {
    setScanLoading(true);
    try { await tauri.rescanFolder(); } catch (err) { console.error(err); }
    setScanLoading(false);
  }, [tauri]);

  const handlePlayFile = useCallback((file: AudioFileInfo) => {
    setPlayingFile(prev => prev?.path === file.path ? null : file);
  }, []);

  const toggleFileSelection = useCallback((fileName: string) => {
    dispatch({ type: 'TOGGLE_SCAN_FILE', payload: fileName });
  }, [dispatch]);

  const selectAllValid = useCallback(() => {
    dispatch({ type: 'SELECT_ALL_SCAN_FILES' });
  }, [dispatch]);

  const deselectAll = useCallback(() => {
    dispatch({ type: 'DESELECT_ALL_SCAN_FILES' });
  }, [dispatch]);

  const detectCategory = useCallback((fileName: string): 'Music' | 'Ambient' | 'Sound' | 'Footstep' => {
    const lower = fileName.toLowerCase();
    if (lower.includes('ambient') || lower.includes('rain') || lower.includes('wind') || lower.includes('night')) return 'Ambient';
    if (lower.includes('step') || lower.includes('foot') || lower.includes('walk')) return 'Footstep';
    if (lower.includes('sfx') || lower.includes('sound') || lower.includes('click') || lower.includes('hit')) return 'Sound';
    return 'Music';
  }, []);

  const handleAddToAudio = useCallback((file: AudioFileInfo) => {
    const id = file.name.replace(/\.[^.]+$/, '');
    const original = originalAudios.find(a => a.id.toLowerCase() === id.toLowerCase());
    const category = detectCategory(file.name);
    const audio: AudioEntry = { id: original ? original.id : id, type: original ? 'replace' : 'custom', originalName: original?.name || null, category, files: [file.name], looped: category === 'Music', jukebox: null };
    dispatch({ type: 'ADD_AUDIO', payload: audio });
    showToast(`✅ ${file.name} ${t('scan.audioAdded')}`, 'success');
  }, [dispatch, showToast, t, detectCategory]);

  const handleAddSelected = useCallback(() => {
    if (selectedScanFiles.length === 0 || !scanResult?.files) return;
    let count = 0;
    for (const fileName of selectedScanFiles) {
      const file = scanResult.files.find(f => f.name === fileName);
      if (!file) continue;
      const id = file.name.replace(/\.[^.]+$/, '');
      const original = originalAudios.find(a => a.id.toLowerCase() === id.toLowerCase());
      const category = detectCategory(file.name);
      dispatch({ type: 'ADD_AUDIO', payload: { id: original ? original.id : id, type: original ? 'replace' : 'custom', originalName: original?.name || null, category, files: [file.name], looped: category === 'Music', jukebox: null } });
      count++;
    }
    showToast(`✅ ${count} ${t('scan.audioAdded')}`, 'success');
    dispatch({ type: 'DESELECT_ALL_SCAN_FILES' });
  }, [selectedScanFiles, scanResult, dispatch, showToast, t, detectCategory]);

  const stats = useMemo(() => {
    if (!scanResult) return null;
    let validCount = 0;
    
    scanResult.files.forEach(f => {
      const fmt = getFileFormat(f.name);
      if ((fmt === 'OGG' && f.is_vorbis) || fmt === 'WAV') {
        validCount++;
      }
    });

    return { 
      total: scanResult.files.length, 
      valid: validCount,
      invalid: scanResult.files.length - validCount, 
      size: scanResult.total_size 
    };
  }, [scanResult]);

  const btnClass = (color: string) => cn('px-4 py-2.5 rounded-lg text-white font-bold transition-all hover:-translate-y-0.5 hover:brightness-110 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed', color);

  const formatBadge = (fmt: string) => {
    const c: Record<string, string> = { OGG: 'bg-green-600', MP3: 'bg-blue-600', WAV: 'bg-purple-600', FLAC: 'bg-orange-600', M4A: 'bg-pink-600', AAC: 'bg-red-600', WMA: 'bg-yellow-700', OPUS: 'bg-teal-600', AIFF: 'bg-indigo-600' };
    return c[fmt] || 'bg-gray-600';
  };

  return (
    <div className="animate-fade-in space-y-4">
      <div className={cn('border-2 rounded-xl p-4', theme === 'dark' ? 'bg-gradient-to-r from-blue-900/30 to-blue-800/30 border-blue-600' : 'bg-gradient-to-r from-[#e3f2fd] to-[#bbdefb] border-[#4a90d9]')}>
        <h3 className={cn('text-xl font-bold mb-2', theme === 'dark' ? 'text-blue-400' : 'text-[#4a90d9]')}>🔍 {t('scan.title')}</h3>
        <p className={cn('text-base', theme === 'dark' ? 'text-gray-300' : '')}>{t('scan.description')}</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button onClick={handleScanFolder} disabled={scanLoading} className={btnClass(theme === 'dark' ? 'bg-green-600 border-b-3 border-green-700' : 'bg-gradient-to-b from-[#6bc048] to-[#4a9030] border-b-3 border-[#2d5a20]')}>
          {scanLoading ? '⏳' : '📂'} {scanLoading ? t('scan.opening') : t('scan.selectFolder')}
        </button>
        {assetsFolder && (
          <>
            <button onClick={handleRescan} disabled={scanLoading} className={btnClass(theme === 'dark' ? 'bg-blue-600 border-b-3 border-blue-700' : 'bg-gradient-to-b from-[#5aa0e9] to-[#3a80c0] border-b-3 border-[#2a5a8a]')}>🔄 {t('scan.refresh')}</button>
            <button onClick={() => tauri.openInExplorer(assetsFolder)} className={btnClass(theme === 'dark' ? 'bg-orange-600 border-b-3 border-orange-700' : 'bg-gradient-to-b from-[#e07020] to-[#d06010] border-b-3 border-[#a04808]')}>📁 Explorer</button>
            <button onClick={tauri.watchFolder} disabled={watching} className={cn(btnClass(theme === 'dark' ? 'bg-blue-600 border-b-3 border-blue-700' : 'bg-gradient-to-b from-[#5aa0e9] to-[#3a80c0] border-b-3 border-[#2a5a8a]'), watching && 'opacity-50')}>
              {watching ? `✅ ${t('scan.watching')}` : `👁️ ${t('scan.watch')}`}
            </button>
          </>
        )}
      </div>

      {assetsFolder && (
        <div className={cn('p-3 rounded-lg font-mono text-sm', theme === 'dark' ? 'bg-gray-900 text-green-400' : 'bg-[#2d1d12] text-[#a1ef5e]')}>
          📂 {assetsFolder} {watching && <span className="ml-3 animate-pulse">👁️ Live</span>}
        </div>
      )}

      {playingFile && <AudioPlayer file={playingFile} onClose={() => setPlayingFile(null)} />}
      
      {scanResult && scanResult.files.length > 0 && <AudioConverter />}

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: t('scan.total'), value: stats.total, icon: '📁', color: '' },
            { label: t('scan.valid'), value: stats.valid, icon: '✅', color: 'green' },
            { label: t('scan.invalid'), value: stats.invalid, icon: '❌', color: 'red' },
            { label: t('scan.size'), value: stats.size, icon: '💾', color: '' },
          ].map((s, i) => {
            const bg = s.color === 'green' ? theme === 'dark' ? 'bg-green-900/30 border-green-600' : 'bg-green-50 border-green-400' : s.color === 'red' ? theme === 'dark' ? 'bg-red-900/30 border-red-600' : 'bg-red-50 border-red-400' : theme === 'dark' ? 'bg-gray-700/50 border-gray-600' : 'bg-white/60 border-[#8b4513]/30';
            return (
              <div key={i} className={cn('p-3 rounded-xl border-2 text-center', bg)}>
                <div className="text-2xl">{s.icon}</div>
                <div className={cn('text-2xl font-bold', theme === 'dark' ? 'text-white' : 'text-[#5c3d2e]')}>{s.value}</div>
                <div className={cn('text-sm', theme === 'dark' ? 'text-gray-400' : 'text-[#8b6914]')}>{s.label}</div>
              </div>
            );
          })}
        </div>
      )}

      {scanResult && scanResult.files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button onClick={selectedScanFiles.length > 0 ? deselectAll : selectAllValid} className={cn('px-3 py-1.5 rounded-lg text-sm font-bold text-white transition-all', theme === 'dark' ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-500 hover:bg-gray-400')}>
            {selectedScanFiles.length > 0 ? `☐ ${t('scan.deselect')} (${selectedScanFiles.length})` : `☑ ${t('scan.selectAll')}`}
          </button>
          {selectedScanFiles.length > 0 && (
            <button onClick={handleAddSelected} className={cn('px-3 py-1.5 rounded-lg text-sm font-bold text-white transition-all', theme === 'dark' ? 'bg-green-600 hover:bg-green-500' : 'bg-green-500 hover:bg-green-400')}>
              ➕ {selectedScanFiles.length} {t('scan.addSelected')}
            </button>
          )}
        </div>
      )}

      {scanResult && scanResult.files.length > 0 && (
        <div className={cn('p-4 rounded-xl border-2', theme === 'dark' ? 'bg-gray-700/50 border-gray-600' : 'bg-white/60 border-[#8b4513]/30')}>
          <h4 className={cn('text-lg font-bold mb-3', theme === 'dark' ? 'text-white' : 'text-[#5c3d2e]')}>📋 {t('scan.files')} ({scanResult.files.length})</h4>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {scanResult.files.map((file, i) => {
              const fmt = getFileFormat(file.name);
              
              const isOggVorbis = fmt === 'OGG' && file.is_vorbis;
              const isWav = fmt === 'WAV';
              const isValid = isOggVorbis || isWav;
              
              const isOggNotVorbis = fmt === 'OGG' && !file.is_vorbis;
              const isInvalid = !isValid;

              const isSelected = selectedScanFiles.includes(file.name);
              const isCurrentlyPlaying = playingFile?.path === file.path;

              return (
                <div key={i} className={cn(
                  'p-3 rounded-lg border-2 flex flex-col sm:flex-row sm:items-center gap-2 transition-all',
                  isSelected 
                    ? theme === 'dark' ? 'bg-blue-900/30 border-blue-500' : 'bg-blue-50 border-blue-400'
                    : isValid 
                      ? theme === 'dark' ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-300'
                      : theme === 'dark' ? 'bg-yellow-900/20 border-yellow-700' : 'bg-yellow-50 border-yellow-300'
                )}>
                  <input 
                    type="checkbox" 
                    checked={isSelected} 
                    onChange={() => toggleFileSelection(file.name)} 
                    className="w-4 h-4 accent-blue-500 flex-shrink-0" 
                  />
                  <PlayButton onClick={() => handlePlayFile(file)} isPlaying={isCurrentlyPlaying} />
                  <div className="flex-1 min-w-0">
                    <div className={cn('font-bold truncate flex items-center gap-2', theme === 'dark' ? 'text-white' : 'text-[#5c3d2e]')}>
                      {isValid ? '✅' : isOggNotVorbis ? '❌' : '⚠️'} 
                      {file.name}
                    </div>
                    {file.error && <div className={cn('text-sm mt-0.5', theme === 'dark' ? 'text-red-400' : 'text-red-600')}>{file.error}</div>}
                  </div> 
                  <div className="flex flex-wrap gap-1.5 flex-shrink-0">
                    <span className={cn('px-2 py-0.5 rounded text-xs text-white font-bold', formatBadge(fmt))}>{fmt}</span>
                    
                    {isOggVorbis && <span className="px-2 py-0.5 rounded text-xs text-white bg-green-600">Vorbis ✓</span>}
                    {isWav && <span className="px-2 py-0.5 rounded text-xs text-white bg-purple-600">WAV ✓</span>}
                    {isOggNotVorbis && <span className="px-2 py-0.5 rounded text-xs text-white bg-red-600">NOT Vorbis</span>}
                    
                    {isInvalid && <span className="px-2 py-0.5 rounded text-xs text-white bg-yellow-600">{t('scan.convert')}</span>}
                    
                    <span className={cn('px-2 py-0.5 rounded text-xs', theme === 'dark' ? 'bg-gray-600 text-gray-200' : 'bg-gray-200')}>{file.size_display}</span>
                    {file.sample_rate && <span className={cn('px-2 py-0.5 rounded text-xs', theme === 'dark' ? 'bg-gray-600 text-gray-200' : 'bg-gray-200')}>{file.sample_rate}Hz</span>}
                    {file.channels && <span className={cn('px-2 py-0.5 rounded text-xs', theme === 'dark' ? 'bg-gray-600 text-gray-200' : 'bg-gray-200')}>{file.channels === 1 ? 'Mono' : 'Stereo'}</span>}
                  </div>
                  <button onClick={() => handleAddToAudio(file)} className={cn('px-2 py-1 rounded text-xs font-bold text-white transition-all hover:scale-105 flex-shrink-0', theme === 'dark' ? 'bg-green-600 hover:bg-green-500' : 'bg-green-500 hover:bg-green-400')} title={t('scan.addToAudio')}>
                    ➕ {t('tab.audio')}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!scanResult && (
        <div className={cn('text-center py-16', theme === 'dark' ? 'text-gray-500' : 'text-[#8b6914]')}>
          <span className="text-5xl block mb-4">🔍</span>
          <p className="text-xl">{t('scan.emptyTitle')}</p>
          <p className="text-base mt-2 opacity-70">{t('scan.formats')}</p>
        </div>
      )}
    </div>
  );
});