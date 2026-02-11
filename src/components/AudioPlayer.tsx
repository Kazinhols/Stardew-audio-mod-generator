import { useState, useRef, useEffect, useCallback } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/utils/cn';
import type { AudioFileInfo } from '@/types/audio';

interface AudioPlayerProps {
  file: AudioFileInfo;
  onClose: () => void;
}

function isTauri(): boolean {
  return typeof window !== 'undefined' && !!(
    (window as any).__TAURI__ ||
    (window as any).__TAURI_INTERNALS__ ||
    (window as any).__TAURI_IPC__
  );
}

async function tauriInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  const w = window as any;
  if (w.__TAURI__?.core?.invoke) return w.__TAURI__.core.invoke(cmd, args);
  if (w.__TAURI_INTERNALS__?.invoke) return w.__TAURI_INTERNALS__.invoke(cmd, args);
  throw new Error('Tauri not available');
}

function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || 'ogg';
}

function getMimeType(filename: string): string {
  const ext = getFileExtension(filename);
  const mimes: Record<string, string> = {
    ogg: 'audio/ogg', mp3: 'audio/mpeg', wav: 'audio/wav',
    flac: 'audio/flac', m4a: 'audio/mp4', aac: 'audio/aac',
    wma: 'audio/x-ms-wma', opus: 'audio/opus', aiff: 'audio/aiff',
  };
  return mimes[ext] || 'audio/ogg';
}

function getFormatLabel(filename: string): string {
  return getFileExtension(filename).toUpperCase();
}

