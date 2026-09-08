import React, { createContext, useContext, useState } from 'react';

const SettingsContext = createContext(null);

export const PRESET_COLORS = [
  { name: 'Purple', hex: '#9333ea' },
  { name: 'Cyan', hex: '#06b6d4' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Crimson', hex: '#e11d48' },
  { name: 'Sunset', hex: '#f97316' },
  { name: 'Blue', hex: '#2563eb' },
];

export const PRESET_TEXT_COLORS = [
  { name: 'White', hex: '#f8fafc' },
  { name: 'Warm', hex: '#fef3c7' },
  { name: 'Slate', hex: '#cbd5e1' },
  { name: 'Silver', hex: '#e2e8f0' },
  { name: 'Soft', hex: '#f1f5f9' },
  { name: 'Azure', hex: '#bfdbfe' },
];

export const SettingsProvider = ({ children }) => {
  const [scrollAnimation, setScrollAnimation] = useState('slide-up');
  const [themeStyle, setThemeStyle] = useState('glass');
  const [accentColor, setAccentColor] = useState(PRESET_COLORS[0].hex);
  const [textColor, setTextColor] = useState('#f8fafc');
  const [lockScreenControls, setLockScreenControls] = useState(true);
  const [audioPreloading, setAudioPreloading] = useState(true);
  const [crossfadeDuration, setCrossfadeDuration] = useState(5);
  const [fadeInTime, setFadeInTime] = useState(1.5);

  return (
    <SettingsContext.Provider
      value={{
        scrollAnimation,
        setScrollAnimation,
        themeStyle,
        setThemeStyle,
        accentColor,
        setAccentColor,
        textColor,
        setTextColor,
        lockScreenControls,
        setLockScreenControls,
        audioPreloading,
        setAudioPreloading,
        crossfadeDuration,
        setCrossfadeDuration,
        fadeInTime,
        setFadeInTime,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
