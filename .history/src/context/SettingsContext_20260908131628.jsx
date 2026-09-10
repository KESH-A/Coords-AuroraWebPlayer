import React from 'react';
import { useSettings, PRESET_COLORS, PRESET_TEXT_COLORS } from '../../context/SettingsContext';

export const SettingsModal = ({ isOpen, onClose }) => {
  const {
    scrollAnimation,
    setScrollAnimation,
    themeStyle,
    setThemeStyle,
    accentColor,
    setAccentColor,
    activeColor = accentColor,
    setActiveColor = setAccentColor,
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
  } = useSettings();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="relative w-full max-w-lg p-6 overflow-hidden rounded-3xl glass border border-white/10 shadow-2xl space-y-6 text-white max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <h2 className="text-xl font-bold tracking-wide">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Theme & Accent Color */}
        <div className="space-y-3">
          <label className="text-sm font-semibold opacity-80">Accent Color</label>
          <div className="grid grid-cols-6 gap-2">
            {PRESET_COLORS.map((color) => (
              <button
                key={color.hex}
                onClick={() => {
                  setAccentColor(color.hex);
                  if (setActiveColor) setActiveColor(color.hex);
                }}
                className={`h-10 rounded-xl border-2 transition-all ${
                  (activeColor || accentColor) === color.hex
                    ? 'border-white scale-110 shadow-lg'
                    : 'border-transparent opacity-70 hover:opacity-100'
                }`}
                style={{ backgroundColor: color.hex }}
              />
            ))}
          </div>
        </div>

        {/* Text Color */}
        <div className="space-y-3">
          <label className="text-sm font-semibold opacity-80">Text Accent Color</label>
          <div className="grid grid-cols-6 gap-2">
            {PRESET_TEXT_COLORS.map((color) => (
              <button
                key={color.hex}
                onClick={() => setTextColor(color.hex)}
                className={`h-10 rounded-xl border-2 transition-all ${
                  textColor === color.hex
                    ? 'border-white scale-110 shadow-lg'
                    : 'border-transparent opacity-70 hover:opacity-100'
                }`}
                style={{ backgroundColor: color.hex }}
              />
            ))}
          </div>
        </div>

        {/* Crossfade Duration */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-semibold">
            <span className="opacity-80">Crossfade Duration</span>
            <span style={{ color: activeColor || accentColor }}>{crossfadeDuration}s</span>
          </div>
          <input
            type="range"
            min="0"
            max="12"
            step="0.5"
            value={crossfadeDuration}
            onChange={(e) => setCrossfadeDuration(parseFloat(e.target.value))}
            className="w-full accent-purple-500 cursor-pointer"
          />
        </div>

        {/* Fade-in Time */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-semibold">
            <span className="opacity-80">Fade-In Duration</span>
            <span style={{ color: activeColor || accentColor }}>{fadeInTime}s</span>
          </div>
          <input
            type="range"
            min="0"
            max="5"
            step="0.1"
            value={fadeInTime}
            onChange={(e) => setFadeInTime(parseFloat(e.target.value))}
            className="w-full accent-purple-500 cursor-pointer"
          />
        </div>

        {/* Toggles */}
        <div className="space-y-4 pt-2 border-t border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold opacity-80">Lock Screen Controls</span>
            <input
              type="checkbox"
              checked={lockScreenControls}
              onChange={(e) => setLockScreenControls(e.target.checked)}
              className="w-5 h-5 accent-purple-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold opacity-80">Audio Preloading</span>
            <input
              type="checkbox"
              checked={audioPreloading}
              onChange={(e) => setAudioPreloading(e.target.checked)}
              className="w-5 h-5 accent-purple-500 cursor-pointer"
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default SettingsModal;