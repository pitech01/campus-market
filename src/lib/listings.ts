import { mockListings } from '../data/mockListings'
import { myListings } from '../data/myListings'
import type { Listing } from '../types'

export function getListingById(id: string): Listing | undefined {
  return [...mockListings, ...myListings].find((listing) => listing.id === id)
}