function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds) || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function AudioPlayer({ file, onClose }: AudioPlayerProps) {
  const { theme } = useTheme();
  const { language } = useLanguage();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const isPlayingRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      const ct = audio.currentTime;
      const dur = audio.duration;
      if (isFinite(ct)) setCurrentTime(ct);
      if (isFinite(dur) && !isNaN(dur) && dur > 0 && duration === 0) {
        setDuration(dur);
      }
    };

    const handleDurationChange = () => {
      const dur = audio.duration;
      if (isFinite(dur) && !isNaN(dur) && dur > 0) {
        setDuration(dur);
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
      isPlayingRef.current = true;
    };

    const handlePause = () => {
      setIsPlaying(false);
      isPlayingRef.current = false;
    };

    const handleEnded = () => {
      setIsPlaying(false);
      isPlayingRef.current = false;
      setCurrentTime(0);
      audio.currentTime = 0;
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [duration]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.src = '';
        audio.load();
      }
      if (urlRef.current && urlRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(urlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const cleanup = () => {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.src = '';
      }
      if (urlRef.current && urlRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
    };

    const setupAudio = (url: string) => {
      if (cancelled) return;

      cleanup();
      urlRef.current = url;

      const audio = new Audio();
      audio.preload = 'metadata';
      audio.volume = volume;

      audio.onloadedmetadata = () => {
        if (cancelled) return;
        const dur = audio.duration;
        console.log('🎵 Metadata loaded, duration:', dur);
        if (isFinite(dur) && !isNaN(dur) && dur > 0) {
          setDuration(dur);
        }
        setReady(true);
        setLoading(false);
      };

      audio.oncanplaythrough = () => {
        if (cancelled) return;
        console.log('🎵 Can play through');
        const dur = audio.duration;
        if (isFinite(dur) && !isNaN(dur) && dur > 0) {
          setDuration(dur);
        }
        setReady(true);
        setLoading(false);
      };

      audio.onerror = () => {
        if (cancelled) return;
        const code = audio.error?.code || 0;
        const msg = audio.error?.message || '';
        console.error('🎵 Audio error:', code, msg);

        let errorText = language === 'pt' ? 'Erro de reprodução' : 'Playback error';
        const ext = getFileExtension(file.name);

        if (code === 4) {
          if (ext === 'ogg') {
            errorText += language === 'pt'
              ? '\n\nO arquivo pode ser OGG Opus (não suportado pelo SDV). Converta para OGG Vorbis.'
              : '\n\nFile may be OGG Opus (not supported by SDV). Convert to OGG Vorbis.';
          } else if (['flac', 'wma', 'aiff', 'ape', 'wv'].includes(ext)) {
            errorText += language === 'pt'
              ? `\n\nO formato ${ext.toUpperCase()} não é suportado pelo navegador. Converta para WAV ou OGG.`
              : `\n\n${ext.toUpperCase()} format is not supported by the browser. Convert to WAV or OGG.`;
          }
        }

        setError(errorText);
        setLoading(false);
      };

      audio.src = url;
      audioRef.current = audio;
      audio.load();
    };

    const loadAudio = async () => {
      setLoading(true);
      setError(null);
      setReady(false);
      setIsPlaying(false);
      isPlayingRef.current = false;
      setCurrentTime(0);
      setDuration(0);

      if (!isTauri()) {
        setLoading(false);
        setError(language === 'pt' ? 'Player disponível apenas no Desktop' : 'Player only available on Desktop');
        return;
      }

      const w = window as any;
      console.log('🎵 Loading:', file.name, file.path);

      try {
        if (w.__TAURI__?.core?.convertFileSrc) {
          const url = w.__TAURI__.core.convertFileSrc(file.path);
          console.log('🎵 Using convertFileSrc');
          setupAudio(url);
          return;
        }
      } catch (e) {
        console.warn('🎵 convertFileSrc failed:', e);
      }

      try {
        let rawData: unknown = null;

        try {
          rawData = await tauriInvoke('plugin:fs|read_file', {
            options: { path: file.path, baseDir: null }
          });
        } catch {
          try {
            rawData = await tauriInvoke('plugin:fs|read_file', { path: file.path });
          } catch {
            rawData = await tauriInvoke('plugin:fs|readFile', { path: file.path });
          }
        }

        if (!rawData) throw new Error('No data');

        let bytes: Uint8Array;
        if (rawData instanceof Uint8Array) {
          bytes = rawData;
        } else if (rawData instanceof ArrayBuffer) {
          bytes = new Uint8Array(rawData);
        } else if (Array.isArray(rawData)) {
          bytes = new Uint8Array(rawData);
        } else if (typeof rawData === 'object' && rawData !== null) {
          const d = (rawData as any).data || (rawData as any).bytes || rawData;
          bytes = new Uint8Array(Array.isArray(d) ? d : []);
        } else {
          throw new Error('Unknown data type');
        }

        if (bytes.length === 0) throw new Error('Empty file');

        console.log('🎵 Read', bytes.length, 'bytes, creating blob');
        const mime = getMimeType(file.name);
        const ab = new ArrayBuffer(bytes.length);
        new Uint8Array(ab).set(bytes);
        const blob = new Blob([ab], { type: mime });
        const url = URL.createObjectURL(blob);
        setupAudio(url);
        return;
      } catch (e) {
        console.warn('🎵 Read bytes failed:', e);
      }

      try {
        const cleanPath = file.path.startsWith('/') ? file.path : `/${file.path}`;
        const url = `asset://localhost${cleanPath}`;
        console.log('🎵 Using asset://');
        setupAudio(url);
        return;
      } catch (e) {
        console.warn('🎵 asset:// failed:', e);
      }

      if (!cancelled) {
        setLoading(false);
        setError(language === 'pt' ? 'Não foi possível carregar o áudio' : 'Could not load audio');
      }
    };

    loadAudio();
    return () => { cancelled = true; };
  }, [file.path, language, volume]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !ready) return;

    if (isPlayingRef.current) {
      audio.pause();
    } else {
      audio.play()
        .catch(err => {
          console.error('🎵 Play error:', err);
          setError(language === 'pt' ? `Erro: ${err.message}` : `Error: ${err.message}`);
        });
    }
  }, [ready, language]);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setCurrentTime(0);
  }, []);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration || !isFinite(duration)) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = pct * duration;
    if (isFinite(newTime)) {
      audio.currentTime = newTime;
      setCurrentTime(newTime);
    }
  }, [duration]);

  const handleClose = useCallback(() => {
    stop();
    onClose();
  }, [stop, onClose]);

  const progress = (duration > 0 && isFinite(duration) && isFinite(currentTime))
    ? Math.min(100, Math.max(0, (currentTime / duration) * 100))
    : 0;

  const fileFormat = getFormatLabel(file.name);

  return (
    <div className={cn(
      'rounded-xl border-2 p-4 mb-4',
      theme === 'dark'
        ? 'bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-purple-500'
        : 'bg-gradient-to-r from-purple-50 to-blue-50 border-purple-400'
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-2xl">{isPlaying ? '🔊' : '🎵'}</span>
          <div className="min-w-0">
            <div className={cn('font-bold truncate', theme === 'dark' ? 'text-white' : 'text-gray-800')}>
              {file.name}
            </div>
            <div className={cn('text-xs', theme === 'dark' ? 'text-gray-400' : 'text-gray-500')}>
              {file.size_display} • {fileFormat}
              {file.sample_rate ? ` • ${file.sample_rate}Hz` : ''}
              {file.channels ? ` • ${file.channels === 1 ? 'Mono' : 'Stereo'}` : ''}
            </div>
          </div>
        </div>
        <button onClick={handleClose} className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center text-lg',
          theme === 'dark' ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'
        )}>✕</button>
      </div>

      {error && (
        <div className={cn('p-3 rounded-lg mb-3 text-sm whitespace-pre-line', theme === 'dark' ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-600')}>
          ❌ {error}
        </div>
      )}

      {loading && (
        <div className={cn('p-3 rounded-lg mb-3 text-center', theme === 'dark' ? 'text-gray-400' : 'text-gray-500')}>
          ⏳ {language === 'pt' ? 'Carregando áudio...' : 'Loading audio...'}
        </div>
      )}

      {ready && !error && (
        <>
          <div
            onClick={handleSeek}
            className={cn('h-4 rounded-full cursor-pointer mb-3 relative overflow-hidden group', theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200')}
          >
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full relative transition-none"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={togglePlay} className={cn(
              'w-11 h-11 rounded-full flex items-center justify-center text-xl text-white transition-all hover:scale-105 active:scale-95',
              isPlaying ? 'bg-purple-600 hover:bg-purple-500' : 'bg-green-600 hover:bg-green-500'
            )}>
              {isPlaying ? '⏸️' : '▶️'}
            </button>

            <button onClick={stop} className={cn(
              'w-11 h-11 rounded-full flex items-center justify-center text-xl transition-all hover:scale-105 active:scale-95',
              theme === 'dark' ? 'bg-gray-700 text-white hover:bg-red-600' : 'bg-gray-200 hover:bg-red-500 hover:text-white'
            )}>
              ⏹️
            </button>

            <div className={cn('text-sm font-mono min-w-[90px] text-center', theme === 'dark' ? 'text-gray-300' : 'text-gray-600')}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>

            <div className="flex items-center gap-1.5 ml-auto">
              <button onClick={() => { const v = volume === 0 ? 0.8 : 0; setVolume(v); if (audioRef.current) audioRef.current.volume = v; }}
                className="text-lg hover:scale-110 transition-transform">
                {volume === 0 ? '🔇' : volume < 0.3 ? '🔈' : volume < 0.7 ? '🔉' : '🔊'}
              </button>
              <input
                type="range" min="0" max="1" step="0.05" value={volume}
                onChange={handleVolumeChange}
                className="w-20 h-1.5 accent-purple-500 cursor-pointer"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

interface PlayButtonProps {
  onClick: () => void;
  isPlaying: boolean;
  className?: string;
}

export function PlayButton({ onClick, isPlaying, className }: PlayButtonProps) {
  const { theme } = useTheme();
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all hover:scale-110 flex-shrink-0',
        isPlaying
          ? theme === 'dark' ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white'
          : theme === 'dark' ? 'bg-green-600 text-white' : 'bg-green-500 text-white',
        className
      )}
    >
      {isPlaying ? '⏸' : '▶️'}
    </button>
  );
}
