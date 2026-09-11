import React, { useRef, useState } from 'react';
import { useAudio } from '../../context/AudioContext';
import { useFavorites } from '../../context/FavoritesContext';
import { useSettings } from '../../context/SettingsContext';
import { Play, Pause, Heart, ArrowLeft } from 'lucide-react';
import defaultProfile from '../../assets/Profile.avif';

export const FavoritesPage = ({ tracks = [], onClose }) => {
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

  const activeColor = accentColor || '#a855f7';
  const isGlass = themeStyle === 'glass';

  return (
    <div 
      className={`fixed inset-0 z-[250] overflow-hidden flex flex-col animate-fade-in select-none ${
        isGlass ? 'glass-modal' : 'bg-[#070913]'
      }`}
      style={{ color: textColor || '#ffffff' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 pt-6 max-w-md mx-auto w-full z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className={`w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-all ${
              isGlass ? 'glass' : 'bg-white/10'
            }`}
          >
            <ArrowLeft className="w-5 h-5" style={{ color: activeColor }} />
          </button>
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 fill-current" style={{ color: activeColor }} />
            <h1 className="text-lg font-bold tracking-wide">Favorites</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {favTracks.length > 0 && (
            <>
              <button 
                onClick={() => setIsSelectMode(!isSelectMode)} 
                className={`text-[11px] font-bold px-3 py-1 rounded-full transition-all border border-white/10 ${
                  isSelectMode ? '' : isGlass ? 'glass-surface' : 'bg-white/10'
                }`}
                style={{ 
                  backgroundColor: isSelectMode ? activeColor : undefined, 
                  color: isSelectMode ? '#000' : '#cbd5e1'
                }}
              >
                {isSelectMode ? 'Cancel' : 'Select'}
              </button>
              {isSelectMode ? (
                <button 
                  onClick={() => { selectedIds.forEach(id => toggleFavorite(id)); setSelectedIds([]); }} 
                  className="text-[11px] font-bold px-3 py-1 rounded-full bg-red-500/80 text-white shadow-lg"
                >
                  Remove ({selectedIds.length})
                </button>
              ) : (
                <button 
                  onClick={() => { if (window.confirm('Clear all favorites?')) clearAllFavorites(); }} 
                  className="text-[11px] font-bold px-3 py-1 rounded-full bg-red-500/80 text-white"
                >
                  Clear All
                </button>
              )}
            </>
          )}
          <span className="text-xs text-slate-400 font-medium">{favTracks.length} tracks</span>
        </div>
      </div>

      {/* Track List */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-28 max-w-md mx-auto w-full relative">
        {favTracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3 relative z-10">
            <div className={`p-5 rounded-3xl ${isGlass ? 'glass-surface' : 'bg-white/5 border border-white/10'}`}>
              <Heart className="w-12 h-12 opacity-50" style={{ color: activeColor }} />
            </div>
            <p className="text-sm font-semibold tracking-wide text-slate-200">No favorites yet</p>
            <p className="text-xs text-slate-400">Tap the heart on any track to add it here</p>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
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
                  onClick={() => { 
                    if (dragMovedRef.current) return; 
                    isSelectMode 
                      ? setSelectedIds(prev => prev.includes(track.id) ? prev.filter(x => x !== track.id) : [...prev, track.id]) 
                      : playTrack(track); 
                  }}
                  className={`flex items-center justify-between p-3.5 rounded-[28px] cursor-grab active:cursor-grabbing transition-all duration-300 active:scale-[0.98] ${
                    isGlass ? (playing ? 'glass' : 'glass-surface') : 'bg-white/5 border border-white/10'
                  }`}
                  style={playing ? { borderColor: activeColor, boxShadow: `0 0 20px ${activeColor}40` } : {}}
                >
                  {isSelectMode && (
                    <div 
                      className="w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 mr-2 transition-all" 
                      style={{ 
                        borderColor: selectedIds.includes(track.id) ? activeColor : 'rgba(255,255,255,0.3)', 
                        backgroundColor: selectedIds.includes(track.id) ? activeColor : 'transparent' 
                      }}
                    >
                      {selectedIds.includes(track.id) && <span className="text-[10px] font-bold text-black">✓</span>}
                    </div>
                  )}

                  <div className="flex items-center gap-3.5 truncate">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 shadow-lg border border-white/20">
                      <img
                        src={track.cover || defaultProfile}
                        alt="Cover"
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.onerror = null; e.target.src = defaultProfile; }}
                      />
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-bold truncate tracking-wide" style={{ color: textColor || '#ffffff' }}>
                        {track.title}
                      </p>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{track.artist || 'Local Track'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(track.id); }}
                      className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-all"
                    >
                      <Heart className="w-4 h-4 fill-current" style={{ color: activeColor }} />
                    </button>
                    <div
                      onClick={(e) => { e.stopPropagation(); playing ? pauseTrack() : playTrack(track); }}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 ${
                        !playing && isGlass ? 'glass' : ''
                      }`}
                      style={{ 
                        backgroundColor: playing ? activeColor : undefined, 
                        border: playing ? `1px solid ${activeColor}` : undefined,
                        boxShadow: playing ? `0 0 20px ${activeColor}` : undefined
                      }}
                    >
                      {playing ? (
                        <Pause className="w-4 h-4 text-black fill-black" />
                      ) : (
                        <Play className="w-4 h-4 ml-0.5" style={{ color: activeColor, fill: activeColor }} />
                      )}
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