import React from 'react';
import { useAudio } from '../../context/AudioContext';
import { useFavorites } from '../../context/FavoritesContext';
import { useSettings } from '../../context/SettingsContext';
import { Play, Pause, Heart, Music, ArrowLeft } from 'lucide-react';
import defaultProfile from '../../assets/Profile.avif';

export const FavoritesPage = ({ tracks, onClose }) => {
  const { playTrack, pauseTrack, currentTrack, isPlaying } = useAudio();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const { accentColor, textColor, themeStyle } = useSettings();

  const favTracks = tracks.filter((t) => favorites.includes(t.id));
  const activeColor = accentColor || '#9333ea';
  const surfaceClass = themeStyle === 'glass' ? 'glass glass-surface' : 'theme-transparent';

  return (
    <div className={`fixed inset-0 z-[250] flex flex-col animate-fade-in ${surfaceClass}`}>
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
        <span className="ml-auto text-xs text-slate-400">{favTracks.length} tracks</span>
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
            {favTracks.map((track) => {
              const isSelected = currentTrack?.id === track.id;
              const playing = isSelected && isPlaying;
              return (
                <div
                  key={track.id}
                  onClick={() => playTrack(track)}
                  className="flex items-center justify-between p-3 rounded-2xl cursor-pointer border border-white/10 bg-white/5 hover:bg-white/10 transition-all active:scale-[0.98]"
                >
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
                      {playing ? <Pause className="w-4 h-4 text-white fill-white" /> : <Play className="w-4 h-4 text-white fill-white ml-0.5" />}
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
