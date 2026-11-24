import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Package, MapPin, ArrowRight } from 'lucide-react'
import type { Listing } from '../types'
import { getFavorites, toggleFavorite } from '../lib/api'
import { useAuth } from '../lib/authContext'

export default function FavoritesPage() {
  const { isAuthenticated } = useAuth()
  const [favorites, setFavorites] = useState<Listing[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (isAuthenticated) {
      loadFavorites()
    }
  }, [isAuthenticated])

  const loadFavorites = async () => {
    try {
      setIsLoading(true)
      const list = await getFavorites()
      setFavorites(list)
    } catch {
      // ignore
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveFavorite = async (id: string | number) => {
    try {
      await toggleFavorite(id)
      setFavorites((prev) => prev.filter((item) => String(item.id) !== String(id)))
    } catch {
      alert('Failed to update favorite.')
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/40 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Heart className="w-8 h-8 fill-rose-500 text-rose-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          Your Saved Campus Listings
        </h2>
        <p className="text-slate-500 text-sm mb-6">
          Log in with your NSUK student account to keep track of items you wish to buy or exchange later.
        </p>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition shadow-sm"
        >
          <span>Sign In</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Heart className="w-7 h-7 text-rose-500 fill-rose-500" />
            <span>Saved Favourites ({favorites.length})</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Items you bookmarked. Watch out for status changes (reserved, sold) before contacting the seller.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-slate-400 text-sm">
          <div className="inline-block animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mb-3" />
          <p>Loading your saved listings...</p>
        </div>
      ) : favorites.length === 0 ? (
        <div className="bg-white dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
            <Heart className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1">
            No saved listings yet
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
            Browse campus textbooks, electronics, and room essentials, and tap the heart icon to save them here.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition"
          >
            <span>Explore Marketplace</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {favorites.map((listing) => {
            const isSold = listing.status === 'sold'
            const isReserved = listing.status === 'reserved'
            const imgUrl = Array.isArray(listing.images) && listing.images.length > 0
              ? (typeof listing.images[0] === 'string' ? listing.images[0] : (listing.images[0] as any).url)
              : null

            return (
              <div
                key={listing.id}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col group relative"
              >
                {/* Image & Status Tag */}
                <div className="relative aspect-4/3 bg-slate-100 dark:bg-slate-700 overflow-hidden">
                  {imgUrl ? (
                    <img
                      src={imgUrl}
                      alt={listing.title}
                      className={`w-full h-full object-cover group-hover:scale-105 transition duration-300 ${
                        isSold ? 'grayscale opacity-75' : ''
                      }`}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <Package className="w-10 h-10" />
                    </div>
                  )}

                  {/* Remove button */}
                  <button
                    onClick={() => handleRemoveFavorite(listing.id)}
                    className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 dark:bg-slate-900/90 text-rose-500 shadow-md flex items-center justify-center hover:scale-110 transition z-10"
                    title="Remove from favorites"
                  >
                    <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                  </button>

                  {/* Badges */}
                  <div className="absolute bottom-2.5 left-2.5 flex flex-wrap gap-1">
                    {isSold ? (
                      <span className="bg-slate-900/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                        SOLD
                      </span>
                    ) : isReserved ? (
                      <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                        RESERVED
                      </span>
                    ) : (
                      <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                        AVAILABLE
                      </span>
                    )}
                    {listing.condition && (
                      <span className="bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 rounded-md">
                        {listing.condition}
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2 mb-1 group-hover:text-emerald-600 transition">
                      <Link to={`/listings/${listing.id}`}>{listing.title}</Link>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mb-2 inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{listing.meeting_location?.name || 'NSUK Campus, Keffi'}</span>
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400 font-medium block">Price</span>
                      <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                        ₦ {Number(listing.price).toLocaleString()}
                      </span>
                    </div>
                    <Link
                      to={`/listings/${listing.id}`}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-emerald-600 hover:text-white text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg transition"
                    >
                      View
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

