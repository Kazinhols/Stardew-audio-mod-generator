import { useState, useEffect, memo, useCallback } from 'react';
import { useAppState, useTauri } from '@/state/AppContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/utils/cn';

export const ExportTab = memo(function ExportTab() {
  const { audios, assetsFolder, modConfig } = useAppState();
  const tauri = useTauri();
  const { language } = useLanguage();
  const { theme } = useTheme();
  
  const [copyAudio, setCopyAudio] = useState(false);
  const [manifestJson, setManifestJson] = useState('{}');
  const [contentJson, setContentJson] = useState('{}');
  const [i18nJson, setI18nJson] = useState('{}');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Regenerate JSON previews when audios or config change
  const audiosKey = JSON.stringify(audios.map(a => ({ id: a.id, f: a.files, l: a.looped, j: a.jukebox })));
  const configKey = `${modConfig.modId}|${modConfig.modName}|${modConfig.modAuthor}|${modConfig.modVersion}`;
  useEffect(() => {
    tauri.getManifestJson().then(setManifestJson).catch(() => {});
    tauri.getContentJson().then(setContentJson).catch(() => {});
    tauri.getI18nJson().then(setI18nJson).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audiosKey, configKey]);

  const handleCopy = useCallback(async (text: string, field: string) => {
    await tauri.copyToClipboard(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }, [tauri]);

  const handleExportFolder = useCallback(() => tauri.exportToFolder(copyAudio), [tauri, copyAudio]);
  
  const handleExportZip = useCallback(() => {
    if (tauri.isDesktop) {
      tauri.exportToZip(copyAudio);
    } else {
      tauri.downloadZip();
    }
  }, [tauri, copyAudio]);

  const reqFiles = audios.flatMap(a => a.files).filter((f, i, arr) => arr.indexOf(f) === i);
  const btnClass = (color: string) => cn('flex items-center justify-center gap-2 p-3.5 text-white rounded-lg font-bold shadow-md transition-all hover:-translate-y-0.5 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed', color);
  const previewHeaderClass = cn('flex items-center justify-between px-4 py-2.5 rounded-t-lg', theme === 'dark' ? 'bg-gray-700' : 'bg-[#8b4513]/10');
  const preClass = cn('p-4 rounded-b-lg overflow-x-auto text-sm max-h-64 overflow-y-auto font-mono leading-relaxed', theme === 'dark' ? 'bg-gray-900 text-green-400 border-2 border-gray-700' : 'bg-gradient-to-br from-[#1a1208] to-[#2d1d12] text-[#a1ef5e] border-4 border-[#5c3d2e]');

  const headerClass = cn(
    'border-2 rounded-xl p-4', 
    tauri.isDesktop
      ? (theme === 'dark' ? 'bg-gradient-to-r from-green-900/30 to-green-800/30 border-green-600' : 'bg-gradient-to-r from-[#e8f5e9] to-[#f1f8e9] border-[#56a037]')
      : (theme === 'dark' ? 'bg-gradient-to-r from-blue-900/30 to-blue-800/30 border-blue-600' : 'bg-gradient-to-r from-[#e3f2fd] to-[#bbdefb] border-[#1976d2]')
  );

  const headerTitleClass = cn(
    'text-xl font-bold mb-2', 
    tauri.isDesktop
      ? (theme === 'dark' ? 'text-green-400' : 'text-[#56a037]')
      : (theme === 'dark' ? 'text-blue-400' : 'text-[#1976d2]')
  );

  return (
    <div className="animate-fade-in space-y-4">
      {/* Header */}
      <div className={headerClass}>
        <h3 className={headerTitleClass}>
          {tauri.isDesktop 
            ? (language === 'pt' ? '📦 Exportar Mod (Nativo)' : '📦 Export Mod (Native)')
            : (language === 'pt' ? '🌐 Exportar Mod (Web)' : '🌐 Export Mod (Web)')
          }
        </h3>
        <p className={cn('text-base', theme === 'dark' ? 'text-gray-300' : '')}>
          {tauri.isDesktop
            ? (language === 'pt' 
                ? 'Escrita direta no disco • Compressão ZIP nativa • Diálogos nativos do OS' 
                : 'Direct disk writes • Native ZIP compression • OS native dialogs')
            : (language === 'pt'
                ? 'Gerado no navegador (JSZip) • Download instantâneo • Sem acesso ao disco local'
                : 'Browser generated (JSZip) • Instant download • No local disk access')
          }
        </p>
        {audios.length > 0 && (
          <p className={cn('text-sm mt-2 font-mono opacity-80', theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}>
            🎵 {audios.length} audio(s) | 📁 {reqFiles.length} file(s)
          </p>
        )}
      </div>

      {/* Copy audio option (desktop only) */}
      {tauri.isDesktop && (
        <div className={cn('p-4 rounded-xl border-2', theme === 'dark' ? 'bg-gray-700/50 border-gray-600' : 'bg-white/60 border-[#8b4513]/30')}>
          <label className={cn('flex items-center gap-3 cursor-pointer text-lg', theme === 'dark' ? 'text-white' : 'text-[#5c3d2e]')}>
            <input type="checkbox" checked={copyAudio} onChange={e => setCopyAudio(e.target.checked)} className="w-5 h-5 accent-[#56a037]" />
            📁 {language === 'pt' ? 'Copiar arquivos .ogg para a pasta do mod' : 'Copy .ogg files to mod folder'}
          </label>
          {copyAudio && !assetsFolder && (
            <p className={cn('text-sm mt-2 ml-8', theme === 'dark' ? 'text-orange-400' : 'text-[#e07020]')}>
              ⚠️ {language === 'pt' ? 'Configure a pasta de assets na aba Scanner' : 'Set up assets folder in Scanner tab'}
            </p>
          )}
          {copyAudio && assetsFolder && (
            <p className={cn('text-sm mt-2 ml-8', theme === 'dark' ? 'text-green-400' : 'text-[#56a037]')}>
              ✅ {assetsFolder}
            </p>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tauri.isDesktop ? (
          <>
            <button onClick={handleExportFolder} disabled={audios.length === 0} className={btnClass(theme === 'dark' ? 'bg-gradient-to-b from-green-500 to-green-600 border-b-4 border-green-700' : 'bg-gradient-to-b from-[#6bc048] to-[#4a9030] border-b-4 border-[#2d5a20]')}>
              📂 {language === 'pt' ? 'Exportar para Pasta' : 'Export to Folder'}
            </button>
            <button onClick={handleExportZip} disabled={audios.length === 0} className={btnClass(theme === 'dark' ? 'bg-gradient-to-b from-orange-500 to-orange-600 border-b-4 border-orange-700' : 'bg-gradient-to-b from-[#e07020] to-[#d06010] border-b-4 border-[#a04808]')}>
              📦 {language === 'pt' ? 'Exportar como ZIP' : 'Export as ZIP'}
            </button>
          </>
        ) : (
          <>
            <button onClick={() => tauri.downloadManifest()} className={btnClass(theme === 'dark' ? 'bg-gradient-to-b from-purple-500 to-purple-600 border-b-4 border-purple-700' : 'bg-gradient-to-b from-[#9b59b6] to-[#8b49a6] border-b-4 border-[#6b2986]')}>
              📜 manifest.json
            </button>
            <button onClick={() => tauri.downloadContent()} disabled={audios.length === 0} className={btnClass(theme === 'dark' ? 'bg-gradient-to-b from-blue-500 to-blue-600 border-b-4 border-blue-700' : 'bg-gradient-to-b from-[#5aa0e9] to-[#3a80c0] border-b-4 border-[#2a5a8a]')}>
              📄 content.json
            </button>
            <button onClick={() => tauri.downloadI18n()} disabled={audios.filter(a => a.jukebox).length === 0} className={btnClass(theme === 'dark' ? 'bg-gradient-to-b from-teal-500 to-teal-600 border-b-4 border-teal-700' : 'bg-gradient-to-b from-[#4db6ac] to-[#009688] border-b-4 border-[#00695c]')}>
              🌐 i18n/default.json
            </button>
            <button onClick={handleExportZip} disabled={audios.length === 0} className={btnClass(theme === 'dark' ? 'bg-gradient-to-b from-indigo-500 to-indigo-600 border-b-4 border-indigo-700' : 'bg-gradient-to-b from-[#5c6bc0] to-[#3f51b5] border-b-4 border-[#303f9f]')}>
              📦 {language === 'pt' ? 'Baixar ZIP (.zip)' : 'Download ZIP (.zip)'}
            </button>
          </>
        )}
      </div>

      {/* Tech Badge */}
      <div className={cn('text-center text-xs p-2 rounded-lg font-mono opacity-70', theme === 'dark' ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-600')}>
        {tauri.isDesktop
          ? '🦀 Rust: fs::write + zip::ZipWriter + native dialogs'
          : '⚡ Web: React + JSZip (Client Side Generation)'
        }
      </div>

      {/* Previews */}
      {[
        { label: '📜 MANIFEST.JSON', json: manifestJson, field: 'manifest' },
        { label: '📄 CONTENT.JSON', json: contentJson, field: 'content' },
        { label: '🌐 I18N/DEFAULT.JSON', json: i18nJson, field: 'i18n' },
      ].map(({ label, json, field }) => (
        <div key={field} className={cn('rounded-lg overflow-hidden', theme === 'dark' ? 'border border-gray-700' : '')}>
          <div className={previewHeaderClass}>
            <span className={cn('font-bold text-lg', theme === 'dark' ? 'text-orange-300' : 'text-[#5c3d2e]')}>{label}</span>
            <button onClick={() => handleCopy(json, field)} className={cn('flex items-center gap-1.5 px-3 py-1 rounded text-sm text-white transition-colors', theme === 'dark' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-[#4a90d9] hover:brightness-110')}>
              {copiedField === field ? '✅ Copied' : '📋 Copy'}
            </button>
          </div>
          <pre className={preClass}>{json}</pre>
        </div>
      ))}
    </div>
  );
});
