const DB_NAME = 'aurora_player_db_v7';
const STORE_NAME = 'tracks';

export const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
};

export const saveTracksToDB = async (files) => {
  const db = await initDB();

  const clearTx = db.transaction(STORE_NAME, 'readwrite');
  clearTx.objectStore(STORE_NAME).clear();
  await new Promise((res) => (clearTx.oncomplete = res));

  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const trackData = {
      id: `${file.name}-${file.size}-${i}`,
      title: file.name.replace(/\.[^/.]+$/, ''),
      artist: 'Local Track',
      file: file,
    };
    store.put(trackData);
  }

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve(true);
    tx.onerror = (e) => reject(e.target.error);
  });
};

export const getTracksFromDB = async () => {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => {
      const items = request.result || [];
      const tracks = items.map((item) => {
        return {
          id: item.id,
          title: item.title,
          artist: item.artist,
          url: URL.createObjectURL(item.file),
        };
      });
      resolve(tracks);
    };
    request.onerror = (e) => reject(e.target.error);
  });
};