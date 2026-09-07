import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { useSettings } from './SettingsContext';

const AudioContext = createContext();

export const AudioProvider = ({ children }) => {
  const { fadeInTime } = useSettings();
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef(new Audio());
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const gainNodeRef = useRef(null);
  const bandsRef = useRef([]);
  const fadeIntervalRef = useRef(null);

  const initWebAudio = () => {
    if (audioCtxRef.current) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 32; // Kasma yapmaması için düşük FFT boyutu
      
      const gain = ctx.createGain();
      const source = ctx.createMediaElementSource(audioRef.current);

      // 5-Bant EQ Filtre Grubu
      const freqs = [60, 230, 910, 4000, 14000];
      const filters = freqs.map((f, i) => {
        const filter = ctx.createBiquadFilter();
        filter.type = i === 0 ? 'lowshelf' : i === 4 ? 'highshelf' : 'peaking';
        filter.frequency.value = f;
        filter.gain.value = 0;
        return filter;
      });

      // Zirincir Bağlantısı: Source -> Filters -> Gain -> Analyser -> Destination
      let current = source;
      filters.forEach((filter) => {
        current.connect(filter);
        current = filter;
      });
      current.connect(gain);
      gain.connect(analyser);
      analyser.connect(ctx.destination);

      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      gainNodeRef.current = gain;
      bandsRef.current = filters;
    } catch (e) {}
  };

  const setEQBands = (gains) => {
    if (!bandsRef.current.length) return;
    gains.forEach((g, i) => {
      if (bandsRef.current[i]) bandsRef.current[i].gain.value = g;
    });
  };

  useEffect(() => {
    const audio = audioRef.current;
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const playTrack = (track) => {
    if (!track) return;
    initWebAudio();

    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }

    const audio = audioRef.current;
    const audioSource = track.src || track.url;

    if (currentTrack?.id !== track.id) {
      if (audioSource.startsWith('http')) audio.crossOrigin = 'anonymous';
      else audio.removeAttribute('crossorigin');
      audio.src = audioSource;
      setCurrentTrack(track);
    }

    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);

    if (fadeInTime > 0) {
      audio.volume = 0;
      audio.play().then(() => {
        setIsPlaying(true);
        const step = 0.05;
        const intervalTime = (fadeInTime * 1000) / (1 / step);
        fadeIntervalRef.current = setInterval(() => {
          if (audio.volume + step >= 1) {
            audio.volume = 1;
            clearInterval(fadeIntervalRef.current);
          } else {
            audio.volume += step;
          }
        }, intervalTime);
      }).catch(() => {});
    } else {
      audio.volume = 1;
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const pauseTrack = () => {
    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
    audioRef.current.pause();
    setIsPlaying(false);
  };

  const seek = (time) => {
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  return (
    <AudioContext.Provider
      value={{
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        playTrack,
        pauseTrack,
        seek,
        audioRef,
        analyserRef,
        setEQBands,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => useContext(AudioContext);