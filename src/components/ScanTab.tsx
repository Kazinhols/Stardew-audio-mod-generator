import { memo } from 'react';
import { useAppState, useTauri } from '@/state/AppContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/utils/cn';
import type { AudioFileInfo } from '@/types/audio';

export const ScanTab = memo(function ScanTab() {
  const { assetsFolder, scanResult, watching } = useAppState();
  const tauri = useTauri();
  const { language } = useLanguage();
  const { theme } = useTheme();

  const btnGreen = cn('px-4 py-2.5 rounded-lg text-white font-bold transition-all hover:-translate-y-0.5 hover:brightness-110 flex items-center gap-2', theme === 'dark' ? 'bg-green-600 border-b-3 border-green-700' : 'bg-gradient-to-b from-[#6bc048] to-[#4a9030] border-b-3 border-[#2d5a20]');
  const btnBlue = cn('px-4 py-2.5 rounded-lg text-white font-bold transition-all hover:-translate-y-0.5 hover:brightness-110 flex items-center gap-2', theme === 'dark' ? 'bg-blue-600 border-b-3 border-blue-700' : 'bg-gradient-to-b from-[#5aa0e9] to-[#3a80c0] border-b-3 border-[#2a5a8a]');
  const btnOrange = cn('px-4 py-2.5 rounded-lg text-white font-bold transition-all hover:-translate-y-0.5 hover:brightness-110 flex items-center gap-2', theme === 'dark' ? 'bg-orange-600 border-b-3 border-orange-700' : 'bg-gradient-to-b from-[#e07020] to-[#d06010] border-b-3 border-[#a04808]');

  return (
    <div className="animate-fade-in space-y-4">
      {/* Header */}
      <div className={cn('border-2 rounded-xl p-4', theme === 'dark' ? 'bg-gradient-to-r from-blue-900/30 to-blue-800/30 border-blue-600' : 'bg-gradient-to-r from-[#e3f2fd] to-[#bbdefb] border-[#4a90d9]')}>
        <h3 className={cn('text-xl font-bold mb-2', theme === 'dark' ? 'text-blue-400' : 'text-[#4a90d9]')}>
          🔍 {language === 'pt' ? 'Scanner de Áudio Nativo (Rust)' : 'Native Audio Scanner (Rust)'}
        </h3>
        <p className={cn('text-base', theme === 'dark' ? 'text-gray-300' : '')}>
          {language === 'pt'
            ? 'O Rust analisa cada arquivo OGG nativamente — detecta Opus vs Vorbis, sample rate, canais. Eventos de mudança são emitidos via Tauri Events.'
            : 'Rust natively analyzes each OGG file — detects Opus vs Vorbis, sample rate, channels. Change events are emitted via Tauri Events.'}
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button onClick={tauri.scanFolder} className={btnGreen}>📂 {language === 'pt' ? 'Selecionar Pasta' : 'Select Folder'}</button>
        {assetsFolder && (
          <>
            <button onClick={tauri.rescanFolder} className={btnBlue}>🔄 {language === 'pt' ? 'Atualizar' : 'Refresh'}</button>
            <button onClick={() => tauri.openInExplorer(assetsFolder)} className={btnOrange}>📁 Explorer</button>
            <button onClick={tauri.watchFolder} disabled={watching} className={cn(btnBlue, watching && 'opacity-50')}>
              {watching ? '✅ Watching' : '👁️ Watch'}
            </button>
          </>
        )}
      </div>

      {/* Current folder */}
      {assetsFolder && (
        <div className={cn('p-3 rounded-lg font-mono text-sm', theme === 'dark' ? 'bg-gray-900 text-green-400' : 'bg-[#2d1d12] text-[#a1ef5e]')}>
          📂 {assetsFolder}
          {watching && <span className="ml-3 animate-pulse">👁️ Live</span>}
        </div>
      )}

      {/* Results */}
      {scanResult && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Total" value={String(scanResult.files.length)} icon="📁" theme={theme} />
            <StatCard label={language === 'pt' ? 'Válidos' : 'Valid'} value={String(scanResult.total_valid)} icon="✅" theme={theme} color="green" />
            <StatCard label={language === 'pt' ? 'Inválidos' : 'Invalid'} value={String(scanResult.total_invalid)} icon="❌" theme={theme} color="red" />
            <StatCard label={language === 'pt' ? 'Tamanho' : 'Size'} value={scanResult.total_size} icon="💾" theme={theme} />
          </div>
          <div className={cn('p-4 rounded-xl border-2', theme === 'dark' ? 'bg-gray-700/50 border-gray-600' : 'bg-white/60 border-[#8b4513]/30')}>
            <h4 className={cn('text-lg font-bold mb-3', theme === 'dark' ? 'text-white' : 'text-[#5c3d2e]')}>
              📋 {language === 'pt' ? 'Arquivos' : 'Files'}
            </h4>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {scanResult.files.map((file, i) => <FileRow key={i} file={file} theme={theme} />)}
            </div>
          </div>
        </>
      )}

      {!scanResult && (
        <div className={cn('text-center py-16', theme === 'dark' ? 'text-gray-500' : 'text-[#8b6914]')}>
          <span className="text-5xl block mb-4">🔍</span>
          <p className="text-xl">{language === 'pt' ? 'Selecione uma pasta de assets para escanear' : 'Select an assets folder to scan'}</p>
          <p className="text-base mt-2 opacity-70">🦀 {language === 'pt' ? 'Análise nativa em Rust' : 'Native Rust analysis'}</p>
        </div>
      )}
    </div>
  );
});

