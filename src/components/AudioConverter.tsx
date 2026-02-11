import { memo, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppState, useAppDispatch, useToastCtx } from '@/state/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/utils/cn';
import type { ConvertJob } from '@/types/audio';

function detectTauri(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as any;
  return !!(
    w.__TAURI__ || 
    w.__TAURI_INTERNALS__ || 
    w.__TAURI_IPC__ ||
    (w.__TAURI_METADATA__ && w.__TAURI_METADATA__.currentWindow)
  );
}

async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  const w = window as any;
  
  if (w.__TAURI__?.core?.invoke) {
    return w.__TAURI__.core.invoke(cmd, args);
  }
  if (w.__TAURI__?.invoke) {
    return w.__TAURI__.invoke(cmd, args);
  }
  if (w.__TAURI_INTERNALS__?.invoke) {
    return w.__TAURI_INTERNALS__.invoke(cmd, args);
  }
  
  throw new Error('Tauri invoke not available');
}

export const AudioConverter = memo(function AudioConverter() {
  const { convertJobs, scanResult, selectedScanFiles, assetsFolder } = useAppState();
  const dispatch = useAppDispatch();
  const { showToast } = useToastCtx();
  const { theme } = useTheme();
  const { language } = useLanguage();

  const isDesktop = useMemo(() => detectTauri(), []);

  const convertFile = useCallback(async (filePath: string, fileName: string, targetFormat: 'ogg' | 'wav') => {
    const jobId = `${Date.now()}-${fileName}`;
    const job: ConvertJob = {
      id: jobId,
      sourceFile: fileName,
      targetFormat,
      status: 'converting',
      progress: 0,
    };
    dispatch({ type: 'ADD_CONVERT_JOB', payload: job });

    if (isDesktop) {
      try {
        const progressInterval = setInterval(() => {
          dispatch({ type: 'UPDATE_CONVERT_JOB', payload: { id: jobId, updates: { progress: Math.min(90, (job.progress || 0) + 15) } } });
        }, 300);

        const result = await invoke<{ success: boolean; output_path: string; error?: string }>('convert_audio', {
          sourcePath: filePath,
          targetFormat,
        });

        clearInterval(progressInterval);

        if (result.success) {
          dispatch({ type: 'UPDATE_CONVERT_JOB', payload: { id: jobId, updates: { status: 'done', progress: 100, outputPath: result.output_path } } });
          showToast(`✅ ${fileName} → .${targetFormat}`, 'success');
        } else {
          dispatch({ type: 'UPDATE_CONVERT_JOB', payload: { id: jobId, updates: { status: 'error', error: result.error } } });
          showToast(`❌ ${result.error}`, 'error');
        }
      } catch (err) {
        dispatch({ type: 'UPDATE_CONVERT_JOB', payload: { id: jobId, updates: { status: 'error', error: String(err) } } });
        showToast(`❌ ${err}`, 'error');
      }
    } else {
      setTimeout(() => {
        dispatch({ type: 'UPDATE_CONVERT_JOB', payload: { id: jobId, updates: { status: 'error', error: language === 'pt' ? 'Conversão só disponível na versão Desktop' : 'Conversion only available in Desktop version' } } });
      }, 500);
    }
  }, [dispatch, showToast, language, isDesktop]);

  const convertSelected = useCallback(async (targetFormat: 'ogg' | 'wav') => {
    if (!scanResult || selectedScanFiles.length === 0) return;

    for (const fileName of selectedScanFiles) {
      const file = scanResult.files.find(f => f.name === fileName);
      if (file) {
        await convertFile(file.path, file.name, targetFormat);
      }
    }
  }, [scanResult, selectedScanFiles, convertFile]);

  const clearJobs = useCallback(() => {
    dispatch({ type: 'CLEAR_CONVERT_JOBS' });
  }, [dispatch]);

  const hasSelectedFiles = selectedScanFiles.length > 0;
  const completedJobs = convertJobs.filter(j => j.status === 'done').length;
  const failedJobs = convertJobs.filter(j => j.status === 'error').length;
  const activeJobs = convertJobs.filter(j => j.status === 'converting').length;

  return (
    <div className={cn(
      'rounded-xl border-2 p-4',
      theme === 'dark'
        ? 'bg-gradient-to-r from-purple-900/20 to-indigo-900/20 border-purple-600/50'
        : 'bg-gradient-to-r from-[#f3e5f5] to-[#e8eaf6] border-[#9b59b6]/50'
    )}>
      <h4 className={cn('text-lg font-bold mb-3 flex items-center gap-2',
        theme === 'dark' ? 'text-purple-300' : 'text-[#9b59b6]'
      )}>
        🔄 {language === 'pt' ? 'Conversor de Áudio' : 'Audio Converter'}
        {activeJobs > 0 && (
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="text-sm"
          >
            ⏳
          </motion.span>
        )}
      </h4>
      <p className={cn('text-sm mb-3',
        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
      )}>
        {isDesktop
          ? (language === 'pt'
            ? '🦀 Conversão nativa via Rust (FFmpeg/Symphonia). Selecione arquivos na lista abaixo para converter.'
            : '🦀 Native conversion via Rust (FFmpeg/Symphonia). Select files from the list below to convert.')
          : (language === 'pt'
            ? '🌐 Conversão disponível apenas na versão Desktop. Na Web, use ferramentas externas como Audacity.'
            : '🌐 Conversion only available in Desktop version. On Web, use external tools like Audacity.')}
      </p>

      <div className="flex flex-wrap gap-2 mb-3">
        <motion.button
          onClick={() => convertSelected('ogg')}
          disabled={!hasSelectedFiles || activeJobs > 0}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed',
            theme === 'dark'
              ? 'bg-green-700 text-white border-2 border-green-600 hover:bg-green-600'
              : 'bg-[#56a037] text-white border-2 border-[#2d5a20] hover:brightness-110'
          )}
        >
          🎵 → OGG Vorbis
          {hasSelectedFiles && <span className="px-1.5 py-0.5 bg-white/20 rounded text-xs">{selectedScanFiles.length}</span>}
        </motion.button>

        <motion.button
          onClick={() => convertSelected('wav')}
          disabled={!hasSelectedFiles || activeJobs > 0}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed',
            theme === 'dark'
              ? 'bg-blue-700 text-white border-2 border-blue-600 hover:bg-blue-600'
              : 'bg-[#4a90d9] text-white border-2 border-[#2a5a8a] hover:brightness-110'
          )}
        >
          🔊 → WAV
          {hasSelectedFiles && <span className="px-1.5 py-0.5 bg-white/20 rounded text-xs">{selectedScanFiles.length}</span>}
        </motion.button>

        {convertJobs.length > 0 && (
          <motion.button
            onClick={clearJobs}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              'px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-1',
              theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            )}
          >
            🗑️ {language === 'pt' ? 'Limpar' : 'Clear'}
          </motion.button>
        )}
      </div>

      {convertJobs.length > 0 && (
        <div className={cn('flex gap-3 text-xs mb-3 px-2', theme === 'dark' ? 'text-gray-400' : 'text-gray-600')}>
          {activeJobs > 0 && <span className="text-amber-500">⏳ {activeJobs} {language === 'pt' ? 'convertendo' : 'converting'}</span>}
          {completedJobs > 0 && <span className="text-green-500">✅ {completedJobs} {language === 'pt' ? 'concluído(s)' : 'done'}</span>}
          {failedJobs > 0 && <span className="text-red-500">❌ {failedJobs} {language === 'pt' ? 'erro(s)' : 'error(s)'}</span>}
        </div>
      )}

      <AnimatePresence>
        {convertJobs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 max-h-48 overflow-y-auto"
          >
            {convertJobs.map((job) => (
              <ConvertJobRow key={job.id} job={job} theme={theme} onRemove={() => dispatch({ type: 'REMOVE_CONVERT_JOB', payload: job.id })} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {!hasSelectedFiles && scanResult && scanResult.files.length > 0 && (
        <div className={cn('text-center text-xs py-2 opacity-60',
          theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
        )}>
          ☝️ {language === 'pt' ? 'Selecione arquivos na lista de scan para converter' : 'Select files from the scan list to convert'}
        </div>
      )}
    </div>
  );
});

const ConvertJobRow = memo(function ConvertJobRow({
  job, theme, onRemove
}: { job: ConvertJob; theme: 'light' | 'dark'; onRemove: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={cn(
        'flex items-center gap-3 p-2.5 rounded-lg border text-sm',
        job.status === 'done'
          ? theme === 'dark' ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-300'
          : job.status === 'error'
            ? theme === 'dark' ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-300'
            : theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
      )}
    >
      {job.status === 'converting' ? (
        <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>⏳</motion.span>
      ) : job.status === 'done' ? (
        <span>✅</span>
      ) : (
        <span>❌</span>
      )}

      <div className="flex-1 min-w-0">
        <div className={cn('font-medium truncate', theme === 'dark' ? 'text-white' : 'text-[#5c3d2e]')}>
          {job.sourceFile} → .{job.targetFormat}
        </div>
        {job.error && (
          <div className={cn('text-xs truncate', theme === 'dark' ? 'text-red-400' : 'text-red-600')}>{job.error}</div>
        )}
        {job.outputPath && (
          <div className={cn('text-xs truncate', theme === 'dark' ? 'text-green-400' : 'text-green-600')}>📁 {job.outputPath}</div>
        )}
      </div>

      {job.status === 'converting' && (
        <div className="w-20 h-2 rounded-full overflow-hidden bg-gray-300 dark:bg-gray-700">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${job.progress}%` }}
          />
        </div>
      )}

      {job.status !== 'converting' && (
        <motion.button
          onClick={onRemove}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className={cn('w-6 h-6 rounded-full flex items-center justify-center text-xs',
            theme === 'dark' ? 'bg-gray-700 text-gray-400 hover:bg-red-600 hover:text-white' : 'bg-gray-200 text-gray-500 hover:bg-red-500 hover:text-white'
          )}
        >
          ✕
        </motion.button>
      )}
    </motion.div>
  );
});
