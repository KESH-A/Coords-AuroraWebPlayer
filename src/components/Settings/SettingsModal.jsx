import React, { useState, useEffect } from 'react';
import { useSettings, PRESET_COLORS } from '../../context/SettingsContext';
import { X, Sliders, Eye, Waves, Sparkles, Palette, FolderPlus, Pipette } from 'lucide-react';

export const SettingsModal = ({ isOpen, onClose, onFolderSelect, isLoading }) => {
  const {
    scrollAnimation,
    setScrollAnimation,
    themeStyle,
    setThemeStyle,
    accentColor,
    setAccentColor,
    fadeInTime,
    setFadeInTime,
  } = useSettings();

  const [shouldRender, setShouldRender] = useState(isOpen);
  const [animationClass, setAnimationClass] = useState('animate-morph-translate');

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setAnimationClass('animate-morph-translate');
    } else if (shouldRender) {
      setAnimationClass('animate-popup-exit');
      const timer = setTimeout(() => setShouldRender(false), 380);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  const containerStyle = themeStyle === 'glass'
    ? 'glass-modal shadow-2xl border-white/15'
    : 'bg-[#0d111d]/90 border-white/10 shadow-none';

  return (
    <>
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 glass-overlay">
        {/* Morph & Translate Animasyonlu Ana Konteyner */}
        <div className={`relative w-full max-w-md rounded-3xl p-6 text-white border transition-all duration-400 backdrop-blur-2xl ${containerStyle} ${animationClass}`}>
          
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5" style={{ color: accentColor }} />
              <h2 className="text-lg font-bold">Settings</h2>
            </div>
            <button onClick={onClose} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6 max-h-[60vh] overflow-y-auto px-1 py-1 custom-scrollbar">
            {/* Music Library Import */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <FolderPlus className="w-4 h-4" style={{ color: accentColor }} /> Music Library
              </label>
              <label
                className="w-full py-3 rounded-2xl text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg active:scale-98"
                style={{ backgroundColor: accentColor }}
              >
                <FolderPlus className="w-4 h-4" />
                <span>Import Music Folder</span>
                <input
                  type="file"
                  webkitdirectory="true"
                  directory="true"
                  multiple
                  onChange={(e) => {
                    if (onFolderSelect) onFolderSelect(e);
                    onClose();
                  }}
                  className="hidden"
                />
              </label>
            </div>

            {/* Accent Color Presets */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Palette className="w-4 h-4" style={{ color: accentColor }} /> Accent Color Presets
              </label>
              <div className="grid grid-cols-4 gap-2">
                {PRESET_COLORS.map((p) => {
                  const isSelected = accentColor.toLowerCase() === p.hex.toLowerCase();
                  return (
                    <button
                      key={p.hex}
                      onClick={() => setAccentColor(p.hex)}
                      className={`h-10 rounded-xl flex items-center justify-center text-[11px] font-bold transition-all border ${
                        isSelected ? 'border-2 border-white scale-100' : 'border-white/10 opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: p.hex }}
                    >
                      <span>{p.name}</span>
                    </button>
                  );
                })}

                <label className="h-10 rounded-xl border border-dashed border-white/30 flex items-center justify-center gap-1 cursor-pointer bg-white/5 hover:bg-white/10 transition-all">
                  <Pipette className="w-3.5 h-3.5 text-slate-300" />
                  <span className="text-[10px] font-bold text-slate-300">Custom</span>
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-0 h-0 opacity-0 pointer-events-none"
                  />
                </label>
              </div>
            </div>

            {/* Interface Style */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Eye className="w-4 h-4" style={{ color: accentColor }} /> Interface Style
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 rounded-2xl border border-white/5">
                <button
                  onClick={() => setThemeStyle('glass')}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    themeStyle === 'glass' ? 'bg-white/20 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Glass (Low Blur)
                </button>
                <button
                  onClick={() => setThemeStyle('transparent')}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    themeStyle === 'transparent' ? 'bg-white/20 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Transparent
                </button>
              </div>
            </div>

            {/* List Scroll Animation */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" style={{ color: accentColor }} /> List Scroll Animation
              </label>
              <select
                value={scrollAnimation}
                onChange={(e) => setScrollAnimation(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 text-xs text-white focus:outline-none"
              >
                <option value="slide-up" className="bg-slate-900">Slide Up</option>
                <option value="slide-down" className="bg-slate-900">Slide Down</option>
                <option value="slide-left" className="bg-slate-900">Slide Left</option>
                <option value="slide-right" className="bg-slate-900">Slide Right</option>
                <option value="scale" className="bg-slate-900">Scale</option>
                <option value="morph" className="bg-slate-900">Morph</option>
                <option value="fade" className="bg-slate-900">Fade</option>
              </select>
            </div>

            {/* Fade-In Speed */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Waves className="w-4 h-4" style={{ color: accentColor }} /> Fade-In Speed ({fadeInTime}s)
              </label>
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={fadeInTime}
                onChange={(e) => setFadeInTime(Number(e.target.value))}
                className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer"
                style={{ accentColor }}
              />
            </div>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center glass-overlay">
          <div className="p-8 rounded-3xl glass-modal flex flex-col items-center gap-4 shadow-2xl">
            <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
            <p className="text-xs font-semibold text-slate-300">Müzikler Yükleniyor...</p>
          </div>
        </div>
      )}
    </>
  );
};