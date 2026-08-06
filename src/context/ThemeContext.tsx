import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

interface ThemeContextType {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userProfile, updateProfileData } = useAuth();
  
  const [theme, setThemeState] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('pak_theme_pref');
    if (saved === 'light' || saved === 'dark') return saved;
    return 'dark';
  });

  // Listen to window storage events for cross-tab persistence
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'pak_theme_pref' && (e.newValue === 'light' || e.newValue === 'dark')) {
        setThemeState(e.newValue);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Sync theme with user profile if available
  useEffect(() => {
    if (userProfile?.themePreference) {
      if (userProfile.themePreference !== theme) {
        setThemeState(userProfile.themePreference);
        localStorage.setItem('pak_theme_pref', userProfile.themePreference);
      }
    }
  }, [userProfile?.themePreference]);

  // Apply root element class
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem('pak_theme_pref', theme);
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setThemeState(nextTheme);
    localStorage.setItem('pak_theme_pref', nextTheme);
    if (userProfile) {
      updateProfileData({ themePreference: nextTheme }).catch((err) => {
        console.error('Error saving theme preference:', err);
      });
    }
  };

  const setTheme = (newTheme: 'dark' | 'light') => {
    setThemeState(newTheme);
    localStorage.setItem('pak_theme_pref', newTheme);
    if (userProfile) {
      updateProfileData({ themePreference: newTheme }).catch((err) => {
        console.error('Error saving theme preference:', err);
      });
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
