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

  useEffect(() => {
    const loadSaved = async () => {
      try {
        setIsLoading(true);
        const saved = await getTracksFromDB();
        if (saved && saved.length > 0 && mountedRef.current) {
          setTracks(applySavedOrder(saved));
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
    const files = e.target?.files || e;
    if (!files || files.length === 0) return;
    const audioFiles = Array.from(files).filter(
      (f) =>
        f.type.startsWith('audio/') ||
        f.name.endsWith('.mp3') ||
        f.name.endsWith('.wav') ||
        f.name.endsWith('.flac') ||
        f.name.endsWith('.m4a')
    );

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
          setTracks(acc);
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

  return { tracks, setTracks, isLoading, handleFolderSelect, importProgress, isImporting, reorderTracks };
};

export const loadSavedTracks = async () => {
  try {
    const saved = await getTracksFromDB();
    return applySavedOrder(saved || []);
  } catch (e) {
    return [];
  }
};