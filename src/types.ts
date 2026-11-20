export type CategoryId =
  | 'textbooks'
  | 'electronics'
  | 'clothing'
  | 'furniture'
  | 'services'
  | 'sports'
  | 'other'

export type ListingStatus = 'active' | 'available' | 'reserved' | 'sold' | 'expired' | 'draft'

export type ListingType = 'sell' | 'exchange' | 'both'

export type ItemCondition = 'Brand New' | 'Like New' | 'Good Condition' | 'Fair'

export interface Category {
  id: number | CategoryId
  slug?: string
  label?: string
  name?: string
  icon: string
  count?: number
  listings_count?: number
  image?: string
  tagline?: string
  sort_order?: number
}

export interface MeetingLocation {
  id: number
  name: string
  description?: string
  is_active?: boolean
}

export interface AuthUser {
  id: number
  name: string
  student_id: string
  email: string
  phone?: string
  faculty?: string
  year?: string
  bio?: string
  role?: string
  avatar_url?: string
  average_rating?: number
  reviews_count?: number
  completed_deals_count?: number
  campus_verified: boolean
  date_joined?: string
}

export interface Listing {
  id: string | number
  title: string
  description: string
  price: number
  originalPrice?: number
  currency?: string
  listing_type?: ListingType
  condition: ItemCondition | string
  quantity?: number
  exchange_wanted?: string | null
  category: CategoryId | any
  status: ListingStatus
  images: string[] | { id: number; url: string }[]
  meeting_location?: MeetingLocation | null
  location?: string
  postedAt?: string
  date_posted?: string
  views_count?: number
  seller_id?: number
  sellerName?: string
  sellerInitial?: string
  sellerAvatar?: string
  sellerRating?: number
  sellerReviewsCount?: number
  sellerCompletedDeals?: number
  sellerFaculty?: string
  verifiedStudent?: boolean
  likesCount?: number
  favorites_count?: number
  isLiked?: boolean
  is_favorited?: boolean
  tags?: string[]
}

export interface Message {
  id: number
  conversation_id: number
  sender_id: number
  receiver_id: number
  content: string
  image_url?: string | null
  read_at?: string | null
  created_at: string
  sender?: {
    id: number
    name: string
    avatar_url?: string
  }
}

export interface Deal {
  id: number
  conversation_id: number
  listing_id: number
  proposer_id: number
  deal_type: ListingType | string
  agreed_price?: number | null
  exchange_item?: string | null
  meet_at?: string | null
  status: 'proposed' | 'accepted' | 'declined' | 'cancelled' | 'completed'
  payment_status?: 'unpaid' | 'pending' | 'paid' | 'refunded'
  payment_reference?: string | null
  paid_at?: string | null
  buyer_confirmed_at?: string | null
  seller_confirmed_at?: string | null
  created_at: string
  meeting_location?: MeetingLocation | null
  listing?: Listing
  proposer?: AuthUser
  reviews?: Review[]
  payments?: Payment[]
}

export interface Payment {
  id: number
  user_id: number
  deal_id?: number | null
  listing_id?: number | null
  reference: string
  amount: number
  currency: string
  status: 'pending' | 'successful' | 'failed' | 'abandoned'
  channel?: string | null
  paid_at?: string | null
  created_at: string
  user?: AuthUser
  deal?: Deal
  listing?: Listing
}

export interface Review {
  id: number
  deal_id: number
  rating: number
  comment?: string
  created_at: string
  reviewer?: AuthUser
  reviewee?: AuthUser
}

export interface Conversation {
  id: number
  listing_id: number
  buyer_id: number
  seller_id: number
  last_message_at: string
  unread_count: number
  listing?: Listing
  other_user?: {
    id: number
    name: string
    avatar_url?: string
    faculty?: string
    average_rating?: number
    campus_verified?: boolean
  }
  latest_message?: Message
  active_deal?: Deal
}

export interface Report {
  id: number
  reporter_id: number
  reportable_type: string
  reportable_id: number
  reason: string
  note?: string
  status: 'pending' | 'reviewed' | 'dismissed' | 'action_taken'
  handled_by?: number
  handled_at?: string
  resolution?: 'dismissed' | 'content_removed' | 'user_warned' | 'user_suspended'
  action_note?: string
  created_at: string
  reporter?: AuthUser
  handler?: AuthUser
  target_type_label?: string
  target_preview?: any
}

export interface NotificationItem {
  id: string
  type: string
  data: {
    title?: string
    message?: string
    action_url?: string
    deal_id?: number
    listing_id?: number
  }
  read_at?: string | null
  created_at: string
}

export interface AdminStats {
  metrics: {
    total_users: number
    verified_students: number
    active_listings: number
    total_listings: number
    total_deals: number
    completed_deals: number
    open_reports: number
    total_reports: number
  }
  categories: {
    name: string
    slug: string
    listings_count: number
  }[]
  recent_audit_logs: {
    id: number
    action: string
    target_type?: string
    target_id?: number
    meta?: any
    created_at: string
    actor?: AuthUser
  }[]
}
