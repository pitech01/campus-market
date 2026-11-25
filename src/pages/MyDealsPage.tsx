import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Handshake,
  Package,
  MapPin,
  Check,
  CheckCircle2,
  Sparkles,
  Star,
  ArrowRight,
  Lock,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react'
import type { Deal } from '../types'
import {
  getMyDeals,
  acceptDeal,
  declineDeal,
  cancelDeal,
  confirmDealHandover,
  submitReview,
  verifyPayment,
  resolveImageUrl,
  DEFAULT_ITEM_PLACEHOLDER,
} from '../lib/api'
import { useAuth } from '../lib/authContext'
import PaystackPaymentModal from '../components/PaystackPaymentModal'

export default function MyDealsPage() {
  const { user, isAuthenticated } = useAuth()
  const [deals, setDeals] = useState<Deal[]>([])
  const [activeTab, setActiveTab] = useState<'ongoing' | 'completed' | 'all'>('ongoing')
  const [isLoading, setIsLoading] = useState(true)

  // Review modal
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedDealId, setSelectedDealId] = useState<number | null>(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)

  // Paystack Escrow Payment Modal & Feedback
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedPaystackDeal, setSelectedPaystackDeal] = useState<Deal | null>(null)
  const [paymentFeedback, setPaymentFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Auto-verify when user returns from Paystack redirect
  useEffect(() => {
    const ref = searchParams.get('reference')
    if (ref && isAuthenticated) {
      verifyPayment(ref)
        .then((res) => {
          setPaymentFeedback({
            type: 'success',
            message: res.message || 'Payment confirmed! Funds are safely secured in Campus Escrow.',
          })
          loadDeals()
        })
        .catch((err) => {
          setPaymentFeedback({
            type: 'error',
            message: err.message || 'Could not verify Paystack payment.',
          })
        })
        .finally(() => {
          // Remove query params cleanly
          const newParams = new URLSearchParams(searchParams)
          newParams.delete('reference')
          newParams.delete('payment')
          newParams.delete('status')
          setSearchParams(newParams, { replace: true })
        })
    }
  }, [searchParams, isAuthenticated])

  useEffect(() => {
    if (isAuthenticated) {
      loadDeals()
    }
  }, [isAuthenticated, activeTab])

  const loadDeals = async () => {
    try {
      setIsLoading(true)
      const data = await getMyDeals(activeTab === 'all' ? undefined : activeTab)
      setDeals(data)
    } catch {
      // ignore
    } finally {
      setIsLoading(false)
    }
  }

  const handleAccept = async (dealId: number) => {
    try {
      await acceptDeal(dealId)
      loadDeals()
    } catch (err: any) {
      alert(err?.message || 'Failed to accept deal.')
    }
  }

  const handleDecline = async (dealId: number) => {
    try {
      await declineDeal(dealId)
      loadDeals()
    } catch (err: any) {
      alert(err?.message || 'Failed to decline deal.')
    }
  }

  const handleCancel = async (dealId: number) => {
    try {
      await cancelDeal(dealId)
      loadDeals()
    } catch (err: any) {
      alert(err?.message || 'Failed to cancel deal.')
    }
  }

  const handleConfirm = async (dealId: number) => {
    try {
      const updated = await confirmDealHandover(dealId)
      loadDeals()
      if (updated.status === 'completed') {
        setSelectedDealId(dealId)
        setShowReviewModal(true)
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to confirm handover.')
    }
  }

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDealId) return

    try {
      setIsSubmittingReview(true)
      await submitReview(selectedDealId, rating, comment)
      setShowReviewModal(false)
      setComment('')
      loadDeals()
      alert('Review submitted! Thank you.')
    } catch (err: any) {
      alert(err?.message || 'Failed to submit review.')
    } finally {
      setIsSubmittingReview(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Handshake className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          Campus Deals & Exchanges
        </h2>
        <p className="text-slate-500 text-sm mb-6">
          Please log in with your Lincoln University College, Nasarawa State student account to manage your ongoing trade agreements.
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
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Handshake className="w-7 h-7 text-emerald-600" />
            <span>My Campus Deals</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track negotiated prices, campus meeting locations, and confirm physical exchanges.
          </p>
        </div>

        {/* Tabs & Quick Wallet Link */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/wallet"
            className="px-3.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition"
          >
            Seller Wallet &amp; Earnings →
          </Link>
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {(['ongoing', 'completed', 'all'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition ${
                  activeTab === tab
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {tab} Deals
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Paystack Payment Feedback Alert */}
      {paymentFeedback && (
        <div
          className={`mb-6 p-4 rounded-2xl flex items-center justify-between text-sm ${
            paymentFeedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50'
              : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800/50'
          }`}
        >
          <div className="flex items-center gap-2">
            {paymentFeedback.type === 'success' ? (
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span className="font-semibold">{paymentFeedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setPaymentFeedback(null)}
            className="text-xs font-bold opacity-60 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Deals List */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-400 text-sm">
          <div className="inline-block animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mb-3" />
          <p>Loading your campus deals...</p>
        </div>
      ) : deals.length === 0 ? (
        <div className="bg-white dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1">
            No {activeTab !== 'all' ? activeTab : ''} deals found
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
            When you chat with students and propose or accept a deal, it will appear here so you both can coordinate handover on campus.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition"
          >
            <span>Browse Campus Marketplace</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {deals.map((deal) => {
            const isProposer = deal.proposer_id === user?.id
            const isBuyer = (deal as any).conversation ? (deal as any).conversation.buyer_id === user?.id : !isProposer
            const isCompleted = deal.status === 'completed'
            const isAccepted = deal.status === 'accepted'
            const isProposed = deal.status === 'proposed'

            return (
              <div
                key={deal.id}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/60 p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Status + Date */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : isAccepted
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : isProposed
                          ? 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800/40'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {deal.status}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(deal.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Listing Info */}
                  <div className="flex items-center space-x-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-700/50">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {deal.listing?.images && (deal.listing.images as any).length > 0 ? (
                        <img
                          src={resolveImageUrl(
                            typeof (deal.listing.images as any)[0] === 'string'
                              ? (deal.listing.images as any)[0]
                              : (deal.listing.images as any)[0].url
                          )}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = DEFAULT_ITEM_PLACEHOLDER
                          }}
                        />
                      ) : (
                        <Package className="w-6 h-6 text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {deal.listing?.title || 'Listing item'}
                      </h4>
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {deal.deal_type === 'exchange'
                          ? `Swap: ${deal.exchange_item || 'Item'}`
                          : `₦ ${Number(deal.agreed_price || deal.listing?.price || 0).toLocaleString()}`}
                      </p>
                    </div>
                  </div>

                  {/* Deal Details */}
                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 mb-4 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Proposer:</span>
                      <span className="font-semibold">{isProposer ? 'You' : deal.proposer?.name || 'Partner'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Meeting Location:</span>
                      <span className="font-semibold text-right truncate max-w-[180px] inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{deal.meeting_location?.name || 'On-Campus Public Area'}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Escrow Status & Paystack Deposit Button */}
                {deal.deal_type !== 'exchange' && (Number(deal.agreed_price || deal.listing?.price || 0) > 0) && (
                  <div className="mb-2">
                    {deal.payment_status === 'paid' ? (
                      <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 rounded-xl flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
                        <span className="flex items-center gap-1.5 font-bold">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <span>Campus Escrow Secured (Paystack)</span>
                        </span>
                        <span className="text-[10px] font-mono opacity-80">
                          {deal.payment_reference ? deal.payment_reference.slice(0, 16) + '…' : 'Paid'}
                        </span>
                      </div>
                    ) : (
                      isAccepted && isBuyer && (
                        <button
                          type="button"
                          onClick={() => setSelectedPaystackDeal(deal)}
                          className="w-full mb-1 py-2 px-3 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Pay ₦{Number(deal.agreed_price || deal.listing?.price || 0).toLocaleString()} with Paystack (Escrow)</span>
                        </button>
                      )
                    )}
                  </div>
                )}

                {/* Bottom Action Buttons */}
                <div className="pt-2">
                  {isProposed && (
                    <div className="flex items-center space-x-2">
                      {!isProposer ? (
                        <>
                          <button
                            onClick={() => handleAccept(deal.id)}
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition inline-flex items-center justify-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Accept Deal</span>
                          </button>
                          <button
                            onClick={() => handleDecline(deal.id)}
                            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition"
                          >
                            Decline
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleCancel(deal.id)}
                          className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl transition"
                        >
                          Cancel Proposal
                        </button>
                      )}
                    </div>
                  )}

                  {isAccepted && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleConfirm(deal.id)}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition inline-flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirm In-Person Handover</span>
                      </button>
                      <button
                        onClick={() => handleCancel(deal.id)}
                        className="px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs font-bold rounded-xl"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {isCompleted && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold inline-flex items-center gap-1">
                        <Sparkles className="w-4 h-4 text-emerald-500" />
                        <span>Exchange Completed</span>
                      </span>
                      <button
                        onClick={() => {
                          setSelectedDealId(deal.id)
                          setShowReviewModal(true)
                        }}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition inline-flex items-center gap-1"
                      >
                        <Star className="w-3.5 h-3.5 fill-white" />
                        <span>Review Student</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
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
              Share your exchange experience to keep Lincoln Campus Marketplace trusted and safe.
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
                      onClick={() => setRating(star)}
                      className={`p-1 transition ${
                        star <= rating ? 'text-amber-400 scale-110' : 'text-slate-300 dark:text-slate-600'
                      }`}
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Comments
                </label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="e.g., Punctual, item exactly as described, easy handover!"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
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
      {/* Paystack Escrow Checkout Modal */}
      {selectedPaystackDeal && (
        <PaystackPaymentModal
          deal={selectedPaystackDeal}
          onClose={() => setSelectedPaystackDeal(null)}
        />
      )}
    </div>
  )
}

