// Master patch script: applies all 9 fixes idempotently.
import fs from 'fs';

const root = 'c:/Website Myself/AuroraPlayer/AuroraWebPlayer';
const R = (p) => String(fs.readFileSync(p, 'utf8')).replace(/\r/g, '');
const W = (p, s) => fs.writeFileSync(p, s, 'utf8');

const files = {
  audio: root + '/src/context/AudioContext.jsx',
  db:    root + '/src/utils/db.js',
  hook:  root + '/src/hooks/useLocalMusic.js',
  track: root + '/src/components/Player/TrackList.jsx',
  app:   root + '/src/App.jsx',
  modal: root + '/src/components/Settings/SettingsModal.jsx',
  html:  root + '/index.html',
  css:   root + '/src/index.css',
};

let applied = 0;
function rep(p, regex, fn, label) {
  const before = R(p);
  const after = before.replace(regex, fn);
  if (after === before) { console.log('  [skip] ' + label + ' (no match)'); return; }
  W(p, after); applied++; console.log('  [ok]   ' + label);
}
function spliceLines(p, matchStart, matchEnd, newLines, label) {
  let s = R(p); let lines = s.split('\n');
  let i1 = lines.findIndex(matchStart);
  if (i1 < 0) { console.log('  [skip] ' + label + ' (start not found)'); return; }
  let i2 = lines.findIndex((l, i) => i > i1 && matchEnd(l));
  if (i2 < 0) { console.log('  [skip] ' + label + ' (end not found)'); return; }
  lines.splice(i1, i2 - i1 + 1, ...newLines);
  W(p, lines.join('\n')); applied++; console.log('  [ok]   ' + label + ' (' + (i1 + 1) + '-' + (i2 + 1) + ')');
}
function insertAfterLine(p, matchFn, newLineText, label) {
  let s = R(p); let lines = s.split('\n');
  let i = lines.findIndex(matchFn);
  if (i < 0) { console.log('  [skip] ' + label + ' (line not found)'); return; }
  lines.splice(i + 1, 0, newLineText);
  W(p, lines.join('\n')); applied++; console.log('  [ok]   ' + label + ' (after ' + (i + 1) + ')');
}

console.log('Patching AudioContext.jsx (normalized to LF first)...');

// 1a. Listener effect: attach timeupdate/loadedmetadata/ended to BOTH slots, return a shared cleanup.
rep(files.audio,
  /([ \t]*)const el = activeEl\(\);\r?\n[ \t]*if \(!el\) return;\r?\n[ \t]*el\.addEventListener\('timeupdate', handleTimeUpdate\);\r?\n[ \t]*el\.addEventListener\('loadedmetadata', handleLoadedMetadata\);\r?\n[ \t]*el\.addEventListener\('ended', handleEnded\);\r?\n[ \t]*return \(\) => \{\r?\n[ \t]*el\.removeEventListener\('timeupdate', handleTimeUpdate\);\r?\n[ \t]*el\.removeEventListener\('loadedmetadata', handleLoadedMetadata\);\r?\n[ \t]*el\.removeEventListener\('ended', handleEnded\);\r?\n[ \t]*\};/,
  (m) => `    const slots = [slotA.current, slotB.current];
    const cleanup = () => {
      slots.forEach((el) => {
        if (!el) return;
        el.removeEventListener('timeupdate', handleTimeUpdate);
        el.removeEventListener('loadedmetadata', handleLoadedMetadata);
        el.removeEventListener('ended', handleEnded);
      });
    };
    cleanup();
    slots.forEach((el) => {
      if (!el) return;
      el.addEventListener('timeupdate', handleTimeUpdate);
      el.addEventListener('loadedmetadata', handleLoadedMetadata);
      el.addEventListener('ended', handleEnded);
    });
    return cleanup;`,
  'listener effect (both slots)');

// 1b. playedHistoryRef
rep(files.audio,
  /([ \t]*)const bandsRef = useRef\(\[\]\);/,
  (m, ind) => ind + 'const bandsRef = useRef([]);\n' + ind + 'const playedHistoryRef = useRef([]);',
  'playedHistoryRef ref');

// 1c. playTrack: record previous track only on a genuine track change.
rep(files.audio,
  /([ \t]*)if \(currentTrackRef\.current\?\.id !== track\.id\) \{\r?\n[ \t]*audio\.src = src;\r?\n[ \t]*audio\.load\(\);\r?\n[ \t]*\}/,
  (m, ind) => ind + 'if (currentTrackRef.current?.id !== track.id) {\n' +
    ind + '  const _prevTrack = currentTrackRef.current;\n' +
    ind + '  if (_prevTrack && playedHistoryRef.current[playedHistoryRef.current.length - 1]?.id !== _prevTrack.id) {\n' +
    ind + '    playedHistoryRef.current.push(_prevTrack);\n' +
    ind + '  }\n' +
    ind + '  audio.src = src;\n' +
    ind + '  audio.load();\n' +
    ind + '}',
  'playTrack history push');

