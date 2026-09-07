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

  // 60 FPS Optimize Edilmiş & Otomatik Resync Yapan Spectrum Loop
  useEffect(() => {
    if (!isOpen || showEQ || !showSpectrum || !canvasRef.current || !analyserRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const analyser = analyserRef.current;
    
    // Frekans verisi boyutlandırması
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    let isActive = true;

// ... üst kısımlar aynı ...
    const renderSpectrum = () => {
      if (!isActive) return;

      animFrameRef.current = requestAnimationFrame(renderSpectrum);

      if (isPlaying) {
        analyser.getByteFrequencyData(dataArray);
      } else {
        for (let i = 0; i < dataArray.length; i++) {
          dataArray[i] = Math.max(0, dataArray[i] - 6);
        }
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Sütun sayısı yarıya indirildi (14)
      const barCount = 14; 
      const barWidth = (canvas.width / barCount) * 0.6;
      const gap = (canvas.width / barCount) * 0.4;
      let x = gap / 2;

      for (let i = 0; i < barCount; i++) {
        const val = dataArray[i * 2] || 0; // Her 2 frekanstan birini alarak dolgun gösteriyoruz
        const barHeight = Math.max(6 * dpr, (val / 255) * canvas.height);

        ctx.fillStyle = accentColor || '#f59e0b';
        ctx.beginPath();
        
        if (ctx.roundRect) {
          ctx.roundRect(x, canvas.height - barHeight, barWidth, barHeight, [6 * dpr, 6 * dpr, 0, 0]);
        } else {
          ctx.rect(x, canvas.height - barHeight, barWidth, barHeight);
        }
        ctx.fill();

        x += barWidth + gap;
      }
    };


    renderSpectrum();

    return () => {
      isActive = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isOpen, isPlaying, showEQ, showSpectrum, accentColor, currentTrack]); // currentTrack eklenerek donma sorunu çözüldü

  if (!isOpen || !currentTrack) return null;

  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div
      className={`fixed inset-0 z-[200] bg-[#070913]/90 backdrop-blur-3xl text-white flex flex-col justify-between p-6 select-none ${
        isClosing ? 'animate-mac-shrink' : 'animate-mac-expand'
      }`}
    >
      {/* Üst Bar */}
      <div className="flex items-center justify-between w-full max-w-md mx-auto">
        <button
          onClick={handleClose}
          className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all active:scale-95"
        >
          <ChevronDown className="w-6 h-6 text-slate-300" />
        </button>

        <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
          Playing Now
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSpectrum(!showSpectrum)}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all bg-white/5 hover:bg-white/10"
            style={{ color: showSpectrum ? accentColor : '#94a3b8' }}
          >
            <Activity className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowEQ(!showEQ)}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
            style={{
              backgroundColor: showEQ ? accentColor : 'rgba(255,255,255,0.05)',
              color: showEQ ? '#000' : '#cbd5e1',
            }}
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Orta Alan: Albüm Kapağı & Spectrum */}
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
              <div className="w-full h-12 bg-white/5 rounded-2xl p-2 border border-white/10 flex items-center justify-center">
                <canvas ref={canvasRef} className="w-full h-full" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Alt Bilgi & Oynatıcı Kontrolleri */}
      <div className="w-full max-w-md mx-auto space-y-5">
        <div 
          className={`flex items-center justify-between transition-all duration-200 ${
            slideDirection ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
          }`}
        >
          <div className="truncate pr-4">
            <h3 className="text-base font-bold text-white truncate">{currentTrack.title}</h3>
            <p className="text-xs text-slate-400 truncate mt-0.5">{currentTrack.artist || 'Local Track'}</p>
          </div>
          <button onClick={() => setIsFavorite(!isFavorite)} className="p-2 rounded-full hover:bg-white/5 transition-all">
            <Heart
              className="w-5 h-5 transition-all"
              style={{
                color: isFavorite ? accentColor : '#94a3b8',
                fill: isFavorite ? accentColor : 'none',
              }}
            />
          </button>
        </div>

        {/* İlerleme Çubuğu */}
        <div className="space-y-1">
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime || 0}
            onChange={(e) => seek(Number(e.target.value))}
            className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
            style={{ accentColor }}
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Butonlar */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => setRepeatMode(repeatMode === 'off' ? 'all' : repeatMode === 'all' ? 'one' : 'off')}
            className="p-2 rounded-full transition-all"
            style={{ color: repeatMode !== 'off' ? accentColor : '#94a3b8' }}
          >
            {repeatMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
          </button>

          <button onClick={handlePrev} className="p-3 rounded-full text-white hover:bg-white/10 active:scale-90 transition-all">
            <SkipBack className="w-6 h-6 fill-white" />
          </button>

          <button
            onClick={() => (isPlaying ? pauseTrack() : playTrack(currentTrack))}
            className="w-14 h-14 rounded-full flex items-center justify-center text-black shadow-xl active:scale-95 transition-all"
            style={{ backgroundColor: accentColor }}
          >
            {isPlaying ? <Pause className="w-6 h-6 fill-black" /> : <Play className="w-6 h-6 fill-black ml-0.5" />}
          </button>

          <button onClick={handleNext} className="p-3 rounded-full text-white hover:bg-white/10 active:scale-90 transition-all">
            <SkipForward className="w-6 h-6 fill-white" />
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