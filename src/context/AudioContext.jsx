import React, { createContext, useContext, useRef, useState } from 'react';

const AudioContextState = createContext(null);

export const AudioProvider = ({ children }) => {
  const audioRef = useRef(new Audio());
  const audioCtxRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const analyserNodeRef = useRef(null);
  const gainNodeRef = useRef(null);
  const eqFiltersRef = useRef([]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [volume, setVolume] = useState(1);
  const [fadeInDuration, setFadeInDuration] = useState(2);

  const initAudioNodes = () => {
    if (audioCtxRef.current) return;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContextClass();
    audioCtxRef.current = ctx;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 128;
    analyserNodeRef.current = analyser;

    const gainNode = ctx.createGain();
    gainNodeRef.current = gainNode;

    const frequencies = [60, 230, 910, 4000, 14000];
    const filters = frequencies.map((freq) => {
      const filter = ctx.createBiquadFilter();
      filter.type = freq <= 230 ? 'lowshelf' : freq >= 4000 ? 'highshelf' : 'peaking';
      filter.frequency.value = freq;
      filter.gain.value = 0;
      return filter;
    });
    eqFiltersRef.current = filters;

    const source = ctx.createMediaElementSource(audioRef.current);
    sourceNodeRef.current = source;

    let current = source;
    filters.forEach((filter) => {
      current.connect(filter);
      current = filter;
    });
    current.connect(gainNode);
    gainNode.connect(analyser);
    analyser.connect(ctx.destination);
  };

  const playTrack = (track) => {
    initAudioNodes();
    
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }

    if (currentTrack?.id !== track.id) {
      setCurrentTrack(track);
      audioRef.current.src = track.url;
    }

    const gain = gainNodeRef.current.gain;
    const ctxTime = audioCtxRef.current.currentTime;

    if (fadeInDuration > 0) {
      gain.setValueAtTime(0, ctxTime);
      gain.linearRampToValueAtTime(volume, ctxTime + fadeInDuration);
    } else {
      gain.setValueAtTime(volume, ctxTime);
    }

    audioRef.current.play();
    setIsPlaying(true);
  };

  const pauseTrack = () => {
    audioRef.current.pause();
    setIsPlaying(false);
  };

  const setEQGain = (bandIndex, gainValue) => {
    if (eqFiltersRef.current[bandIndex]) {
      eqFiltersRef.current[bandIndex].gain.value = gainValue;
    }
  };

  return (
    <AudioContextState.Provider
      value={{
        isPlaying,
        currentTrack,
        playTrack,
        pauseTrack,
        volume,
        setVolume,
        fadeInDuration,
        setFadeInDuration,
        setEQGain,
        analyserNode: analyserNodeRef.current,
      }}
    >
      {children}
    </AudioContextState.Provider>
  );
};

export const useAudio = () => useContext(AudioContextState);