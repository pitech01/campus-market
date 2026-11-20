import { useState } from 'react'
import { ShieldCheck, Lock, AlertCircle, Loader2, X, ExternalLink, CheckCircle2 } from 'lucide-react'
import type { Deal, Listing } from '../types'
import { initializePayment } from '../lib/api'

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
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const activeListing = deal?.listing || listing
  const finalAmount = customAmount ?? (deal?.agreed_price ? Number(deal.agreed_price) : Number(activeListing?.price || 0))
  const currencySymbol = activeListing?.currency === 'RM' ? 'RM' : '₦'
  const meetingSpot = deal?.meeting_location?.name || activeListing?.location || 'Lincoln Campus'

  const handlePay = async () => {
    setLoading(true)
    setErrorMsg(null)

    try {
      const callbackUrl = `${window.location.origin}/deals?payment=success`
      const res = await initializePayment({
        deal_id: deal?.id,
        listing_id: activeListing?.id,
        amount: finalAmount,
        callback_url: callbackUrl,
      })

      if (res.authorization_url) {
        // Redirect directly to Paystack hosted checkout
        window.location.href = res.authorization_url
      } else {
        setErrorMsg('Paystack checkout URL was not generated. Please try again.')
        setLoading(false)
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to initiate Paystack payment. Please check your network.')
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
              <span className="paystack-modal-subtitle">100% Buyer Protection · Lincoln University College</span>
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
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
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
                    <span>LUC Verified Deal</span>
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

          {/* Paystack Trust Badge */}
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