// 1d. completeCrossfade: push old track before the slot swap.
rep(files.audio,
  /([ \t]*)setCurrentTrack\(pendingNextTrack\.current\);/,
  (m, ind) => ind + 'const _oldTrack = currentTrackRef.current;\n' +
    ind + 'if (_oldTrack && playedHistoryRef.current[playedHistoryRef.current.length - 1]?.id !== _oldTrack.id) playedHistoryRef.current.push(_oldTrack);\n' +
    ind + 'setCurrentTrack(pendingNextTrack.current);',
  'completeCrossfade history push');

// 1e. playPrev rewrite -> history-aware with seek-rewind fallback.
rep(files.audio,
  /([ \t]*)const playPrev = \(\) => \{[\s\S]*?playTrack\(list\[prevIdx\]\);\r?\n[ \t]*\};/,
  (m, ind) => `  const playPrev = () => {
    cancelCrossfade();
    const audio = activeEl();
    if (audio.currentTime > 3) { audio.currentTime = 0; setCurrentTime(0); return; }
    const history = playedHistoryRef.current;
    if (history.length > 0) {
      const prev = history.pop();
      playTrack(prev);
      return;
    }
    const list = playlistRef.current;
    if (!list || list.length === 0) return;
    const cur = currentTrackRef.current;
    const idx = list.findIndex((t) => t.id === cur?.id);
    const prevIdx = idx > 0 ? idx - 1 : list.length - 1;
    playTrack(list[prevIdx]);
  };`,
  'playPrev history-aware');

