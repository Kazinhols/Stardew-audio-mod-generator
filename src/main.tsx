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
    <div className="min-h-screen flex items-center justify-center p-8 bg-gray-900 text-white">
      <div className="max-w-lg w-full bg-red-900/20 border-2 border-red-500 rounded-xl p-8 text-center shadow-2xl">
        <h1 className="text-3xl font-bold text-red-400 mb-4">💥 Erro Crítico</h1>
        <div className="bg-black/50 text-left p-4 rounded text-sm font-mono overflow-auto max-h-48 mb-6 border border-red-500/30">
          {error instanceof Error ? error.message : String(error)}
        </div>
        <button
          onClick={resetErrorBoundary}
          className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded font-bold transition-all"
        >
          🔄 Tentar Novamente
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
          {}
          <AppProvider>
            <App />
          </AppProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>
);