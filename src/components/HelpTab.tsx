import { memo, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/utils/cn';

const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

export const HelpTab = memo(function HelpTab() {
  const { language } = useLanguage();
  const { theme } = useTheme();

  const styles = useMemo(() => ({
    box: cn(
      'p-4 rounded-xl border-2 mb-4',
      theme === 'dark'
        ? 'bg-gray-700/50 border-gray-600'
        : 'bg-white/60 border-[#8b4513]/30'
    ),
    head: cn(
      'text-xl font-bold mb-3',
      theme === 'dark' ? 'text-white' : 'text-[#5c3d2e]'
    ),
    text: cn(
      'text-lg leading-relaxed',
      theme === 'dark' ? 'text-gray-300' : ''
    ),
    pre: cn(
      'p-4 rounded-xl border-4 overflow-x-auto text-sm max-h-48 overflow-y-auto',
      theme === 'dark'
        ? 'bg-gray-900 text-green-400 border-gray-700'
        : 'bg-gradient-to-br from-[#1a1208] to-[#2d1d12] text-[#a1ef5e] border-[#5c3d2e]'
    ),
    code: cn(
      'px-2 py-0.5 rounded',
      theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'
    ),
    tree: cn(
      'p-4 rounded-lg font-mono text-base leading-loose',
      theme === 'dark'
        ? 'bg-gray-900 text-yellow-200'
        : 'bg-[#2d1d12] text-[#f0e68c]'
    ),
  }), [theme]);

  return (
    <div className="animate-fade-in space-y-4">

      {}
      {isTauri && (
        <div className={cn(
          'border-2 rounded-xl p-4',
          theme === 'dark'
            ? 'bg-gradient-to-r from-orange-900/30 to-orange-800/30 border-orange-600'
            : 'bg-gradient-to-r from-[#fff3e0] to-[#ffe0b2] border-[#e07020]'
        )}>
          <h3 className={cn(
            'text-xl font-bold mb-3',
            theme === 'dark' ? 'text-orange-400' : 'text-[#e07020]'
          )}>
            🏗️ {language === 'pt'
              ? 'Arquitetura: 100% Tauri + 100% React'
              : 'Architecture: 100% Tauri + 100% React'}
          </h3>
          <div className={cn('text-base space-y-2', theme === 'dark' ? 'text-gray-300' : '')}>
            <p className="font-bold">🦀 Rust Backend (Tauri):</p>
            <ul className="ml-4 space-y-1">
              <li>• <code>ogg</code> crate — {language === 'pt' ? 'Valida Vorbis vs Opus nativamente' : 'Validates Vorbis vs Opus natively'}</li>
              <li>• <code>walkdir</code> — {language === 'pt' ? 'Escaneia pastas recursivamente' : 'Recursively scans directories'}</li>
              <li>• <code>zip</code> crate — {language === 'pt' ? 'Compressão ZIP nativa' : 'Native ZIP compression'}</li>
              <li>• <code>notify</code> crate — {language === 'pt' ? 'File watcher em tempo real' : 'Real-time file watcher'}</li>
              <li>• <code>serde_json</code> — {language === 'pt' ? 'Serialização JSON' : 'JSON serialization'}</li>
              <li>• <code>chrono</code> — {language === 'pt' ? 'Timestamps nativos' : 'Native timestamps'}</li>
              <li>• Tauri Events — {language === 'pt' ? 'Comunicação Rust → React' : 'Rust → React communication'}</li>
              <li>• Tauri Plugins — dialog, fs, clipboard, notification, opener, os, process, shell</li>
            </ul>
            <p className="font-bold mt-3">⚛️ React Frontend:</p>
            <ul className="ml-4 space-y-1">
              <li>• <code>useReducer</code> + Immer — {language === 'pt' ? 'Estado centralizado e imutável' : 'Centralized immutable state'}</li>
              <li>• <code>React.lazy</code> + <code>Suspense</code> — {language === 'pt' ? 'Code splitting por aba' : 'Code splitting per tab'}</li>
              <li>• <code>React.memo</code> — {language === 'pt' ? 'Previne re-renders desnecessários' : 'Prevents unnecessary re-renders'}</li>
              <li>• <code>ErrorBoundary</code> — {language === 'pt' ? 'Captura erros sem crashar' : 'Catches errors without crashing'}</li>
              <li>• <code>Context</code> — {language === 'pt' ? 'State, Theme, Language separados' : 'Separate State, Theme, Language contexts'}</li>
              <li>• <code>useCallback</code> — {language === 'pt' ? 'Funções estáveis entre renders' : 'Stable functions between renders'}</li>
            </ul>
          </div>
        </div>
      )}

      {}
      {!isTauri && (
        <div className={cn(
          'border-2 rounded-xl p-4',
          theme === 'dark'
            ? 'bg-gradient-to-r from-blue-900/30 to-blue-800/30 border-blue-600'
            : 'bg-gradient-to-r from-[#e3f2fd] to-[#bbdefb] border-[#1976d2]'
        )}>
          <h3 className={cn(
            'text-xl font-bold mb-3',
            theme === 'dark' ? 'text-blue-400' : 'text-[#1976d2]'
          )}>
            🌐 {language === 'pt'
              ? 'Versão Web — Como funciona'
              : 'Web Version — How it works'}
          </h3>
          <div className={cn('text-base space-y-2', theme === 'dark' ? 'text-gray-300' : '')}>
            <ul className="ml-4 space-y-1">
              <li>• {language === 'pt'
                ? 'Configure seu mod de áudio diretamente no navegador'
                : 'Configure your audio mod directly in the browser'}</li>
              <li>• {language === 'pt'
                ? 'Adicione arquivos OGG Vorbis arrastando ou selecionando'
                : 'Add OGG Vorbis files by dragging or selecting'}</li>
              <li>• {language === 'pt'
                ? 'Baixe o mod pronto como ZIP ao finalizar'
                : 'Download the finished mod as a ZIP when done'}</li>
              <li>• {language === 'pt'
                ? 'Nenhuma instalação necessária!'
                : 'No installation needed!'}</li>
            </ul>
            <p className={cn('mt-3 text-sm italic', theme === 'dark' ? 'text-gray-400' : 'text-gray-600')}>
              💡 {language === 'pt'
                ? 'Para recursos avançados (file watcher, validação Rust, etc), baixe a versão Desktop.'
                : 'For advanced features (file watcher, Rust validation, etc), download the Desktop version.'}
            </p>
          </div>
        </div>
      )}

      {}
      <div className={cn(
        'border-2 rounded-xl p-4',
        theme === 'dark'
          ? 'bg-gradient-to-r from-green-900/30 to-green-800/30 border-green-600'
          : 'bg-gradient-to-r from-[#e8f5e9] to-[#f1f8e9] border-[#56a037]'
      )}>
        <h3 className={cn(
          'text-xl font-bold mb-3',
          theme === 'dark' ? 'text-green-400' : 'text-[#56a037]'
        )}>
          📁 {language === 'pt' ? 'Estrutura do Mod Gerado' : 'Generated Mod Structure'}
        </h3>
        <div className={styles.tree}>
          <div><span className="text-[#87ceeb]">📂 [CP] MeuModDeAudio/</span></div>
          <div>├── <span className="text-[#98fb98]">📄 manifest.json</span></div>
          <div>├── <span className="text-[#98fb98]">📄 content.json</span></div>
          <div>├── <span className="text-[#87ceeb]">📂 i18n/</span></div>
          <div>│   └── <span className="text-[#98fb98]">📄 default.json</span></div>
          <div>└── <span className="text-[#87ceeb]">📂 assets/</span></div>
          <div>    ├── <span className="text-[#98fb98]">🎵 musica1.ogg</span></div>
          <div>    └── <span className="text-[#98fb98]">🎵 musica2.ogg</span></div>
        </div>
      </div>

      {}
      <div className={styles.box}>
        <h3 className={styles.head}>
          📋 {language === 'pt' ? 'Formato JSON (SDV 1.6+)' : 'JSON Format (SDV 1.6+)'}
        </h3>
        <pre className={styles.pre}>{`{
  "Action": "EditData",
  "Target": "Data/AudioChanges",
  "Entries": {
    "MeuAudio": {
      "Id": "MeuAudio",
      "Category": "Music",
      "FilePaths": [
        "{{AbsoluteFilePath: assets/arquivo.ogg}}"
      ],
      "StreamedVorbis": true,
      "Looped": true
    }
  }
}`}</pre>
      </div>

      {}
      <div className={styles.box}>
        <h3 className={styles.head}>
          ⚠️ {language === 'pt' ? 'Requisitos' : 'Requirements'}
        </h3>
        <ul className={cn(styles.text, 'list-disc list-inside space-y-1')}>
          <li><strong>SMAPI</strong> — Mod loader</li>
          <li><strong>Content Patcher</strong></li>
          <li>
            <strong>OGG Vorbis</strong> — {language === 'pt' ? 'NÃO use Opus!' : "DON'T use Opus!"}
          </li>
          <li><strong>SDV 1.6+</strong></li>
        </ul>
      </div>

      {}
      {}
      {}
      <div className={styles.box}>
        <h3 className={styles.head}>
          ⌨️ {language === 'pt' ? 'Atalhos de Teclado' : 'Keyboard Shortcuts'}
        </h3>
        <div className={cn(styles.text, 'space-y-1')}>
          <p><code className={styles.code}>Ctrl+1-4</code> — Tabs</p>
          <p><code className={styles.code}>Ctrl+S</code> — {language === 'pt' ? 'Salvar projeto' : 'Save project'}</p>
          <p><code className={styles.code}>Ctrl+O</code> — {language === 'pt' ? 'Abrir projeto' : 'Open project'}</p>
        </div>
      </div>

      {}
      <div className={styles.box}>
        <h3 className={styles.head}>
          💾 {language === 'pt' ? 'Sobre' : 'About'}
        </h3>
        <div className={styles.text}>
          <strong>Stardew Audio Mod Generator v3.0</strong><br />
          • By: Kazinhols<br />
          {isTauri ? (
            <>
              • 🦀 Tauri 2 (Rust backend) + ⚛️ React 19 (UI)<br />
              • {language === 'pt' ? 'Immer para estado imutável' : 'Immer for immutable state'}<br />
              • {language === 'pt' ? 'Code splitting com React.lazy' : 'Code splitting with React.lazy'}<br />
              • {language === 'pt' ? 'Error Boundary para resiliência' : 'Error Boundary for resilience'}<br />
              • ~5MB {language === 'pt' ? 'instalado' : 'installed'} (vs ~150MB Electron)
            </>
          ) : (
            <>
              • ⚛️ React 19<br />
              • {language === 'pt'
                ? 'Funciona 100% no navegador — sem instalação'
                : 'Works 100% in the browser — no installation'}<br />
              • {language === 'pt'
                ? 'Versão Desktop disponível com recursos extras'
                : 'Desktop version available with extra features'}
            </>
          )}
        </div>
      </div>
    </div>
  );
});