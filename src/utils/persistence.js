const STORAGE_KEY = 'aurora_player_state_v2';

export const loadPersistedState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
};

export const savePersistedState = (state) => {
  try {
    const current = loadPersistedState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...state }));
  } catch (e) {}
};

export const persistKey = (key, value) => {
  const current = loadPersistedState();
  current[key] = value;
  savePersistedState(current);
};

export const clearPersistedState = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {}
};