const StatCard = memo(function StatCard({ label, value, icon, theme, color }: { label: string; value: string; icon: string; theme: 'light' | 'dark'; color?: string }) {
  const bg = color === 'green'
    ? theme === 'dark' ? 'bg-green-900/30 border-green-600' : 'bg-green-50 border-green-400'
    : color === 'red'
    ? theme === 'dark' ? 'bg-red-900/30 border-red-600' : 'bg-red-50 border-red-400'
    : theme === 'dark' ? 'bg-gray-700/50 border-gray-600' : 'bg-white/60 border-[#8b4513]/30';
  return (
    <div className={cn('p-3 rounded-xl border-2 text-center', bg)}>
      <div className="text-2xl">{icon}</div>
      <div className={cn('text-2xl font-bold', theme === 'dark' ? 'text-white' : 'text-[#5c3d2e]')}>{value}</div>
      <div className={cn('text-sm', theme === 'dark' ? 'text-gray-400' : 'text-[#8b6914]')}>{label}</div>
    </div>
  );
});

const FileRow = memo(function FileRow({ file, theme }: { file: AudioFileInfo; theme: 'light' | 'dark' }) {
  const isOk = file.is_valid_ogg && file.is_vorbis;
  return (
    <div className={cn('p-3 rounded-lg border-2 flex flex-col sm:flex-row sm:items-center gap-2 transition-all', isOk ? theme === 'dark' ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-300' : theme === 'dark' ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-300')}>
      <div className="flex-1 min-w-0">
        <div className={cn('font-bold truncate', theme === 'dark' ? 'text-white' : 'text-[#5c3d2e]')}>{isOk ? '✅' : '❌'} {file.name}</div>
        {file.error && <div className={cn('text-sm mt-1', theme === 'dark' ? 'text-red-400' : 'text-red-600')}>{file.error}</div>}
      </div>
      <div className="flex flex-wrap gap-1.5">
        <span className={cn('px-2 py-0.5 rounded text-xs text-white', isOk ? 'bg-green-600' : 'bg-red-600')}>{isOk ? 'Vorbis ✓' : 'NOT Vorbis'}</span>
        <span className={cn('px-2 py-0.5 rounded text-xs', theme === 'dark' ? 'bg-gray-600 text-gray-200' : 'bg-gray-200')}>{file.size_display}</span>
        {file.sample_rate && <span className={cn('px-2 py-0.5 rounded text-xs', theme === 'dark' ? 'bg-gray-600 text-gray-200' : 'bg-gray-200')}>{file.sample_rate}Hz</span>}
        {file.channels && <span className={cn('px-2 py-0.5 rounded text-xs', theme === 'dark' ? 'bg-gray-600 text-gray-200' : 'bg-gray-200')}>{file.channels === 1 ? 'Mono' : 'Stereo'}</span>}
      </div>
    </div>
  );
});
