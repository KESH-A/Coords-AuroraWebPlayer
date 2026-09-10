import React, { useState, useRef, useEffect } from 'react';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { AudioProvider, useAudio } from './context/AudioContext';
import { FavoritesProvider, useFavorites } from './context/FavoritesContext';
import { GlassFilter } from './components/UI/GlassFilter';
import { SettingsModal } from './components/Settings/SettingsModal';
import { ActivePlayerModal } from './components/Player/ActivePlayerModal';
import { TrackList } from './components/Player/TrackList';
import { FavoritesPage } from './components/Player/FavoritesPage';
import { VisualizerCanvas } from './components/Player/VisualizerCanvas';
import { DynamicCanvasBackground } from './components/UI/DynamicCanvasBackground';
import { useLocalMusic } from './hooks/useLocalMusic';
import { App as CapApp } from '@capacitor/app';
import { Settings, User, Search, Play, Pause, Disc, Heart, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';

function MainLayout() {
  const { isPlaying, currentTrack, playTrack, pauseTrack, currentTime, duration, setPlaylist, playNext, playPrev, seek, isMuted, toggleMute } = useAudio();
  const { tracks: localTracks, isLoading, handleFolderSelect, isImporting, reorderTracks } = useLocalMusic();
  const { accentColor, textColor, themeStyle, bgColor, gradientColors, visualizer, dynamicCanvasBg } = useSettings();
  const { isFavorite } = useFavorites();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPlayerModalOpen, setIsActivePlayerOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);
  const mainRef = useRef(null);

  // Global keyboard shortcuts: Space (play/pause), ←/→ (seek ±5s), M (mute).
  useEffect(() => {
    const isEditable = (el) => el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
    const handler = (e) => {
      if (isEditable(e.target)) return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (currentTrack) {
          if (isPlaying) pauseTrack(); else playTrack(currentTrack);
        }
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        if (duration > 0) seek(Math.max(0, currentTime - 5));
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        if (duration > 0) seek(Math.min(duration, currentTime + 5));
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        toggleMute();
      }
    };
    window.addEventListener('keydown', handler, { passive: false });
    return () => window.removeEventListener('keydown', handler);
  }, [isPlaying, currentTrack, currentTime, duration, pauseTrack, playTrack, seek, toggleMute]);

  useEffect(() => {
    if (localTracks && localTracks.length > 0) setPlaylist(localTracks);
  }, [localTracks, setPlaylist]);

  useEffect(() => {
    if (!mainRef.current || typeof ResizeObserver === 'undefined') return;
    const update = () => { if (mainRef.current) setContainerHeight(mainRef.current.clientHeight); };
    update();
    const obs = new ResizeObserver(update);
    obs.observe(mainRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    try {
      CapApp.addListener('backButton', ({ canGoBack }) => {
        if (isFavoritesOpen) { setIsFavoritesOpen(false); return; }
        if (favoritesOnly) { setFavoritesOnly(false); return; }
        if (isPlayerModalOpen) { setIsActivePlayerOpen(false); return; }
        if (isSettingsOpen) { setIsSettingsOpen(false); return; }
        if (canGoBack) window.history.back(); else CapApp.exitApp();
      });
      return () => { CapApp.removeAllListeners(); };
    } catch (e) {}
  }, [favoritesOnly, isPlayerModalOpen, isSettingsOpen, isFavoritesOpen]);

  useEffect(() => {
    const req = async () => {
      try {
        if (window.Capacitor?.isNativePlatform()) {
          const { Permissions } = window.Capacitor;
          if (Permissions?.request) await Permissions.request({ name: 'storage' });
        }
      } catch (e) {}
    };
    req();
  }, []);

  useEffect(() => {
    const anyOpen = isPlayerModalOpen || isSettingsOpen || isFavoritesOpen || favoritesOnly;
    document.body.style.overflow = anyOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isPlayerModalOpen, isSettingsOpen, isFavoritesOpen, favoritesOnly]);

  const handleScroll = (e) => setScrollTop(e.target.scrollTop);

  const fmt = (t) => {
    if (!t || isNaN(t)) return '0:00';
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  };

  const filtered = localTracks.filter((tr) => {
    if (favoritesOnly && !isFavorite(tr.id)) return false;
    const q = searchQuery.toLowerCase();
    return tr.title?.toLowerCase().includes(q) || tr.artist?.toLowerCase().includes(q);
  });

  const activeColor = themeStyle === 'gradient' && gradientColors.length >= 2 ? gradientColors[0] : (accentColor || '#9333ea');
  const surf = themeStyle === 'glass' ? 'glass glass-surface' : themeStyle === 'gradient' ? 'glass-modal' : 'theme-transparent';
  const pct = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  return (
    <div className="h-screen w-full transition-colors duration-500 relative overflow-x-hidden overflow-y-visible" style={{ '--bg-base': bgColor || '#0f172a', color: textColor || '#f8fafc', backgroundColor: bgColor || '#0f172a' }}>
      <GlassFilter />

      <header className="fixed top-0 left-0 right-0 p-4 z-30 pointer-events-none">
        <div className={'w-full max-w-xl mx-auto flex items-center justify-between gap-2 p-2 rounded-full border border-white/20 shadow-xl pointer-events-auto backdrop-blur-md bg-slate-950/60 ' + surf}>
          <button onClick={() => setIsSettingsOpen(true)} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center shrink-0 border border-white/10 active:scale-95 transition-all">
            <Settings className="w-5 h-5" style={{ color: activeColor }} />
          </button>

          <div className="flex-1 min-w-0 relative flex items-center max-w-xs mx-auto">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search music..." className="w-full bg-white/5 border border-white/10 rounded-full py-1.5 pl-9 pr-3 text-xs focus:outline-none transition-all duration-300 placeholder-slate-400 focus:bg-white/10" style={{ color: textColor || '#ffffff' }} />
          </div>

          <button onClick={() => setIsFavoritesOpen(true)} className={`w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center shrink-0 border border-white/10 active:scale-95 transition-all ${favoritesOnly ? 'ring-2 ring-pink-500/60' : ''}`} title="Favorites">
            <Heart className="w-5 h-5" style={{ color: favoritesOnly ? '#ec4899' : activeColor, fill: favoritesOnly ? '#ec4899' : 'transparent' }} />
          </button>

          <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center shrink-0 border border-white/10 active:scale-95 transition-all">
            <User className="w-5 h-5" style={{ color: activeColor }} />
          </button>
        </div>
      </header>

      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {dynamicCanvasBg && <DynamicCanvasBackground />}
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-purple-600/30 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-pink-500/25 blur-[120px]" />
        <div className="absolute top-[40%] right-[20%] w-[30vw] h-[30vw] rounded-full bg-cyan-500/20 blur-[100px]" />
      </div>

      <main ref={mainRef} onScroll={handleScroll} className="w-full h-full overflow-y-auto no-scrollbar pt-24 pb-32 px-4 max-w-xl mx-auto relative z-10">
        <div key={favoritesOnly ? 'fav-list' : 'all-list'} className="w-full animate-morph-translate">
          <TrackList tracks={filtered} isLoading={isLoading} scrollTop={scrollTop} containerHeight={containerHeight} onReorder={(ordered) => { if (filtered.length === localTracks.length) reorderTracks(ordered); }} />
        </div>
      </main>

      {currentTrack && (
        <div onClick={() => setIsActivePlayerOpen(true)} className="fixed bottom-0 left-0 right-0 z-40 cursor-pointer" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          <div className={'mx-auto max-w-xl border-t border-x border-white/20 rounded-t-3xl shadow-2xl backdrop-blur-xl bg-slate-900/80 ' + surf} style={{ borderBottom: 'none' }}>
            {visualizer && (
              <div className="px-3 pt-1.5 gpu-layer">
                <VisualizerCanvas />
              </div>
            )}
            <div className="flex items-center justify-between gap-3 p-3 pb-2.5">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: activeColor + '33', borderColor: activeColor + '4d', borderWidth: 1 }}>
                  <Disc className={'w-6 h-6 ' + (isPlaying ? 'animate-spin [animation-duration:6s]' : '')} style={{ color: activeColor }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold truncate" style={{ color: textColor || '#fff' }}>{currentTrack.title}</p>
                  <p className="text-[10px] text-slate-400 truncate">{currentTrack.artist || 'Unknown'}</p>
                  <div className="mt-1.5 h-[3px] bg-white/10 rounded-full overflow-hidden cursor-pointer active:scale-x-105 transition-transform" style={{ willChange: 'transform' }}>
                    <div className="h-full rounded-full transition-all duration-200 ease-linear" style={{ width: pct + '%', backgroundColor: activeColor, boxShadow: '0 0 8px ' + activeColor, willChange: 'width' }} />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 sm:gap-3" onClick={(e) => e.stopPropagation()}>
                <span className="text-[10px] font-mono text-slate-400 hidden lg:inline">{fmt(currentTime)} / {fmt(duration)}</span>
                <button onClick={(e) => { e.stopPropagation(); toggleMute(); }} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all" style={{ color: activeColor }} title="Mute (M)">
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <button onClick={(e) => { e.stopPropagation(); playPrev(); }} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all" style={{ color: activeColor }} title="Previous">
                  <SkipBack className="w-4 h-4" />
                </button>
                <button onClick={() => isPlaying ? pauseTrack() : playTrack(currentTrack)} className="p-3 rounded-2xl text-white shadow-lg active:scale-95 transition-all" style={{ backgroundColor: activeColor }}>
                  {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
                </button>
                <button onClick={(e) => { e.stopPropagation(); playNext(true); }} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all" style={{ color: activeColor }} title="Next">
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        onFolderSelect={(e) => {
          const list = Array.from(e?.target?.files || e || []);
          if (list.length > 0) handleFolderSelect(list);
        }} 
        isLoading={isLoading} 
        isImporting={isImporting} 
      />
      <ActivePlayerModal isOpen={isPlayerModalOpen} onClose={() => setIsActivePlayerOpen(false)} tracks={localTracks} />

      {isFavoritesOpen && (
        <>
          <div className="fixed inset-0 z-[240] bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setIsFavoritesOpen(false)} />
          <FavoritesPage tracks={localTracks} onClose={() => setIsFavoritesOpen(false)} />
        </>
      )}
    </div>
  );
}

export function App() {
  return (
    <SettingsProvider>
      <AudioProvider>
        <FavoritesProvider>
          <MainLayout />
        </FavoritesProvider>
      </AudioProvider>
    </SettingsProvider>
  );
}

export default App;