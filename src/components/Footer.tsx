import { Link } from 'react-router-dom'
import { Heart, ShieldCheck, Mail } from 'lucide-react'
import Icon from './Icon'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        {/* Brand & Mission Column */}
        <div className="footer-brand-column">
          <Link className="brand" to="/" aria-label="NSUK Campus Market Home">
            <div className="brand-badge" style={{ background: '#ffffff', padding: 2, border: '1.5px solid rgba(220, 38, 38, 0.4)' }}>
              <img src="/images/nsuk-logo.png" alt="NSUK Crest" style={{ width: 26, height: 26, objectFit: 'contain' }} />
            </div>
            <div className="brand-text-group">
              <span className="brand-name">Campus Market</span>
              <span className="brand-campus-pill">Keffi</span>
            </div>
          </Link>
          <p className="footer-desc">
            The verified peer-to-peer student marketplace for Nasarawa State University Keffi (NSUK). Safely buy, sell, and exchange textbooks, electronics, and hostel essentials.
          </p>
          <div className="footer-campus-badge">
            <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>Official Student Project · Nasarawa State University Keffi</span>
          </div>
          <div className="footer-social-row">
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="footer-social-btn" aria-label="Facebook">
              <Icon name="icon-facebook" />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="footer-social-btn" aria-label="Instagram">
              <Icon name="icon-instagram" />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="footer-social-btn" aria-label="LinkedIn">
              <Icon name="icon-linkedin" />
            </a>
          </div>
        </div>

        {/* Links Grid */}
        <div className="footer-links-grid">
          <div className="footer-column">
            <h4>Marketplace</h4>
            <ul>
              <li><Link to="/#categories">Textbooks & Notes</Link></li>
              <li><Link to="/#categories">Electronics & Laptops</Link></li>
              <li><Link to="/#categories">Hostel & Living</Link></li>
              <li><Link to="/#categories">Student Fashion</Link></li>
              <li><Link to="/listings/new">Post an Item (+)</Link></li>
            </ul>
          </div>

          <div className="footer-column">
            <h4>Campus & Safety</h4>
            <ul>
              <li><Link to="/#trust">Verification Process</Link></li>
              <li><Link to="/#trust">Safe Campus Meetup Spots</Link></li>
              <li><Link to="/deals">My Deals & Escrow</Link></li>
              <li><Link to="/favorites">Saved Favourites</Link></li>
              <li><Link to="/profile">My Student Hub</Link></li>
            </ul>
          </div>

          <div className="footer-column">
            <h4>Get In Touch</h4>
            <ul>
              <li><Link to="/#top">About NSUK Marketplace</Link></li>
              <li><Link to="/register">Join as a Student</Link></li>
              <li><Link to="/login">Student Log In</Link></li>
              <li><a href="mailto:info@nussy.rabanigeo.com" className="inline-flex items-center gap-1"><Mail className="w-3.5 h-3.5 inline text-red-500" /> Support Desk</a></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom">
        <div className="footer-bottom-inner">
          <p className="footer-copyright">
            <span>© {new Date().getFullYear()} NSUK Campus Market. Built with</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 inline mx-1 flex-shrink-0" />
            <span>for NSUK Student Community.</span>
          </p>
          <div className="footer-badges">
            <span className="footer-secure-pill">
              <ShieldCheck className="w-4 h-4 text-emerald-500 inline mr-1" />
              <span>100% Student Verified</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}


