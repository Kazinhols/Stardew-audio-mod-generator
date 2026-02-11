import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Verificação segura para ambiente browser (SSR safety)
    if (typeof window === 'undefined') return 'dark'; // Padrão Dark para app Desktop
    
    try {
      const saved = localStorage.getItem('sdv-audio-mod-theme');
      if (saved === 'light' || saved === 'dark') return saved;
      
      // Se não tiver salvo, verifica preferência do sistema
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light';
      }
    } catch (e) {
      console.warn('Theme detection error:', e);
    }
    
    return 'dark'; // Padrão Dark se nada for encontrado
  });

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('sdv-audio-mod-theme', newTheme);
      }
    } catch (e) {
      console.warn('Failed to save theme:', e);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }, [theme, setTheme]);

  // Aplica as classes e atributos ao HTML
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      
      // Remove classe anterior para evitar conflitos
      root.classList.remove('light', 'dark');
      
      // Adiciona classe atual (Tailwind darkMode: 'class')
      root.classList.add(theme);
      
      // Adiciona data-attribute (Para nossos seletores CSS customizados [data-theme='light'])
      root.setAttribute('data-theme', theme);
      
      // Opcional: define cor do background do body via style inline para evitar flash
      root.style.colorScheme = theme;
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}