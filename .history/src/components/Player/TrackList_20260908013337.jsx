import React from 'react';
import { useAudio } from '../../context/AudioContext';
import { useSettings } from '../../context/SettingsContext';
import { Play, Pause, Music } from 'lucide-react';
import defaultProfile from '../../assets/Profile.avif';

const ITEM_HEIGHT = 84;

export const TrackList = ({ tracks, scrollTop = 0, containerHeight = 600 }) => {
  const { playTrack, currentTrack, isPlaying } = useAudio();
  const { scrollAnimation, accentColor, textColor, themeStyle } = useSettings();

  const getAnimationClass = () => {
    switch (scrollAnimation) {
      case 'slide-left': return 'animate-slide-left';
      case 'slide-right': return 'animate-slide-right';
      case 'slide-down': return 'animate-slide-down';
      case 'scale': return 'animate-scale-up';
      case 'morph': return 'animate-morph';
      case 'fade': return 'animate-fade-in';
      default: return 'animate-slide-up';
    }
  };

  if (!tracks || tracks.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-10 text-slate-500">
        <Music className="w-12 h-12 mb-2 opacity-40" />
        <p className="text-xs font-medium">No tracks found</p>
      </div>
    );
  }

  const visibleCount = Math.ceil(containerHeight / ITEM_HEIGHT);
  const totalHeight = tracks.length * ITEM_HEIGHT;

  const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - 3);
  const endIndex = Math.min(tracks.length, startIndex + visibleCount + 6);
  const visibleTracks = tracks.slice(startIndex, endIndex);

  const activeColor = accentColor || '#9333ea';

  return (
    <div style={{ height: `${totalHeight}px`, position: 'relative', width: '100%' }}>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          transform: `translateY(${startIndex * ITEM_HEIGHT}px)`,
        }}
        className="space-y-2.5"
      >
        {visibleTracks.map((track, i) => {
          const actualIndex = startIndex + i;
          const isSelected = currentTrack?.id === track.id;
          const isTrackPlaying = isSelected && isPlaying;

          return (
            <div
              key={track.id || actualIndex}
              onClick={() => playTrack(track)}
              style={{
                height: `${ITEM_HEIGHT - 10}px`,
                backgroundColor: isSelected ? `${activeColor}40` : undefined,
                borderColor: isSelected ? `${activeColor}80` : undefined,
              }}
              className={`glass flex items-center justify-between p-3 px-4 rounded-2xl cursor-pointer border backdrop-blur-xl transition-all duration-200 active:scale-[0.98] ${getAnimationClass()} ${
                isSelected
                  ? 'text-white shadow-xl shadow-purple-950/40'
                  : 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-3.5 truncate">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-900 border border-white/15 shrink-0 shadow-md">
                  <img
                    src={track.cover || defaultProfile}
                    alt="Cover"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = defaultProfile;
                    }}
                  />
                </div>

                <div className="truncate">
                  <p
                    className="text-sm font-bold truncate"
                    style={{ color: isSelected ? '#ffffff' : (textColor || '#ffffff') }}
                  >
                    {track.title}
                  </p>
                  <p className="text-xs text-slate-400 truncate mt-1">{track.artist || 'Local Track'}</p>
                </div>
              </div>

              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 border transition-all"
                style={{
                  backgroundColor: isTrackPlaying ? activeColor : 'rgba(255, 255, 255, 0.1)',
                  borderColor: isTrackPlaying ? activeColor : 'rgba(255, 255, 255, 0.15)',
                  boxShadow: isTrackPlaying ? `0 0 12px ${activeColor}80` : undefined,
                }}
              >
                {isTrackPlaying ? (
                  <Pause className="w-4 h-4 text-white fill-white" />
                ) : (
                  <Play className="w-4 h-4 text-amber-400 fill-amber-400 ml-0.5" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};