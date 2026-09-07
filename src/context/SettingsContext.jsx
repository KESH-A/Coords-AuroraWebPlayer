import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext(null);

export const THEME_PRESETS = [
  { name: 'Neon Purple', primary: '#8b5cf6', accent: '#ec4899', bg: '#0f172a' },
  { name: 'Cyberpunk Cyan', primary: '#06b6d4', accent: '#f43f5e', bg: '#082f49' },
  { name: 'Emerald Glass', primary: '#10b981', accent: '#3b82f6', bg: '#022c22' },
  { name: 'Sunset Amber', primary: '#f59e0b', accent: '#ef4444', bg: '#1c1917' },
];

export const SettingsProvider = ({ children }) => {
  const [theme, setTheme] = useState(THEME_PRESETS[0]);
  const [glassStyle, setGlassStyle] = useState('glass-surface');
  const [animSpeed, setAnimSpeed] = useState(0.5);
  const [fadeInTime, setFadeInTime] = useState(2);
  const [scrollAnimation, setScrollAnimation] = useState('scale');

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', theme.primary);
    root.style.setProperty('--accent-color', theme.accent);
    root.style.setProperty('--bg-base', theme.bg);
    root.style.setProperty('--anim-speed', `${animSpeed}s`);
  }, [theme, animSpeed]);

  return (
    <SettingsContext.Provider
      value={{
        theme,
        setTheme,
        glassStyle,
        setGlassStyle,
        animSpeed,
        setAnimSpeed,
        fadeInTime,
        setFadeInTime,
        scrollAnimation,
        setScrollAnimation,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);