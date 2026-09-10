const DB_NAME = 'aurora_player_db_v8';
const STORE_NAME = 'tracks';

export const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('title', 'title', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
};

export const saveTracksToDB = async (files, onProgress) => {
  const db = await initDB();

  const clearTx = db.transaction(STORE_NAME, 'readwrite');
  clearTx.objectStore(STORE_NAME).clear();
  await new Promise((res) => (clearTx.oncomplete = res));

  const CHUNK = 50;
  let done = 0;
  const now = Date.now();
  for (let i = 0; i < files.length; i += CHUNK) {
    const chunk = files.slice(i, i + CHUNK);
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    chunk.forEach((file, j) => {
      const idx = i + j;
      store.put({
        id: `${file.name}-${file.size}-${idx}`,
        title: file.name.replace(/\.[^/.]+$/, ''),
        artist: 'Local Track',
        file: file,
        createdAt: now + idx,
        size: file.size,
        type: file.type,
      });
    });
    await new Promise((res, rej) => {
      tx.oncomplete = res;
      tx.onerror = (e) => rej(e.target.error);
    });
    done += chunk.length;
    if (typeof onProgress === 'function') onProgress(done);
  }
  return true;
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
          cover: item.cover || null,
          album: item.album || 'Local Music',
          createdAt: item.createdAt || 0,
          size: item.size || 0,
          type: item.type || 'audio/mpeg',
        };
      });
      resolve(tracks);
    };
    request.onerror = (e) => reject(e.target.error);
  });
};

export const deleteTrackFromDB = async (id) => {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = (e) => reject(e.target.error);
  });
};

export const getAllTracksFromDB = async () => {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = (e) => reject(e.target.error);
  });
};
