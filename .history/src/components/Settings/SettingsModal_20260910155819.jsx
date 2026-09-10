import React, { useState, useEffect, useRef } from 'react';
import { useSettings, PRESET_COLORS, PRESET_TEXT_COLORS, PRESET_GRADIENTS, PRESET_BG_COLORS, PRESET_VISUALIZER_COLORS } from '../../context/SettingsContext';
import { X, Sliders, Sparkles, Palette, Pipette, FolderPlus, Type, Smartphone, Zap, Activity, PaintBucket, Layers, Music, BarChart3, Circle, Waves, Gamepad2 } from 'lucide-react';

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
  } = useSettings();

  const [isClosing, setIsClosing] = useState(false);
  const modalRef = useRef(null);
  const [visualizerColorPresets] = useState([
    { name: 'Accent', value: 'accent' },
    { name: 'Rainbow', value: 'rainbow' },
    { name: 'White', value: '#ffffff' },
    { name: 'Cyan', value: '#06b6d4' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Green', value: '#10b981' },
  ]);

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
  };

  const handleAnimationEnd = () => {
    if (isClosing) {
      setIsClosing(false);
      onClose();
    }
  };

  if (!isOpen && !isClosing) return null;

  const getAccentStyle = () => {
    if (themeStyle === 'gradient' && gradientColors && gradientColors.length >= 2) {
      return { background: `linear-gradient(135deg, ${gradientColors[0]}, ${gradientColors[1]})` };
    }
    return { backgroundColor: accentColor };
  };

  const getAccentColorOnly = () => {
    if (themeStyle === 'gradient' && gradientColors && gradientColors.length >= 2) {
      return gradientColors[0];
    }
    return accentColor;
  };

  const getVisualizerColorValue = () => {
    if (visualizerColor === 'accent') {
      return getAccentColorOnly();
    }
    if (typeof visualizerColor === 'string' && visualizerColor.startsWith('#')) {
      return visualizerColor;
    }
    const preset = PRESET_VISUALIZER_COLORS.find(v => v.value === visualizerColor);
    return preset && preset.hex ? preset.hex : accentColor;
  };

  const containerStyle = themeStyle === 'glass'
    ? 'glass glass-modal shadow-2xl border-white/15'
    : themeStyle === 'gradient'
      ? 'glass-modal shadow-2xl border-white/15'
      : 'theme-transparent shadow-none';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <button className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/10 backdrop-blur-lg flex items-center justify-center text-white hover:bg-white/20 transition-colors" onClick={(e) => { e.stopPropagation(); onClose(); }}>
        <X className="w-5 h-5" />
      </button>
      <div className="glass rounded-2xl w-full max-w-md p-6 border border-white/10 shadow-2xl shadow-black/40" style={{ maxHeight: 'calc(100vh - 2rem)', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5" style={{ color: getAccentColorOnly() }} />
            <h2 className="text-lg font-bold" style={{ color: textColor }}>Settings</h2>
          </div>
        </div>

        <div className="space-y-6 max-h-[60vh] overflow-y-auto px-1 py-1 no-scrollbar">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <FolderPlus className="w-4 h-4" style={{ color: getAccentColorOnly() }} /> Music Library
            </label>
            <label
              className="w-full py-3 rounded-2xl text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg active:scale-98"
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

          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Palette className="w-4 h-4" style={{ color: accentColor }} /> Theme Appearance
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setThemeStyle('glass')}
                className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all ${themeStyle === 'glass' ? 'bg-white/20 border-white/30' : 'bg-white/5 border-transparent'}`}
              >
                Glass
              </button>
              <button
                onClick={() => setThemeStyle('transparent')}
                className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all ${themeStyle === 'transparent' ? 'bg-white/20 border-white/30' : 'bg-white/5 border-transparent'}`}
              >
                Transparent
              </button>
              <button
                onClick={() => setThemeStyle('gradient')}
                className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all ${themeStyle === 'gradient' ? 'bg-white/20 border-white/30' : 'bg-white/5 border-transparent'}`}
              >
                Gradient
              </button>
            </div>
          </div>

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
                    className={`h-9 rounded-xl transition-all border-2 flex items-center justify-center gap-2 ${JSON.stringify(gradientColors) === JSON.stringify(g.colors) ? 'border-white scale-105' : 'border-transparent opacity-70 hover:opacity-100'}`}
                    style={{ background: `linear-gradient(135deg, ${g.colors[0]}, ${g.colors[1]})` }}
                  >
                    <span className="text-[10px] font-bold text-white drop-shadow-lg">{g.name}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    onClick={() => setAccentColor(c.hex)}
                    className={`h-9 rounded-xl transition-all border-2 ${accentColor === c.hex ? 'border-white scale-105' : 'border-transparent opacity-70 hover:opacity-100'}`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Type className="w-4 h-4" style={{ color: getAccentColorOnly() }} /> Text Color
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_TEXT_COLORS.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => setTextColor(c.hex)}
                  className={`h-9 rounded-xl transition-all border-2 ${textColor === c.hex ? 'border-white scale-105' : 'border-transparent opacity-70 hover:opacity-100'}`}
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

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" style={{ color: getAccentColorOnly() }} /> List Scroll Animation
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

          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Zap className="w-4 h-4" style={{ color: getAccentColorOnly() }} /> Audio Effects
            </label>
            <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-xs text-slate-300">Preload next track</span>
              <button onClick={() => setAudioPreloading(!audioPreloading)} className={`w-10 h-6 rounded-full relative transition-colors ${audioPreloading ? '' : 'bg-white/10'}`} style={{ backgroundColor: audioPreloading ? getAccentColorOnly() : undefined }}>
                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${audioPreloading ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-xs text-slate-300">Fade in</span>
              <button onClick={() => setFadeIn(!fadeIn)} className={`w-10 h-6 rounded-full relative transition-colors ${fadeIn ? '' : 'bg-white/10'}`} style={{ backgroundColor: fadeIn ? getAccentColorOnly() : undefined }}>
                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${fadeIn ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-slate-300">Crossfade</span>
                <span className="font-mono" style={{ color: getAccentColorOnly() }}>{crossfadeDuration}s</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={crossfadeDuration}
                onChange={(e) => setCrossfadeDuration(parseFloat(e.target.value))}
                className="w-full"
                style={{ accentColor: getAccentColorOnly() }}
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>0s</span>
                <span>5s</span>
                <span>10s</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Activity className="w-4 h-4" style={{ color: getAccentColorOnly() }} /> Visualizer
            </label>
            <button
              onClick={() => setVisualizer(!visualizer)}
              className={`w-10 h-6 rounded-full relative transition-colors ${visualizer ? '' : 'bg-white/10'}`}
              style={{ backgroundColor: visualizer ? getAccentColorOnly() : undefined }}
            >
              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${visualizer ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4" style={{ color: getAccentColorOnly() }} /> Visualizer Style
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'bars', label: 'Bars / Spectrum', icon: BarChart3, desc: 'Classic vertical bars' },
                { id: 'circular', label: 'Circular Beat', icon: Circle, desc: 'Pulsing ring display' },
                { id: 'fluid', label: 'Fluid Wave', icon: Waves, desc: 'Orbiting particle field' },
                { id: 'vhs', label: 'Retro VHS', icon: Gamepad2, desc: 'Scanline bar mode' },
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

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <PaintBucket className="w-4 h-4" style={{ color: getAccentColorOnly() }} /> Visualizer Color
            </label>
            <div className="flex flex-wrap gap-2">
              {visualizerColorPresets.map(({ name, value }) => (
                <button
                  key={name}
                  onClick={() => setVisualizerColor(value)}
                  className="w-7 h-7 rounded-full border-2 transition-all hover:scale-110 active:scale-95"
                  style={{
                    backgroundColor: value === 'accent' ? getAccentColorOnly()
                      : value === 'rainbow' ? 'transparent'
                      : value.startsWith('#') ? value
                      : PRESET_VISUALIZER_COLORS.find(v => v.value === value)?.hex || accentColor,
                    borderColor: visualizerColor === value ? '#fff' : 'rgba(255,255,255,0.2)',
                    boxShadow: visualizerColor === value ? `0 0 8px ${getAccentColorOnly()}40` : undefined,
                  }}
                  title={name}
                >
                  {value === 'rainbow' && (
                    <div className="w-full h-full rounded-full"
                      style={{ background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }} />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Layers className="w-4 h-4" style={{ color: getAccentColorOnly() }} /> Dynamic Canvas BG
            </label>
            <button
              onClick={() => setDynamicCanvasBg(!dynamicCanvasBg)}
              className="w-10 h-6 rounded-full relative transition-colors"
              style={{ backgroundColor: dynamicCanvasBg ? getAccentColorOnly() : undefined }}
            >
              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${dynamicCanvasBg ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4" style={{ color: getAccentColorOnly() }} /> Lock Screen
            </label>
            <button
              onClick={() => setLockScreenControls(!lockScreenControls)}
              className={`w-10 h-6 rounded-full relative transition-colors ${lockScreenControls ? '' : 'bg-white/10'}`}
              style={{ backgroundColor: lockScreenControls ? getAccentColorOnly() : undefined }}
            >
              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${lockScreenControls ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
