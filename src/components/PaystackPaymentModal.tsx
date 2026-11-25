import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, Lock, AlertCircle, Loader2, X, ExternalLink, CheckCircle2, UserCheck, ArrowRight } from 'lucide-react'
import type { Deal, Listing } from '../types'
import { initializePayment } from '../lib/api'
import { useAuth } from '../lib/authContext'

interface PaystackPaymentModalProps {
  deal?: Deal | null
  listing?: Listing | null
  amount?: number
  onClose: () => void
  onSuccess?: (reference: string) => void
}

export default function PaystackPaymentModal({
  deal,
  listing,
  amount: customAmount,
  onClose,
}: PaystackPaymentModalProps) {
  const { user, isAuthenticated } = useAuth()
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isAuthError, setIsAuthError] = useState(false)

  const activeListing = deal?.listing || listing
  const finalAmount = customAmount ?? (deal?.agreed_price ? Number(deal.agreed_price) : Number(activeListing?.price || 0))
  const currencySymbol = activeListing?.currency === 'RM' ? 'RM' : '₦'
  const meetingSpot = deal?.meeting_location?.name || activeListing?.location || 'Lincoln Central Library & Senate Foyer'

  // If user is not signed in, show a dedicated, friendly authentication card
  if (!isAuthenticated) {
    const returnUrl = encodeURIComponent(window.location.pathname)

    return (
      <div className="paystack-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
        <div className="paystack-modal-box max-w-md" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="paystack-modal-header bg-gradient-to-r from-red-600 to-red-700 text-white">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Lock className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="paystack-modal-title text-white">Sign In Required</h3>
                <span className="paystack-modal-subtitle text-red-100">Lincoln Nasarawa Campus Escrow</span>
              </div>
            </div>
            <button
              type="button"
              className="paystack-close-btn text-white/80 hover:text-white"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center border border-red-100 dark:border-red-900/50">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">Sign in to Purchase</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                To guarantee 100% student escrow protection and secure meetups on campus, you must be signed in with your Lincoln Nasarawa student account.
              </p>
            </div>

            {/* Summary preview */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 text-left">
              <div className="text-xs text-slate-500">Selected Item</div>
              <div className="font-semibold text-slate-900 dark:text-white truncate">{activeListing?.title || 'Campus Item'}</div>
              <div className="text-sm font-bold text-red-600 mt-0.5">{currencySymbol} {finalAmount.toLocaleString()}</div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-2.5 pt-2">
              <Link
                to={`/login?redirect=${returnUrl}`}
                className="btn btn-primary w-full py-3 font-bold inline-flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Sign In to Continue</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to={`/register?redirect=${returnUrl}`}
                className="btn btn-outline w-full py-2.5 text-sm inline-flex items-center justify-center gap-1.5"
              >
                <span>Create Student Account</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const handlePay = async () => {
    setLoading(true)
    setErrorMsg(null)
    setIsAuthError(false)

    try {
      const callbackUrl = `${window.location.origin}/deals?payment=success`
      const res = await initializePayment({
        deal_id: deal?.id,
        listing_id: activeListing?.id,
        listing_title: activeListing?.title,
        amount: finalAmount,
        callback_url: callbackUrl,
      })

      const publicKey =
        res.public_key ||
        import.meta.env.VITE_PAYSTACK_PUBLIC_KEY ||
        'pk_test_1547bb10f90e5a418cc62e479fbbb4390abdbf70'

      // If running in simulated/pilot mode, verify immediately via /deals redirect
      if (res.is_simulated) {
        window.location.href = `/deals?payment=success&reference=${encodeURIComponent(res.reference)}`
        return
      }

      // Priority 1: Hosted Paystack checkout URL created by our backend for this exact reference
      if (res.authorization_url) {
        window.location.href = res.authorization_url
        return
      }

      // Priority 2: Paystack Inline Popup fallback using server-registered reference
      if (typeof (window as any).PaystackPop !== 'undefined' && publicKey) {
        try {
          const amountInKobo = Math.round(finalAmount * 100)
          const handler = (window as any).PaystackPop.setup({
            key: publicKey,
            email: user?.email || 'student@lincoln.edu.ng',
            amount: amountInKobo,
            currency: activeListing?.currency === 'RM' ? 'MYR' : 'NGN',
            ref: res.reference,
            metadata: {
              custom_fields: [
                {
                  display_name: 'Campus Marketplace Item',
                  variable_name: 'item_title',
                  value: activeListing?.title || 'Campus Item',
                },
                {
                  display_name: 'Student Payer',
                  variable_name: 'student_name',
                  value: user?.name || 'Student',
                },
              ],
            },
            callback: function (response: any) {
              const finalRef = response.reference || res.reference
              window.location.href = `/deals?payment=success&reference=${encodeURIComponent(finalRef)}`
            },
            onClose: function () {
              setLoading(false)
            },
          })

          handler.openIframe()
          return
        } catch (inlineErr) {
          console.warn('Paystack inline checkout error:', inlineErr)
        }
      }

      setErrorMsg('Paystack checkout URL was not generated. Please try again.')
      setLoading(false)
    } catch (err: any) {
      const msg = err.message || ''
      if (err.status === 401 || msg.toLowerCase().includes('unauthenticated')) {
        setIsAuthError(true)
        setErrorMsg('Your login session has expired. Please sign in again to proceed.')
      } else {
        setErrorMsg(msg || 'Failed to initiate Paystack payment. Please check your network.')
      }
      setLoading(false)
    }
  }

  return (
    <div className="paystack-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="paystack-modal-box" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="paystack-modal-header">
          <div className="flex items-center gap-2">
            <div className="paystack-header-icon">
              <Lock className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="paystack-modal-title">Paystack Campus Escrow</h3>
              <span className="paystack-modal-subtitle">100% Buyer Protection · Lincoln University College, Nasarawa State</span>
            </div>
          </div>
          <button
            type="button"
            className="paystack-close-btn"
            onClick={onClose}
            aria-label="Close payment modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="paystack-modal-body">
          {errorMsg && (
            <div className="paystack-alert-error" role="alert">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <div className="flex-1">
                <span>{errorMsg}</span>
                {isAuthError && (
                  <div className="mt-2">
                    <Link
                      to={`/login?redirect=${encodeURIComponent(window.location.pathname)}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-red-700 underline"
                    >
                      <span>Sign in again</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Logged in Student Banner */}
          {user && (
            <div className="flex items-center justify-between p-2.5 bg-red-50/60 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 rounded-xl text-xs text-slate-700 dark:text-slate-300">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <UserCheck className="w-4 h-4 text-red-600" />
                <span>Payer: <strong>{user.name}</strong></span>
              </span>
              <span className="text-[11px] text-slate-500 font-mono">{user.student_id || user.email}</span>
            </div>
          )}

          {/* Item & Price Summary Card */}
          <div className="paystack-summary-card">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <span className="paystack-summary-label">Paying For</span>
                <h4 className="paystack-item-title">{activeListing?.title || 'Campus Marketplace Agreement'}</h4>
                <div className="paystack-meta-row">
                  <span className="paystack-meta-pill">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Lincoln Verified Deal</span>
                  </span>
                  <span className="paystack-meta-spot">{meetingSpot}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="paystack-summary-label">Total Amount</span>
                <div className="paystack-price-display">
                  <span className="paystack-currency">{currencySymbol}</span>
                  <span className="paystack-amount">{finalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* How Campus Escrow Works */}
          <div className="paystack-escrow-explainer">
            <h5 className="flex items-center gap-1.5 text-xs font-bold text-red-700 dark:text-red-300 uppercase tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4 text-red-600" />
              <span>How Student Escrow Protects You:</span>
            </h5>
            <ul className="paystack-steps-list">
              <li>
                <CheckCircle2 className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                <span>Your payment is locked safely in Paystack escrow. <strong>The seller is NOT paid yet.</strong></span>
              </li>
              <li>
                <CheckCircle2 className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                <span>Meet up safely at <strong>{meetingSpot}</strong> and inspect your item.</span>
              </li>
              <li>
                <CheckCircle2 className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                <span>Only when you tap <strong>"Confirm Handover"</strong> are the funds released.</span>
              </li>
            </ul>
          </div>

          {/* Paystack Trust Footer */}
          <div className="paystack-trust-footer">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Secured by Paystack 256-bit bank encryption</span>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">Cards · Bank Transfer · USSD</span>
          </div>

          {/* Action CTAs */}
          <div className="paystack-actions-row">
            <button
              type="button"
              className="paystack-cancel-btn"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="button"
              className="paystack-submit-btn"
              onClick={handlePay}
              disabled={loading || finalAmount <= 0}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connecting Paystack…</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Pay {currencySymbol}{finalAmount.toLocaleString()} via Paystack</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-1 opacity-70" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
