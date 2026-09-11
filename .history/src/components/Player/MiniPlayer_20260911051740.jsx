import React, { useRef } from 'react';
import { useAudio } from '../../context/AudioContext';
import { useSettings } from '../../context/SettingsContext';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { VisualizerCanvas } from './VisualizerCanvas';

export const MiniPlayer = ({ onOpenSettings }) => {
  const { 
    currentTrack, isPlaying, playTrack, pauseTrack, playNext, playPrev, 
    seek, currentTime, duration, volume, setVolume, toggleMute, isMuted, initWebAudio 
  } = useAudio();
  const { themeStyle, accentColor, textColor, gradientColors, visualizer } = useSettings();

  const progressRef = useRef(null);
  const dragStartRef = useRef({ x: 0, seekAt: 0, active: false });

  const activeColor = (themeStyle === 'gradient' && gradientColors && gradientColors.length >= 2)
    ? gradientColors[0]
    : (accentColor || '#9333ea');

  const progressPct = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  const seekToClientX = (clientX) => {
    if (typeof initWebAudio === 'function') initWebAudio();
    const rect = progressRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0) return;
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    if (duration > 0) seek(pct * duration);
  };

  const handleProgressPointerDown = (e) => {
    if (duration <= 0) return;
    if (typeof initWebAudio === 'function') initWebAudio();
    dragStartRef.current = { x: (e.touches ? e.touches[0].clientX : e.clientX), seekAt: currentTime, active: true };
    seekToClientX(e.touches ? e.touches[0].clientX : e.clientX);
  };

  const handleProgressPointerMove = (e) => {
    const drag = dragStartRef.current;
    if (!drag.active || duration <= 0) return;
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const deltaPct = (x - drag.x) / (progressRef.current?.getBoundingClientRect().width || 1);
    const next = Math.max(0, Math.min(duration, drag.seekAt + deltaPct * duration));
    seek(next);
  };

  const handleProgressPointerUp = () => {
    dragStartRef.current.active = false;
  };

  const handlePlayPause = () => {
    if (typeof initWebAudio === 'function') initWebAudio();
    if (isPlaying) {
      pauseTrack();
    } else if (currentTrack) {
      playTrack(currentTrack);
    }
  };

  const handleNextTrack = () => {
    if (typeof initWebAudio === 'function') initWebAudio();
    playNext();
  };

  const handlePrevTrack = () => {
    if (typeof initWebAudio === 'function') initWebAudio();
    playPrev();
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 cursor-pointer safe-bottom" onClick={() => {}}>
      <div className="glass glass-modal rounded-t-3xl border border-white/10 border-b-0 shadow-2xl shadow-black/40 px-3 pt-3 flex-1">
        {/* MainBar Spectrum: Sadece Settings'teki visualizer anahtarına göre açılır/kapanır */}
        {visualizer && (
          <div className="mb-2">
            <VisualizerCanvas />
          </div>
        )}
        
        {/* Progress bar */}
        <div
          ref={progressRef}
          onPointerDown={handleProgressPointerDown}
          onPointerMove={handleProgressPointerMove}
          onPointerUp={handleProgressPointerUp}
          onPointerLeave={handleProgressPointerUp}
          className="h-[3px] bg-white/10 rounded-full overflow-hidden cursor-pointer touch-none"
          style={{ willChange: 'width' }}
        >
          <div
            className="h-full rounded-full"
            style={{ width: progressPct + '%', backgroundColor: activeColor, boxShadow: '0 0 8px ' + activeColor, willChange: 'width' }}
          />
        </div>

        <div className="flex items-center gap-3 py-2.5">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-900 border border-white/15 shrink-0">
            {currentTrack?.cover ? (
              <img src={currentTrack.cover} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-800">
                <Play className="w-5 h-5 text-slate-400" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate text-white">
              {currentTrack?.title || 'No track selected'}
            </p>
            <p className="text-xs text-slate-400 truncate">
              {currentTrack?.artist || 'Local Track'}
            </p>
          </div>
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => toggleMute()} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition" title="Mute (M)">
              {isMuted ? <VolumeX className="w-4 h-4 text-slate-300" /> : <Volume2 className="w-4 h-4 text-slate-300" />}
            </button>
            <button onClick={handlePrevTrack} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition">
              <SkipBack className="w-4 h-4 text-slate-300" />
            </button>
            <button
              onClick={handlePlayPause}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 text-white fill-white" />
              ) : (
                <Play className="w-4 h-4 ml-0.5 text-white" style={{ color: activeColor, fill: activeColor }} />
              )}
            </button>
            <button onClick={handleNextTrack} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition">
              <SkipForward className="w-4 h-4 text-slate-300" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiniPlayer;