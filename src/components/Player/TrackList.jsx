import React, {useRef} from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useAudio} from "../../context/AudioContext";
import {useSettings} from "../../context/SettingsContext";
import {Play, Pause, Music, FolderPlus} from "lucide-react"


export const TrackList = ({ tracks, onFolderSelect, isLoading }) => {
    const parentRef = useRef(null);
    const {currentTrack, isPlaying, playTrack, pauseTrack } = useAudio();
    const {scrollAnimation, glassyStyle} = useSettings();


    const rowVirtualizer = useVirtualizer({
        count: tracks.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 72,
        overscan: 5,
    });

    const getAnimationClass = () => {
        switch (scrollAnimation) {
            case "fade":
                return "transition-opacity duration-300 opacity-90 hover:opacity-100";
            case "scale":
                return "transition-transform duration-300 hover:scale-[1.01] active:scale-[0.99]";
            case "morph":
                return "transition-all duration-300 hover:rounded-3xl";
            case "slide":
                return "transition-transform duration-300 hover:translate-x-2";
            default:
                return "";
        }
    };

    return (
        <div className={`w-full max-w-2xl p-6 rounded-3xl ${glassyStyle} border border-white/10 space-y-4`}>
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Music className="w-5 h-5 text-purple-400"/>
                        Track Library
                    </h3>
                    <p className="text-xs text-slate-400">{tracks.length} tracks(s) loaded</p>
                </div>

                <label className="cursor-pointer px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-all shadow-lg shadow-purple-500/25 flex items-center gap-2 active:scale-95">
                    <FolderPlus className="w-4 h-4"/>
                    <span>Import Music Folder</span>
                    <input 
                        type="file" 
                        webkitdirectory="true"
                        directory="true"
                        multiple
                        onChange={onFolderSelect}
                        className="hidden"
                    />
                </label>
            </div>

            {isLoading ? (
                <div className="h-96 flex items-center justify-center text-slate-400 text-sm "> 
                    Loading library tracks...
                </div>
            ) : tracks.length === 0 ? (
                <div className="h-96 flex flex-col items-center justify-center gap-3 text-slate-500 border-2 border-dashed border-white/5 rounded-2xl">
                    <Music className="w-10 h-10 stroke-1"/>
                    <p className="text-sm">No tracks in library. Select a local folder to begin.</p>
                </div>
            ) : (
                <div 
                    ref={parentRef}
                    className="h-[480px] overflow-y-auto pr-2 space-y-2 custom-scrollbar"
                >
                    <div
                        style={{
                            height: `${rowVirtualizer.getTotalSize()}px`,
                            width: "100%",
                            position: "relative",
                        }}
                    >
                        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                            const track = tracks[virtualRow.index];
                            const isCurrent = currentTrack?.id === track.id;

                            return (
                                <div 
                                    key={virtualRow.key}
                                    style={{
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        width: "100%",
                                        height: `${virtualRow.size}px`,
                                        transform: `translateY(${virtualRow.start}px)`,
                                    }}
                                    className="p-1"
                                >
                                    <div
                                        onClick={() => (isCurrent && isPlaying ? pauseTrack : playTrack(track))}
                                        className={`w-full h-full px-4 flex items-center justify-between rounded-2xl cursor-pointer border ${getAnimationClass()} 
                                        ${isCurrent
                                        ? "bg-purple-500/20 border-purple-500/50 text-white"
                                        : "bg-white/5 hover:bg-white/10 border-white/5 text-slate-300"
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <button className="p-2 rounded-xl bg-white/10 text-white shrink-0">
                                                {isCurrent && isPlaying ? (
                                                    <Pause className="w-4 h-4 fill-white"/>
                                                ) : (
                                                    <Play className="w-4 h-4 fill-white ml-0.5"/>
                                                )}
                                            </button>
                                            <div className="truncate">
                                                <p className={`text-sm font-medium truncate ${isCurrent ? "text-purple-300" : "text-slate-100"}`}>
                                                    {track.title}
                                                </p>
                                                <p className="text-xs text-slate-400 truncate">{track.artist}</p>
                                            </div>
                                        </div>

                                        <span className="text-[10px] uppercase font-semibold px-2 py-1 rounded-md bg-white/5 text-slate-400 border border-white/5 shrink-0">
                                            {track.isLocal ? "Local" : "Online"}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};