console.log('Patching db.js (chunked save + onProgress)...');
spliceLines(files.db,
  (l) => /^export const saveTracksToDB = async \(files\) => \{$/.test(l),
  (l) => l.trim() === '};',
  [
    "export const saveTracksToDB = async (files, onProgress) => {",
    "  const db = await initDB();",
    "",
    "  const clearTx = db.transaction(STORE_NAME, 'readwrite');",
    "  clearTx.objectStore(STORE_NAME).clear();",
    "  await new Promise((res) => (clearTx.oncomplete = res));",
    "",
    "  const CHUNK = 50;",
    "  let done = 0;",
    "  for (let i = 0; i < files.length; i += CHUNK) {",
    "    const chunk = files.slice(i, i + CHUNK);",
    "    const tx = db.transaction(STORE_NAME, 'readwrite');",
    "    const store = tx.objectStore(STORE_NAME);",
    "    chunk.forEach((file, j) => {",
    "      const idx = i + j;",
    "      store.put({",
    "        id: `${file.name}-${file.size}-${idx}`,",
    "        title: file.name.replace(/\\.[^/.]+$/, ''),",
    "        artist: 'Local Track',",
    "        file: file,",
    "      });",
    "    });",
    "    await new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = (e) => rej(e.target.error); });",
    "    done += chunk.length;",
    "    if (typeof onProgress === 'function') onProgress(done);",
    "  }",
    "  return true;",
    "};",
  ],
  'saveTracksToDB chunked+onProgress');

console.log('Patching useLocalMusic.js (incremental render + progress)...');
rep(files.hook,
  /const \[isLoading, setIsLoading\] = useState\(false\);/,
  (m) => m + '\n  const [importProgress, setImportProgress] = useState(0);\n  const [isImporting, setIsImporting] = useState(false);',
  'import states');
spliceLines(files.hook,
  (l) => /^  const handleFolderSelect = async \(e\) => \{$/.test(l),
  (l) => l.trim() === '};',
  [
    "  const handleFolderSelect = async (e) => {",
    "    const files = e.target?.files || e;",
    "    if (!files || files.length === 0) return;",
    "    const audioFiles = Array.from(files).filter(",
    "      (f) =>",
    "        f.type.startsWith('audio/') ||",
    "        f.name.endsWith('.mp3') ||",
    "        f.name.endsWith('.wav') ||",
    "        f.name.endsWith('.flac') ||",
    "        f.name.endsWith('.m4a')",
    "    );",
    "",
    "    setIsLoading(true);",
    "    setIsImporting(true);",
    "    setImportProgress(0);",
    "    try {",
    "      await saveTracksToDB(audioFiles, (done) => {",
    "        setImportProgress(Math.round((done / audioFiles.length) * 100));",
    "      });",
    "      const CHUNK = 40;",
    "      let acc = [];",
    "      for (let i = 0; i < audioFiles.length; i += CHUNK) {",
    "        const chunk = audioFiles.slice(i, i + CHUNK);",
    "        const mapped = chunk.map((file, j) => {",
    "          const idx = i + j;",
    "          return {",
    "            id: `${file.name}-${file.size}-${idx}`,",
    "            title: file.name.replace(/\\.[^/.]+$/, ''),",
    "            artist: 'Local Track',",
    "            url: URL.createObjectURL(file),",
    "          };",
    "        });",
    "        acc = [...acc, ...mapped];",
    "        setTracks(acc);",
    "        setImportProgress(Math.round((acc.length / audioFiles.length) * 100));",
    "        await new Promise((r) => setTimeout(r, 0));",
    "      }",
    "    } catch (err) {",
    "      console.error('Failed to save tracks:', err);",
    "    } finally {",
    "      setIsLoading(false);",
    "      setIsImporting(false);",
    "    }",
    "  };",
  ],
  'handleFolderSelect incremental');
rep(files.hook,
  /return \{ tracks, isLoading, handleFolderSelect \};/,
  () => 'return { tracks, isLoading, handleFolderSelect, importProgress, isImporting };',
  'hook return shape');

console.log('Patching TrackList.jsx (staggered enter delay)...');
insertAfterLine(files.track,
  (l) => /height: /.test(l) && /ITEM_HEIGHT/.test(l),
  "                animationDelay: (actualIndex * 24) + 'ms',",
  'staggered animationDelay');

console.log('Patching App.jsx (Prev/Next, import bar, settings origin)...');
rep(files.app,
  /import \{ Settings, User, Search, Play, Pause, Disc, Heart \} from 'lucide-react';/,
  () => "import { Settings, User, Search, Play, Pause, Disc, Heart, SkipBack, SkipForward } from 'lucide-react';",
  'App imports');
rep(files.app,
  /const \{ isPlaying, currentTrack, playTrack, pauseTrack, currentTime, duration, setPlaylist \} = useAudio\(\);/,
  () => 'const { isPlaying, currentTrack, playTrack, pauseTrack, currentTime, duration, setPlaylist, playNext, playPrev } = useAudio();',
  'App useAudio destructure');
rep(files.app,
  /const \{ tracks: localTracks, isLoading, handleFolderSelect \} = useLocalMusic\(\);/,
  () => 'const { tracks: localTracks, isLoading, handleFolderSelect, importProgress, isImporting } = useLocalMusic();',
  'App useLocalMusic destructure');
rep(files.app,
  /const \[isSettingsOpen, setIsSettingsOpen\] = useState\(false\);/,
  (m) => m + '\n  const [settingsOrigin, setSettingsOrigin] = useState(null);',
  'App settingsOrigin state');
rep(files.app,
  /onClick=\{\(\) => setIsSettingsOpen\(true\)\}/,
  () => "onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); setSettingsOrigin(r); setIsSettingsOpen(true); }}",
  'App gear onClick');
rep(files.app,
  /onFolderSelect=\{handleFolderSelect\} isLoading=\{isLoading\} \/>/,
  () => 'onFolderSelect={handleFolderSelect} isLoading={isLoading} origin={settingsOrigin} />',
  'App SettingsModal origin prop');
rep(files.app,
  /([ \t]*)<button onClick=\{\(\) => isPlaying \? pauseTrack\(\) : playTrack\(currentTrack\)\}([\s\S]*?)<\/button>/,
  (m, ind, inner) => {
    const prevBtn = ind + '<button onClick={(e) => { e.stopPropagation(); playPrev(); }} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all" style={{ color: activeColor }} title="Previous">\n' +
      ind + '  <SkipBack className="w-4 h-4" />\n' +
      ind + '</button>';
    const nextBtn = ind + '<button onClick={(e) => { e.stopPropagation(); playNext(true); }} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all" style={{ color: activeColor }} title="Next">\n' +
      ind + '  <SkipForward className="w-4 h-4" />\n' +
      ind + '</button>';
    return prevBtn + '\n' + ind + '<button onClick={() => isPlaying ? pauseTrack() : playTrack(currentTrack)}' + inner + '</button>\n' + nextBtn;
  },
  'App mini-player Prev/Next');
rep(files.app,
  /([ \t]*)<TrackList/,
  (m, ind) => {
    const banner = ind + '{isImporting && (\n' +
      ind + '  <div className="mb-3">\n' +
      ind + '    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1"><span>Importing tracks…</span><span>{importProgress}%</span></div>\n' +
      ind + '    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden"><div className="h-full transition-all duration-300" style={{ width: importProgress + "%" }} /></div>\n' +
      ind + '  </div>\n' +
      ind + ')}\n';
    return banner + ind + '<TrackList';
  },
  'App import progress banner');

console.log('Patching SettingsModal.jsx (origin-based morph)...');
rep(files.modal,
  /export const SettingsModal = \(\{[^}]*\}\) => \{/,
  () => 'export const SettingsModal = ({ isOpen, onClose, onFolderSelect, isLoading, origin }) => {',
  'SettingsModal signature');
spliceLines(files.modal,
  (l) => /const \[shouldRender, setShouldRender\] = useState\(isOpen\);/.test(l),
  (l) => /ref=\{modalRef\}/.test(l),
  [
    "  const [shouldRender, setShouldRender] = useState(isOpen);",
    "  const [animateIn, setAnimateIn] = useState(isOpen);",
    "  const modalRef = useRef(null);",
    "",
    "  useEffect(() => {",
    "    if (isOpen) {",
    "      setShouldRender(true);",
    "      requestAnimationFrame(() => requestAnimationFrame(() => setAnimateIn(true)));",
    "    } else {",
    "      setAnimateIn(false);",
    "      const t = setTimeout(() => setShouldRender(false), 450);",
    "      return () => clearTimeout(t);",
    "    }",
    "  }, [isOpen]);",
    "",
    "  if (!shouldRender) return null;",
    "",
    "  const containerStyle = themeStyle === 'glass'",
    "    ? 'glass glass-modal shadow-2xl border-white/15'",
    "    : 'theme-transparent shadow-none';",
    "",
    "  const originPoint = origin",
    "    ? { top: origin.top + window.scrollY, left: origin.left + window.scrollX }",
    "    : { top: '50%', left: '50%' };",
    "",
    "  return (",
    "    <>",
    '      <div className="fixed inset-0 z-[300] glass-overlay" />',
    "      <div",
    "        ref={modalRef}",
    "        className={`relative w-full max-w-md p-6 border ${containerStyle}`}",
    "        style={{",
    "          position: 'fixed',",
    '          top: animateIn ? \'50%\' : `${originPoint.top}px`,',
    '          left: animateIn ? \'50%\' : `${originPoint.left}px`,',
    '          transformOrigin: \'top left\',',
    "          transform: animateIn ? 'translate(-50%, -50%) scale(1)' : 'scale(0.85)',",
    "          opacity: animateIn ? 1 : 0,",
    "          transition: 'top 450ms cubic-bezier(0.34,1.56,0.64,1), left 450ms cubic-bezier(0.34,1.56,0.64,1), transform 450ms cubic-bezier(0.34,1.56,0.64,1), opacity 450ms ease',",
    "          zIndex: 300,",
    "          maxHeight: 'calc(100vh - 2rem)',",
    "          overflowY: 'auto',",
    "        }}",
    "      >",
  ],
  'SettingsModal morph block');

console.log('Patching index.html (SVG glass-grain filter)...');
rep(files.html,
  /<\/body>/,
  () => `    <svg width="128" height="128" viewBox="0 0 128 128" style="position:fixed;top:0;left:0;width:0;height:0;visibility:hidden;pointer-events:none;">
      <filter id="glass-grain" color-interpolation-filters="sRGB" x="-50%" y="-50%" width="200%" height="200%">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
        <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 4 -1" />
      </filter>
    </svg>
  </body>`,
  'index.html grain SVG');

console.log('Patching index.css (grain filter + mobile fallback)...');
{
  const p = files.css;
  let s = R(p);
  const guard = 'PC: subtle SVG noise grain texture on surface/modal cards';
  if (s.includes(guard)) {
    console.log('  [skip] index.css grain (already present)');
  } else {
    s = s + '\n\n/* PC: subtle SVG noise grain texture on surface/modal cards. Mobile: backdrop-blur fallback */\n' +
      '.glass-surface,\n.glass-modal {\n  filter: url(#glass-grain);\n}\n' +
      '@media (max-width: 768px) {\n  .glass-surface,\n  .glass-modal {\n    filter: none;\n    -webkit-backdrop-filter: blur(12px) saturate(180%) !important;\n    backdrop-filter: blur(12px) saturate(180%) !important;\n  }\n}\n';
    W(p, s);
    applied++;
    console.log('  [ok]   index.css grain + mobile fallback');
  }
}

console.log('\nDone. ' + applied + ' edit(s) applied.');
