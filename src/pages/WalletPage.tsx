import { Link } from 'react-router-dom'
import { Wallet, ArrowRight } from 'lucide-react'
import { useAuth } from '../lib/authContext'
import SellerWalletPanel from '../components/SellerWalletPanel'

export default function WalletPage() {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-red-50 dark:bg-red-950/40 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Wallet className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          Seller Wallet &amp; Financial Records
        </h2>
        <p className="text-slate-500 text-sm mb-6">
          Sign in with your Lincoln University College, Nasarawa State student account to track your sales revenue, escrow balance, and payouts.
        </p>
        <Link
          to="/login?redirect=%2Fwallet"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition shadow-sm"
        >
          <span>Sign In</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Wallet className="w-7 h-7 text-red-600" />
            <span>Seller Wallet &amp; Financial Records</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track everything you have made from escrow &amp; cash sales, manage payout bank details, and export your ledger.
          </p>
        </div>
        <Link to="/profile" className="btn btn-outline btn-sm text-xs font-bold self-start sm:self-auto">
          Back to Profile Hub
        </Link>
      </div>

      <SellerWalletPanel />
    </div>
  )
}
