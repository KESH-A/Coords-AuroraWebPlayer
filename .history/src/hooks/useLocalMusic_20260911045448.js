import { useState, useEffect, useRef, useCallback } from 'react';
import { saveTracksToDB, getTracksFromDB } from '../utils/db';

const ORDER_KEY = 'aurora_track_order_v1';

const applySavedOrder = (list) => {
  try {
    const raw = localStorage.getItem(ORDER_KEY);
    if (!raw) return list;
    const ids = JSON.parse(raw);
    if (!Array.isArray(ids)) return list;
    const byId = {};
    list.forEach((t) => { if (t && t.id) byId[t.id] = t; });
    const ordered = ids.map((id) => byId[id]).filter(Boolean);
    const rest = list.filter((t) => t && !ids.includes(t.id));
    return [...ordered, ...rest];
  } catch (e) {
    return list;
  }
};

export const useLocalMusic = () => {
  const [tracks, setTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // APK Otomatik Hafıza Tarama (Capacitor/Native Bridge)
  const scanDeviceAudio = async () => {
    if (window.Capacitor && window.Capacitor.isNativePlatform()) {
      try {
        setIsLoading(true);
        // Capacitor Filesystem veya MediaStore plugin çağrısı
        if (window.Capacitor.Plugins?.MediaScanner) {
          const result = await window.Capacitor.Plugins.MediaScanner.getAudioFiles();
          if (result && result.files && mountedRef.current) {
            const mappedTracks = result.files.map((file, idx) => ({
              id: file.id || `${file.name}-${file.size}-${idx}`,
              title: file.title || file.name.replace(/\.[^/.]+$/, ''),
              artist: file.artist || 'Local Track',
              url: window.Capacitor.convertFileSrc(file.path),
            }));
            setTracks(applySavedOrder(mappedTracks));
          }
        }
      } catch (err) {
        console.error('Device audio scan error:', err);
      } finally {
        if (mountedRef.current) setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    const loadSaved = async () => {
      try {
        setIsLoading(true);
        const saved = await getTracksFromDB();
        if (saved && saved.length > 0 && mountedRef.current) {
          setTracks(applySavedOrder(saved));
        } else if (window.Capacitor && window.Capacitor.isNativePlatform()) {
          // Eğer DB boşsa APK'da otomatik hafızayı tara
          await scanDeviceAudio();
        }
      } catch (err) {
        console.error('Failed to load saved tracks:', err);
      } finally {
        if (mountedRef.current) setIsLoading(false);
      }
    };
    loadSaved();
  }, []);

  const reorderTracks = useCallback((ordered) => {
    if (!Array.isArray(ordered)) return;
    const ids = ordered.map((t) => t.id).filter(Boolean);
    try { localStorage.setItem(ORDER_KEY, JSON.stringify(ids)); } catch (e) {}
    setTracks(ordered);
  }, []);

  const handleFolderSelect = async (e) => {
    let files = [];
    if (e.target?.files) {
      files = Array.from(e.target.files);
    } else if (e.dataTransfer?.files) {
      files = Array.from(e.dataTransfer.files);
    } else if (Array.isArray(e)) {
      files = e;
    }

    if (!files || files.length === 0) return;

    const audioFiles = files.filter(
      (f) =>
        f.type.startsWith('audio/') ||
        /\.(mp3|wav|flac|m4a|aac|ogg)$/i.test(f.name)
    );

    if (audioFiles.length === 0) return;

    setIsLoading(true);
    setIsImporting(true);
    setImportProgress(0);

    try {
      await saveTracksToDB(audioFiles, (done) => {
        if (mountedRef.current) setImportProgress(Math.round((done / audioFiles.length) * 100));
      });

      const CHUNK = 40;
      let acc = [];
      for (let i = 0; i < audioFiles.length; i += CHUNK) {
        const chunk = audioFiles.slice(i, i + CHUNK);
        const mapped = chunk.map((file, j) => {
          const idx = i + j;
          return {
            id: `${file.name}-${file.size}-${idx}`,
            title: file.name.replace(/\.[^/.]+$/, ''),
            artist: 'Local Track',
            url: URL.createObjectURL(file),
          };
        });
        acc = [...acc, ...mapped];
        if (mountedRef.current) {
          setTracks((prev) => {
            const merged = [...prev, ...mapped];
            const unique = Array.from(new Map(merged.map((t) => [t.id, t])).values());
            return applySavedOrder(unique);
          });
          setImportProgress(Math.round((acc.length / audioFiles.length) * 100));
        }
        await new Promise((r) => setTimeout(r, 0));
      }
    } catch (err) {
      console.error('Failed to save tracks:', err);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        setIsImporting(false);
      }
    }
  };

  return { 
    tracks, 
    setTracks, 
    isLoading, 
    handleFolderSelect, 
    scanDeviceAudio, 
    importProgress, 
    isImporting, 
    reorderTracks 
  };
};

export const loadSavedTracks = async () => {
  try {
    const saved = await getTracksFromDB();
    return applySavedOrder(saved || []);
  } catch (e) {
    return [];
  }
};