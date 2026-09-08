import { useState, useEffect } from 'react';
import { saveTracksToDB, getTracksFromDB } from '../utils/db';

export const useLocalMusic = () => {
  const [tracks, setTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadSaved = async () => {
      try {
        setIsLoading(true);
        const saved = await getTracksFromDB();
        if (saved && saved.length > 0) {
          setTracks(saved);
        }
      } catch (err) {
        console.error('Failed to load saved tracks:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadSaved();
  }, []);

  const handleFolderSelect = async (e) => {
    const files = e.target?.files || e;
    if (!files || files.length === 0) return;

    setIsLoading(true);
    const audioFiles = Array.from(files).filter(
      (f) =>
        f.type.startsWith('audio/') ||
        f.name.endsWith('.mp3') ||
        f.name.endsWith('.wav') ||
        f.name.endsWith('.flac') ||
        f.name.endsWith('.m4a')
    );

    try {
      await saveTracksToDB(audioFiles);
      const updatedTracks = await getTracksFromDB();
      setTracks(updatedTracks);
    } catch (err) {
      console.error('Failed to save tracks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return { tracks, isLoading, handleFolderSelect };
};