import type {
  Category,
  Conversation,
  Deal,
  Listing,
  MeetingLocation,
  Message,
  Review,
  AuthUser,
  Payment,
  WalletSummary,
  WalletTransaction,
  WithdrawalRequest,
} from '../types'

export const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

export const DEFAULT_ITEM_PLACEHOLDER =
  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80'

/**
 * Universal Image URL Resolver
 * Resolves images whether returned as:
 * 1. External CDN URLs (Unsplash, Wikimedia)
 * 2. Uploaded paths with hardcoded localhost/127.0.0.1:8000
 * 3. Relative storage paths ("listings/xyz.jpg" or "/storage/listings/xyz.jpg")
 * 4. Blob / data URIs
 */
export function resolveImageUrl(
  url?: string | null,
  fallback: string = DEFAULT_ITEM_PLACEHOLDER
): string {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return fallback
  }

  const trimmed = url.trim()

  // Base64 or object blob URLs returned as-is
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed
  }

  // If URL has hardcoded localhost:8000 or 127.0.0.1:8000 from local backend APP_URL,
  // strip it out and convert to a relative path so it routes through Vite proxy or production host
  if (/^https?:\/\/(localhost|127\.0\.0\.1):8000/i.test(trimmed)) {
    const rel = trimmed.replace(/^https?:\/\/(localhost|127\.0\.0\.1):8000/i, '')
    return rel.startsWith('/') ? rel : `/${rel}`
  }

  // External CDN or production HTTPS URLs
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }

  // Relative paths
  if (trimmed.startsWith('/')) {
    return trimmed
  }

  if (trimmed.startsWith('storage/')) {
    return `/${trimmed}`
  }

  return `/storage/${trimmed}`
}

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('nussy_auth_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
  const headers = {
    Accept: 'application/json',
    ...getAuthHeader(),
    ...(options.headers || {}),
  }

  const res = await fetch(url, {
    ...options,
    headers,
  })

  if (!res.ok) {
    let errorData: any
    try {
      errorData = await res.json()
    } catch {
      errorData = { message: `Request failed with status ${res.status}` }
    }
    const error = new Error(errorData.message || 'API request failed') as any
    error.status = res.status
    error.errors = errorData.errors
    throw error
  }

  if (res.status === 204) {
    return {} as T
  }

  return res.json()
}

// =================== Categories & Locations ===================
export async function getCategories(): Promise<Category[]> {
  const data = await request<{ data: Category[] }>('/categories')
  return data.data || []
}

export async function getMeetingLocations(): Promise<MeetingLocation[]> {
  const data = await request<{ data: MeetingLocation[] }>('/meeting-locations')
  return data.data || []
}

// =================== Listings ===================
export interface ListingFilterParams {
  q?: string
  category?: string
  category_id?: number
  condition?: string
  listing_type?: string
  meeting_location_id?: number
  location?: string
  min_price?: number
  max_price?: number
  status?: string
  sort_by?: string
  page?: number
  per_page?: number
}

export async function getListings(params: ListingFilterParams = {}): Promise<{ data: Listing[]; meta?: any }> {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== 'all') {
      searchParams.append(key, String(value))
    }
  })

  const qs = searchParams.toString()
  return request<{ data: Listing[]; meta?: any }>(`/listings${qs ? `?${qs}` : ''}`)
}

export async function getListing(id: string | number): Promise<Listing> {
  const data = await request<{ data: Listing }>(`/listings/${id}`)
  return data.data
}

export async function createListing(formData: FormData): Promise<Listing> {
  const data = await request<{ data: Listing }>('/listings', {
    method: 'POST',
    body: formData,
  })
  return data.data
}

export async function updateListing(id: string | number, formData: FormData): Promise<Listing> {
  // Use POST with _method=PUT for multipart formData compatibility in Laravel
  formData.append('_method', 'PUT')
  const data = await request<{ data: Listing }>(`/listings/${id}`, {
    method: 'POST',
    body: formData,
  })
  return data.data
}

