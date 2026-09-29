import React, { useState } from 'react'
import { Flag, X, CheckCircle2, ShieldAlert } from 'lucide-react'
import { submitReport } from '../lib/api'

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  reportableType: 'listing' | 'user' | 'message' | 'review'
  reportableId: number | string
  targetTitle?: string
  onReportSubmitted?: () => void
}

const REPORT_REASONS: Record<string, string[]> = {
  listing: [
    'Prohibited Item (Weapons, Drugs, Alcohol, Vapes, Tobacco)',
    'Suspected Counterfeit or Pirated Material',
    'Scam or Fraudulent Pricing',
    'Misleading Description or Photos',
    'Offensive or Inappropriate Content',
    'Duplicate or Spam Listing',
    'Other Violation',
  ],
  user: [
    'Suspected Fake Account / Non-Lincoln Member',
    'Harassment or Abusive Conduct',
    'Attempted Scams or Payment Fraud',
    'Unresponsive / Repeatedly No-Shows at Agreed Meets',
    'Other Violation',
  ],
  message: [
    'Harassment or Threatening Language',
    'Scam Link or Phishing Attempt',
    'Unsolicited External Payment Request',
    'Inappropriate / Offensive Chat',
    'Other Violation',
  ],
  review: [
    'False or Malicious Review',
    'Abusive or Harassing Remarks',
    'Spam or Irrelevant Comment',
    'Other Violation',
  ],
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  reportableType,
  reportableId,
  targetTitle,
  onReportSubmitted,
}) => {
  const reasons = REPORT_REASONS[reportableType] || REPORT_REASONS.listing
  const [reason, setReason] = useState(reasons[0])
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await submitReport({
        reportable_type: reportableType,
        reportable_id: reportableId,
        reason,
        note: note.trim() || undefined,
      })
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        setNote('')
        onClose()
        if (onReportSubmitted) onReportSubmitted()
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Failed to submit report. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="report-modal-backdrop" onClick={onClose}>
      <div className="report-modal-box" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="report-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Flag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: 0 }}>Report to Campus Moderation</h3>
              <span style={{ fontSize: 11, color: '#ffe4e6', display: 'block' }}>Lincoln University College Trust & Safety</span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 24 }}>
          {success ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ width: 48, height: 48, background: '#ecfdf5', color: '#059669', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <h4 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-h)', marginBottom: 4 }}>Report Submitted</h4>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Thank you. Campus moderators will investigate this {reportableType} within 48 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {targetTitle && (
                <div style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border)', borderRadius: 12, padding: 10, fontSize: 12 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-soft)', display: 'block', marginBottom: 2 }}>
                    Reporting {reportableType}:
                  </span>
                  <span style={{ fontWeight: 600, color: 'var(--text-h)' }}>{targetTitle}</span>
                </div>
              )}

              {error && (
                <div style={{ padding: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 10, fontSize: 12 }}>
                  {error}
                </div>
              )}

              <div className="admin-form-group">
                <label className="admin-label">
                  Reason for Report <span style={{ color: '#e11d48' }}>*</span>
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="admin-select"
                  required
                >
                  {reasons.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-form-group">
                <label className="admin-label">
                  Additional Details / Evidence (Optional)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Provide context (e.g. asked for external payment, fake ID, abusive conduct)..."
                  rows={3}
                  maxLength={1000}
                  className="admin-textarea"
                />
              </div>

              <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: 12, padding: 10, fontSize: 11.5, color: '#92400e', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Safety Reminder:</strong> All reports are strictly confidential. The reported user will not see your identity.
                </span>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="btn btn-ghost btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-sm"
                  style={{ background: '#e11d48', color: '#fff', border: 'none', padding: '8px 18px', fontWeight: 700 }}
                >
                  {loading ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default ReportModal

