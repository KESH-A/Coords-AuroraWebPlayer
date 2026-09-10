import React, { useEffect, useRef, useState } from 'react';
import { useAudio } from '../../context/AudioContext';
import { useSettings } from '../../context/SettingsContext';
import { useFavorites } from '../../context/FavoritesContext';
import { Play, Pause, Music, Heart } from 'lucide-react';
import defaultProfile from '../../assets/Profile.avif';

const ITEM_HEIGHT = 84;

const TrackSkeleton = ({ variant, index }) => {
  let resolved = variant;
  if (variant === 'random' || !variant) {
    const pool = ['shimmer-wave', 'pulse-glass', 'glow-fade'];
    resolved = pool[index % pool.length];
  }
  let cls = 'skeleton-shimmer-wave';
  if (resolved === 'pulse-glass') cls = 'skeleton-pulse-glass';
  else if (resolved === 'glow-fade') cls = 'skeleton-glow-fade';

  return (
    <div
      className={`skeleton-row ${cls} gpu-layer`}
      style={{ height: ITEM_HEIGHT - 10, animationDelay: (index % 8) * 90 + 'ms' }}
    >
      <div className="flex items-center gap-3.5 p-3 px-4">
        <div className="w-12 h-12 rounded-xl skeleton-block shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="h-3 w-2/3 skeleton-block" />
          <div className="h-2 w-1/3 skeleton-block" />
        </div>
        <div className="w-8 h-8 rounded-full skeleton-block shrink-0" />
      </div>
    </div>
  );
};