export async function updateListingStatus(id: string | number, status: string): Promise<Listing> {
  const data = await request<{ data: Listing }>(`/listings/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  return data.data
}

export async function deleteListing(id: string | number): Promise<void> {
  await request(`/listings/${id}`, {
    method: 'DELETE',
  })
}

export async function getMyListings(status?: string): Promise<Listing[]> {
  const qs = status && status !== 'all' ? `?status=${status}` : ''
  const data = await request<{ data: Listing[] }>(`/my/listings${qs}`)
  return data.data || []
}

// =================== Favorites / Wishlist ===================
export async function getFavorites(): Promise<Listing[]> {
  const data = await request<{ data: Listing[] }>('/favorites')
  return data.data || []
}

export async function toggleFavorite(listingId: string | number): Promise<{ is_favorited: boolean; favorites_count: number }> {
  return request<{ is_favorited: boolean; favorites_count: number }>(`/listings/${listingId}/favorite`, {
    method: 'POST',
  })
}

// =================== Chat & Conversations (Sprint 2) ===================
export async function getConversations(): Promise<Conversation[]> {
  const data = await request<{ data: Conversation[] }>('/conversations')
  return data.data || []
}

export async function startConversation(listingId: number | string): Promise<Conversation> {
  const numericId = typeof listingId === 'number' ? listingId : (parseInt(String(listingId).replace(/\D/g, ''), 10) || listingId)
  const data = await request<{ data: Conversation }>('/conversations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ listing_id: numericId }),
  })
  return data.data
}

export async function getConversationThread(conversationId: number | string): Promise<{ conversation: Conversation; messages: Message[] }> {
  return request<{ conversation: Conversation; messages: Message[] }>(`/conversations/${conversationId}`)
}

export async function sendMessage(conversationId: number | string, content?: string, imageFile?: File): Promise<Message> {
  const formData = new FormData()
  if (content) formData.append('content', content)
  if (imageFile) formData.append('image', imageFile)

  const data = await request<{ data: Message }>(`/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: formData,
  })
  return data.data
}

export async function markConversationRead(conversationId: number | string): Promise<void> {
  await request(`/conversations/${conversationId}/read`, {
    method: 'POST',
  })
}

export async function blockUser(userId: number | string): Promise<void> {
  await request(`/blocks/${userId}`, { method: 'POST' })
}

export async function unblockUser(userId: number | string): Promise<void> {
  await request(`/blocks/${userId}`, { method: 'DELETE' })
}

// =================== Deals & Exchange Tracking (Sprint 3) ===================
export async function getMyDeals(status?: string): Promise<Deal[]> {
  const qs = status ? `?status=${status}` : ''
  const data = await request<{ data: Deal[] }>(`/deals${qs}`)
  return data.data || []
}

export interface ProposeDealPayload {
  listing_id: number | string
  deal_type: 'cash' | 'exchange' | 'both'
  agreed_price?: number | null
  exchange_item?: string | null
  meeting_location_id?: number | null
  meet_at?: string | null
}

