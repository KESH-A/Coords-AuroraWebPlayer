import React, { useState, useEffect, useRef } from 'react';
import { useAudio } from '../../context/AudioContext';
import { useSettings } from '../../context/SettingsContext';
import { useFavorites } from '../../context/FavoritesContext';
import { EqualizerPanel } from './EqualizerPanel';
import { VisualizerCanvas } from './VisualizerCanvas';
import defaultProfile from '../../assets/Profile.avif';
import {
  ChevronDown, Sliders, Heart, Repeat, Repeat1, Shuffle,
  SkipBack, SkipForward, Play, Pause, ListMusic, Activity
} from 'lucide-react';

export const ActivePlayerModal = ({ isOpen, onClose, tracks = [] }) => {
  const {
    currentTrack, isPlaying, playTrack, pauseTrack, playNext, playPrev,
    seek, currentTime, duration, playbackMode, setPlaybackMode,
    setPlaylist, volume, setVolume, initWebAudio
  } = useAudio();
  const { accentColor, textColor, themeStyle, gradientColors } = useSettings();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [showEQ, setShowEQ] = useState(false);
  const [showModalSpectrum, setShowModalSpectrum] = useState(true); // MainBar'dan BAĞIMSIZ Spectrum State'i
  const [slideDirection, setSlideDirection] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [shouldRender, setShouldRender] = useState(false);
  const [animationClass, setAnimationClass] = useState('animate-mac-expand');

  const [gestureType, setGestureType] = useState(null);
  const [gestureValue, setGestureValue] = useState(0);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [ripple, setRipple] = useState(null);

  const touchStart = useRef(null);
  const touchType = useRef(null);
  const lastTap = useRef(0);
  const modalRef = useRef(null);
  const gestureValRef = useRef(0);

  const fav = currentTrack ? isFavorite(currentTrack.id) : false;

  const activeColor = (themeStyle === 'gradient' && gradientColors && gradientColors.length >= 2)
    ? gradientColors[0]
    : (accentColor === 'rgb-cycle' ? 'var(--accent-color)' : (accentColor || '#f59e0b'));

  useEffect(() => {
    if (isOpen) {
      if (typeof initWebAudio === 'function') initWebAudio(); // Modal açıldığında AudioContext uykudaysa uyandır
      setShouldRender(true);
      setAnimationClass('animate-mac-expand');
    } else if (shouldRender) {
      setAnimationClass('animate-mac-shrink');
      const timer = setTimeout(() => { setShouldRender(false); }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (tracks && tracks.length > 0) setPlaylist(tracks);
  }, [tracks, setPlaylist]);

  if (!shouldRender && !isOpen) return null;
  if (!currentTrack) return null;

  const handleClose = () => {
    if (onClose) onClose();
  };

  const handleCycleMode = () => {
    const modes = ['off', 'all', 'one', 'shuffle'];
    setPlaybackMode(modes[(modes.indexOf(playbackMode) + 1) % modes.length]);
  };

  const handleNext = () => {
    if (isAnimating) return;
    if (typeof initWebAudio === 'function') initWebAudio();
    setIsAnimating(true);
    setSlideDirection('next');
    setTimeout(() => { playNext(true); setSlideDirection(''); setIsAnimating(false); }, 180);
  };

  const handlePrev = () => {
    if (isAnimating) return;
    if (typeof initWebAudio === 'function') initWebAudio();
    setIsAnimating(true);
    setSlideDirection('prev');
    setTimeout(() => { playPrev(); setSlideDirection(''); setIsAnimating(false); }, 180);
  };

  const handlePlayPauseToggle = () => {
    if (typeof initWebAudio === 'function') initWebAudio();
    if (isPlaying) {
      pauseTrack();
    } else if (currentTrack) {
      playTrack(currentTrack);
    }
  };

  const onTouchStart = (e) => {
    const t = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    touchStart.current = { 
      x: t.clientX, 
      y: t.clientY, 
      time: Date.now(),
      relX: t.clientX - rect.left,
      rectWidth: rect.width
    };
    touchType.current = null;
    setGestureType(null);
    setSwipeOffset(0);
  };

  const onTouchMove = (e) => {
    if (!touchStart.current) return;
    const t = e.touches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;

    if (!touchType.current) {
      if (Math.abs(dx) > 12 || Math.abs(dy) > 12) {
        touchType.current = Math.abs(dx) > Math.abs(dy) ? 'swipe' : 'vertical';
      }
    }

    if (touchType.current === 'swipe') {
      setGestureType('swipe');
      setSwipeOffset(dx * 0.45);
    } else if (touchType.current === 'vertical') {
      const isRight = touchStart.current.relX > touchStart.current.rectWidth / 2;
      const delta = -dy * 0.6;
      
      if (isRight) {
        setGestureType('volume');
        const newVol = Math.max(0, Math.min(100, (volume * 100) + delta));
        setGestureValue(newVol);
        gestureValRef.current = newVol;
        setVolume(newVol / 100);
      } else {
        setGestureType('brightness');
        const newBright = Math.max(20, Math.min(100, brightness + delta));
        setGestureValue(newBright);
        gestureValRef.current = newBright;
        setBrightness(newBright);
      }
    }
  };

  const onTouchEnd = (e) => {
    if (!touchStart.current) return;
    const start = touchStart.current;
    const elapsed = Date.now() - start.time;
    const endX = e.changedTouches[0]?.clientX || start.x;
    const dx = endX - start.x;

    if (!touchType.current && elapsed < 250) {
      const now = Date.now();
      if (now - lastTap.current < 300) {
        handlePlayPauseToggle();
        const rect = e.currentTarget.getBoundingClientRect();
        setRipple({ x: start.x - rect.left, y: start.y - rect.top, id: now });
        setTimeout(() => setRipple(null), 600);
        lastTap.current = 0;
      } else {
        lastTap.current = now;
      }
    } else if (touchType.current === 'swipe') {
      if (dx < -60) handleNext();
      else if (dx > 60) handlePrev();
    }

    touchStart.current = null;
    touchType.current = null;
    setGestureType(null);
    setSwipeOffset(0);
  };

  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;
  const modalThemeClass = themeStyle === 'glass' ? 'glass' : 'theme-transparent';

  return (
    <div
      ref={modalRef}
      className={`${modalThemeClass} fixed inset-0 z-[200] overflow-hidden rounded-none! bg-[#070913]/95 backdrop-blur-3xl flex flex-col justify-between p-6 select-none ${animationClass}`}
      style={{ color: textColor || '#ffffff', filter: `brightness(${brightness}%)` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-md mx-auto">
        <button onClick={handleClose} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all active:scale-95">
          <ChevronDown className="w-6 h-6" style={{ color: textColor || '#cbd5e1' }} />
        </button>
        <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Playing Now</span>
        <div className="flex items-center gap-2">
          {/* Modal Spectrum Toggle - Settings'ten bağımsız */}
          <button 
            onClick={() => setShowModalSpectrum(!showModalSpectrum)} 
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all bg-white/5 hover:bg-white/10" 
            style={{ color: showModalSpectrum ? activeColor : '#94a3b8' }}
          >
            <Activity className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setShowEQ(!showEQ)} 
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all" 
            style={{ backgroundColor: showEQ ? activeColor : 'rgba(255,255,255,0.05)', color: showEQ ? '#000' : '#cbd5e1' }}
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center my-4 max-w-md w-full mx-auto">
        {showEQ ? (
          <div className="w-full">
            <EqualizerPanel />
          </div>
        ) : (
          <div className="w-full flex flex-col items-center gap-5">
            {/* Album Cover & Touch Area */}
            <div
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              className="w-64 h-64 sm:w-72 sm:h-72 rounded-3xl bg-slate-900 border border-white/15 shadow-2xl overflow-hidden relative cursor-grab active:cursor-grabbing touch-none"
              style={{
                transform: `translateX(${swipeOffset}px) rotate(${swipeOffset * 0.02}deg)`,
                transition: gestureType === 'swipe' ? 'none' : 'transform 0.2s ease',
                willChange: 'transform',
              }}
            >
              <img 
                src={currentTrack?.cover || defaultProfile} 
                alt="Album Cover" 
                className="w-full h-full object-cover pointer-events-none" 
                onError={(e) => { e.target.onerror = null; e.target.src = defaultProfile; }} 
              />

              {gestureType === 'volume' && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-2 pointer-events-none">
                  <div className="w-2.5 h-28 bg-white/20 rounded-full overflow-hidden flex items-end">
                    <div className="w-full rounded-full transition-all duration-75" style={{ height: `${gestureValue}%`, backgroundColor: activeColor }} />
                  </div>
                  <span className="text-xs font-bold text-white">{Math.round(gestureValue)}%</span>
                </div>
              )}

              {gestureType === 'brightness' && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-2 pointer-events-none">
                  <div className="w-2.5 h-28 bg-white/20 rounded-full overflow-hidden flex items-end">
                    <div className="w-full rounded-full transition-all duration-75" style={{ height: `${gestureValue}%`, backgroundColor: '#fbbf24' }} />
                  </div>
                  <span className="text-xs font-bold text-white">{Math.round(gestureValue)}%</span>
                </div>
              )}

              {ripple && (
                <span 
                  key={ripple.id} 
                  className="absolute rounded-full border-2 border-white/60 animate-ping pointer-events-none" 
                  style={{ left: ripple.x - 40, top: ripple.y - 40, width: 80, height: 80 }} 
                />
              )}
            </div>

            {/* In-Player Visualizer Strip */}
            <div className={`w-full overflow-hidden transition-all duration-300 ${showModalSpectrum ? 'max-h-20 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
              <div className={`w-full h-14 p-1 border border-white/10 flex items-center justify-center overflow-hidden rounded-2xl ${themeStyle === 'glass' ? 'glass bg-white/5' : 'bg-white/5 backdrop-blur-md'}`}>
                <VisualizerCanvas />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer / Controls */}
      <div className="w-full max-w-md mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div className="truncate pr-4">
            <h3 className="text-base font-bold truncate" style={{ color: textColor || '#ffffff' }}>{currentTrack?.title}</h3>
            <p className="text-xs text-slate-400 truncate">{currentTrack?.artist || 'Unknown'}</p>
          </div>
          <button onClick={() => currentTrack && toggleFavorite(currentTrack.id)} className="p-2 rounded-full transition-all active:scale-90">
            <Heart className="w-5 h-5" style={{ color: fav ? '#ec4899' : '#94a3b8', fill: fav ? '#ec4899' : 'transparent' }} />
          </button>
        </div>

        {/* Seek Bar */}
        <div className="space-y-1">
          <div 
            className="h-2 bg-white/10 rounded-full overflow-hidden cursor-pointer group relative py-1" 
            onClick={(e) => { 
              if (typeof initWebAudio === 'function') initWebAudio();
              const r = e.currentTarget.getBoundingClientRect(); 
              const clickX = e.clientX - r.left;
              seek((clickX / r.width) * duration); 
            }}
          >
            <div 
              className="h-full rounded-full transition-all duration-75 relative" 
              style={{ width: `${progressPercent}%`, backgroundColor: activeColor, boxShadow: `0 0 10px ${activeColor}` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <div className="flex justify-between text-[11px] font-mono text-slate-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Buttons Bar */}
        <div className="flex items-center justify-between pt-1">
          <button 
            onClick={handleCycleMode} 
            className="p-2 rounded-full transition-all active:scale-90" 
            style={{ color: playbackMode !== 'off' ? activeColor : '#94a3b8' }} 
            title={`Mode: ${playbackMode}`}
          >
            {playbackMode === 'one' ? <Repeat1 className="w-5 h-5" /> : playbackMode === 'shuffle' ? <Shuffle className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
          </button>
          <button onClick={handlePrev} className="p-3 rounded-full hover:bg-white/10 active:scale-90 transition-all">
            <SkipBack className="w-6 h-6 fill-current" style={{ color: textColor || '#ffffff' }} />
          </button>
          <button 
            onClick={handlePlayPauseToggle} 
            className="w-14 h-14 rounded-full flex items-center justify-center text-black shadow-xl active:scale-95 transition-all" 
            style={{ backgroundColor: activeColor }}
          >
            {isPlaying ? <Pause className="w-6 h-6 fill-black" /> : <Play className="w-6 h-6 fill-black ml-0.5" />}
          </button>
          <button onClick={handleNext} className="p-3 rounded-full hover:bg-white/10 active:scale-90 transition-all">
            <SkipForward className="w-6 h-6 fill-current" style={{ color: textColor || '#ffffff' }} />
          </button>
          <button onClick={handleClose} className="p-2 rounded-full text-slate-400 hover:text-white transition-all">
            <ListMusic className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};