export const TrackList = ({ tracks, scrollTop = 0, containerHeight = 600, isLoading = false, onReorder }) => {
  const { playTrack, pauseTrack, currentTrack, isPlaying, currentTime, duration } = useAudio();
  const { scrollAnimation, accentColor, textColor, themeStyle, gradientColors, loadingAnimVariant } = useSettings();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [mounted, setMounted] = useState(false);
  const dragIndexRef = useRef(null);
  const dragMovedRef = useRef(false);

  useEffect(() => { setMounted(true); }, []);

  const getAnimationClass = () => {
    if (!scrollAnimation) return '';
    switch (scrollAnimation) {
      case 'slide-left': return 'animate-slide-left';
      case 'slide-right': return 'animate-slide-right';
      case 'slide-down': return 'animate-slide-down';
      case 'scale': return 'animate-scale-up';
      case 'morph': return 'animate-morph';
      case 'fade': return 'animate-fade-in';
      case 'slide-up': return 'animate-slide-up';
      default: return '';
    }
  };

  const animationClass = mounted ? getAnimationClass() : '';

  const activeColor = (themeStyle === 'gradient' && gradientColors && gradientColors.length >= 2)
    ? gradientColors[0]
    : (accentColor || '#9333ea');

  const itemThemeClass = themeStyle === 'glass'
    ? 'glass glass-surface'
    : themeStyle === 'gradient'
      ? 'glass-surface'
      : 'theme-transparent';

  if (isLoading) {
    return (
      <div className="w-full space-y-2.5">
        {Array.from({ length: Math.max(5, Math.min(9, Math.ceil(containerHeight / ITEM_HEIGHT))) }).map((_, i) => (
          <TrackSkeleton key={i} variant={loadingAnimVariant || 'shimmer-wave'} index={i} />
        ))}
      </div>
    );
  }

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

  const activeIndex = tracks.findIndex((t) => t.id === currentTrack?.id);
  const activeTrack = activeIndex !== -1 ? tracks[activeIndex] : null;
  const activePlaying = !!(activeTrack && isPlaying && currentTrack?.id === activeTrack.id);

  const progressPct = (duration > 0 && activeTrack && currentTrack?.id === activeTrack.id)
    ? Math.min(100, Math.max(0, (currentTime / duration) * 100))
    : 0;

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
    if (from === null || from === targetIndex || typeof onReorder !== 'function') return;
    if (!tracks) return;
    const next = [...tracks];
    const [moved] = next.splice(from, 1);
    next.splice(targetIndex, 0, moved);
    onReorder(next);
  };

  const handleDragEnd = () => {
    dragIndexRef.current = null;
    setTimeout(() => { dragMovedRef.current = false; }, 0);
  };

  return (
    <div style={{ height: `${totalHeight}px`, position: 'relative', width: '100%' }}>
      {/* Active-track glass bubble: glides between rows via `top` transition, expands to
          fill the whole card while PLAYING, collapses to a small glass pill when PAUSED. */}
      {activeTrack && (
        <div
          className="absolute left-0 right-0 pointer-events-none gpu-layer"
          style={{
            top: activeIndex * ITEM_HEIGHT,
            height: ITEM_HEIGHT - 10,
            transition: 'top 0.55s cubic-bezier(0.16, 1, 0.3, 1)',
            zIndex: 0,
          }}
        >
          <div
            className="absolute inset-0 rounded-2xl"
            style={{
              backgroundColor: activePlaying ? activeColor : 'rgba(255,255,255,0.04)',
              backdropFilter: 'blur(18px) saturate(160%)',
              WebkitBackdropFilter: 'blur(18px) saturate(160%)',
              border: `1px solid ${activeColor}${activePlaying ? 'd9' : '59'}`,
              boxShadow: activePlaying
                ? `0 10px 44px ${activeColor}66, inset 0 1px 0 rgba(255,255,255,0.35)`
                : `0 6px 26px ${activeColor}26, inset 0 1px 0 rgba(255,255,255,0.25)`,
              transform: activePlaying ? 'scale(1) translate3d(0,0,0)' : 'scale(0.84) translate3d(0,0,0)',
              opacity: activePlaying ? 1 : 0.72,
              transition: 'transform 0.5s cubic-bezier(0.34, 1.25, 0.64, 1), opacity 0.4s ease, background-color 0.4s ease, box-shadow 0.4s ease, border-color 0.4s ease',
              willChange: 'transform, opacity, background-color',
            }}
          >
            {activePlaying && (
              <div
                className="absolute inset-0 rounded-2xl"
                style={{
                  background: `linear-gradient(120deg, ${activeColor}22, transparent 45%, ${activeColor}33 100%)`,
                  mixBlendMode: 'overlay',
                  pointerEvents: 'none',
                }}
              />
            )}
          </div>
        </div>
      )}

      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          transform: `translateY(${startIndex * ITEM_HEIGHT}px) translate3d(0,0,0)`,
          willChange: 'transform',
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
              draggable
              onDragStart={(e) => handleDragStart(e, actualIndex)}
              onDragOver={(e) => handleDragOver(e, actualIndex)}
              onDrop={(e) => handleDrop(e, actualIndex)}
              onDragEnd={handleDragEnd}
              onClick={() => { if (!dragMovedRef.current) playTrack(track); }}
              style={{
                height: `${ITEM_HEIGHT - 10}px`,
                backgroundColor: isTrackPlaying ? 'transparent' : undefined,
                borderColor: isTrackPlaying ? `${activeColor}99` : undefined,
                transform: 'translate3d(0,0,0)',
                willChange: 'transform',
              }}
              className={`relative z-[1] overflow-hidden ${itemThemeClass} flex items-center justify-between p-3 px-4 rounded-2xl cursor-grab active:cursor-grabbing border backdrop-blur-xl transition-colors duration-200 active:scale-[0.98] ${animationClass} ${
                isTrackPlaying
                  ? 'text-white shadow-xl shadow-black/40'
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
                <div className="truncate flex-1 min-w-0">
                  <p
                    className="text-sm font-bold truncate"
                    style={{ color: isSelected ? '#ffffff' : (textColor || '#ffffff') }}
                  >
                    {track.title}
                  </p>
                  <p className="text-xs text-slate-400 truncate">{track.artist || 'Local Track'}</p>
                  {isSelected && (
                    <div className="mt-1.5 h-[3px] bg-white/10 rounded-full overflow-hidden" style={{ willChange: 'width' }}>
                      {/* key={track.id} forces a remount on track change → instant 0% reset,
                          no smooth glide from the previous song's duration position. */}
                      <div
                        key={track.id}
                        className="h-full rounded-full"
                        style={{
                          width: progressPct + '%',
                          backgroundColor: activeColor,
                          boxShadow: '0 0 6px ' + activeColor,
                          transition: 'width 200ms linear',
                          willChange: 'width',
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(track.id); }}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90"
                >
                  <Heart className="w-4 h-4" style={{ color: isFavorite(track.id) ? '#ec4899' : 'rgba(255,255,255,0.3)', fill: isFavorite(track.id) ? '#ec4899' : 'transparent' }} />
                </button>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isTrackPlaying) {
                      pauseTrack();
                    } else {
                      playTrack(track);
                    }
                  }}
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 border transition-all cursor-pointer hover:scale-110 active:scale-95"
                  style={{
                    backgroundColor: isTrackPlaying ? activeColor : 'rgba(255, 255, 255, 0.1)',
                    borderColor: isTrackPlaying ? activeColor : 'rgba(255, 255, 255, 0.15)',
                    boxShadow: isTrackPlaying ? `0 0 12px ${activeColor}80` : undefined,
                  }}
                >
                  {isTrackPlaying ? (
                    <Pause className="w-4 h-4 text-white fill-white" />
                  ) : (
                    <Play className="w-4 h-4 ml-0.5" style={{ color: activeColor, fill: activeColor }} />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
