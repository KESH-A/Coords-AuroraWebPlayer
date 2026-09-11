import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { useSettings } from './SettingsContext';
import { loadPersistedState, savePersistedState } from '../utils/persistence';

const AudioCtx = createContext();

export const AudioProvider = ({ children }) => {
  const { lockScreenControls, audioPreloading, crossfadeDuration } = useSettings();

  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackMode, setPlaybackModeState] = useState('off');
  const [playlist, setPlaylistState] = useState([]);

  const slotA = useRef(new Audio());
  const slotB = useRef(new Audio());
  const currentSlotRef = useRef('A');
  const isCrossfading = useRef(false);
  const crossfadeTimer = useRef(null);
  const pendingNextTrack = useRef(null);

  const preloadAudioRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const masterGainRef = useRef(null);
  const crossfadeGainA = useRef(null);
  const crossfadeGainB = useRef(null);
  const bandsRef = useRef([]);
  const playedHistoryRef = useRef([]);
  const isGoingBackRef = useRef(false); // Geri sarma aksiyonu takibi
  const mutedRef = useRef(false);

  const playbackModeRef = useRef(playbackMode);
  const playlistRef = useRef(playlist);
  const currentTrackRef = useRef(currentTrack);
  const volumeRef = useRef(1);
  const persistedTrackIdRef = useRef(null);
  const crossfadeDurRef = useRef(crossfadeDuration);

  useEffect(() => {
    crossfadeDurRef.current = crossfadeDuration;
  }, [crossfadeDuration]);

  useEffect(() => {
    const saved = loadPersistedState();
    if (saved.playbackMode) setPlaybackModeState(saved.playbackMode);
    if (typeof saved.volume === 'number') setVolume(saved.volume);
    if (saved.currentTrackId) persistedTrackIdRef.current = saved.currentTrackId;
  }, []);

  useEffect(() => {
    savePersistedState({ playbackMode, volume });
  }, [playbackMode, volume]);

  useEffect(() => {
    if (playlist.length > 0 && persistedTrackIdRef.current && !currentTrack) {
      const found = playlist.find(t => t.id === persistedTrackIdRef.current);
      if (found) {
        setCurrentTrack(found);
        currentTrackRef.current = found;
      }
    }
  }, [playlist, currentTrack]);

  useEffect(() => {
    if (currentTrack) {
      savePersistedState({ currentTrackId: currentTrack.id });
    }
  }, [currentTrack]);

  const activeEl = () => currentSlotRef.current === 'A' ? slotA.current : slotB.current;
  const inactiveEl = () => currentSlotRef.current === 'A' ? slotB.current : slotA.current;
  const activeCG = () => currentSlotRef.current === 'A' ? crossfadeGainA.current : crossfadeGainB.current;
  const inactiveCG = () => currentSlotRef.current === 'A' ? crossfadeGainB.current : crossfadeGainA.current;

  const setPlaybackMode = (mode) => {
    playbackModeRef.current = mode;
    setPlaybackModeState(mode);
  };

  const setPlaylist = (tracks) => {
    const list = Array.isArray(tracks) ? tracks : [];
    playlistRef.current = list;
    setPlaylistState(list);
  };

  const setVolume = (v) => {
    const clamped = Math.min(1, Math.max(0, v));
    setVolumeState(clamped);
    volumeRef.current = clamped;
    if (!mutedRef.current) {
      if (slotA.current) slotA.current.volume = clamped;
      if (slotB.current) slotB.current.volume = clamped;
    }
    if (masterGainRef.current) masterGainRef.current.gain.value = clamped;
  };

  const toggleMute = () => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setIsMuted(next);
    const effective = next ? 0 : volumeRef.current;
    if (slotA.current) slotA.current.volume = effective;
    if (slotB.current) slotB.current.volume = effective;
    if (masterGainRef.current) masterGainRef.current.gain.value = effective;
  };

  const initWebAudio = () => {
    if (audioCtxRef.current) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      const ctx = new AC();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64; // Spectrum hassasiyet artırıldı
      const masterGain = ctx.createGain();

      const srcA = ctx.createMediaElementSource(slotA.current);
      const srcB = ctx.createMediaElementSource(slotB.current);

      const cgA = ctx.createGain();
      const cgB = ctx.createGain();
      cgA.gain.value = 1;
      cgB.gain.value = 0;

      const freqs = [60, 230, 910, 4000, 14000];
      const filters = freqs.map((f, i) => {
        const filter = ctx.createBiquadFilter();
        filter.type = i === 0 ? 'lowshelf' : i === 4 ? 'highshelf' : 'peaking';
        filter.frequency.value = f;
        filter.gain.value = 0;
        return filter;
      });

      srcA.connect(cgA);
      srcB.connect(cgB);
      cgA.connect(filters[0]);
      cgB.connect(filters[0]);

      let node = filters[0];
      for (let i = 1; i < filters.length; i++) {
        node.connect(filters[i]);
        node = filters[i];
      }
      node.connect(masterGain);
      masterGain.connect(analyser);
      analyser.connect(ctx.destination);

      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      masterGainRef.current = masterGain;
      crossfadeGainA.current = cgA;
      crossfadeGainB.current = cgB;
      bandsRef.current = filters;
    } catch (e) {}
  };

  const setEQBands = (gains) => {
    if (!bandsRef.current.length) return;
    gains.forEach((g, i) => {
      if (bandsRef.current[i]) bandsRef.current[i].gain.value = g;
    });
  };

  const setBassBoost = (val) => {
    const clamped = Math.min(100, Math.max(0, Number(val)));
    const gain = (clamped - 40) / 20 * 6;
    if (bandsRef.current[0]) bandsRef.current[0].gain.value = gain;
  };

  const setLoudness = (val) => {
    const clamped = Math.min(100, Math.max(0, Number(val)));
    const gain = (clamped - 60) / 40 * 6;
    if (bandsRef.current[4]) bandsRef.current[4].gain.value = gain;
  };

  const getNextTrackToPlay = () => {
    const list = playlistRef.current;
    if (!list || list.length === 0) return null;
    const cur = currentTrackRef.current;
    const idx = list.findIndex((t) => t.id === cur?.id);
    const mode = playbackModeRef.current;
    if (mode === 'shuffle') {
      if (list.length > 1) {
        let r = Math.floor(Math.random() * (list.length - 1));
        if (idx !== -1 && r >= idx) r++;
        return list[r];
      }
      return list[0];
    }
    if (mode === 'one') return cur || list[0];
    if (mode === 'all') return list[(idx + 1) % list.length];
    if (idx !== -1 && idx + 1 < list.length) return list[idx + 1];
    return null;
  };

  const equalPowerCurve = (steps, out) => {
    const arr = new Float32Array(steps);
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      arr[i] = out ? Math.cos(t * Math.PI / 2) : Math.sin(t * Math.PI / 2);
    }
    return arr;
  };

  const startCrossfade = () => {
    if (isCrossfading.current) return;
    if (crossfadeTimer.current) { clearTimeout(crossfadeTimer.current); crossfadeTimer.current = null; }
    const next = getNextTrackToPlay();
    if (!next) return;
    const ctx = audioCtxRef.current;
    const otherEl = inactiveEl();
    const otherGain = inactiveCG();
    const curGain = activeCG();
    if (!ctx || !otherGain || !curGain) return;

    otherEl.src = next.url || next.src;
    otherEl.currentTime = 0;
    otherEl.volume = volumeRef.current;
    pendingNextTrack.current = next;
    isCrossfading.current = true;

    const dur = crossfadeDurRef.current;
    const steps = 64;
    const outCurve = equalPowerCurve(steps, true);
    const inCurve = equalPowerCurve(steps, false);

    otherEl.play().then(() => {
      if (ctx.state === 'suspended') ctx.resume();
      const now = ctx.currentTime;
      curGain.gain.cancelScheduledValues(now);
      curGain.gain.setValueAtTime(curGain.gain.value, now);
      otherGain.gain.cancelScheduledValues(now);
      otherGain.gain.setValueAtTime(0, now);
      curGain.gain.setValueCurveAtTime(outCurve, now, dur);
      otherGain.gain.setValueCurveAtTime(inCurve, now, dur);
      if (crossfadeTimer.current) clearTimeout(crossfadeTimer.current);
      crossfadeTimer.current = setTimeout(() => completeCrossfade(), dur * 1000);
    }).catch(() => { isCrossfading.current = false; pendingNextTrack.current = null; });
  };

  const completeCrossfade = () => {
    if (crossfadeTimer.current) { clearTimeout(crossfadeTimer.current); crossfadeTimer.current = null; }
    if (!isCrossfading.current) return;
    isCrossfading.current = false;

    const ctx = audioCtxRef.current;
    const newActiveEl = inactiveEl();
    const oldActiveEl = activeEl();

    oldActiveEl.pause();
    oldActiveEl.src = '';
    try { oldActiveEl.load(); } catch (e) {}

    currentSlotRef.current = currentSlotRef.current === 'A' ? 'B' : 'A';

    if (ctx) {
      const now = ctx.currentTime;
      const newCG = activeCG();
      const oldCG = inactiveCG();
      if (newCG) { newCG.gain.cancelScheduledValues(now); newCG.gain.setValueAtTime(1, now); }
      if (oldCG) { oldCG.gain.cancelScheduledValues(now); oldCG.gain.setValueAtTime(0, now); }
    }

    if (pendingNextTrack.current) {
      const _oldTrack = currentTrackRef.current;
      if (_oldTrack && !isGoingBackRef.current) {
        playedHistoryRef.current.push(_oldTrack);
      }
      setCurrentTrack(pendingNextTrack.current);
      currentTrackRef.current = pendingNextTrack.current;
      pendingNextTrack.current = null;
    }

    const otherEl = inactiveEl();
    otherEl.pause();
    otherEl.src = '';
    try { otherEl.load(); } catch (e) {}

    preloadNextTrack();
  };

  const cancelCrossfade = () => {
    if (crossfadeTimer.current) { clearTimeout(crossfadeTimer.current); crossfadeTimer.current = null; }
    if (isCrossfading.current) {
      const otherEl = inactiveEl();
      otherEl.pause();
      otherEl.src = '';
      isCrossfading.current = false;
      pendingNextTrack.current = null;
      const ctx = audioCtxRef.current;
      if (ctx) {
        const now = ctx.currentTime;
        const cgA = crossfadeGainA.current;
        const cgB = crossfadeGainB.current;
        if (cgA) { cgA.gain.cancelScheduledValues(now); cgA.gain.setValueAtTime(1, now); }
        if (cgB) { cgB.gain.cancelScheduledValues(now); cgB.gain.setValueAtTime(0, now); }
      }
    }
  };

  const playTrack = (track, isBackOperation = false) => {
    if (!track) return;
    initWebAudio();
    cancelCrossfade();
    cleanupPreload();
    const audio = activeEl();
    const src = track.url || track.src;
    
    if (currentTrackRef.current?.id !== track.id) {
      const _prevTrack = currentTrackRef.current;
      if (_prevTrack && !isBackOperation) {
        playedHistoryRef.current.push(_prevTrack);
      }
      audio.src = src;
      audio.load();
    }
    
    audio.volume = volumeRef.current;
    const cg = activeCG();
    const icg = inactiveCG();
    const ctx = audioCtxRef.current;
    if (ctx && cg && icg) {
      const now = ctx.currentTime;
      cg.gain.cancelScheduledValues(now);
      cg.gain.setValueAtTime(1, now);
      icg.gain.cancelScheduledValues(now);
      icg.gain.setValueAtTime(0, now);
    }
    
    setCurrentTrack(track);
    currentTrackRef.current = track;
    audio.play().then(() => {
      setIsPlaying(true);
      const ctx2 = audioCtxRef.current;
      if (ctx2 && ctx2.state === 'suspended') ctx2.resume();
      preloadNextTrack();
    }).catch(() => {});
  };

  const pauseTrack = () => {
    activeEl().pause();
    setIsPlaying(false);
  };

  const seek = (time) => {
    const audio = activeEl();
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const playNext = (manual) => {
    cancelCrossfade();
    const list = playlistRef.current;
    if (!list || list.length === 0) return;
    const cur = currentTrackRef.current;
    const idx = list.findIndex((t) => t.id === cur?.id);
    const mode = playbackModeRef.current;
    let nextIdx = -1;
    if (mode === 'one') {
      if (manual) nextIdx = (idx + 1) % list.length;
      else { const a = activeEl(); a.currentTime = 0; a.play().then(() => setIsPlaying(true)).catch(() => {}); return; }
    } else if (mode === 'all') {
      nextIdx = (idx + 1) % list.length;
    } else if (mode === 'shuffle') {
      if (list.length > 1) { let r = Math.floor(Math.random() * (list.length - 1)); if (idx !== -1 && r >= idx) r++; nextIdx = r; }
      else nextIdx = 0;
    } else {
      if (idx !== -1 && idx + 1 < list.length) nextIdx = idx + 1;
      else if (idx !== -1 && idx + 1 >= list.length) nextIdx = 0;
    }
    if (nextIdx >= 0 && nextIdx < list.length) playTrack(list[nextIdx]);
  };

  const playPrev = () => {
    cancelCrossfade();
    const audio = activeEl();
    if (audio.currentTime > 3) { 
      audio.currentTime = 0; 
      setCurrentTime(0); 
      return; 
    }

    const list = playlistRef.current;
    if (!list || list.length === 0) return;
    const cur = currentTrackRef.current;
    const idx = list.findIndex((t) => t.id === cur?.id);
    
    // Doğrudan playlist sıralamasına göre geriye gitme mantığı
    const prevIdx = idx > 0 ? idx - 1 : list.length - 1;
    playTrack(list[prevIdx], true);
  };

  const cleanupPreload = () => {
    if (preloadAudioRef.current) {
      preloadAudioRef.current.pause();
      preloadAudioRef.current.src = '';
      preloadAudioRef.current.load();
    }
  };

  const preloadNextTrack = () => {
    if (!audioPreloading) return;
    const next = getNextTrackToPlay();
    if (!next || next.id === currentTrackRef.current?.id) return;
    const nextSource = next.url || next.src;
    if (!preloadAudioRef.current) preloadAudioRef.current = new Audio();
    const preloader = preloadAudioRef.current;
    if (preloader.src !== nextSource) {
      preloader.preload = 'auto';
      preloader.src = nextSource;
      preloader.volume = 0;
      preloader.load();
    }
  };

  useEffect(() => {
    const handleTimeUpdate = () => {
      const audio = activeEl();
      if (!audio || isNaN(audio.duration)) return;
      setCurrentTime(audio.currentTime);
      setDuration(audio.duration);
      const dur = crossfadeDurRef.current;
      if (dur > 0 && !isCrossfading.current && audio.duration > 0 &&
          audio.currentTime >= audio.duration - dur && audio.duration - audio.currentTime < dur + 0.5) {
        startCrossfade();
      }
    };
    const handleLoadedMetadata = () => {
      const audio = activeEl();
      if (audio && !isNaN(audio.duration)) setDuration(audio.duration);
    };
    const handleEnded = () => {
      if (isCrossfading.current) { completeCrossfade(); return; }
      const dur = crossfadeDurRef.current;
      if (dur <= 0) playNext(false);
    };
    const slots = [slotA.current, slotB.current];
    const cleanup = () => {
      slots.forEach((el) => {
        if (!el) return;
        el.removeEventListener('timeupdate', handleTimeUpdate);
        el.removeEventListener('loadedmetadata', handleLoadedMetadata);
        el.removeEventListener('ended', handleEnded);
      });
    };
    cleanup();
    slots.forEach((el) => {
      if (!el) return;
      el.addEventListener('timeupdate', handleTimeUpdate);
      el.addEventListener('loadedmetadata', handleLoadedMetadata);
      el.addEventListener('ended', handleEnded);
    });
    return cleanup;
  }, [audioPreloading, playbackMode]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    if (!lockScreenControls) {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = 'none';
      try {
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('previoustrack', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
        navigator.mediaSession.setActionHandler('seekto', null);
      } catch (e) {}
      return;
    }
    if (currentTrack) {
      const artworkList = [];
      if (currentTrack.cover) {
        artworkList.push(
          { src: currentTrack.cover, sizes: '96x96', type: 'image/png' },
          { src: currentTrack.cover, sizes: '256x256', type: 'image/png' },
          { src: currentTrack.cover, sizes: '512x512', type: 'image/png' }
        );
      }
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title || 'Unknown Title',
        artist: currentTrack.artist || 'Aurora Player',
        album: currentTrack.album || 'Local Music',
        artwork: artworkList,
      });
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
      if ('setPositionState' in navigator.mediaSession && duration > 0) {
        try {
          navigator.mediaSession.setPositionState({
            duration: Math.max(0, duration),
            playbackRate: 1,
            position: Math.min(Math.max(0, currentTime), duration),
          });
        } catch (e) {}
      }
      try {
        navigator.mediaSession.setActionHandler('play', () => { if (currentTrackRef.current) playTrack(currentTrackRef.current); });
        navigator.mediaSession.setActionHandler('pause', () => pauseTrack());
        navigator.mediaSession.setActionHandler('previoustrack', () => playPrev());
        navigator.mediaSession.setActionHandler('nexttrack', () => playNext(true));
        navigator.mediaSession.setActionHandler('seekto', (details) => { if (details.seekTime !== undefined) seek(details.seekTime); });
      } catch (e) {}
    }
  }, [currentTrack, isPlaying, lockScreenControls, duration]);

  useEffect(() => {
    let raf = 0;
    let lastReported = -1;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const el = activeEl();
      if (!el) return;
      const t = el.currentTime;
      if (!isNaN(t) && Math.abs(t - lastReported) > 0.03) {
        lastReported = t;
        setCurrentTime(t);
        if (!isNaN(el.duration)) setDuration(el.duration);
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <AudioCtx.Provider
      value={{
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        playbackMode,
        setPlaybackMode,
        playlist,
        setPlaylist,
        playTrack,
        pauseTrack,
        playNext,
        playPrev,
        seek,
        audioRef: slotA,
        audioRefB: slotB,
        analyserRef,
        setEQBands,
        setBassBoost,
        setLoudness,
        volume,
        setVolume,
        isMuted,
        toggleMute,
      }}
    >
      {children}
    </AudioCtx.Provider>
  );
};

export const useAudio = () => useContext(AudioCtx);