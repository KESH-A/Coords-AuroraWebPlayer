import React from "react";
import {useSettings, THEME_PRESETS} from "../../context/SettingsContext";
import {Palette, Sparkles, Gauge, Volume2, X, Volume } from "lucide-react";

export const SettingsModal = ({isOpen, onClose}) => {
    const {
        theme,
        setTheme,
        glassStyle,
        setGlassStyle,
        animSpeed,
        setAnimSpeed,
        fadeInTime,
        setFadeInTime,
        scrollAnimation,
        setScrollAnimation,
    } = useSettings();

    if (!isOpen) {
        return null;
    }

    return(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className={`w-full max-w-xl p-6 rounded-e-3xl ${glassStyle} border border-white/10 space-y-6 max-h-[90vh] overflow-y-auto`}>

                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                    <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-400" />
                        Aurora Settings
                    </h2>
                    <button 
                    onClick={onClose}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-3">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <Palette className="w-4 h-4 text-purple-400" /> Color Presets
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        {THEME_PRESETS.map((preset) => (
                            <button
                                key={preset.name}
                                onClick={() => setTheme(preset)}
                                className={`p-3 rounded-2xl border transition-all flex items-center justify-between
                                ${theme.name === preset.name
                                ? "border-purple-500 bg-purple-500/20 text-white"
                                : "border-white/5 bg-white/5 text-slate-400 hover:text-white"
                                }`}
                            >
                                <span className="text-sm font-medium">{preset.name}</span>
                                <div className="flex items-center gap-1">
                                    <span className="w-3 h-3 rounded-full" style={{backgroundColor: preset.primary}}></span>
                                    <span className="w-3 h-3 rounded-full" style={{backgroundColor: preset.accent}}></span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
                
                <div className="space-y-3"> 
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Surface Texture & Blur
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={() => setGlassStyle("glass-classic")}
                            className={`p-3 rounded-2xl border text-xs font-semibold transition-all
                            ${glassStyle === "glass-classic"
                            ? "border-purple-500 bg-purple-500/20 text-white"
                            : "border-white/5 bg-white/5 text-slate-400 hover:text-white"
                            }`}
                        >
                            Classic Glass
                        </button>
                        <button 
                            onClick={() => setGlassStyle("glass-surface")}
                            className={`p-3 rounded-2xl border text-xs font-semibold transition-all
                            ${glassStyle === "glass-surface"
                            ? "border-purple-500 bg-purple-500/20 text-white"
                            : "border-white/5 bg-white/5 text-slate-400 hover:text-white"
                            }`}
                        >
                            Glass Surface (Noise Filter)
                        </button>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold  text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <Gauge className="w-4 h-4 text-cyan-400" /> Animation Speed
                        </label>
                        <span className="text-xs text-purple-400 font-mono">{animSpeed}</span>
                    </div>
                    <input 
                    type="range" 
                    min="0.3"
                    max="1.5"
                    step="0.1"
                    value={animSpeed}
                    onChange={(e) => setAnimSpeed(Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500">
                        <span>Fast (0.3s)</span>
                        <span>normal (0.8s)</span>
                        <span>Smooth (1.5s)</span>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <Volume2 className="w-4 h-4 text-emerald-400"/> Audio Fade-In
                        </label>
                        <span className="text-xs text-emerald-400 font-mono">{fadeInTime}</span>
                    </div>
                    <input 
                        type="range" 
                        min="0"
                        max="5"
                        step="0.5"
                        value={fadeInTime}
                        onChange={(e) => setFadeInTime(Number(e.target.value))}
                        className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                </div>

                <div className="space-y-3">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        List Scroll Animation
                    </label>
                    <div className="gird grid-cols-3 gap-2">
                        {["scale", "fade", "morph", "slide"].map((anim) => (
                            <button
                                key={anim}
                                onClick={() => setScrollAnimation(anim)}
                                className={`py-2 rounded-xl text-xs font-medium capitalize border transition-all
                                ${scrollAnimation === anim
                                ? "border-purple-500 bg-purple-500/20 text-white"
                                : "border-white/5 bg-white/5 text-slate-400 hover:text-white"
                                }`}
                            >
                                {anim}
                            </button>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};