export async function proposeDeal(conversationId: number | string, payload: ProposeDealPayload): Promise<Deal> {
  const data = await request<{ data: Deal }>(`/conversations/${conversationId}/deals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return data.data
}

export async function acceptDeal(dealId: number | string): Promise<Deal> {
  const data = await request<{ data: Deal }>(`/deals/${dealId}/accept`, {
    method: 'PATCH',
  })
  return data.data
}

export async function declineDeal(dealId: number | string): Promise<Deal> {
  const data = await request<{ data: Deal }>(`/deals/${dealId}/decline`, {
    method: 'PATCH',
  })
  return data.data
}

export async function cancelDeal(dealId: number | string): Promise<Deal> {
  const data = await request<{ data: Deal }>(`/deals/${dealId}/cancel`, {
    method: 'PATCH',
  })
  return data.data
}

export async function confirmDealHandover(dealId: number | string): Promise<Deal> {
  const data = await request<{ data: Deal }>(`/deals/${dealId}/confirm`, {
    method: 'PATCH',
  })
  return data.data
}

// =================== Paystack Payments & Campus Escrow ===================
export interface InitializePaymentPayload {
  deal_id?: number | string
  listing_id?: number | string
  listing_title?: string
  amount?: number
  callback_url?: string
}

export interface InitializePaymentResponse {
  status: string
  message: string
  authorization_url?: string | null
  access_code?: string | null
  reference: string
  public_key?: string
  amount: number
  is_simulated?: boolean
  payment: Payment
}

export interface VerifyPaymentResponse {
  status: string
  message: string
  payment: Payment
  deal?: Deal | null
}

export async function initializePayment(payload: InitializePaymentPayload): Promise<InitializePaymentResponse> {
  return request<InitializePaymentResponse>('/payments/initialize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function verifyPayment(reference: string): Promise<VerifyPaymentResponse> {
  return request<VerifyPaymentResponse>(`/payments/verify/${encodeURIComponent(reference)}`)
}

export async function getPayments(page = 1): Promise<{ data: Payment[]; meta?: any }> {
  return request<{ data: Payment[]; meta?: any }>(`/payments?page=${page}`)
}

export async function getPayment(id: number | string): Promise<{ data: Payment }> {
  return request<{ data: Payment }>(`/payments/${id}`)
}

// =================== Reviews (Sprint 3) ===================
export async function submitReview(dealId: number | string, rating: number, comment?: string): Promise<Review> {
  const data = await request<{ data: Review }>(`/deals/${dealId}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rating, comment }),
  })
  return data.data
}

// =================== Profile & Users ===================
export async function getMyProfile(): Promise<AuthUser> {
  const data = await request<{ data: AuthUser }>('/me')
  return data.data
}

export async function updateProfile(formData: FormData): Promise<AuthUser> {
  formData.append('_method', 'PUT')
  const data = await request<{ data: AuthUser }>('/me', {
    method: 'POST',
    body: formData,
  })
  return data.data
}

export async function getPublicProfile(userId: number | string): Promise<{ user: AuthUser; active_listings: Listing[]; reviews: Review[] }> {
  return request<{ user: AuthUser; active_listings: Listing[]; reviews: Review[] }>(`/users/${userId}`)
}

