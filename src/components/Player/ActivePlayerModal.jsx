import React, { useState, useEffect, useRef } from 'react';
import { useAudio } from '../../context/AudioContext';
import { useSettings } from '../../context/SettingsContext';
import { useFavorites } from '../../context/FavoritesContext';
import { EqualizerPanel } from './EqualizerPanel';
import defaultProfile from '../../assets/Profile.avif';
import {
  ChevronDown, Sliders, Heart, Repeat, Repeat1, Shuffle,
  SkipBack, SkipForward, Play, Pause, ListMusic, Activity
} from 'lucide-react';

export const ActivePlayerModal = ({ isOpen, onClose, tracks = [] }) => {
  const {
    currentTrack, isPlaying, playTrack, pauseTrack, playNext, playPrev,
    seek, currentTime, duration, analyserRef, playbackMode, setPlaybackMode,
    setPlaylist, volume, setVolume,
  } = useAudio();
  const { accentColor, textColor, themeStyle } = useSettings();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [showEQ, setShowEQ] = useState(false);
  const [showSpectrum, setShowSpectrum] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [slideDirection, setSlideDirection] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [brightness, setBrightness] = useState(100);

  // Gesture state
  const [gestureType, setGestureType] = useState(null);
  const [gestureValue, setGestureValue] = useState(0);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [ripple, setRipple] = useState(null);
  const touchStart = useRef(null);
  const touchType = useRef(null);
  const lastTap = useRef(0);

  const modalRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);

  const fav = currentTrack ? isFavorite(currentTrack.id) : false;

  // Liquid animation via WAAPI
  useEffect(() => {
    const el = modalRef.current;
    if (!el) return;
    if (isOpen && !isClosing) {
      el.style.display = 'flex';
      el.animate(
        [
          { opacity: 0, transform: 'scale(0.15) translateY(60vh)', borderRadius: '50%', filter: 'blur(8px)' },
          { opacity: 1, transform: 'scale(1.12) translateY(-3vh)', borderRadius: '28px', filter: 'blur(0px)', offset: 0.35 },
          { transform: 'scale(0.94) translateY(1vh)', borderRadius: '22px', offset: 0.55 },
          { transform: 'scale(1.04) translateY(-0.5vh)', borderRadius: '18px', offset: 0.75 },
          { opacity: 1, transform: 'scale(1) translateY(0)', borderRadius: '16px', filter: 'blur(0px)' },
        ],
        { duration: 600, easing: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)', fill: 'forwards' }
      );
    }
  }, [isOpen]);

  useEffect(() => {
    const el = modalRef.current;
    if (!el) return;
    if (isClosing) {
      const anim = el.animate(
        [
          { opacity: 1, transform: 'scale(1) translateY(0)', borderRadius: '16px' },
          { transform: 'scale(1.08) translateY(-4vh)', borderRadius: '30px', offset: 0.25 },
          { opacity: 0.6, transform: 'scale(0.5) translateY(50vh)', borderRadius: '45% 45% 30% 30%', offset: 0.55 },
          { opacity: 0, transform: 'scale(0.05) translateY(90vh)', borderRadius: '50%' },
        ],
        { duration: 500, easing: 'cubic-bezier(0.68, -0.5, 0.32, 1.4)', fill: 'forwards' }
      );
      anim.onfinish = () => { setIsClosing(false); onClose(); };
    }
  }, [isClosing]);

  useEffect(() => {
    if (tracks && tracks.length > 0) setPlaylist(tracks);
  }, [tracks, setPlaylist]);

  const handleClose = () => { setIsClosing(true); };

  const handleCycleMode = () => {
    const modes = ['off', 'all', 'one', 'shuffle'];
    setPlaybackMode(modes[(modes.indexOf(playbackMode) + 1) % modes.length]);
  };

  const handleNext = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setSlideDirection('next');
    setTimeout(() => { playNext(true); setSlideDirection(''); setIsAnimating(false); }, 180);
  };

  const handlePrev = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setSlideDirection('prev');
    setTimeout(() => { playPrev(); setSlideDirection(''); setIsAnimating(false); }, 180);
  };

  // --- Touch gestures on album art ---
  const onTouchStart = (e) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY, time: Date.now() };
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
      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
        touchType.current = Math.abs(dx) > Math.abs(dy) ? 'swipe' : 'vertical';
      }
    }
    if (touchType.current === 'swipe') {
      setGestureType('swipe');
      setSwipeOffset(dx * 0.4);
    } else if (touchType.current === 'vertical') {
      const rect = e.currentTarget.getBoundingClientRect();
      const isRight = touchStart.current.x - rect.left > rect.width / 2;
      const delta = -dy;
      if (isRight) {
        setGestureType('volume');
        setGestureValue(Math.max(0, Math.min(100, volume * 100 + delta * 0.5)));
      } else {
        setGestureType('brightness');
        setGestureValue(Math.max(20, Math.min(100, brightness + delta * 0.5)));
      }
    }
  };

  const onTouchEnd = (e) => {
    if (!touchStart.current) return;
    const start = touchStart.current;
    const elapsed = Date.now() - start.time;
    const dx = (e.changedTouches[0]?.clientX || start.x) - start.x;
    const dy = (e.changedTouches[0]?.clientY || start.y) - start.y;

    if (!touchType.current && elapsed < 250) {
      // Tap detection
      const now = Date.now();
      if (now - lastTap.current < 300) {
        // Double tap
        if (isPlaying) pauseTrack(); else playTrack(currentTrack);
        setRipple({ x: start.x, y: start.y, id: now });
        setTimeout(() => setRipple(null), 600);
        lastTap.current = 0;
      } else {
        lastTap.current = now;
      }
    } else if (touchType.current === 'swipe') {
      if (dx < -50) handleNext();
      else if (dx > 50) handlePrev();
    } else if (touchType.current === 'vertical') {
      const rect = e.currentTarget.getBoundingClientRect();
      const isRight = start.x - rect.left > rect.width / 2;
      if (isRight) setVolume(gestureValue / 100);
      else setBrightness(gestureValue);
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
    return mins + ':' + (secs < 10 ? '0' : '') + secs;
  };

  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;
  const activeColor = accentColor || '#f59e0b';
  const modalThemeClass = themeStyle === 'glass' ? 'glass' : 'theme-transparent';

  if (!isOpen && !isClosing) return null;

  return (
    <div
      ref={modalRef}
      className={`${modalThemeClass} fixed inset-0 z-[200] bg-[#070913]/90 backdrop-blur-3xl flex flex-col justify-between p-6 select-none liquid-goo-active`}
      style={{ color: textColor || '#ffffff', display: 'none' }}
    >
      <div className="flex items-center justify-between w-full max-w-md mx-auto">
        <button onClick={handleClose} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all active:scale-95">
          <ChevronDown className="w-6 h-6" style={{ color: textColor || '#cbd5e1' }} />
        </button>
        <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Playing Now</span>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowSpectrum(!showSpectrum)} className="w-9 h-9 rounded-full flex items-center justify-center transition-all bg-white/5 hover:bg-white/10" style={{ color: showSpectrum ? activeColor : '#94a3b8' }}>
            <Activity className="w-4 h-4" />
          </button>
          <button onClick={() => setShowEQ(!showEQ)} className="w-9 h-9 rounded-full flex items-center justify-center transition-all" style={{ backgroundColor: showEQ ? activeColor : 'rgba(255,255,255,0.05)', color: showEQ ? '#000' : '#cbd5e1' }}>
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
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              className="w-64 h-64 sm:w-72 sm:h-72 rounded-3xl bg-slate-900 border border-white/15 shadow-2xl overflow-hidden relative cursor-grab active:cursor-grabbing"
              style={{
                transform: `translateX(${swipeOffset}px) rotate(${swipeOffset * 0.02}deg)`,
                transition: gestureType === 'swipe' ? 'none' : 'transform 0.2s ease',
                willChange: 'transform',
                touchAction: 'none',
              }}
            >
              <img src={currentTrack?.cover || defaultProfile} alt="Album Cover" className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = defaultProfile; }} />
              {gestureType === 'volume' && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                  <div className="w-2 h-24 bg-white/20 rounded-full overflow-hidden flex items-end">
                    <div className="w-full rounded-full transition-all duration-75" style={{ height: gestureValue + '%', backgroundColor: activeColor }} />
                  </div>
                  <span className="text-xs font-bold text-white">{Math.round(gestureValue)}%</span>
                </div>
              )}
              {gestureType === 'brightness' && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                  <div className="w-2 h-24 bg-white/20 rounded-full overflow-hidden flex items-end">
                    <div className="w-full rounded-full transition-all duration-75" style={{ height: gestureValue + '%', backgroundColor: '#fbbf24' }} />
                  </div>
                  <span className="text-xs font-bold text-white">{Math.round(gestureValue)}%</span>
                </div>
              )}
              {ripple && (
                <span key={ripple.id} className="absolute rounded-full border-2 border-white/60 animate-ping pointer-events-none" style={{ left: ripple.x - 40, top: ripple.y - 40, width: 80, height: 80 }} />
              )}
            </div>
            {showSpectrum && (
              <div className={`w-full h-12 p-2 border border-white/10 flex items-center justify-center overflow-hidden rounded-2xl ${themeStyle === 'glass' ? 'glass bg-white/5' : 'bg-white/5 backdrop-blur-md'}`}>
                <canvas ref={canvasRef} className="w-full h-full" />
              </div>
            )}
          </div>
        )}
      </div>

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
        <div className="space-y-1">
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden cursor-pointer group" onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); seek(((e.clientX - r.left) / r.width) * duration); }}>
            <div className="h-full rounded-full transition-all duration-75 relative" style={{ width: progressPercent + '%', backgroundColor: activeColor, boxShadow: '0 0 10px ' + activeColor }}>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <div className="flex justify-between text-[11px] font-mono text-slate-400"><span>{formatTime(currentTime)}</span><span>{formatTime(duration)}</span></div>
        </div>
        <div className="flex items-center justify-between pt-1">
          <button onClick={handleCycleMode} className="p-2 rounded-full transition-all active:scale-90" style={{ color: playbackMode !== 'off' ? activeColor : '#94a3b8' }} title={'Mode: ' + playbackMode}>
            {playbackMode === 'one' ? <Repeat1 className="w-5 h-5" /> : playbackMode === 'shuffle' ? <Shuffle className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
          </button>
          <button onClick={handlePrev} className="p-3 rounded-full hover:bg-white/10 active:scale-90 transition-all"><SkipBack className="w-6 h-6 fill-current" style={{ color: textColor || '#ffffff' }} /></button>
          <button onClick={() => (isPlaying ? pauseTrack() : playTrack(currentTrack))} className="w-14 h-14 rounded-full flex items-center justify-center text-black shadow-xl active:scale-95 transition-all" style={{ backgroundColor: activeColor }}>
            {isPlaying ? <Pause className="w-6 h-6 fill-black" /> : <Play className="w-6 h-6 fill-black ml-0.5" />}
          </button>
          <button onClick={handleNext} className="p-3 rounded-full hover:bg-white/10 active:scale-90 transition-all"><SkipForward className="w-6 h-6 fill-current" style={{ color: textColor || '#ffffff' }} /></button>
          <button onClick={handleClose} className="p-2 rounded-full text-slate-400 hover:text-white transition-all"><ListMusic className="w-5 h-5" /></button>
        </div>
      </div>
    </div>
  );
};
