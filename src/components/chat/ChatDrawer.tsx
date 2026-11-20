import { useState, useEffect, useRef } from 'react'
import {
  MessageSquare,
  X,
  CheckCircle2,
  Star,
  Handshake,
  Ban,
  ShieldCheck,
  Package,
  MapPin,
  Sparkles,
  Camera,
  Check,
  Lock,
} from 'lucide-react'
import type {
  Conversation,
  Deal,
  Listing,
  MeetingLocation,
  Message,
} from '../../types'
import {
  getConversations,
  getConversationThread,
  sendMessage,
  proposeDeal,
  acceptDeal,
  declineDeal,
  cancelDeal,
  confirmDealHandover,
  submitReview,
  getMeetingLocations,
  blockUser,
} from '../../lib/api'
import { useAuth } from '../../lib/authContext'
import PaystackPaymentModal from '../PaystackPaymentModal'

interface ChatDrawerProps {
  isOpen: boolean
  onClose: () => void
  initialListing?: Listing | null
  initialConversationId?: number | null
}

export default function ChatDrawer({
  isOpen,
  onClose,
  initialListing,
  initialConversationId,
}: ChatDrawerProps) {
  const { user, isAuthenticated } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<number | null>(initialConversationId || null)
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)

  // Deal modal state
  const [showDealModal, setShowDealModal] = useState(false)
  const [dealType, setDealType] = useState<'cash' | 'exchange' | 'both'>('cash')
  const [agreedPrice, setAgreedPrice] = useState<string>('')
  const [exchangeItem, setExchangeItem] = useState('')
  const [meetingLocationId, setMeetingLocationId] = useState<number | ''>('')
  const [meetingLocations, setMeetingLocations] = useState<MeetingLocation[]>([])
  const [isSubmittingDeal, setIsSubmittingDeal] = useState(false)

  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [reviewedDealId, setReviewedDealId] = useState<number | null>(null)
  const [paystackModalDeal, setPaystackModalDeal] = useState<Deal | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch meeting locations for deals
  useEffect(() => {
    getMeetingLocations()
      .then((locs) => setMeetingLocations(locs))
      .catch(() => {})
  }, [])

  // Load conversations when drawer opens
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      loadConversations()
    }
  }, [isOpen, isAuthenticated])

  // Handle initial listing or conversation
  useEffect(() => {
    if (initialConversationId) {
      setActiveConversationId(initialConversationId)
    } else if (initialListing && isOpen) {
      initListingChat(initialListing)
    }
  }, [initialListing, initialConversationId, isOpen])

  // Poll active conversation thread
  useEffect(() => {
    if (!activeConversationId || !isOpen) return

    loadThread(activeConversationId)
    const interval = setInterval(() => {
      loadThread(activeConversationId, true)
    }, 4000)

    return () => clearInterval(interval)
  }, [activeConversationId, isOpen])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadConversations = async () => {
    try {
      setIsLoading(true)
      const list = await getConversations()
      setConversations(list)
      if (list.length > 0 && !activeConversationId) {
        setActiveConversationId(list[0].id)
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false)
    }
  }

  const initListingChat = async (listing: Listing) => {
    try {
      setIsLoading(true)
      const { startConversation } = await import('../../lib/api')
      const conv = await startConversation(listing.id)
      setActiveConversationId(conv.id)
      await loadConversations()
    } catch {
      // ignore
    } finally {
      setIsLoading(false)
    }
  }

  const loadThread = async (id: number, silent = false) => {
    try {
      if (!silent) setIsLoading(true)
      const res = await getConversationThread(id)
      setActiveConversation(res.conversation)
      setMessages(res.messages)
    } catch {
      // ignore
    } finally {
      if (!silent) setIsLoading(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!inputText.trim() && !selectedImage) || !activeConversationId || isSending) return

    try {
      setIsSending(true)
      const newMsg = await sendMessage(activeConversationId, inputText.trim(), selectedImage || undefined)
      setMessages((prev) => [...prev, newMsg])
      setInputText('')
      setSelectedImage(null)
      setImagePreview(null)
      loadConversations()
    } catch {
      alert('Failed to send message. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSelectedImage(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleProposeDealSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeConversation || !activeConversation.listing) return

    try {
      setIsSubmittingDeal(true)
      await proposeDeal(activeConversation.id, {
        listing_id: activeConversation.listing_id,
        deal_type: dealType,
        agreed_price: dealType !== 'exchange' ? parseFloat(agreedPrice) || activeConversation.listing.price : null,
        exchange_item: dealType !== 'cash' ? exchangeItem : null,
        meeting_location_id: meetingLocationId ? Number(meetingLocationId) : null,
      })
      setShowDealModal(false)
      loadThread(activeConversation.id)
    } catch (err: any) {
      alert(err?.message || 'Failed to propose deal.')
    } finally {
      setIsSubmittingDeal(false)
    }
  }

  const handleAcceptDeal = async (deal: Deal) => {
    try {
      await acceptDeal(deal.id)
      if (activeConversationId) loadThread(activeConversationId)
    } catch (err: any) {
      alert(err?.message || 'Failed to accept deal.')
    }
  }

  const handleDeclineDeal = async (deal: Deal) => {
    try {
      await declineDeal(deal.id)
      if (activeConversationId) loadThread(activeConversationId)
    } catch (err: any) {
      alert(err?.message || 'Failed to decline deal.')
    }
  }

  const handleCancelDeal = async (deal: Deal) => {
    try {
      await cancelDeal(deal.id)
      if (activeConversationId) loadThread(activeConversationId)
    } catch (err: any) {
      alert(err?.message || 'Failed to cancel deal.')
    }
  }

  const handleConfirmHandover = async (deal: Deal) => {
    try {
      const updated = await confirmDealHandover(deal.id)
      if (activeConversationId) loadThread(activeConversationId)
      if (updated.status === 'completed') {
        setReviewedDealId(deal.id)
        setShowReviewModal(true)
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to confirm handover.')
    }
  }

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reviewedDealId) return

    try {
      setIsSubmittingReview(true)
      await submitReview(reviewedDealId, reviewRating, reviewComment)
      setShowReviewModal(false)
      setReviewComment('')
      alert('Review submitted! Thank you for helping keep Lincoln Marketplace trusted.')
    } catch (err: any) {
      alert(err?.message || 'Failed to submit review.')
    } finally {
      setIsSubmittingReview(false)
    }
  }

  const handleBlockUser = async (otherUserId: number) => {
    if (!confirm('Are you sure you want to block this user? You will no longer receive messages from them.')) return
    try {
      await blockUser(otherUserId)
      alert('User has been blocked.')
      loadConversations()
    } catch {
      alert('Failed to block user.')
    }
  }

  if (!isOpen) return null

  const activeDeal = activeConversation?.active_deal
  const otherUser = activeConversation?.other_user
  const listing = activeConversation?.listing

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-slate-900/60 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 shadow-2xl flex flex-col h-full border-l border-slate-200 dark:border-slate-800">
        {/* Top Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
              <MessageSquare className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">Campus Messenger & Deals</h2>
              <p className="text-xs text-slate-400">Direct peer-to-peer student trading (Lincoln University)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content Area: Sidebar Inbox + Chat Thread */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Inbox Sidebar */}
          <div className="w-1/3 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50 dark:bg-slate-900/50">
            <div className="p-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Conversations ({conversations.length})
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {conversations.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No active conversations yet. Find an item and click "Chat with Seller"!
                </div>
              ) : (
                conversations.map((conv) => {
                  const isActive = conv.id === activeConversationId
                  return (
                    <button
                      key={conv.id}
                      onClick={() => setActiveConversationId(conv.id)}
                      className={`w-full text-left p-3 flex items-start space-x-3 transition ${
                        isActive
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 border-l-4 border-emerald-600'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0 flex items-center justify-center text-sm font-bold text-slate-700 dark:text-slate-300 overflow-hidden">
                        {conv.other_user?.avatar_url ? (
                          <img src={conv.other_user.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          conv.other_user?.name?.charAt(0) || 'U'
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                            {conv.other_user?.name || 'Student'}
                          </p>
                          {conv.unread_count > 0 && (
                            <span className="bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                              {conv.unread_count}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium truncate">
                          {conv.listing?.title || 'Listing item'}
                        </p>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* Right Chat Thread & Deal Box */}
          <div className="w-2/3 flex flex-col bg-white dark:bg-slate-900">
            {activeConversation ? (
              <>
                {/* Chat Partner Header */}
                <div className="p-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs">
                      {otherUser?.avatar_url ? (
                        <img src={otherUser.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        otherUser?.name?.charAt(0) || 'U'
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-semibold text-sm text-slate-900 dark:text-white">
                          {otherUser?.name}
                        </span>
                        {otherUser?.campus_verified && (
                          <span className="bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/60 text-[10px] font-semibold px-1.5 py-0.5 rounded inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-red-600 dark:text-red-400" />
                            <span>LUC Verified</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 inline-flex items-center gap-1">
                        <span>{otherUser?.faculty || 'Lincoln Student'}</span>
                        <span>•</span>
                        <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
                        <span>{otherUser?.average_rating || '5.0'}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowDealModal(true)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition inline-flex items-center gap-1"
                    >
                      <Handshake className="w-3.5 h-3.5" />
                      <span>Propose Deal</span>
                    </button>
                    {otherUser && (
                      <button
                        onClick={() => handleBlockUser(otherUser.id)}
                        className="text-xs text-slate-400 hover:text-red-500 p-1.5 rounded transition"
                        title="Block User"
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Safe Meeting Campus Alert Banner */}
                <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/50 px-3 py-2 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                    <span><strong>Safety Tips:</strong> Meet at official campus spots (Library/Cafeteria). Inspect item before paying.</span>
                  </span>
                </div>

                {/* Listing Snapshot Bar */}
                {listing && (
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-10 h-10 rounded bg-slate-200 dark:bg-slate-700 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {Array.isArray(listing.images) && listing.images.length > 0 ? (
                          <img
                            src={typeof listing.images[0] === 'string' ? listing.images[0] : (listing.images[0] as any).url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[200px]">
                          {listing.title}
                        </p>
                        <p className="text-xs font-bold text-emerald-600">
                          ₦ {Number(listing.price).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      listing.status === 'active' || listing.status === 'available'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : listing.status === 'reserved'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                    }`}>
                      {listing.status}
                    </span>
                  </div>
                )}

                {/* Active Deal Status Card (if any) */}
                {activeDeal && (
                  <div className="m-3 p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200 dark:border-emerald-800 text-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-emerald-900 dark:text-emerald-300 inline-flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Deal Agreement ({activeDeal.status.toUpperCase()})</span>
                      </span>
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                        {activeDeal.agreed_price ? `₦ ${Number(activeDeal.agreed_price).toLocaleString()}` : activeDeal.exchange_item || 'Exchange'}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px] mb-2 inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>Meetup: {activeDeal.meeting_location?.name || 'On-Campus Public Area'}</span>
                    </p>

                    {/* Escrow Status / Paystack Trigger */}
                    {activeDeal.deal_type !== 'exchange' && (Number(activeDeal.agreed_price || listing?.price || 0) > 0) && (
                      <div className="mb-2">
                        {activeDeal.payment_status === 'paid' ? (
                          <div className="py-1 px-2 rounded-lg bg-emerald-100/70 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-[11px] font-bold text-emerald-800 dark:text-emerald-200 flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Escrow Secured (Paid via Paystack)</span>
                            </span>
                            <span className="font-mono text-[9.5px] opacity-75">
                              {activeDeal.payment_reference ? activeDeal.payment_reference.slice(0, 12) + '…' : 'Paid'}
                            </span>
                          </div>
                        ) : (
                          activeDeal.status === 'accepted' && (activeConversation?.buyer_id === user?.id) && (
                            <button
                              type="button"
                              onClick={() => setPaystackModalDeal(activeDeal)}
                              className="w-full py-1.5 px-2 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Lock className="w-3 h-3" />
                              <span>Pay ₦{Number(activeDeal.agreed_price || listing?.price || 0).toLocaleString()} with Paystack (Escrow)</span>
                            </button>
                          )
                        )}
                      </div>
                    )}

                    {/* Deal Action Buttons */}
                    <div className="flex items-center gap-2">
                      {activeDeal.status === 'proposed' && (
                        <>
                          {activeDeal.proposer_id !== user?.id ? (
                            <>
                              <button
                                onClick={() => handleAcceptDeal(activeDeal)}
                                className="px-2.5 py-1 bg-emerald-600 text-white font-bold rounded hover:bg-emerald-700 transition inline-flex items-center gap-1"
                              >
                                <Check className="w-3 h-3" />
                                <span>Accept Deal</span>
                              </button>
                              <button
                                onClick={() => handleDeclineDeal(activeDeal)}
                                className="px-2.5 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-300 transition"
                              >
                                Decline
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleCancelDeal(activeDeal)}
                              className="px-2.5 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded"
                            >
                              Cancel Proposal
                            </button>
                          )}
                        </>
                      )}

                      {activeDeal.status === 'accepted' && (
                        <div className="flex items-center justify-between w-full">
                          <span className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                            Listing is Reserved. Handover in progress.
                          </span>
                          <button
                            onClick={() => handleConfirmHandover(activeDeal)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded shadow-sm transition inline-flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Confirm Handover</span>
                          </button>
                        </div>
                      )}

                      {activeDeal.status === 'completed' && (
                        <div className="flex items-center justify-between w-full">
                          <span className="text-emerald-700 dark:text-emerald-300 font-bold inline-flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Deal Completed & Handed Over!</span>
                          </span>
                          <button
                            onClick={() => {
                              setReviewedDealId(activeDeal.id)
                              setShowReviewModal(true)
                            }}
                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded inline-flex items-center gap-1"
                          >
                            <Star className="w-3 h-3 fill-white" />
                            <span>Rate Student</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Messages Stream */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 text-xs p-6">
                      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2">
                        <MessageSquare className="w-6 h-6 text-slate-400" />
                      </div>
                      <p className="font-semibold text-slate-600 dark:text-slate-300">
                        Start the conversation with {otherUser?.name || 'the student'}!
                      </p>
                      <p className="mt-1">
                        Ask about condition, confirm pickup spots, or agree on a price.
                      </p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.sender_id === user?.id
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-xs shadow-sm ${
                              isMe
                                ? 'bg-emerald-600 text-white rounded-br-xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-xs'
                            }`}
                          >
                            {msg.image_url && (
                              <div className="mb-1.5 rounded-lg overflow-hidden max-h-48">
                                <img src={msg.image_url} alt="" className="w-full h-full object-cover" />
                              </div>
                            )}
                            <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                          </div>
                          <span className="text-[10px] text-slate-400 mt-1 px-1">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Bar */}
                <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                  {imagePreview && (
                    <div className="mb-2 relative inline-block">
                      <img src={imagePreview} alt="Preview" className="w-16 h-16 rounded-lg object-cover border" />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedImage(null)
                          setImagePreview(null)
                        }}
                        className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title="Attach photo"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageSelect}
                      accept="image/*"
                      className="hidden"
                    />
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Type a message or campus meeting question..."
                      className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-3.5 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="submit"
                      disabled={isSending || (!inputText.trim() && !selectedImage)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition"
                    >
                      {isSending ? '...' : 'Send'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-sm">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                  <MessageSquare className="w-8 h-8 text-slate-400" />
                </div>
                <p>Select a conversation to start chatting</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Propose Deal Modal */}
      {showDealModal && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
              <Handshake className="w-5 h-5 text-emerald-600" />
              <span>Propose Campus Deal</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Set clear terms for the face-to-face exchange on campus.
            </p>

            <form onSubmit={handleProposeDealSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Deal Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['cash', 'exchange', 'both'] as const).map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setDealType(t)}
                      className={`py-2 text-xs font-bold rounded-lg border uppercase transition ${
                        dealType === t
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {dealType !== 'exchange' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Agreed Price (NGN ₦)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={agreedPrice}
                    onChange={(e) => setAgreedPrice(e.target.value)}
                    placeholder={listing ? String(listing.price) : '0.00'}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                  />
                </div>
              )}

              {dealType !== 'cash' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Exchange Item / Terms
                  </label>
                  <input
                    type="text"
                    value={exchangeItem}
                    onChange={(e) => setExchangeItem(e.target.value)}
                    placeholder="e.g., Silberschatz 10th Ed or USB-C Hub"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Safe Campus Meeting Spot
                </label>
                <select
                  value={meetingLocationId}
                  onChange={(e) => setMeetingLocationId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                >
                  <option value="">Select a safe campus meetup spot</option>
                  {meetingLocations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDealModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDeal}
                  className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition"
                >
                  {isSubmittingDeal ? 'Submitting...' : 'Send Proposal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
              <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
              <span>Rate & Review Student</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              How was your campus exchange experience? Your review helps keep Lincoln University marketplace safe.
            </p>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Rating
                </label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className={`p-1 transition ${
                        star <= reviewRating ? 'text-amber-400 scale-110' : 'text-slate-300 dark:text-slate-600'
                      }`}
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Comments (Optional)
                </label>
                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="e.g. On time, item in perfect condition, friendly student!"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Skip
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition"
                >
                  {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Paystack Escrow Payment Modal */}
      {paystackModalDeal && (
        <PaystackPaymentModal
          deal={paystackModalDeal}
          onClose={() => setPaystackModalDeal(null)}
        />
      )}
    </div>
  )
}
