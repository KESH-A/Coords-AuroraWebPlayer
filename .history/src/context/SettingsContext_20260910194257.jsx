import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export const PRESET_COLORS = [
  { name: 'Purple', hex: '#9333ea' },
  { name: 'Blue', hex: '#2563eb' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Rose', hex: '#f43f5e' },
  { name: 'Amber', hex: '#f59e0b' },
];

export const PRESET_TEXT_COLORS = [
  { name: 'White', hex: '#ffffff' },
  { name: 'Slate', hex: '#cbd5e1' },
  { name: 'Amber', hex: '#fef3c7' },
];

export const PRESET_GRADIENTS = [
  { name: 'Sunset', colors: ['#ff512f', '#dd2476'] },
  { name: 'Ocean', colors: ['#2b5876', '#4e4376'] },
  { name: 'Neon', colors: ['#00f2fe', '#4facfe'] },
  { name: 'Lush', colors: ['#11998e', '#38ef7d'] },
];

export const PRESET_VISUALIZER_COLORS = [
  { name: 'Accent', value: 'accent' },
  { name: 'Live RGB', value: 'rgb-cycle' },
  { name: 'Rainbow', value: 'rainbow' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Green', value: '#10b981' },
];

export const SettingsProvider = ({ children }) => {
  // LocalStorage Helper
  const getInitial = (key, fallback) => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : fallback;
    } catch {
      return fallback;
    }
  };

  // State Definitions
  const [themeStyle, setThemeStyle] = useState(() => getInitial('themeStyle', 'glass'));
  const [accentColor, setAccentColor] = useState(() => getInitial('accentColor', '#9333ea'));
  const [textColor, setTextColor] = useState(() => getInitial('textColor', '#ffffff'));
  const [gradientColors, setGradientColors] = useState(() => getInitial('gradientColors', ['#9333ea', '#3b82f6']));
  const [scrollAnimation, setScrollAnimation] = useState(() => getInitial('scrollAnimation', 'slide-up'));
  const [loadingAnimVariant, setLoadingAnimVariant] = useState(() => getInitial('loadingAnimVariant', 'shimmer-wave'));
  const [audioPreloading, setAudioPreloading] = useState(() => getInitial('audioPreloading', true));
  const [fadeIn, setFadeIn] = useState(() => getInitial('fadeIn', true));
  const [crossfadeDuration, setCrossfadeDuration] = useState(() => getInitial('crossfadeDuration', 2));
  const [visualizer, setVisualizer] = useState(() => getInitial('visualizer', true));
  const [visualizerStyle, setVisualizerStyle] = useState(() => getInitial('visualizerStyle', 'bars'));
  const [visualizerColor, setVisualizerColor] = useState(() => getInitial('visualizerColor', 'accent'));
  const [dynamicCanvasBg, setDynamicCanvasBg] = useState(() => getInitial('dynamicCanvasBg', false));
  const [lockScreenControls, setLockScreenControls] = useState(() => getInitial('lockScreenControls', true));

  // LocalStorage Save Effects
  useEffect(() => localStorage.setItem('themeStyle', JSON.stringify(themeStyle)), [themeStyle]);
  useEffect(() => localStorage.setItem('accentColor', JSON.stringify(accentColor)), [accentColor]);
  useEffect(() => localStorage.setItem('textColor', JSON.stringify(textColor)), [textColor]);
  useEffect(() => localStorage.setItem('gradientColors', JSON.stringify(gradientColors)), [gradientColors]);
  useEffect(() => localStorage.setItem('scrollAnimation', JSON.stringify(scrollAnimation)), [scrollAnimation]);
  useEffect(() => localStorage.setItem('loadingAnimVariant', JSON.stringify(loadingAnimVariant)), [loadingAnimVariant]);
  useEffect(() => localStorage.setItem('audioPreloading', JSON.stringify(audioPreloading)), [audioPreloading]);
  useEffect(() => localStorage.setItem('fadeIn', JSON.stringify(fadeIn)), [fadeIn]);
  useEffect(() => localStorage.setItem('crossfadeDuration', JSON.stringify(crossfadeDuration)), [crossfadeDuration]);
  useEffect(() => localStorage.setItem('visualizer', JSON.stringify(visualizer)), [visualizer]);
  useEffect(() => localStorage.setItem('visualizerStyle', JSON.stringify(visualizerStyle)), [visualizerStyle]);
  useEffect(() => localStorage.setItem('visualizerColor', JSON.stringify(visualizerColor)), [visualizerColor]);
  useEffect(() => localStorage.setItem('dynamicCanvasBg', JSON.stringify(dynamicCanvasBg)), [dynamicCanvasBg]);
  useEffect(() => localStorage.setItem('lockScreenControls', JSON.stringify(lockScreenControls)), [lockScreenControls]);

  // LIVE ACCENT COLOR DÖNGÜSÜ (CSS Variable Update)
  useEffect(() => {
    let animId;
    let phase = 0;

    if (accentColor === 'rgb-cycle') {
      const updateLiveColor = () => {
        // ~2.5 saniyelik pürüzsüz (smooth) renk akışı hızı
        phase += 0.008; 
        const hue = (phase * 180) % 360;
        const liveColor = `hsl(${hue}, 85%, 60%)`;
        
        document.documentElement.style.setProperty('--accent-color', liveColor);
        animId = requestAnimationFrame(updateLiveColor);
      };

      updateLiveColor();
    } else {
      document.documentElement.style.setProperty('--accent-color', accentColor);
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [accentColor]);

  // Dynamic Text Color CSS Variable Injection
  useEffect(() => {
    document.documentElement.style.setProperty('--text-color', textColor);
  }, [textColor]);

  return (
    <SettingsContext.Provider
      value={{
        themeStyle,
        setThemeStyle,
        accentColor,
        setAccentColor,
        textColor,
        setTextColor,
        gradientColors,
        setGradientColors,
        scrollAnimation,
        setScrollAnimation,
        loadingAnimVariant,
        setLoadingAnimVariant,
        audioPreloading,
        setAudioPreloading,
        fadeIn,
        setFadeIn,
        crossfadeDuration,
        setCrossfadeDuration,
        visualizer,
        setVisualizer,
        visualizerStyle,
        setVisualizerStyle,
        visualizerColor,
        setVisualizerColor,
        dynamicCanvasBg,
        setDynamicCanvasBg,
        lockScreenControls,
        setLockScreenControls,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};