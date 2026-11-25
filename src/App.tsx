import { Route, Routes } from 'react-router-dom'
import Layout from './Layout'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import ListingDetailPage from './pages/ListingDetailPage'
import ListingFormPage from './pages/ListingFormPage'
import ProfilePage from './pages/ProfilePage'
import WalletPage from './pages/WalletPage'
import MyDealsPage from './pages/MyDealsPage'
import FavoritesPage from './pages/FavoritesPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import NotFoundPage from './pages/NotFoundPage'
import './App.css'

function App() {
  return (
    <Routes>
      {/* Standalone Auth & Admin Routes (No Consumer Navbar & Footer) */}
      <Route path="login" element={<LoginPage />} />
      <Route path="register" element={<RegisterPage />} />
      <Route path="forgot-password" element={<ForgotPasswordPage />} />
      <Route path="reset-password" element={<ResetPasswordPage />} />
      <Route path="admin" element={<AdminDashboardPage />} />
      <Route path="moderation" element={<AdminDashboardPage />} />

      {/* Main Marketplace Pages with Navbar & Footer */}
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="wallet" element={<WalletPage />} />
        <Route path="deals" element={<MyDealsPage />} />
        <Route path="favorites" element={<FavoritesPage />} />
        <Route path="listings/new" element={<ListingFormPage />} />
        <Route path="listings/:id" element={<ListingDetailPage />} />
        <Route path="listings/:id/edit" element={<ListingFormPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App
