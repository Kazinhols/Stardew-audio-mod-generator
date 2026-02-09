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
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: '#3d2817' }}>
      <div className="max-w-lg w-full bg-[#f8ecc2] border-4 border-[#8b4513] rounded-2xl p-8 text-center">
        <h1 className="text-3xl text-[#e63e3e] mb-4">💥 Something went wrong</h1>
        <pre className="text-left text-sm bg-gray-900 text-red-400 p-4 rounded-lg mb-4 overflow-auto max-h-48">
          {error instanceof Error ? error.message : String(error)}
        </pre>
        <button
          onClick={resetErrorBoundary}
          className="px-6 py-3 bg-[#e07020] text-white rounded-lg text-xl hover:brightness-110 transition-all"
        >
          🔄 Try Again
        </button>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
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
