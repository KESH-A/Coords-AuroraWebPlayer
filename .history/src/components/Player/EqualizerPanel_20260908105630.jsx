import React, { useState } from 'react';
import { useAudio } from '../../context/AudioContext';
import { useSettings } from '../../context/SettingsContext';

const PRESET_MAP = {
  Rock: [5, 3, -1, 3, 5],
  Pop: [-1, 2, 5, 3, -2],
  Acoustic: [3, 2, 1, 2, 3],
  EDM: [6, 4, 0, 2, 4],
  Metal: [7, 2, -2, 4, 6],
  Live: [-2, 1, 3, 2, 1],
  Flat: [0, 0, 0, 0, 0],
};

const BANDS = ['60Hz', '230Hz', '910Hz', '4kHz', '14kHz'];
const SNAP_STEPS = [0, 20, 40, 60, 80, 100];

export const EqualizerPanel = () => {
  const { setEQBands, setBassBoost: setAudioBass, setLoudness: setAudioLoudness } = useAudio() || {};
  const { accentColor, textColor, themeStyle } = useSettings();

  const [eqEnabled, setEqEnabled] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState('Rock');
  const [bandGains, setBandGains] = useState(PRESET_MAP.Rock);
  const [bassBoost, setBassBoost] = useState(40);
  const [loudness, setLoudness] = useState(60);

  const applyGains = (gains) => {
    setBandGains(gains);
    if (eqEnabled && setEQBands) {
      setEQBands(gains);
    }
  };

  const handlePresetSelect = (preset) => {
    setSelectedPreset(preset);
    const gains = PRESET_MAP[preset];
    applyGains(gains);
  };

  const handleBandChange = (index, value) => {
    const newGains = [...bandGains];
    newGains[index] = Number(value);
    setSelectedPreset('Custom');
    applyGains(newGains);
  };

  const toggleEQ = () => {
    const nextState = !eqEnabled;
    setEqEnabled(nextState);
    if (setEQBands) {
      setEQBands(nextState ? bandGains : [0, 0, 0, 0, 0]);
    }
  };

  const snapValue = (val) => {
    const num = Number(val);
    return SNAP_STEPS.reduce((prev, curr) =>
      Math.abs(curr - num) < Math.abs(prev - num) ? curr : prev
    );
  };

  const handleBassChange = (val) => {
    const snapped = snapValue(val);
    setBassBoost(snapped);
    if (setAudioBass) setAudioBass(snapped);
  };

  const handleLoudnessChange = (val) => {
    const snapped = snapValue(val);
    setLoudness(snapped);
    if (setAudioLoudness) setAudioLoudness(snapped);
  };

  const activeColor = accentColor || '#f59e0b';
  const panelThemeClass = themeStyle === 'glass' ? 'glass glass-modal' : 'theme-transparent';

  return (
    <div
      className={`${panelThemeClass} w-full max-w-md mx-auto p-4 rounded-3xl space-y-4 animate-morph select-none`}
      style={{ color: textColor || '#ffffff' }}
    >
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {Object.keys(PRESET_MAP).map((p) => (
          <button
            key={p}
            onClick={() => handlePresetSelect(p)}
            className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
              selectedPreset === p
                ? 'text-black shadow-lg scale-105'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
            style={{
              backgroundColor: selectedPreset === p ? activeColor : undefined,
            }}
          >
            {p}
          </button>
        ))}
        {selectedPreset === 'Custom' && (
          <span
            className="px-3.5 py-1 rounded-full text-xs font-bold border whitespace-nowrap"
            style={{
              backgroundColor: `${activeColor}33`,
              color: activeColor,
              borderColor: `${activeColor}4d`,
            }}
          >
            Custom
          </span>
        )}
      </div>

      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-200">Equalizer</span>
            <span className="text-[10px] text-slate-400 font-mono">
              {eqEnabled ? 'ACTIVE' : 'BYPASS'}
            </span>
          </div>
          <button
            onClick={toggleEQ}
            className="w-10 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out"
            style={{ backgroundColor: eqEnabled ? activeColor : 'rgba(255, 255, 255, 0.2)' }}
          >
            <div
              className={`w-4 h-4 rounded-full bg-black transition-transform duration-200 ease-in-out ${
                eqEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div
          className={`h-36 flex items-end justify-between px-2 pt-4 transition-opacity duration-300 ${
            eqEnabled ? 'opacity-100' : 'opacity-30 pointer-events-none'
          }`}
        >
          {BANDS.map((freq, i) => {
            const gain = bandGains[i] ?? 0;
            const heightPercent = Math.min(Math.max(((gain + 10) / 20) * 100, 0), 100);

            return (
              <div key={freq} className="flex flex-col items-center gap-2 h-full justify-end group">
                <span
                  className="text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: activeColor }}
                >
                  {gain > 0 ? `+${gain}` : gain}dB
                </span>

                <div className="w-2 bg-white/10 rounded-full h-full relative flex items-end justify-center">
                  <div
                    className="w-full rounded-full relative transition-all duration-150"
                    style={{ height: `${heightPercent}%`, backgroundColor: activeColor }}
                  >
                    <div
                      className="w-3.5 h-3.5 rounded-full absolute -top-1.5 -left-[3px] shadow-md"
                      style={{ backgroundColor: activeColor, boxShadow: `0 0 10px ${activeColor}80` }}
                    />
                  </div>

                  <input
                    type="range"
                    min="-10"
                    max="10"
                    step="1"
                    value={gain}
                    onChange={(e) => handleBandChange(i, e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full [writing-mode:vertical-lr] [direction:rtl]"
                  />
                </div>

                <span className="text-[9px] font-mono text-slate-400">{freq}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2">
          <div className="flex justify-between text-[11px] font-bold">
            <span className="text-slate-300">Bass Boost</span>
            <span className="font-mono" style={{ color: activeColor }}>{bassBoost}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="20"
            value={bassBoost}
            onChange={(e) => handleBassChange(e.target.value)}
            className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
            style={{ accentColor: activeColor }}
          />
        </div>

        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2">
          <div className="flex justify-between text-[11px] font-bold">
            <span className="text-slate-300">Loudness</span>
            <span className="font-mono" style={{ color: activeColor }}>{loudness}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="20"
            value={loudness}
            onChange={(e) => handleLoudnessChange(e.target.value)}
            className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
            style={{ accentColor: activeColor }}
          />
        </div>
      </div>
    </div>
  );
};
};