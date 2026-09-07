import React, { useState } from 'react';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { AudioProvider, useAudio } from './context/AudioContext';
import { GlassFilter } from './components/UI/GlassFilter';
import { SettingsModal } from './components/Settings/SettingsModal';
import { EqualizerPanel } from './components/Player/EqualizerPanel';
import { VisualizerCanvas } from './components/Player/VisualizerCanvas';
import { TrackList } from './components/Player/TrackList';
import { useLocalMusic } from './hooks/useLocalMusic';
import { Settings as SettingsIcon, Music, Sliders, Play, Pause, Volume2 } from 'lucide-react';

// Test için birkaç hazır demo şarkı (Klasör yüklemeden de denemek için)
const DEMO_TRACKS = [
  {
    id: 'demo-1',
    title: 'SoundHelix Song 1',
    artist: 'SoundHelix Demo',
    album: 'Online Demo',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    isLocal: false,
  },
  {
    id: 'demo-2',
    title: 'SoundHelix Song 2',
    artist: 'SoundHelix Demo',
    album: 'Online Demo',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    isLocal: false,
  },
];

function MainLayout() {
  const { glassStyle } = useSettings();
  const { isPlaying, currentTrack, playTrack, pauseTrack, volume, setVolume } = useAudio();
  const { tracks: localTracks, isLoading, handleFolderSelect } = useLocalMusic();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Yerel klasör yüklendiyse onu, yoksa demo listeyi göster
  const displayTracks = localTracks.length > 0 ? localTracks : DEMO_TRACKS;

  return (
    <div className="min-h-screen w-full bg-[var(--bg-base)] text-slate-100 p-4 md:p-8 flex flex-col items-center justify-between relative overflow-x-hidden transition-colors duration-500">
      
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--primary-color)] opacity-20 rounded-full blur-3xl pointer-events-none transition-all duration-700" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--accent-color)] opacity-15 rounded-full blur-3xl pointer-events-none transition-all duration-700" />

      {/* Secret SVG Filter for Glass Surface Texture */}
      <GlassFilter />

      {/* Header */}
      <header className={`w-full max-w-5xl p-4 md:p-6 rounded-3xl ${glassStyle} border border-white/10 flex items-center justify-between z-10 mb-6`}>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-[var(--primary-color)]/20 text-[var(--primary-color)] border border-[var(--primary-color)]/30">
            <Music className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">AuroraWebPlayer</h1>
            <p className="text-xs text-slate-400">PWA & Mobile Media Engine</p>
          </div>
        </div>

        <button
          onClick={() => setIsSettingsOpen(true)}
          className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all active:scale-95 flex items-center gap-2 text-xs font-semibold"
        >
          <SettingsIcon className="w-5 h-5 text-[var(--primary-color)]" />
          <span className="hidden sm:inline">Settings</span>
        </button>
      </header>

      {/* Main Dashboard Grid */}
      <main className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-6 z-10 mb-24">
        
        {/* Left Column: Track List */}
        <div className="lg:col-span-2 flex flex-col items-center">
          <TrackList
            tracks={displayTracks}
            onFolderSelect={handleFolderSelect}
            isLoading={isLoading}
          />
        </div>

        {/* Right Column: Audio Hardware Controls (Visualizer & EQ) */}
        <div className="flex flex-col gap-6 items-center">
          
          {/* Visualizer Card */}
          <div className={`w-full p-6 rounded-3xl ${glassStyle} border border-white/10 space-y-4`}>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <span>Realtime Spectrum</span>
              <span className="text-[var(--primary-color)] font-mono">60 FPS Canvas</span>
            </div>
            <VisualizerCanvas />
          </div>

          {/* Equalizer Panel */}
          <EqualizerPanel />

        </div>
      </main>

      {/* Floating Player Control Bar */}
      {currentTrack && (
        <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-4xl p-4 rounded-3xl ${glassStyle} border border-white/15 z-40 shadow-2xl flex items-center justify-between gap-4 backdrop-blur-2xl`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-3 rounded-2xl bg-[var(--primary-color)]/20 text-[var(--primary-color)] shrink-0">
              <Music className="w-5 h-5" />
            </div>
            <div className="truncate">
              <p className="text-sm font-semibold text-white truncate">{currentTrack.title}</p>
              <p className="text-xs text-slate-400 truncate">{currentTrack.artist}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4 shrink-0">
            <button
              onClick={() => (isPlaying ? pauseTrack() : playTrack(currentTrack))}
              className="p-3 rounded-2xl bg-[var(--primary-color)] text-white shadow-lg shadow-[var(--primary-color)]/30 hover:scale-105 active:scale-95 transition-all"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
            </button>
          </div>

          {/* Volume Slider */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <Volume2 className="w-4 h-4 text-slate-400" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-20 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[var(--primary-color)]"
            />
          </div>
        </div>
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
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