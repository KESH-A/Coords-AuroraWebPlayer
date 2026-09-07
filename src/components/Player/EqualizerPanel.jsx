import React, { useState } from 'react';
import { useAudio } from '../../context/AudioContext';
import { Sliders } from 'lucide-react';

const EQ_PRESETS = {
  Flat: [0, 0, 0, 0, 0],
  BassBoost: [6, 4, 0, 0, 2],
  Pop: [-1, 2, 5, 1, -2],
  Rock: [4, 2, -1, 3, 5],
  Voice: [-2, 3, 4, 1, -3],
};

export const EqualizerPanel = () => {
  const { setEQGain } = useAudio();
  const [gains, setGains] = useState([0, 0, 0, 0, 0]);
  const bands = ['60Hz', '230Hz', '910Hz', '4kHz', '14kHz'];

  const handleSliderChange = (index, value) => {
    const newGains = [...gains];
    newGains[index] = Number(value);
    setGains(newGains);
    setEQGain(index, Number(value));
  };

  const applyPreset = (presetName) => {
    const presetValues = EQ_PRESETS[presetName];
    setGains(presetValues);
    presetValues.forEach((val, idx) => setEQGain(idx, val));
  };

  return (
    <div className="p-6 rounded-3xl glass-surface border border-white/10 w-full max-w-md space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-purple-400 font-semibold">
          <Sliders className="w-5 h-5" />
          <span>5-Band Hardware Equalizer</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.keys(EQ_PRESETS).map((preset) => (
          <button
            key={preset}
            onClick={() => applyPreset(preset)}
            className="px-3 py-1.5 rounded-xl text-xs font-medium bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-all active:scale-95"
          >
            {preset}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-4 h-48 items-center pt-2">
        {bands.map((band, idx) => (
          <div key={band} className="flex flex-col items-center h-full justify-between">
            <span className="text-[10px] text-slate-400 font-mono">{gains[idx]}dB</span>
            <input
              type="range"
              min="-12"
              max="12"
              step="1"
              value={gains[idx]}
              onChange={(e) => handleSliderChange(idx, e.target.value)}
              className="h-32 w-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500 [writing-mode:vertical-lr] [direction:rtl]"
            />
            <span className="text-xs text-slate-300 font-medium">{band}</span>
          </div>
        ))}
      </div>
    </div>
  );
};