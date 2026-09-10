import React from 'react';
import { X, Palette, Volume2, Sparkles, Pipette } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

const PRESET_GRADIENTS = [
  { name: 'Purple Night', colors: ['#4c1d95', '#c084fc'] },
  { name: 'Ocean Blue', colors: ['#0369a1', '#38bdf8'] },
  { name: 'Emerald', colors: ['#065f46', '#34d399'] },
  { name: 'Sunset Glow', colors: ['#9f1239', '#fb7185'] },
  { name: 'Midnight', colors: ['#0f172a', '#334155'] },
  { name: 'Neon Cyber', colors: ['#831843', '#06b6d4'] }
];

const SettingsModal = ({ isOpen, onClose }) => {
  const {
    themeStyle,
    setThemeStyle,
    gradientColors,
    setGradientColors,
    visualizerStyle,
    setVisualizerStyle,
    visualizerColor,
    setVisualizerColor,
  } = usePlayer();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-slate-900/90 border border-white/10 rounded-3xl p-6 shadow-2xl text-white max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-bold">Görünüm ve Tema Ayarları</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6 mt-5">
          {/* Tema Stili */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-3">
              Uygulama Teması
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setThemeStyle('glass')}
                className={`py-2.5 px-4 rounded-xl text-sm font-medium transition-all border ${
                  themeStyle === 'glass' ? 'bg-purple-600/30 border-purple-500 text-white' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                Glassmorphism
              </button>
              <button
                onClick={() => setThemeStyle('gradient')}
                className={`py-2.5 px-4 rounded-xl text-sm font-medium transition-all border ${
                  themeStyle === 'gradient' ? 'bg-purple-600/30 border-purple-500 text-white' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                Dynamic Gradient
              </button>
            </div>
          </div>

          {/* Arka Plan Renk Presetleri */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-3">
              Arka Plan Gradient Renkleri
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRESET_GRADIENTS.map((g) => (
                <button
                  key={g.name}
                  onClick={() => setGradientColors(g.colors)}
                  className={`h-10 rounded-xl transition-all border-2 flex items-center justify-center p-1 ${
                    JSON.stringify(gradientColors) === JSON.stringify(g.colors) ? 'border-white scale-105 shadow-lg' : 'border-transparent opacity-80 hover:opacity-100'
                  }`}
                  style={{ background: `linear-gradient(135deg, ${g.colors[0]} 20%, ${g.colors[1]} 80%)` }}
                >
                  <span className="text-[10px] font-bold text-white drop-shadow-md truncate">{g.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Visualizer Modu */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-3">
              Visualizer Stili
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['bars', 'wave', 'fluid'].map((style) => (
                <button
                  key={style}
                  onClick={() => setVisualizerStyle(style)}
                  className={`py-2 px-3 rounded-xl text-xs font-medium capitalize transition-all border ${
                    visualizerStyle === style ? 'bg-purple-600/30 border-purple-500 text-white' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  {style === 'bars' ? 'Sütunlar' : style === 'wave' ? 'Dalga' : 'Akışkan'}
                </button>
              ))}
            </div>
          </div>

          {/* Visualizer Renk Seçimi & Custom Color */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-3">
              Visualizer Rengi
            </label>
            <div className="flex items-center gap-3 flex-wrap">
              {['#9333ea', '#00f3ff', '#ff00ff', '#ff4500', 'rainbow'].map((color) => (
                <button
                  key={color}
                  onClick={() => setVisualizerColor(color)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    visualizerColor === color ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-80'
                  }`}
                  style={{
                    background: color === 'rainbow' ? 'linear-gradient(135deg, red, yellow, green, blue, purple)' : color,
                  }}
                />
              ))}

              {/* Custom Color Picker */}
              <label className="w-8 h-8 rounded-full border-2 border-white/20 flex items-center justify-center cursor-pointer bg-white/10 hover:scale-110 transition-all relative">
                <Pipette className="w-4 h-4 text-white" />
                <input
                  type="color"
                  value={visualizerColor.startsWith('#') ? visualizerColor : '#9333ea'}
                  onChange={(e) => setVisualizerColor(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;