// =================== Password Reset & PDPA ===================
export async function forgotPassword(email: string): Promise<{ message: string; reset_token?: string }> {
  return request<{ message: string; reset_token?: string }>('/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
}

export async function resetPassword(payload: { email: string; token: string; password: string; password_confirmation: string }): Promise<{ message: string }> {
  return request<{ message: string }>('/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function exportMyData(): Promise<Blob> {
  const token = localStorage.getItem('nussy_auth_token')
  const res = await fetch(`${API_BASE}/me/export`, {
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  return res.blob()
}

export async function deleteMyAccount(): Promise<{ message: string }> {
  return request<{ message: string }>('/me', {
    method: 'DELETE',
  })
}

// =================== Reports & Moderation (FR-MOD) ===================
export async function submitReport(payload: {
  reportable_type: 'listing' | 'user' | 'message' | 'review'
  reportable_id: number | string
  reason: string
  note?: string
}): Promise<{ message: string; report: any }> {
  return request<{ message: string; report: any }>('/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function getModerationReports(params: { status?: string; type?: string; page?: number } = {}): Promise<any> {
  const searchParams = new URLSearchParams()
  if (params.status && params.status !== 'all') searchParams.append('status', params.status)
  if (params.type && params.type !== 'all') searchParams.append('type', params.type)
  if (params.page) searchParams.append('page', String(params.page))

  const qs = searchParams.toString()
  return request<any>(`/moderation/reports${qs ? `?${qs}` : ''}`)
}

export async function updateModerationReport(reportId: number | string, payload: {
  resolution: 'dismissed' | 'content_removed' | 'user_warned' | 'user_suspended'
  action_note?: string
}): Promise<{ message: string; report: any }> {
  return request<{ message: string; report: any }>(`/moderation/reports/${reportId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

// =================== Notifications (FR-NOT) ===================
export async function getNotifications(): Promise<{ notifications: { data: any[] }; unread_count: number }> {
  return request<{ notifications: { data: any[] }; unread_count: number }>('/notifications')
}

export async function markNotificationRead(id: string): Promise<{ message: string; unread_count: number }> {
  return request<{ message: string; unread_count: number }>(`/notifications/${id}/read`, {
    method: 'PATCH',
  })
}

export async function markAllNotificationsRead(): Promise<{ message: string; unread_count: number }> {
  return request<{ message: string; unread_count: number }>('/notifications/read-all', {
    method: 'POST',
  })
}

// =================== Admin Operations (FR-ADM) ===================
export async function getAdminStats(): Promise<any> {
  return request<any>('/admin/stats')
}

export async function getAdminUsers(params: { q?: string; role?: string; status?: string; page?: number } = {}): Promise<any> {
  const searchParams = new URLSearchParams()
  if (params.q) searchParams.append('q', params.q)
  if (params.role && params.role !== 'all') searchParams.append('role', params.role)
  if (params.status && params.status !== 'all') searchParams.append('status', params.status)
  if (params.page) searchParams.append('page', String(params.page))

  const qs = searchParams.toString()
  return request<any>(`/admin/users${qs ? `?${qs}` : ''}`)
}

export async function updateAdminUser(userId: number | string, payload: { role?: string; status?: string }): Promise<any> {
  return request<any>(`/admin/users/${userId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function getAdminSettings(): Promise<any> {
  return request<any>('/admin/settings')
}

export async function updateAdminSettings(settings: Record<string, any>): Promise<any> {
  return request<any>('/admin/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  })
}

export async function createAdminCategory(payload: { name: string; description?: string; icon?: string }): Promise<any> {
  return request<any>('/admin/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function updateAdminCategory(categoryId: number | string, payload: { name?: string; description?: string; icon?: string }): Promise<any> {
  return request<any>(`/admin/categories/${categoryId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function createAdminLocation(payload: { name: string; description?: string; is_active?: boolean }): Promise<any> {
  return request<any>('/admin/locations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function updateAdminLocation(locationId: number | string, payload: { name?: string; description?: string; is_active?: boolean }): Promise<any> {
  return request<any>(`/admin/locations/${locationId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function getExportUrl(type: 'users' | 'listings' | 'deals'): string {
  const token = localStorage.getItem('nussy_auth_token')
  return `${API_BASE}/admin/export/${type}?token=${token || ''}`
}

async function downloadAuthenticatedCsv(endpoint: string, fallbackFilename: string): Promise<void> {
  const token = localStorage.getItem('nussy_auth_token')
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      Accept: 'text/csv, application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (!res.ok) {
    let msg = `Export failed (${res.status})`
    try {
      const err = await res.json()
      if (err.message) msg = err.message
    } catch {
      // ignore
    }
    throw new Error(msg)
  }

  const blob = await res.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fallbackFilename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}

export async function downloadAdminExport(type: 'users' | 'listings' | 'deals'): Promise<void> {
  return downloadAuthenticatedCsv(
    `/admin/export/${type}`,
    `lincoln_campus_${type}_${new Date().toISOString().slice(0, 10)}.csv`
  )
}

export async function getAdminListings(params: { q?: string; status?: string; category_id?: string | number; page?: number } = {}): Promise<any> {
  const searchParams = new URLSearchParams()
  if (params.q) searchParams.append('q', params.q)
  if (params.status && params.status !== 'all') searchParams.append('status', params.status)
  if (params.category_id && params.category_id !== 'all') searchParams.append('category_id', String(params.category_id))
  if (params.page) searchParams.append('page', String(params.page))

  const qs = searchParams.toString()
  return request<any>(`/admin/listings${qs ? `?${qs}` : ''}`)
}

export async function updateAdminListing(listingId: number | string, status: string): Promise<any> {
  return request<any>(`/admin/listings/${listingId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
}

export async function deleteAdminListing(listingId: number | string): Promise<any> {
  return request<any>(`/admin/listings/${listingId}`, {
    method: 'DELETE',
  })
}

export async function seedAdminDemoListings(): Promise<{
  message: string
  created_count: number
  total_listings: number
}> {
  return request<{ message: string; created_count: number; total_listings: number }>(
    '/admin/seed-demo-listings',
    { method: 'POST' }
  )
}

export async function getAdminDeals(params: { q?: string; status?: string; payment_status?: string; page?: number } = {}): Promise<any> {
  const searchParams = new URLSearchParams()
  if (params.q) searchParams.append('q', params.q)
  if (params.status && params.status !== 'all') searchParams.append('status', params.status)
  if (params.payment_status && params.payment_status !== 'all') searchParams.append('payment_status', params.payment_status)
  if (params.page) searchParams.append('page', String(params.page))

  const qs = searchParams.toString()
  return request<any>(`/admin/deals${qs ? `?${qs}` : ''}`)
}

export async function getAdminFinance(params: { withdrawal_status?: string; page?: number } = {}): Promise<any> {
  const searchParams = new URLSearchParams()
  if (params.withdrawal_status && params.withdrawal_status !== 'all') {
    searchParams.append('withdrawal_status', params.withdrawal_status)
  }
  if (params.page) searchParams.append('page', String(params.page))

  const qs = searchParams.toString()
  return request<any>(`/admin/finance${qs ? `?${qs}` : ''}`)
}

export async function processAdminWithdrawal(
  withdrawalId: number | string,
  payload: { status: 'paid' | 'rejected'; admin_note?: string }
): Promise<any> {
  return request<any>(`/admin/withdrawals/${withdrawalId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function getAdminAuditLogs(params: { q?: string; action?: string; page?: number } = {}): Promise<any> {
  const searchParams = new URLSearchParams()
  if (params.q) searchParams.append('q', params.q)
  if (params.action && params.action !== 'all') searchParams.append('action', params.action)
  if (params.page) searchParams.append('page', String(params.page))

  const qs = searchParams.toString()
  return request<any>(`/admin/audit-logs${qs ? `?${qs}` : ''}`)
}

export async function deleteAdminCategory(categoryId: number | string): Promise<any> {
  return request<any>(`/admin/categories/${categoryId}`, {
    method: 'DELETE',
  })
}

export async function deleteAdminLocation(locationId: number | string): Promise<any> {
  return request<any>(`/admin/locations/${locationId}`, {
    method: 'DELETE',
  })
}

// =================== Seller Wallet & Financial Records ===================
export async function getWallet(): Promise<WalletSummary> {
  const data = await request<{ wallet: WalletSummary }>('/wallet')
  return data.wallet
}

export async function getWalletTransactions(params: {
  type?: string
  status?: string
  q?: string
  page?: number
  per_page?: number
} = {}): Promise<{ data: WalletTransaction[]; current_page?: number; last_page?: number; total?: number }> {
  const searchParams = new URLSearchParams()
  if (params.type && params.type !== 'all') searchParams.append('type', params.type)
  if (params.status && params.status !== 'all') searchParams.append('status', params.status)
  if (params.q) searchParams.append('q', params.q)
  if (params.page) searchParams.append('page', String(params.page))
  if (params.per_page) searchParams.append('per_page', String(params.per_page))

  const qs = searchParams.toString()
  return request<{ data: WalletTransaction[]; current_page?: number; last_page?: number; total?: number }>(
    `/wallet/transactions${qs ? `?${qs}` : ''}`
  )
}

export async function getWalletWithdrawals(page = 1): Promise<{ data: WithdrawalRequest[]; current_page?: number; last_page?: number; total?: number }> {
  return request<{ data: WithdrawalRequest[]; current_page?: number; last_page?: number; total?: number }>(
    `/wallet/withdrawals?page=${page}`
  )
}

export async function updateWalletBankDetails(payload: {
  bank_name: string
  account_number: string
  account_name: string
}): Promise<{ message: string; wallet: any }> {
  return request<{ message: string; wallet: any }>('/wallet/bank-details', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function requestWalletWithdrawal(payload: {
  amount: number
  bank_name?: string
  account_number?: string
  account_name?: string
}): Promise<{ message: string; withdrawal: WithdrawalRequest }> {
  return request<{ message: string; withdrawal: WithdrawalRequest }>('/wallet/withdraw', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function downloadWalletExport(): Promise<void> {
  return downloadAuthenticatedCsv(
    '/wallet/export',
    `lincoln_seller_financial_records_${new Date().toISOString().slice(0, 10)}.csv`
  )
}

