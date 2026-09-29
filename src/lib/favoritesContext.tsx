import React, { createContext, useContext, useEffect, useState } from 'react'

interface FavoritesContextType {
  favoriteIds: Set<string>
  toggleFavorite: (id: string) => void
  isFavorite: (id: string) => boolean
  favoriteCount: number
}

const FavoritesContext = createContext<FavoritesContextType>({
  favoriteIds: new Set(),
  toggleFavorite: () => {},
  isFavorite: () => false,
  favoriteCount: 0,
})

const STORAGE_KEY = 'nussy_user_favorites'

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        return new Set(JSON.parse(saved))
      }
    } catch {
      // fallback
    }
    // Default some favorites to showcase the feature
    return new Set(['l1', 'l3', 'l6'])
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(favoriteIds)))
    } catch {
      // ignore
    }
  }, [favoriteIds])

  const toggleFavorite = (id: string) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const isFavorite = (id: string) => favoriteIds.has(id)

  return (
    <FavoritesContext.Provider
      value={{
        favoriteIds,
        toggleFavorite,
        isFavorite,
        favoriteCount: favoriteIds.size,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  return useContext(FavoritesContext)
}
