import React, { useState, useEffect, useRef } from 'react';
import { useAudio } from '../../context/AudioContext';
import { useSettings } from '../../context/SettingsContext';
import { EqualizerPanel } from './EqualizerPanel';
import defaultProfile from '../../assets/Profile.avif';
import {
  ChevronDown,
  Sliders,
  Heart,
  Repeat,
  Repeat1,
  SkipBack,
  SkipForward,
  Play,
  Pause,
  ListMusic,
  Activity
} from 'lucide-react';

export const ActivePlayerModal = ({ isOpen, onClose, tracks = [], onOpenPlaylist }) => {
  const { currentTrack, isPlaying, playTrack, pauseTrack, seek, currentTime, duration, analyserRef } = useAudio();
  const { accentColor } = useSettings();

  const [isFavorite, setIsFavorite] = useState(false);
  const [repeatMode, setRepeatMode] = useState('off');
  const [showEQ, setShowEQ] = useState(false);
  const [showSpectrum, setShowSpectrum] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  
  // Yön tabanlı akıcı geçiş animasyonu için state
  const [slideDirection, setSlideDirection] = useState(''); // 'next' | 'prev' | ''
  const [slideDirection, setSlideDirection] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);

  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);

  const currentIndex = tracks.findIndex((t) => t.id === currentTrack?.id);

  const handleNext = () => {
    if (!tracks.length || isAnimating) return;
    setIsAnimating(true);
    setSlideDirection('next');

    setTimeout(() => {
      const nextIndex = (currentIndex + 1) % tracks.length;
      playTrack(tracks[nextIndex]);
      setSlideDirection('');
      setIsAnimating(false);
    }, 180);
  };

  const handlePrev = () => {
    if (!tracks.length || isAnimating) return;
    setIsAnimating(true);
    setSlideDirection('prev');

    setTimeout(() => {
      const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
      playTrack(tracks[prevIndex]);
      setSlideDirection('');
      setIsAnimating(false);
    }, 180);
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 350);
  };

  useEffect(() => {
    if (!isOpen || showEQ || !showSpectrum || !canvasRef.current || !analyserRef?.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const syncCanvasSize = () => {
      if (!canvas) return { width: 0, height: 0, dpr: 1 };
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const cssW = rect.width;
      const cssH = rect.height;
      if (cssW === 0 || cssH === 0) return { width: 0, height: 0, dpr };

      const targetW = Math.round(cssW * dpr);
      const targetH = Math.round(cssH * dpr);

      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }
      return { width: cssW, height: cssH, dpr };
    };

    let resizeObserver = null;
    if (canvas.parentElement && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        syncCanvasSize();
      });
      resizeObserver.observe(canvas.parentElement);
    }

    let isActive = true;

    const renderSpectrum = () => {
      if (!isActive) return;
      if (!isActive || document.hidden) return;

      animFrameRef.current = requestAnimationFrame(renderSpectrum);

      const { width, height, dpr } = syncCanvasSize();
      if (width === 0 || height === 0) return;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      if (isPlaying) {
        analyser.getByteFrequencyData(dataArray);
      } else {
        for (let i = 0; i < dataArray.length; i++) {
          dataArray[i] = Math.max(0, dataArray[i] - 6);
        }
      }

      const halfCount = 7;
      const barCount = halfCount * 2;
      const slotWidth = width / barCount;
      const barWidth = Math.max(3, slotWidth * 0.65);
      const gap = slotWidth - barWidth;
      const radius = Math.min(barWidth / 2, 4);

      ctx.fillStyle = accentColor || '#f59e0b';

      for (let i = 0; i < barCount; i++) {
        const freqIndex = i < halfCount ? (halfCount - 1 - i) : (i - halfCount);
        const val = dataArray[freqIndex] || 0;
        const barHeight = Math.max(4, (val / 255) * height);
        const x = i * slotWidth + gap / 2;
        const y = height - barHeight;

        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y, barWidth, barHeight, [radius, radius, 0, 0]);
        } else {
          ctx.rect(x, y, barWidth, barHeight);
        }
        ctx.fill();
      }
    };

    const timers = [50, 150, 300, 480].map((delay) =>
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      } else if (isActive) {
        syncCanvasSize();
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = requestAnimationFrame(renderSpectrum);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    const timers = [40, 100, 200, 320].map((delay) =>
      setTimeout(() => {
        if (isActive) syncCanvasSize();
      }, delay)
    );

    const initialRaf = requestAnimationFrame(() => {
        syncCanvasSize();
        renderSpectrum();
      });

    return () => {
      isActive = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      timers.forEach(clearTimeout);
      cancelAnimationFrame(initialRaf);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [isOpen, isPlaying, showEQ, showSpectrum, accentColor, currentTrack, analyserRef]);

  if (!isOpen || !currentTrack) return null;

  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;
  const activeColor = accentColor || '#f59e0b';
  const modalThemeClass = themeStyle === 'glass' ? 'glass' : 'theme-transparent';

  return (
    <div
      className={`${modalThemeClass} fixed inset-0 z-[200] bg-[#070913]/90 backdrop-blur-3xl flex flex-col justify-between p-6 select-none ${
        isClosing ? 'animate-mac-shrink' : 'animate-mac-expand'
        isClosing ? 'animate-modal-shrink' : 'animate-modal-expand'
      }`}
      style={{ color: textColor || '#ffffff' }}
    >
      <div className="flex items-center justify-between w-full max-w-md mx-auto">
        <button
          onClick={handleClose}
          className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all active:scale-95"
        >
          <ChevronDown className="w-6 h-6" style={{ color: textColor || '#cbd5e1' }} />
        </button>

        <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
          Playing Now
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSpectrum(!showSpectrum)}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all bg-white/5 hover:bg-white/10"
            style={{ color: showSpectrum ? activeColor : '#94a3b8' }}
          >
            <Activity className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowEQ(!showEQ)}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
            style={{
              backgroundColor: showEQ ? activeColor : 'rgba(255,255,255,0.05)',
              color: showEQ ? '#000' : '#cbd5e1',
            }}
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center my-4 max-w-md w-full mx-auto">
        {showEQ ? (
          <EqualizerPanel />
        ) : (
          <div className="w-full flex flex-col items-center gap-5">
            <div
              className={`w-64 h-64 sm:w-72 sm:h-72 rounded-3xl bg-slate-900 border border-white/15 shadow-2xl overflow-hidden relative transition-all duration-200 transform ${
                slideDirection === 'next'
                  ? '-translate-x-12 opacity-0 scale-90 -rotate-3'
                  : slideDirection === 'prev'
                  ? 'translate-x-12 opacity-0 scale-90 rotate-3'
                  : 'translate-x-0 opacity-100 scale-100 rotate-0'
              }`}
            >
              <img
                src={currentTrack.cover || defaultProfile}
                alt="Album Cover"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = defaultProfile;
                }}
              />
            </div>

            {showSpectrum && (
              <div
                className={`w-full h-12 p-2 border border-white/10 flex items-center justify-center overflow-hidden rounded-2xl ${
                  themeStyle === 'glass' ? 'glass bg-white/5' : 'bg-white/5 backdrop-blur-md'
                }`}
              >
                <canvas ref={canvasRef} className="w-full h-full" />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="w-full max-w-md mx-auto space-y-5">
        <div
          className={`flex items-center justify-between transition-all duration-200 ${
            slideDirection ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
          }`}
        >
          <div className="truncate pr-4">
            <h3 className="text-base font-bold truncate" style={{ color: textColor || '#ffffff' }}>
              {currentTrack.title}
            </h3>
            <p className="text-xs text-slate-400 truncate mt-0.5">{currentTrack.artist || 'Local Track'}</p>
          </div>
          <button onClick={() => setIsFavorite(!isFavorite)} className="p-2 rounded-full hover:bg-white/5 transition-all">
            <Heart
              className="w-5 h-5 transition-all"
              style={{
                color: isFavorite ? activeColor : '#94a3b8',
                fill: isFavorite ? activeColor : 'none',
              }}
            />
          </button>
        </div>

        <div className="space-y-1.5 w-full">
          <div className="relative w-full py-2 cursor-pointer group select-none flex items-center">
            <div className="w-full h-2 rounded-full bg-white/10 backdrop-blur-md border border-white/15 overflow-hidden relative shadow-inner">
              <div
                className="h-full rounded-full transition-all duration-75 relative"
                style={{
                  width: `${progressPercent}%`,
                  backgroundColor: activeColor,
                  boxShadow: `0 0 10px ${activeColor}, 0 0 4px ${activeColor}`,
                }}
              />
            </div>

            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-white shadow-lg pointer-events-none transition-transform duration-100 ease-out group-hover:scale-125 group-active:scale-110 flex items-center justify-center"
              style={{
                left: `${progressPercent}%`,
                backgroundColor: activeColor,
                boxShadow: `0 0 12px ${activeColor}, 0 2px 6px rgba(0,0,0,0.5)`,
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-white" />
            </div>

            <input
              type="range"
              min="0"
              max={duration || 100}
              step="any"
              value={currentTime || 0}
              onChange={(e) => seek(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              aria-label="Seek track position"
            />
          </div>

          <div className="flex justify-between text-[11px] font-mono text-slate-400 px-0.5">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <button
            onClick={handleCycleMode}
            className="p-2 rounded-full transition-all active:scale-90"
            style={{ color: playbackMode !== 'off' ? activeColor : '#94a3b8' }}
            title={`Mode: ${playbackMode}`}
          >
            {playbackMode === 'one' ? (
              <Repeat1 className="w-5 h-5" />
            ) : playbackMode === 'shuffle' ? (
              <Shuffle className="w-5 h-5" />
            ) : (
              <Repeat className="w-5 h-5" />
            )}
          </button>

          <button onClick={handlePrev} className="p-3 rounded-full hover:bg-white/10 active:scale-90 transition-all">
            <SkipBack className="w-6 h-6 fill-current" style={{ color: textColor || '#ffffff' }} />
          </button>

          <button
            onClick={() => (isPlaying ? pauseTrack() : playTrack(currentTrack))}
            className="w-14 h-14 rounded-full flex items-center justify-center text-black shadow-xl active:scale-95 transition-all"
            style={{ backgroundColor: activeColor }}
          >
            {isPlaying ? <Pause className="w-6 h-6 fill-black" /> : <Play className="w-6 h-6 fill-black ml-0.5" />}
          </button>

          <button onClick={handleNext} className="p-3 rounded-full hover:bg-white/10 active:scale-90 transition-all">
            <SkipForward className="w-6 h-6 fill-current" style={{ color: textColor || '#ffffff' }} />
          </button>

          <button
            onClick={() => {
              if (onOpenPlaylist) onOpenPlaylist();
              handleClose();
            }}
            className="p-2 rounded-full text-slate-400 hover:text-white transition-all"
          >
            <ListMusic className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};