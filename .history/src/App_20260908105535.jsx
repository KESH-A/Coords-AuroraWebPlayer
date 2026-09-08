import React, { useState, useRef, useEffect } from 'react';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { AudioProvider, useAudio } from './context/AudioContext';
import { GlassFilter } from './components/UI/GlassFilter';
import { SettingsModal } from './components/Settings/SettingsModal';
import { ActivePlayerModal } from './components/Player/ActivePlayerModal';
import { TrackList } from './components/Player/TrackList';
import { useLocalMusic } from './hooks/useLocalMusic';
import { Settings, User, Search, Play, Pause, Disc } from 'lucide-react';

function MainLayout() {
  const { isPlaying, currentTrack, playTrack, pauseTrack, currentTime, duration, setPlaylist } = useAudio();
  const { tracks: localTracks, isLoading, handleFolderSelect } = useLocalMusic();
  const { accentColor, textColor } = useSettings();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isActivePlayerOpen, setIsActivePlayerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);
  const mainRef = useRef(null);

  useEffect(() => {
    if (localTracks && localTracks.length > 0) {
      setPlaylist(localTracks);
    }
  }, [localTracks, setPlaylist]);

  useEffect(() => {
    if (!mainRef.current) return;
    const updateHeight = () => {
      if (mainRef.current) setContainerHeight(mainRef.current.clientHeight);
    };
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(mainRef.current);
    return () => observer.disconnect();
  }, []);

  const handleScroll = (e) => {
    setScrollTop(e.target.scrollTop);
  };

  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const filteredTracks = localTracks.filter((track) => {
    const q = searchQuery.toLowerCase();
    return (
      track.title?.toLowerCase().includes(q) ||
      track.artist?.toLowerCase().includes(q)
    );
  });

  const activeColor = accentColor || '#9333ea';

  return (
    <div
      className="h-screen w-full bg-[var(--bg-base)] transition-colors duration-500 relative overflow-hidden"
      style={{
        '--text-main': textColor || '#f8fafc',
        color: textColor || '#f8fafc',
      }}
    >
      <GlassFilter />

      <header className="fixed top-0 left-0 right-0 p-4 z-30 pointer-events-none">
        <div className="glass w-full max-w-xl mx-auto flex items-center justify-between gap-2 p-2 rounded-full glass-surface border border-white/20 shadow-xl pointer-events-auto backdrop-blur-md bg-slate-950/60">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center shrink-0 border border-white/10 active:scale-95 transition-all"
          >
            <Settings className="w-5 h-5" style={{ color: activeColor }} />
          </button>

          <div className="flex-1 min-w-0 relative flex items-center transition-all duration-300 focus-within:scale-105 focus-within:-translate-y-0.5 animate-morph-translate">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none transition-colors duration-300" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search music..."
              className="w-full bg-white/5 border border-white/10 rounded-full py-1.5 pl-9 pr-3 text-xs focus:outline-none transition-all duration-300 placeholder-slate-400 focus:bg-white/10 focus:shadow-lg"
              style={{ color: textColor || '#ffffff' }}
            />
          </div>

          <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center shrink-0 border border-white/10 active:scale-95 transition-all">
            <User className="w-5 h-5" style={{ color: activeColor }} />
          </button>
        </div>
      </header>

      <main
        ref={mainRef}
        onScroll={handleScroll}
        className="w-full h-full overflow-y-auto custom-scrollbar pt-24 pb-28 px-4 max-w-xl mx-auto"
      >
        <TrackList
          tracks={filteredTracks}
          onFolderSelect={handleFolderSelect}
          isLoading={isLoading}
          scrollTop={scrollTop}
          containerHeight={containerHeight}
        />
      </main>

      {currentTrack && (
        <div
          onClick={() => setIsActivePlayerOpen(true)}
          className="glass fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-lg p-3 rounded-3xl glass-surface border border-white/25 z-40 shadow-2xl flex items-center justify-between gap-3 cursor-pointer active:scale-[0.99] transition-all backdrop-blur-lg bg-slate-900/50"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 overflow-hidden relative"
              style={{
                backgroundColor: `${activeColor}33`,
                borderColor: `${activeColor}4d`,
              }}
            >
              <Disc
                className={`w-6 h-6 ${isPlaying ? 'animate-spin [animation-duration:6s]' : ''}`}
                style={{ color: activeColor }}
              />
            </div>
            <div className="truncate">
              <p className="text-xs font-bold truncate" style={{ color: textColor || '#ffffff' }}>
                {currentTrack.title}
              </p>
              <p className="text-[10px] text-slate-400 truncate">{currentTrack.artist || 'Unknown Artist'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
            <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            <button
              onClick={() => (isPlaying ? pauseTrack() : playTrack(currentTrack))}
              className="p-3 rounded-2xl text-white shadow-lg active:scale-95 transition-all"
              style={{ backgroundColor: activeColor }}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
            </button>
          </div>
        </div>
      )}

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onFolderSelect={handleFolderSelect}
        isLoading={isLoading}
      />

      <ActivePlayerModal
        isOpen={isActivePlayerOpen}
        onClose={() => setIsActivePlayerOpen(false)}
        tracks={localTracks}
      />
    </div>
  );
}

export function App() {
  return (
    <SettingsProvider>
      <AudioProvider>
        <MainLayout />
      </AudioProvider>
    </SettingsProvider>
  );
}

export default App;