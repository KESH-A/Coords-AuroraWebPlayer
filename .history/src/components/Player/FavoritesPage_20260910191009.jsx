import React, { useRef, useState } from 'react';
import { useAudio } from '../../context/AudioContext';
import { useFavorites } from '../../context/FavoritesContext';
import { useSettings } from '../../context/SettingsContext';
import { Play, Pause, Heart, Music, ArrowLeft } from 'lucide-react';
import defaultProfile from '../../assets/Profile.avif';

export const FavoritesPage = ({ tracks, onClose }) => {
  const { playTrack, pauseTrack, currentTrack, isPlaying } = useAudio();
  const { favorites, toggleFavorite, isFavorite, reorderFavorites, clearAllFavorites } = useFavorites();
  const { accentColor, textColor, themeStyle } = useSettings();

  const [selectedIds, setSelectedIds] = useState([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const dragIndexRef = useRef(null);
  const dragMovedRef = useRef(false);

  const favTracks = favorites
    .map((id) => tracks.find((t) => t.id === id))
    .filter(Boolean);

  const handleDragStart = (e, index) => {
    dragIndexRef.current = index;
    dragMovedRef.current = true;
    try {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(index));
    } catch (err) {}
  };

  const handleDragOver = (e, index) => {
    if (dragIndexRef.current === null) return;
    e.preventDefault();
    e.stopPropagation();
    try { e.dataTransfer.dropEffect = 'move'; } catch (err) {}
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    e.stopPropagation();
    const from = dragIndexRef.current;
    dragIndexRef.current = null;
    if (from === null || from === targetIndex) return;
    const next = [...favTracks];
    const [moved] = next.splice(from, 1);
    next.splice(targetIndex, 0, moved);
    reorderFavorites(next.map((t) => t.id));
  };

  const handleDragEnd = () => {
    dragIndexRef.current = null;
    setTimeout(() => { dragMovedRef.current = false; }, 0);
  };

  const activeColor = accentColor || '#9333ea';
  // surfaceClass tanımını değiştir:
const surfaceClass = themeStyle === 'glass-surface' 
  ? 'bg-[#070913]/85 backdrop-blur-3xl border border-white/10' 
  : 'theme-transparent';

  return (
    <div className={`fixed inset-0 z-[250] overflow-hidden rounded-none! flex flex-col animate-fade-in ${surfaceClass}`}>
      <div className="flex items-center gap-3 p-4 pt-6">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center active:scale-95 transition-all"
        >
          <ArrowLeft className="w-5 h-5" style={{ color: activeColor }} />
        </button>
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 fill-current" style={{ color: activeColor }} />
          <h1 className="text-lg font-bold" style={{ color: textColor || '#fff' }}>Favorites</h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {favTracks.length > 0 && (
            <>
              <button onClick={() => setIsSelectMode(!isSelectMode)} className="text-[10px] font-bold px-2 py-1 rounded-full transition-all" style={{ backgroundColor: isSelectMode ? activeColor : 'rgba(255,255,255,0.1)', color: isSelectMode ? '#000' : '#94a3b8' }}>
                {isSelectMode ? 'Cancel' : 'Select'}
              </button>
              {isSelectMode ? (
                <button onClick={() => { selectedIds.forEach(id => toggleFavorite(id)); setSelectedIds([]); }} className="text-[10px] font-bold px-2 py-1 rounded-full bg-red-500/80 text-white">Remove ({selectedIds.length})</button>
              ) : (
                <button onClick={() => { if (window.confirm('Clear all favorites?')) clearAllFavorites(); }} className="text-[10px] font-bold px-2 py-1 rounded-full bg-red-500/80 text-white">Clear All</button>
              )}
            </>
          )}
          <span className="text-xs text-slate-400 font-semibold">{favTracks.length} {favTracks.length === 1 ? 'track' : 'tracks'}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-28">
        {favTracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3">
            <Heart className="w-12 h-12 opacity-30" />
            <p className="text-xs">No favorites yet</p>
            <p className="text-[10px] opacity-60">Tap the heart on any track to add it here</p>
          </div>
        ) : (
          <div className="space-y-2 pt-2">
            {favTracks.map((track, index) => {
              const isSelected = currentTrack?.id === track.id;
              const playing = isSelected && isPlaying;
              return (
                <div
                  key={track.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  onClick={() => { if (dragMovedRef.current) return; isSelectMode ? setSelectedIds(prev => prev.includes(track.id) ? prev.filter(x => x !== track.id) : [...prev, track.id]) : playTrack(track); }}
                  className="flex items-center justify-between p-3 rounded-2xl cursor-grab active:cursor-grabbing border border-white/10 bg-white/5 hover:bg-white/10 transition-all active:scale-[0.98] gpu-layer"
                >
                  {isSelectMode && (
                    <div className="w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mr-2" style={{ borderColor: selectedIds.includes(track.id) ? activeColor : 'rgba(255,255,255,0.3)', backgroundColor: selectedIds.includes(track.id) ? activeColor : 'transparent' }}>
                      {selectedIds.includes(track.id) && <span className="text-[10px] font-bold text-white">✓</span>}
                    </div>
                  )}
                  <div className="flex items-center gap-3 truncate">
                    <div className="w-11 h-11 rounded-xl overflow-hidden bg-slate-900 border border-white/15 shrink-0">
                      <img
                        src={track.cover || defaultProfile}
                        alt="Cover"
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.onerror = null; e.target.src = defaultProfile; }}
                      />
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-bold truncate" style={{ color: textColor || '#fff' }}>{track.title}</p>
                      <p className="text-xs text-slate-400 truncate">{track.artist || 'Local Track'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(track.id); }}
                      className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-all"
                    >
                      <Heart className="w-4 h-4 fill-current" style={{ color: activeColor }} />
                    </button>
                    <div
                      onClick={(e) => { e.stopPropagation(); playing ? pauseTrack() : playTrack(track); }}
                      className="w-9 h-9 rounded-full flex items-center justify-center border transition-all cursor-pointer"
                      style={{ backgroundColor: playing ? activeColor : 'rgba(255,255,255,0.1)', borderColor: playing ? activeColor : 'rgba(255,255,255,0.15)' }}
                    >
                      {playing ? <Pause className="w-4 h-4 text-white fill-white" /> : <Play className="w-4 h-4 ml-0.5" style={{ color: activeColor, fill: activeColor }} />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
