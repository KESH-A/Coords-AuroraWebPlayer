import React, { useState } from 'react';
import { X, FolderPlus, Monitor, Palette, Volume2, ShieldCheck, Moon, Sun } from 'lucide-react';

const SettingsModal = ({ isOpen, onClose, visualizerStyle, setVisualizerStyle, theme, setTheme }) => {
  const [activeTab, setActiveTab] = useState('general');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-2xl bg-slate-900/90 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Settings
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-48 border-r border-white/10 p-4 space-y-2 bg-slate-950/40">
            <button
              onClick={() => setActiveTab('general')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                activeTab === 'general' ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' : 'text-slate-400 hover:bg-white/5'
              }`}
            >
              <Monitor size={18} />
              General
            </button>
            <button
              onClick={() => setActiveTab('audio')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                activeTab === 'audio' ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' : 'text-slate-400 hover:bg-white/5'
              }`}
            >
              <Volume2 size={18} />
              Audio & Engine
            </button>
            <button
              onClick={() => setActiveTab('appearance')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                activeTab === 'appearance' ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' : 'text-slate-400 hover:bg-white/5'
              }`}
            >
              <Palette size={18} />
              Appearance
            </button>
          </div>

          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-300 mb-3">Music Directory</h3>
                  <label className="flex items-center justify-center gap-3 p-4 border-2 border-dashed border-white/20 rounded-xl hover:border-pink-500/50 hover:bg-white/5 transition cursor-pointer">
                    <FolderPlus size={24} className="text-pink-400" />
                    <span className="text-sm text-slate-300">Select Local Folder</span>
                    <input 
                      type="file" 
                      webkitdirectory="" 
                      directory="" 
                      multiple 
                      className="hidden" 
                    />
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'audio' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-300 mb-3">Visualizer Preset</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {['bars', 'wave', 'particles'].map((style) => (
                      <button
                        key={style}
                        onClick={() => setVisualizerStyle(style)}
                        className={`p-3 rounded-xl border text-center capitalize transition ${
                          visualizerStyle === style 
                            ? 'bg-pink-500/20 border-pink-500 text-pink-400 font-semibold' 
                            : 'border-white/10 text-slate-400 hover:bg-white/5'
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-300 mb-3">Theme</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setTheme && setTheme('dark')}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition ${
                        theme === 'dark' ? 'bg-pink-500/20 border-pink-500 text-pink-400' : 'border-white/10 text-slate-400'
                      }`}
                    >
                      <Moon size={18} />
                      Dark
                    </button>
                    <button
                      onClick={() => setTheme && setTheme('light')}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition ${
                        theme === 'light' ? 'bg-pink-500/20 border-pink-500 text-pink-400' : 'border-white/10 text-slate-400'
                      }`}
                    >
                      <Sun size={18} />
                      Light
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;