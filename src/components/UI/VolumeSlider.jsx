  import React from 'react';

export const VolumeSlider = ({ value = 0, onChange = () => {}, size = 80, color = '#9333ea', textColor = '#fff', labelColor }) => {
  return (
    <div className="flex items-center gap-2">
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: `${size}px`, accentColor: color }}
      />
      <span className="text-xs font-mono" style={{ color: labelColor || textColor }}>
        {Math.round((value || 0) * 100)}%
      </span>
    </div>
  );
};

export default VolumeSlider;