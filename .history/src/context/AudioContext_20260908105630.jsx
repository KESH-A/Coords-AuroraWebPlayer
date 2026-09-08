import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { useSettings } from './SettingsContext';

const AudioContext = createContext();

export const AudioProvider = ({ children }) => {
  const { lockScreenControls, audioPreloading } = useSettings();

  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackMode, setPlaybackModeState] = useState('off');
  const [playlist, setPlaylistState] = useState([]);

  const audioRef = useRef(new Audio());
  const preloadAudioRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const gainNodeRef = useRef(null);
  const bandsRef = useRef([]);

  const playbackModeRef = useRef(playbackMode);
  const playlistRef = useRef(playlist);
  const currentTrackRef = useRef(currentTrack);

  const setPlaybackMode = (mode) => {
    playbackModeRef.current = mode;
    setPlaybackModeState(mode);
  };

  const setPlaylist = (tracks) => {
    const list = Array.isArray(tracks) ? tracks : [];
    playlistRef.current = list;
    setPlaylistState(list);
  };

  const initWebAudio = () => {
    if (audioCtxRef.current) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 32;

      const gain = ctx.createGain();
      const source = ctx.createMediaElementSource(audioRef.current);

      const freqs = [60, 230, 910, 4000, 14000];
      const filters = freqs.map((f, i) => {
        const filter = ctx.createBiquadFilter();
        filter.type = i === 0 ? 'lowshelf' : i === 4 ? 'highshelf' : 'peaking';
        filter.frequency.value = f;
        filter.gain.value = 0;
        return filter;
      });

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

  const getNextTrackToPlay = () => {
    const list = playlistRef.current;
    if (!list || list.length === 0) return null;

    const current = currentTrackRef.current;
    const currentIndex = list.findIndex((t) => t.id === current?.id);
    const mode = playbackModeRef.current;

    if (mode === 'shuffle') {
      if (list.length > 1) {
        let randIdx = Math.floor(Math.random() * (list.length - 1));
        if (currentIndex !== -1 && randIdx >= currentIndex) randIdx++;
        return list[randIdx];
      }
      return list[0];
    }

    if (mode === 'one') {
      return current || list[0];
    }

    if (mode === 'all') {
      const nextIndex = (currentIndex + 1) % list.length;
      return list[nextIndex];
    }

    if (currentIndex !== -1 && currentIndex + 1 < list.length) {
      return list[currentIndex + 1];
    }
    return null;
  };

  const preloadNextTrack = () => {
    if (!audioPreloading) return;
    const nextTrack = getNextTrackToPlay();
    if (!nextTrack) return;

    const nextSource = nextTrack.src || nextTrack.url;
    if (!nextSource) return;

    if (!preloadAudioRef.current) {
      preloadAudioRef.current = new Audio();
    }
    const preloader = preloadAudioRef.current;
    if (preloader.src !== nextSource) {
      preloader.preload = 'auto';
      preloader.src = nextSource;
      preloader.load();
    }
  };

  const playTrack = (track) => {
    if (!track) return;
    initWebAudio();

    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }

    const audio = audioRef.current;
    const audioSource = track.src || track.url;

    if (currentTrackRef.current?.id !== track.id) {
      if (audioSource.startsWith('http')) audio.crossOrigin = 'anonymous';
      else audio.removeAttribute('crossorigin');
      audio.src = audioSource;
      currentTrackRef.current = track;
      setCurrentTrack(track);
    }

    audio.volume = 1;
    audio.play().then(() => setIsPlaying(true)).catch(() => {});
    audio.play().then(() => {
      setIsPlaying(true);
      preloadNextTrack();
    }).catch(() => {});
  };

  const pauseTrack = () => {
    audioRef.current.pause();
    setIsPlaying(false);
  };

  const seek = (time) => {
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const playNext = (manual = false) => {
    const list = playlistRef.current;
    if (!list || list.length === 0) return;

    const current = currentTrackRef.current;
    const currentIndex = list.findIndex((t) => t.id === current?.id);
    const mode = playbackModeRef.current;

    if (mode === 'shuffle') {
      if (list.length > 1) {
        let randIdx = Math.floor(Math.random() * (list.length - 1));
        if (currentIndex !== -1 && randIdx >= currentIndex) randIdx++;
        playTrack(list[randIdx]);
      } else {
        playTrack(list[0]);
      }
      return;
    }

    if (mode === 'one') {
      if (manual) {
        const nextIndex = (currentIndex + 1) % list.length;
        playTrack(list[nextIndex]);
      } else {
        const audio = audioRef.current;
        audio.currentTime = 0;
        audio.play().then(() => setIsPlaying(true)).catch(() => {});
      }
      return;
    }

    if (mode === 'all') {
      const nextIndex = (currentIndex + 1) % list.length;
      playTrack(list[nextIndex]);
      return;
    }

    if (currentIndex !== -1 && currentIndex + 1 < list.length) {
      playTrack(list[currentIndex + 1]);
    } else if (manual) {
      playTrack(list[0]);
    } else {
      setIsPlaying(false);
    }
  };

  const playPrev = () => {
    const audio = audioRef.current;
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      setCurrentTime(0);
      return;
    }

    const list = playlistRef.current;
    if (!list || list.length === 0) return;

    const current = currentTrackRef.current;
    const currentIndex = list.findIndex((t) => t.id === current?.id);
    const prevIndex = (currentIndex - 1 + list.length) % list.length;
    playTrack(list[prevIndex]);
  };

  useEffect(() => {
    const audio = audioRef.current;
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration && audio.currentTime > audio.duration * 0.75) {
        preloadNextTrack();
      }
    };
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => {
      playNext(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);
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
        navigator.mediaSession.setActionHandler('play', () => {
          if (currentTrackRef.current) playTrack(currentTrackRef.current);
        });
        navigator.mediaSession.setActionHandler('pause', () => {
          pauseTrack();
        });
        navigator.mediaSession.setActionHandler('previoustrack', () => {
          playPrev();
        });
        navigator.mediaSession.setActionHandler('nexttrack', () => {
          playNext(true);
        });
        navigator.mediaSession.setActionHandler('seekto', (details) => {
          if (details.seekTime !== undefined) {
            seek(details.seekTime);
          }
        });
      } catch (e) {}
    }
  }, [currentTrack, isPlaying, lockScreenControls, duration]);

  return (
    <AudioContext.Provider
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
export const useAudio = () => useContext(AudioContext);