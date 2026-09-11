import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export const PRESET_COLORS = [
  { name: 'Purple', hex: '#9333ea' },
  { name: 'Blue', hex: '#2563eb' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Rose', hex: '#f43f5e' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Live RGB', hex: 'rgb-cycle' },
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
  { name: 'White', value: '#ffffff' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Green', value: '#10b981' },
];

export const SettingsProvider = ({ children }) => {
  const getInitial = (key, fallback) => {
    try {
      const saved = localStorage.getItem(key);
      return saved !== null ? JSON.parse(saved) : fallback;
    } catch {
      return fallback;
    }
  };

  const [themeStyle, setThemeStyle] = useState(() => getInitial('themeStyle', 'glass'));
  const [accentColor, setAccentColor] = useState(() => getInitial('accentColor', '#9333ea'));
  const [textColor, setTextColor] = useState(() => getInitial('textColor', '#ffffff'));
  const [gradientColors, setGradientColors] = useState(() => getInitial('gradientColors', ['#9333ea', '#3b82f6']));
  const [bgEffectMode, setBgEffectMode] = useState(() => getInitial('bgEffectMode', 'stars'));
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

  // LocalStorage Otomatik Güncelleme Entegrasyonu
  useEffect(() => localStorage.setItem('themeStyle', JSON.stringify(themeStyle)), [themeStyle]);
  useEffect(() => localStorage.setItem('accentColor', JSON.stringify(accentColor)), [accentColor]);
  useEffect(() => localStorage.setItem('textColor', JSON.stringify(textColor)), [textColor]);
  useEffect(() => localStorage.setItem('gradientColors', JSON.stringify(gradientColors)), [gradientColors]);
  useEffect(() => localStorage.setItem('bgEffectMode', JSON.stringify(bgEffectMode)), [bgEffectMode]);
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

  // HSL'den RGB Hex / RGBA dönüştürme yardımcısı
  const hslToRgb = (h, s, l) => {
    s /= 100;
    l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    const r = Math.round(255 * f(0));
    const g = Math.round(255 * f(8));
    const b = Math.round(255 * f(4));
    return `${r}, ${g}, ${b}`;
  };

  // Dinamik CSS Variable Enjeksiyonu (Accent & Live RGB)
  useEffect(() => {
    let animId;
    let phase = 0;

    if (accentColor === 'rgb-cycle') {
      const updateLiveColor = () => {
        phase += 0.005;
        const hue = (phase * 180) % 360;
        const liveColor = `hsl(${hue}, 85%, 60%)`;
        const rgbVals = hslToRgb(hue, 85, 60);

        document.documentElement.style.setProperty('--accent-color', liveColor);
        document.documentElement.style.setProperty('--accent-color-rgb', rgbVals);
        animId = requestAnimationFrame(updateLiveColor);
      };
      updateLiveColor();
    } else {
      document.documentElement.style.setProperty('--accent-color', accentColor);
      
      let hex = accentColor.replace('#', '');
      if (hex.length === 3) hex = hex.split('').map(x => x + x).join('');
      if (hex.length === 6) {
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        document.documentElement.style.setProperty('--accent-color-rgb', `${r}, ${g}, ${b}`);
      }
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [accentColor]);

  // Lockscreen & MediaSession Bildirim Kontrolü Senkronizasyonu
  useEffect(() => {
    if ('mediaSession' in navigator) {
      if (!lockScreenControls) {
        navigator.mediaSession.metadata = null;
        navigator.mediaSession.playbackState = 'none';
      }
    }
  }, [lockScreenControls]);

  useEffect(() => {
    document.documentElement.style.setProperty('--text-color', textColor);
  }, [textColor]);

  const addGradientColor = (color = '#ec4899') => {
    setGradientColors((prev) => (prev.length >= 5 ? prev : [...prev, color]));
  };

  const removeGradientColor = (index) => {
    setGradientColors((prev) => (prev.length <= 2 ? prev : prev.filter((_, i) => i !== index)));
  };

  const updateGradientColor = (index, newColor) => {
    setGradientColors((prev) => {
      const updated = [...prev];
      updated[index] = newColor;
      return updated;
    });
  };

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
        bgEffectMode,
        setBgEffectMode,
        addGradientColor,
        removeGradientColor,
        updateGradientColor,
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