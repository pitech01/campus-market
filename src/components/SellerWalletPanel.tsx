import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Wallet,
  TrendingUp,
  Lock,
  ArrowDownToLine,
  Download,
  Building2,
  CheckCircle2,
  AlertCircle,
  Search,
  RefreshCw,
  Banknote,
  ShieldCheck,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  RotateCcw,
} from 'lucide-react'
import {
  getWallet,
  getWalletTransactions,
  getWalletWithdrawals,
  updateWalletBankDetails,
  requestWalletWithdrawal,
  downloadWalletExport,
} from '../lib/api'
import type { WalletSummary, WalletTransaction, WithdrawalRequest } from '../types'

const TX_TYPE_META: Record<string, { label: string; badgeClass: string }> = {
  escrow_hold: {
    label: 'Escrow Hold',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50',
  },
  escrow_release: {
    label: 'Escrow Released',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50',
  },
  cash_sale: {
    label: 'Cash Meetup Sale',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/50',
  },
  withdrawal: {
    label: 'Bank Payout',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50',
  },
  escrow_refund: {
    label: 'Escrow Refund',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  },
}

const STATUS_BADGE: Record<string, string> = {
  completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300',
  paid: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300',
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300',
  cancelled: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  failed: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300',
}

function formatNaira(amount: number | string | undefined | null): string {
  const num = Number(amount || 0)
  return `₦${num.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function SellerWalletPanel() {
  const [wallet, setWallet] = useState<WalletSummary | null>(null)
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [txLoading, setTxLoading] = useState(false)
  const [subView, setSubView] = useState<'ledger' | 'withdrawals'>('ledger')

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // Bank Details Form
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountName, setAccountName] = useState('')
  const [savingBank, setSavingBank] = useState(false)

  // Payout Request Form
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [requestingPayout, setRequestingPayout] = useState(false)
  const [exporting, setExporting] = useState(false)

  // Feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message })
    setTimeout(() => setFeedback(null), 5000)
  }

  const loadWalletAndWithdrawals = useCallback(async () => {
    try {
      const [walletData, withdrawalRes] = await Promise.all([
        getWallet(),
        getWalletWithdrawals(),
      ])
      setWallet(walletData)
      setWithdrawals(withdrawalRes.data || [])
      if (walletData.bank_name) setBankName(walletData.bank_name)
      if (walletData.account_number) setAccountNumber(walletData.account_number)
      if (walletData.account_name) setAccountName(walletData.account_name)
    } catch (err: any) {
      showFeedback('error', err?.message || 'Could not load seller wallet.')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadTransactions = useCallback(async () => {
    try {
      setTxLoading(true)
      const res = await getWalletTransactions({
        type: typeFilter,
        status: statusFilter,
        q: searchQuery,
      })
      setTransactions(res.data || [])
    } catch {
      // ignore transient error
    } finally {
      setTxLoading(false)
    }
  }, [typeFilter, statusFilter, searchQuery])

  useEffect(() => {
    loadWalletAndWithdrawals()
  }, [loadWalletAndWithdrawals])

  useEffect(() => {
    loadTransactions()
  }, [loadTransactions])

  const handleSaveBankDetails = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSavingBank(true)
      const res = await updateWalletBankDetails({
        bank_name: bankName.trim(),
        account_number: accountNumber.trim(),
        account_name: accountName.trim(),
      })
      showFeedback('success', res.message || 'Payout bank account updated.')
      loadWalletAndWithdrawals()
    } catch (err: any) {
      showFeedback('error', err?.message || 'Failed to save bank details.')
    } finally {
      setSavingBank(false)
    }
  }

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault()
    const amountNum = Number(withdrawAmount)
    if (!amountNum || amountNum < 100) {
      showFeedback('error', 'Minimum payout request is ₦100.00.')
      return
    }
    try {
      setRequestingPayout(true)
      const res = await requestWalletWithdrawal({
        amount: amountNum,
        bank_name: bankName.trim() || undefined,
        account_number: accountNumber.trim() || undefined,
        account_name: accountName.trim() || undefined,
      })
      setWithdrawAmount('')
      showFeedback('success', res.message || 'Withdrawal request submitted!')
      await Promise.all([loadWalletAndWithdrawals(), loadTransactions()])
    } catch (err: any) {
      showFeedback('error', err?.message || 'Withdrawal request failed.')
    } finally {
      setRequestingPayout(false)
    }
  }

  const handleExportCsv = async () => {
    try {
      setExporting(true)
      await downloadWalletExport()
      showFeedback('success', 'Financial records CSV downloaded.')
    } catch (err: any) {
      showFeedback('error', err?.message || 'Failed to export financial records.')
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="py-16 text-center text-slate-400 text-sm">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full mb-3" />
        <p>Loading seller wallet &amp; financial records...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Flash Feedback */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-bold flex items-center justify-between gap-3 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800/50 dark:text-emerald-300'
              : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/40 dark:border-red-800/50 dark:text-red-300'
          }`}
        >
          <span className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </span>
          <button type="button" onClick={() => setFeedback(null)} className="opacity-70 hover:opacity-100 font-extrabold">
            ×
          </button>
        </div>
      )}

      {/* Top Financial KPI Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Made */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-red-950 text-white rounded-2xl p-5 shadow-md border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
              Total Made ({wallet?.seller_share_rate ?? 80}% Seller Share)
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="text-2xl font-black tracking-tight">{formatNaira(wallet?.total_made)}</div>
          <p className="text-[11px] text-slate-300 mt-2">
            {wallet?.completed_sales_count || 0} sale(s) · Gross {formatNaira(wallet?.total_gross_sales)} · Admin {wallet?.commission_rate ?? 20}% ({formatNaira(wallet?.total_platform_fees)})
          </p>
        </div>

        {/* Available Balance */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Available Wallet Balance
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
            {formatNaira(wallet?.available_balance)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            Ready to withdraw to your bank account
          </p>
        </div>

        {/* Held in Escrow */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Pending in Escrow ({wallet?.seller_share_rate ?? 80}%)
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center">
              <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
            {formatNaira(wallet?.pending_balance)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            {wallet?.pending_escrow_count || 0} deal(s) awaiting handover confirmation
          </p>
        </div>

        {/* Total Withdrawn & Buyer Spend */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Withdrawn
            </span>
            <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/50 flex items-center justify-center">
              <ArrowDownToLine className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {formatNaira(wallet?.total_withdrawn)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            Pending payouts: <strong>{formatNaira(wallet?.pending_withdrawals_total)}</strong> · Spent: {formatNaira(wallet?.total_spent_as_buyer)}
          </p>
        </div>
      </div>

      {/* How Seller Wallet Works Banner */}
      <div className="bg-red-50/70 dark:bg-red-950/20 border border-red-200/80 dark:border-red-900/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            <strong className="text-slate-900 dark:text-white block mb-0.5">
              How Your Lincoln Seller Wallet Works ({wallet?.seller_share_rate ?? 80}% Seller / {wallet?.commission_rate ?? 20}% Admin Split)
            </strong>
            Your seller dashboard holds <strong>{wallet?.seller_share_rate ?? 80}%</strong> of the cost of sold items while the platform retains a <strong>{wallet?.commission_rate ?? 20}%</strong> admin fee. Paystack payments wait in <strong>Pending Escrow</strong> until both parties confirm campus handover, then move into your withdrawable <strong>Available Balance</strong>.
          </div>
        </div>
        <Link
          to="/deals"
          className="btn btn-outline btn-sm shrink-0 text-xs font-bold whitespace-nowrap"
        >
          View Active Deals
        </Link>
      </div>

      {/* Bank Details & Request Payout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Payout Bank Details */}
        <form
          onSubmit={handleSaveBankDetails}
          className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-4 shadow-xs"
        >
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-red-600" />
                <span>Payout Bank Account</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Where your released escrow earnings will be settled</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Bank Name</label>
              <input
                type="text"
                required
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. GTBank, Access, OPay, Kuda"
                className="input-control text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Account Number</label>
              <input
                type="text"
                required
                minLength={8}
                maxLength={20}
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="e.g. 0123456789"
                className="input-control text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Account Name</label>
            <input
              type="text"
              required
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="Account holder full name"
              className="input-control text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={savingBank}
            className="btn btn-outline btn-sm font-bold text-xs"
          >
            {savingBank ? 'Saving Bank Details...' : 'Save Bank Account'}
          </button>
        </form>

        {/* Request Withdrawal */}
        <form
          onSubmit={handleWithdraw}
          className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-4 shadow-xs flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-emerald-600" />
                  <span>Request Wallet Payout</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Withdrawable balance: <strong className="text-emerald-600">{formatNaira(wallet?.available_balance)}</strong>
                </p>
              </div>
              {Number(wallet?.available_balance || 0) >= 100 && (
                <button
                  type="button"
                  onClick={() => setWithdrawAmount(String(wallet?.available_balance || 0))}
                  className="text-[11px] font-bold text-red-600 hover:underline"
                >
                  Withdraw Max
                </button>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Payout Amount (NGN ₦)
              </label>
              <div className="input-with-affix">
                <span className="input-prefix">₦</span>
                <input
                  type="number"
                  min={100}
                  step="0.01"
                  max={Number(wallet?.available_balance || 0) > 0 ? Number(wallet?.available_balance) : undefined}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Enter amount (min ₦100)"
                  className="input-control with-prefix text-xs"
                  required
                />
              </div>
            </div>

            <div className="text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700/60">
              {bankName && accountNumber ? (
                <span>
                  Destination: <strong>{bankName}</strong> · <span className="font-mono">{accountNumber}</span> ({accountName})
                </span>
              ) : (
                <span>Please fill in your payout bank account details on the left first.</span>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={requestingPayout || Number(wallet?.available_balance || 0) < 100}
            className="btn btn-primary btn-sm w-full font-bold text-xs py-2.5 disabled:opacity-50"
          >
            {requestingPayout ? 'Submitting Payout Request...' : 'Request Bank Payout'}
          </button>
        </form>
      </div>

      {/* Ledger & Payout History Section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl w-fit">
            <button
              type="button"
              onClick={() => setSubView('ledger')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                subView === 'ledger'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Financial Records ({transactions.length})
            </button>
            <button
              type="button"
              onClick={() => setSubView('withdrawals')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                subView === 'withdrawals'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Payout Requests ({withdrawals.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                loadWalletAndWithdrawals()
                loadTransactions()
              }}
              className="btn btn-outline btn-sm text-xs inline-flex items-center gap-1.5"
              title="Refresh financial records"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={exporting}
              className="btn btn-outline btn-sm text-xs inline-flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
            </button>
          </div>
        </div>

        {subView === 'ledger' ? (
          <div>
            {/* Filters */}
            <div className="p-4 bg-slate-50/70 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-700 flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search item title, reference, or buyer..."
                  className="input-control pl-8 text-xs"
                />
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="input-control text-xs w-auto"
              >
                <option value="all">All Record Types</option>
                <option value="escrow_release">Escrow Released</option>
                <option value="escrow_hold">Escrow Hold (Pending)</option>
                <option value="cash_sale">Cash Meetup Sales</option>
                <option value="withdrawal">Bank Payouts</option>
                <option value="escrow_refund">Escrow Refunds</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-control text-xs w-auto"
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            {/* Ledger Table */}
            {txLoading ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading financial records...</div>
            ) : transactions.length === 0 ? (
              <div className="py-14 px-6 text-center">
                <Wallet className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-1">No financial records yet</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  When a buyer pays via Paystack escrow or you complete a cash meetup sale, every naira earned and payout requested will be recorded here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-[11px] uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-4 font-bold">Date &amp; Ref</th>
                      <th className="py-3 px-4 font-bold">Type</th>
                      <th className="py-3 px-4 font-bold">Details / Counterparty</th>
                      <th className="py-3 px-4 font-bold">Method</th>
                      <th className="py-3 px-4 font-bold text-right">Item Cost</th>
                      <th className="py-3 px-4 font-bold text-right">Admin (20%)</th>
                      <th className="py-3 px-4 font-bold text-right">Your Share (80%)</th>
                      <th className="py-3 px-4 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                    {transactions.map((tx) => {
                      const meta = TX_TYPE_META[tx.type] || {
                        label: tx.type,
                        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
                      }
                      const isCredit = tx.direction === 'credit'
                      const isDebit = tx.direction === 'debit'

                      return (
                        <tr key={tx.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/20">
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="font-semibold text-slate-800 dark:text-slate-200">
                              {new Date(tx.created_at).toLocaleDateString()}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400">{tx.reference}</div>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${meta.badgeClass}`}>
                              {isCredit ? (
                                <ArrowDownLeft className="w-3 h-3" />
                              ) : isDebit ? (
                                <ArrowUpRight className="w-3 h-3" />
                              ) : (
                                <Clock className="w-3 h-3" />
                              )}
                              <span>{meta.label}</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-4 max-w-xs">
                            <div className="font-semibold text-slate-900 dark:text-white truncate">
                              {tx.listing ? (
                                <Link to={`/listings/${tx.listing.id}`} className="hover:text-red-600 hover:underline">
                                  {tx.listing.title}
                                </Link>
                              ) : (
                                tx.description
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">
                              {tx.counterparty ? `Buyer: ${tx.counterparty.name}` : tx.description}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 dark:text-slate-300 capitalize">
                            {tx.payment_method.replace('_', ' ')}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap text-right text-slate-600 dark:text-slate-300">
                            {formatNaira(tx.gross_amount)}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap text-right text-slate-500">
                            {Number(tx.fee_amount || 0) > 0 ? `-${formatNaira(tx.fee_amount)}` : '—'}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap text-right font-extrabold">
                            <span
                              className={
                                isCredit
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : isDebit
                                  ? 'text-red-600 dark:text-red-400'
                                  : 'text-amber-600 dark:text-amber-400'
                              }
                            >
                              {isCredit ? '+' : isDebit ? '-' : ''}
                              {formatNaira(tx.net_amount)}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${STATUS_BADGE[tx.status] || 'bg-slate-100 text-slate-600'}`}>
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div>
            {withdrawals.length === 0 ? (
              <div className="py-14 px-6 text-center">
                <RotateCcw className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-1">No payout requests yet</h4>
                <p className="text-xs text-slate-500">
                  Once your Paystack escrow earnings move into your Available Balance, you can request a bank payout above.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-[11px] uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-4 font-bold">Reference &amp; Date</th>
                      <th className="py-3 px-4 font-bold">Destination Bank</th>
                      <th className="py-3 px-4 font-bold text-right">Amount</th>
                      <th className="py-3 px-4 font-bold">Status</th>
                      <th className="py-3 px-4 font-bold">Admin Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                    {withdrawals.map((w) => (
                      <tr key={w.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/20">
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-mono font-bold text-slate-800 dark:text-slate-200">{w.reference}</div>
                          <div className="text-[11px] text-slate-400">{new Date(w.created_at).toLocaleString()}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900 dark:text-white">{w.bank_name}</div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {w.account_number} · {w.account_name}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-right font-extrabold text-slate-900 dark:text-white">
                          {formatNaira(w.amount)}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${STATUS_BADGE[w.status] || 'bg-slate-100 text-slate-600'}`}>
                            {w.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {w.admin_note || (w.status === 'pending' ? 'Awaiting admin payout review' : '—')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
