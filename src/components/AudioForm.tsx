import { useState, useCallback, useRef, useEffect } from 'react';
import { originalAudios } from '@/data/originalAudios';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import type { AudioEntry, AudioCategory, AudioFileInfo } from '@/types/audio';
import { cn } from '@/utils/cn';

interface AudioFormProps {
  onAdd: (audio: AudioEntry) => void;
  existingIds: string[];
  showToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  scannedFiles?: AudioFileInfo[];
}

function getFileFormat(filename: string): string {
  return (filename.split('.').pop() || 'ogg').toUpperCase();
}

export function AudioForm({ onAdd, existingIds, showToast, scannedFiles = [] }: AudioFormProps) {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const [audioId, setAudioId] = useState('');
  const [category, setCategory] = useState<AudioCategory>('Music');
  const [looped, setLooped] = useState(true);
  const [files, setFiles] = useState<string[]>([]);
  const [newFileName, setNewFileName] = useState('');
  const [jukeboxEnabled, setJukeboxEnabled] = useState(false);
  const [jukeboxName, setJukeboxName] = useState('');
  const [jukeboxAvailable, setJukeboxAvailable] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredSuggestions = originalAudios.filter(a =>
    a.id.toLowerCase().includes(audioId.toLowerCase()) ||
    a.name.toLowerCase().includes(audioId.toLowerCase()) ||
    a.category.toLowerCase().includes(audioId.toLowerCase())
  );

  const groupedSuggestions = filteredSuggestions.reduce((acc, audio) => {
    if (!acc[audio.category]) acc[audio.category] = [];
    acc[audio.category].push(audio);
    return acc;
  }, {} as Record<string, typeof originalAudios>);

  const originalAudio = originalAudios.find(a => a.id.toLowerCase() === audioId.toLowerCase());
  const isReplacing = !!originalAudio;

  const handleAddFile = useCallback(() => {
    let filename = newFileName.trim();
    if (!filename) return;
    filename = filename.replace(/^assets[\\/]/, '').replace(/^\//, '');
    if (!filename.endsWith('.ogg')) filename += '.ogg';
    if (files.includes(filename)) { showToast(t('toast.fileAlreadyAdded'), 'error'); return; }
    setFiles(prev => [...prev, filename]);
    setNewFileName('');
  }, [newFileName, files, showToast, t]);

  const handleAddScannedFile = useCallback((fileName: string) => {
    if (files.includes(fileName)) {
      showToast(`⚠️ ${t('audio.alreadyInList')}`, 'warning');
      return;
    }
    setFiles(prev => [...prev, fileName]);
    showToast(`✅ ${fileName} ${t('audio.fileAdded')}`, 'success');
  }, [files, showToast, t]);

  const handleCategoryChange = useCallback((c: AudioCategory) => {
    setCategory(c);
    if (c !== 'Music') { setLooped(false); setJukeboxEnabled(false); }
  }, []);

  const handleSubmit = useCallback(() => {
    const id = audioId.trim();
    if (!id) { showToast(t('toast.fillAudioId'), 'error'); return; }
    if (files.length === 0) { showToast(t('toast.addAtLeastOneFile'), 'error'); return; }
    if (existingIds.some(e => e.toLowerCase() === id.toLowerCase())) { showToast(t('toast.idAlreadyExists'), 'error'); return; }
    if (jukeboxEnabled && !jukeboxName.trim()) { showToast(t('toast.fillJukeboxName'), 'error'); return; }

    const audio: AudioEntry = {
      id: originalAudio ? originalAudio.id : id,
      type: isReplacing ? 'replace' : 'custom',
      originalName: originalAudio?.name || null,
      category,
      files: [...files],
      looped: category === 'Music' ? looped : false,
      jukebox: jukeboxEnabled ? { name: jukeboxName.trim(), available: jukeboxAvailable } : null,
    };
    onAdd(audio);
    setAudioId(''); setFiles([]); setJukeboxEnabled(false); setJukeboxName(''); setJukeboxAvailable(true);
    showToast(t('toast.audioAdded'), 'success');
  }, [audioId, files, category, looped, jukeboxEnabled, jukeboxName, jukeboxAvailable, existingIds, originalAudio, isReplacing, onAdd, showToast, t]);

  const inputClass = cn(
    'w-full p-3 text-lg border-3 rounded-md transition-all',
    theme === 'dark'
      ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500 placeholder-gray-400'
      : 'bg-[#fff8e1] border-[#8b5a2b] text-[#4e2a04] focus:border-[#4a90d9]'
  );
  const selectClass = cn(inputClass, 'cursor-pointer appearance-none', theme === 'dark' ? 'bg-gray-700' : 'bg-[#fff8e1]');
  const labelClass = cn('block mb-1.5 font-bold text-lg', theme === 'dark' ? 'text-gray-200' : 'text-[#5c3d2e]');
  const dividerClass = cn('border-0 h-0.5 my-4', theme === 'dark' ? 'bg-gradient-to-r from-transparent via-gray-600 to-transparent' : 'bg-gradient-to-r from-transparent via-[#8b4513] to-transparent');

  const formatBadge = (fmt: string) => {
    const c: Record<string, string> = { OGG: 'bg-green-600', MP3: 'bg-blue-600', WAV: 'bg-purple-600', FLAC: 'bg-orange-600', M4A: 'bg-pink-600', AAC: 'bg-red-600' };
    return c[fmt] || 'bg-gray-600';
  };

  return (
    <div className={cn('p-4 rounded-xl border-2 mb-5', theme === 'dark' ? 'bg-blue-900/20 border-blue-500' : 'bg-[#4a90d9]/15 border-[#4a90d9]')}>
      <h3 className={cn('text-xl font-bold mb-4', theme === 'dark' ? 'text-blue-400' : 'text-[#4a90d9]')}>
        🎵 {t('audio.addTitle')}
      </h3>

      <div className="mb-4">
        <label className={labelClass}>🎯 {t('audio.id')}</label>
        <div ref={wrapperRef} className="relative">
          <input type="text" value={audioId} onChange={e => setAudioId(e.target.value)} onFocus={() => setShowSuggestions(true)} placeholder="Ex: MainTheme, spring1..." className={inputClass} />
          {showSuggestions && (
            <div className={cn('absolute top-full left-0 right-0 border-3 border-t-0 rounded-b-md max-h-64 overflow-y-auto z-50', theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-[#8b5a2b]')}>
              {Object.entries(groupedSuggestions).map(([cat, items]) => (
                <div key={cat}>
                  <div className={cn('px-3 py-1.5 text-sm sticky top-0 text-white', theme === 'dark' ? 'bg-gray-700' : 'bg-[#8b5a2b]')}>📂 {cat}</div>
                  {items.map(a => (
                    <div key={a.id} onClick={() => { setAudioId(a.id); setShowSuggestions(false); }} className={cn('px-3 py-2 cursor-pointer border-b', theme === 'dark' ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-100 hover:bg-[#fff3d0]')}>
                      <div className={cn('font-bold', theme === 'dark' ? 'text-white' : 'text-[#5c3d2e]')}>{a.id}</div>
                      <div className={cn('text-sm', theme === 'dark' ? 'text-gray-400' : 'text-[#8b6914]')}>{a.name}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
        {audioId.trim() && (
          <div className={cn('mt-2 px-3 py-2 rounded-md text-sm border-l-4', isReplacing ? theme === 'dark' ? 'bg-orange-900/30 border-orange-500 text-orange-300' : 'bg-[#e07020]/20 border-[#e07020] text-[#a05010]' : theme === 'dark' ? 'bg-green-900/30 border-green-500 text-green-300' : 'bg-[#56a037]/20 border-[#56a037] text-[#3a7020]')}>
            {isReplacing ? <>🔄 <strong>{t('audio.replacing')}:</strong> {originalAudio?.name}</> : <>➕ <strong>{t('audio.newCustom')}</strong></>}
          </div>
        )}
      </div>

      <hr className={dividerClass} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className={labelClass}>📂 {t('audio.category')}</label>
          <select value={category} onChange={e => handleCategoryChange(e.target.value as AudioCategory)} className={selectClass}>
            <option value="Music">🎵 {t('category.Music')}</option>
            <option value="Ambient">🌿 {t('category.Ambient')}</option>
            <option value="Sound">🔊 {t('category.Sound')}</option>
            <option value="Footstep">👣 {t('category.Footstep')}</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>🔁 {t('audio.loop')}</label>
          <select value={looped ? 'true' : 'false'} onChange={e => setLooped(e.target.value === 'true')} disabled={category !== 'Music'} className={cn(selectClass, 'disabled:opacity-50')}>
            <option value="true">{t('audio.loopYes')}</option>
            <option value="false">{t('audio.loopNo')}</option>
          </select>
        </div>
      </div>

      <hr className={dividerClass} />

      <label className={labelClass}>📁 {t('audio.files')}</label>
      <div className="flex gap-2.5 mt-2">
        <input type="text" value={newFileName} onChange={e => setNewFileName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddFile()} placeholder="filename.ogg" className={cn(inputClass, 'flex-1')} />
        <button onClick={handleAddFile} className={cn('px-5 py-3 text-lg text-white border-0 rounded-md cursor-pointer', theme === 'dark' ? 'bg-green-600' : 'bg-[#56a037]')}>+</button>
      </div>

      <div className="flex flex-wrap gap-2 mt-2.5">
        {files.length === 0 ? (
          <span className={cn('text-sm', theme === 'dark' ? 'text-gray-500' : 'text-gray-400')}>{t('audio.noFiles')}</span>
        ) : files.map((file, i) => (
          <div key={i} className={cn('px-3 py-1.5 rounded-full flex items-center gap-2 text-sm text-white', theme === 'dark' ? 'bg-blue-600' : 'bg-gradient-to-b from-[#5aa0e9] to-[#3a80c0]')}>
            🎵 {file}
            <button onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))} className="bg-white/30 border-0 text-white w-5 h-5 rounded-full cursor-pointer hover:bg-red-500/50 flex items-center justify-center text-xs">×</button>
          </div>
        ))}
      </div>

      {scannedFiles.length > 0 && (
        <>
          <hr className={dividerClass} />
          <div className={cn('p-3 rounded-lg border-2 border-dashed', theme === 'dark' ? 'bg-blue-900/20 border-blue-500/50' : 'bg-blue-50 border-blue-300')}>
            <label className={cn('block mb-2 font-bold text-base', theme === 'dark' ? 'text-blue-400' : 'text-blue-600')}>
              📂 {t('audio.scannedFiles')}
              <span className={cn('ml-2 text-sm font-normal', theme === 'dark' ? 'text-gray-400' : 'text-gray-500')}>
                ({t('audio.clickToUse')})
              </span>
            </label>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {scannedFiles.map((sf, i) => {
                const isAlreadyAdded = files.includes(sf.name);
                const fmt = getFileFormat(sf.name);
                return (
                  <div key={i} className={cn(
                    'flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all',
                    isAlreadyAdded
                      ? theme === 'dark' ? 'bg-green-900/20 opacity-50' : 'bg-green-50 opacity-50'
                      : theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700 cursor-pointer' : 'bg-white hover:bg-gray-50 cursor-pointer'
                  )} onClick={() => !isAlreadyAdded && handleAddScannedFile(sf.name)}>
                    <span className={cn('px-1.5 py-0.5 rounded text-xs text-white font-bold flex-shrink-0', formatBadge(fmt))}>{fmt}</span>
                    <span className={cn('flex-1 truncate text-sm', theme === 'dark' ? 'text-white' : 'text-gray-800')}>{sf.name}</span>
                    <span className={cn('text-xs flex-shrink-0 hidden sm:inline', theme === 'dark' ? 'text-gray-500' : 'text-gray-400')}>{sf.size_display}</span>
                    {sf.is_vorbis && <span className="text-xs px-1 py-0.5 rounded bg-green-600 text-white flex-shrink-0">✓</span>}
                    {isAlreadyAdded ? (
                      <span className={cn('text-xs flex-shrink-0', theme === 'dark' ? 'text-green-400' : 'text-green-600')}>✅</span>
                    ) : (
                      <span className={cn('text-xs font-bold flex-shrink-0', theme === 'dark' ? 'text-blue-400' : 'text-blue-600')}>+ {t('audio.use')}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      <hr className={dividerClass} />


      <label className={cn(
        'flex items-center gap-2 text-lg cursor-pointer px-3.5 py-2.5 rounded-md border-2 transition-all inline-flex',
        category !== 'Music' && 'opacity-50 cursor-not-allowed',
        theme === 'dark' ? 'bg-gray-700/60 border-gray-600 text-white hover:bg-gray-600/60' : 'bg-white/60 border-transparent hover:bg-white/90'
      )}>
        <input type="checkbox" checked={jukeboxEnabled} onChange={e => setJukeboxEnabled(e.target.checked)} disabled={category !== 'Music'} className="w-4 h-4 accent-green-500" />
        📻 {t('audio.jukebox')}
      </label>

      {jukeboxEnabled && category === 'Music' && (
        <div className={cn('mt-4 p-4 rounded-lg border-2 border-dashed', theme === 'dark' ? 'bg-green-900/20 border-green-500' : 'bg-[#56a037]/10 border-[#56a037]')}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>🏷️ {t('audio.jukeboxName')}</label>
              <input type="text" value={jukeboxName} onChange={e => setJukeboxName(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>👁️ {t('audio.jukeboxVisible')}</label>
              <select value={jukeboxAvailable ? 'true' : 'false'} onChange={e => setJukeboxAvailable(e.target.value === 'true')} className={selectClass}>
                <option value="true">{t('audio.jukeboxVisibleYes')}</option>
                <option value="false">{t('audio.jukeboxVisibleNo')}</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <button onClick={handleSubmit} className={cn('w-full mt-5 p-3.5 text-2xl text-white rounded-lg cursor-pointer flex items-center justify-center gap-2.5 shadow-md transition-all hover:-translate-y-0.5', theme === 'dark' ? 'bg-gradient-to-b from-green-500 to-green-600 border-b-4 border-green-700' : 'bg-gradient-to-b from-[#6bc048] to-[#4a9030] border-b-4 border-[#2d5a20]')}>
        ➕ {t('audio.addToList')}
      </button>
    </div>
  );
}