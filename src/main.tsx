import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './App';
import { AppProvider } from './state/AppContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }: { error: unknown; resetErrorBoundary: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 night-sky">
      <div className="max-w-lg w-full bg-[#3a2518] border-4 border-[#e63e3e] rounded-xl p-8 text-center pixel-border">
        <div className="text-5xl mb-4 animate-junimo-bounce inline-block">💥</div>
        <h1 className="font-pixel text-lg text-[#e63e3e] mb-4 text-shadow-pixel">
          Critical Error!
        </h1>
        <div className="bg-black/50 text-left p-4 rounded text-sm font-mono overflow-auto max-h-48 mb-6 border-2 border-[#e63e3e]/30 text-[#ff9999]">
          {error instanceof Error ? error.message : String(error)}
        </div>
        <button
          onClick={resetErrorBoundary}
          className="pixel-btn px-6 py-3 bg-gradient-to-b from-[#e63e3e] to-[#c02020] text-white rounded-lg font-pixel text-xs border-[#901515] hover:from-[#ff4444] transition-all"
        >
          🔄 Try Again
        </button>
      </div>
    </div>
  );
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => window.location.reload()}>
      <ThemeProvider>
        <LanguageProvider>
          <AppProvider>
            <App />
          </AppProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>
);
