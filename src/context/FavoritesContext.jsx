import React, { createContext, useContext, useState, useEffect } from 'react';

const FavoritesContext = createContext(null);
const STORAGE_KEY = 'aurora_favorites_v1';

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch (e) {}
  }, [favorites]);

  const isFavorite = (id) => favorites.includes(id);

  const clearAllFavorites = () => { setFavorites([]); };

  const reorderFavorites = (nextIds) => {
    if (!Array.isArray(nextIds)) return;
    setFavorites(nextIds);
  };

  const toggleFavorite = (id) => {
    if (!id) return;
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <FavoritesContext.Provider value={{ favorites, isFavorite, toggleFavorite, reorderFavorites, clearAllFavorites }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => useContext(FavoritesContext);
