import React from 'react';
import { useSettings, PRESET_COLORS, PRESET_TEXT_COLORS, PRESET_GRADIENTS, PRESET_VISUALIZER_COLORS } from '../../context/SettingsContext';
import { X, Sliders, Sparkles, Palette, Pipette, FolderPlus, Type, Smartphone, Zap, Activity, PaintBucket, Layers, BarChart3, Circle, Waves, RefreshCw } from 'lucide-react';

export const SettingsModal = ({ isOpen, onClose, onFolderSelect, isLoading, isImporting }) => {
  const {
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
    fadeIn,
    setFadeIn,
    visualizer,
    setVisualizer,
    gradientColors,
    setGradientColors,
    dynamicCanvasBg,
    setDynamicCanvasBg,
    visualizerStyle,
    setVisualizerStyle,
    visualizerColor,
    setVisualizerColor,
    loadingAnimVariant,
    setLoadingAnimVariant,
  } = useSettings();

  if (!isOpen) return null;

  const getAccentStyle = () => {
    if (accentColor === 'rgb-cycle') {
      return { background: 'linear-gradient(90deg, #ff0000, #00ff00, #0000ff, #ff0000)', backgroundSize: '200% 200%' };
    }
    if (themeStyle === 'gradient' && gradientColors && gradientColors.length >= 2) {
      return { background: `linear-gradient(135deg, ${gradientColors[0]}, ${gradientColors[1]})` };
    }
    return { backgroundColor: accentColor };
  };

  const getAccentColorOnly = () => {
    if (accentColor === 'rgb-cycle') return '#ec4899';
    if (themeStyle === 'gradient' && gradientColors && gradientColors.length >= 2) {
      return gradientColors[0];
    }
    return accentColor;
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-6" 
      onClick={onClose}
    >
      <div 
        className="relative glass rounded-3xl w-full max-w-md p-6 border border-white/15 shadow-2xl shadow-black/60 flex flex-col max-h-[85vh]" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5" style={{ color: getAccentColorOnly() }} />
            <h2 className="text-lg font-bold" style={{ color: textColor }}>Settings</h2>
          </div>
          <button 
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors" 
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-6 overflow-y-auto pt-4 pr-1 no-scrollbar flex-1">
          {/* Music Library */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <FolderPlus className="w-4 h-4" style={{ color: getAccentColorOnly() }} /> Music Library
            </label>
            <label
              className="w-full py-3 rounded-2xl text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg active:scale-95 hover:opacity-90"
              style={getAccentStyle()}
              onClick={(e) => { e.stopPropagation(); document.getElementById('folder-input')?.click(); }}
            >
              <FolderPlus className="w-4 h-4" />
              {(isLoading || isImporting) ? 'Loading...' : 'Import Music'}
            </label>
            <input
              type="file"
              id="folder-input"
              webkitdirectory="true"
              directory=""
              multiple
              accept="audio/*"
              className="hidden"
              onChange={onFolderSelect}
            />
          </div>

          {/* Theme Appearance */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Palette className="w-4 h-4" style={{ color: getAccentColorOnly() }} /> Theme Appearance
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['glass', 'transparent', 'gradient'].map((style) => (
                <button
                  key={style}
                  onClick={() => setThemeStyle(style)}
                  className={`py-2 px-3 rounded-xl text-xs font-medium border capitalize transition-all ${
                    themeStyle === style ? 'bg-white/20 border-white/40 text-white shadow-md' : 'bg-white/5 border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          {/* Accent Color */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Palette className="w-4 h-4" style={{ color: getAccentColorOnly() }} /> Accent Color
            </label>
            {themeStyle === 'gradient' ? (
              <div className="grid grid-cols-2 gap-2">
                {PRESET_GRADIENTS.map((g) => (
                  <button
                    key={g.name}
                    onClick={() => setGradientColors(g.colors)}
                    className={`h-9 rounded-xl transition-all border-2 flex items-center justify-center gap-2 ${
                      JSON.stringify(gradientColors) === JSON.stringify(g.colors) ? 'border-white scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                    style={{ background: `linear-gradient(135deg, ${g.colors[0]}, ${g.colors[1]})` }}
                  >
                    <span className="text-[10px] font-bold text-white drop-shadow-lg">{g.name}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    onClick={() => setAccentColor(c.hex)}
                    className={`h-9 rounded-xl transition-all border-2 ${
                      accentColor === c.hex ? 'border-white scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}

                {/* Live RGB Cycle */}
                <button
                  onClick={() => setAccentColor('rgb-cycle')}
                  className={`h-9 rounded-xl transition-all border-2 flex items-center justify-center ${
                    accentColor === 'rgb-cycle' ? 'border-white scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                  style={{ background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }}
                  title="Live Animated RGB"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-white animate-spin" />
                </button>

                {/* Custom Pipette */}
                <label className="h-9 rounded-xl border border-dashed border-white/30 flex items-center justify-center gap-1 cursor-pointer bg-white/5 hover:bg-white/10 transition-all">
                  <Pipette className="w-3.5 h-3.5 text-slate-300" />
                  <input
                    type="color"
                    value={accentColor.startsWith('#') ? accentColor : '#9333ea'}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-0 h-0 opacity-0 pointer-events-none"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Text Color */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Type className="w-4 h-4" style={{ color: getAccentColorOnly() }} /> Text Color
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_TEXT_COLORS.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => setTextColor(c.hex)}
                  className={`h-9 rounded-xl transition-all border-2 ${
                    textColor === c.hex ? 'border-white scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
              <label className="h-9 rounded-xl border border-dashed border-white/30 flex items-center justify-center gap-1 cursor-pointer bg-white/5 hover:bg-white/10 transition-all">
                <Pipette className="w-3.5 h-3.5 text-slate-300" />
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="w-0 h-0 opacity-0 pointer-events-none"
                />
              </label>
            </div>
          </div>

          {/* Visualizer Style */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4" style={{ color: getAccentColorOnly() }} /> Visualizer Style
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'bars', label: 'Bars', icon: BarChart3, desc: 'Spectrum' },
                { id: 'circular', label: 'Circular', icon: Circle, desc: 'Beat Ring' },
                { id: 'fluid', label: 'Fluid', icon: Waves, desc: 'Particle Wave' },
              ].map(({ id, label, icon: Icon, desc }) => (
                <button
                  key={id}
                  onClick={() => setVisualizerStyle(id)}
                  className="flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all text-xs"
                  style={{
                    backgroundColor: visualizerStyle === id ? getAccentColorOnly() + '30' : 'rgba(255,255,255,0.05)',
                    borderColor: visualizerStyle === id ? getAccentColorOnly() : 'rgba(255,255,255,0.1)',
                    color: visualizerStyle === id ? '#fff' : 'rgba(255,255,255,0.5)',
                  }}
                >
                  <Icon className="w-5 h-5" style={{ color: visualizerStyle === id ? getAccentColorOnly() : 'inherit' }} />
                  <span className="font-bold">{label}</span>
                  <span className="text-[10px] opacity-60">{desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Visualizer Color */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <PaintBucket className="w-4 h-4" style={{ color: getAccentColorOnly() }} /> Visualizer Color
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {PRESET_VISUALIZER_COLORS.map(({ name, value }) => (
                <button
                  key={name}
                  onClick={() => setVisualizerColor(value)}
                  className="w-7 h-7 rounded-full border-2 transition-all hover:scale-110 active:scale-95 flex items-center justify-center overflow-hidden"
                  style={{
                    backgroundColor: value === 'accent' ? getAccentColorOnly()
                      : value === 'rainbow' || value === 'rgb-cycle' ? 'transparent'
                      : value,
                    borderColor: visualizerColor === value ? '#fff' : 'rgba(255,255,255,0.2)',
                    boxShadow: visualizerColor === value ? `0 0 8px ${getAccentColorOnly()}40` : undefined,
                  }}
                  title={name}
                >
                  {value === 'rainbow' && (
                    <div className="w-full h-full rounded-full"
                      style={{ background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }} />
                  )}
                  {value === 'rgb-cycle' && (
                    <div className="w-full h-full rounded-full flex items-center justify-center"
                      style={{ background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }}>
                      <RefreshCw className="w-3 h-3 text-white animate-spin" />
                    </div>
                  )}
                </button>
              ))}

              <label 
                className="w-7 h-7 rounded-full border-2 border-dashed border-white/40 flex items-center justify-center cursor-pointer bg-white/5 hover:bg-white/10 transition-all hover:scale-110 active:scale-95"
                title="Custom Color"
              >
                <Pipette className="w-3.5 h-3.5 text-slate-200" />
                <input
                  type="color"
                  value={visualizerColor.startsWith('#') ? visualizerColor : '#06b6d4'}
                  onChange={(e) => setVisualizerColor(e.target.value)}
                  className="w-0 h-0 opacity-0 pointer-events-none"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};