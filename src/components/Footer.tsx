import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import Icon from './Icon'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand-column">
          <Link className="brand" to="/">
            <div className="brand-badge">
              <span className="brand-logo-text">N</span>
            </div>
            <div className="brand-text-group">
              <span className="brand-name">Nussy</span>
              <span className="brand-campus-pill">LUC Campus</span>
            </div>
          </Link>
          <p className="footer-desc">
            The dedicated verified peer-to-peer marketplace for Lincoln University College students to trade textbooks, electronics, and dorm living essentials.
          </p>
          <div className="footer-campus-badge">
            <Icon name="icon-shield" />
            <span>Official Student Project · Lincoln University College</span>
          </div>
          <div className="footer-social-row">
            <a href="#" className="footer-social-btn" aria-label="Facebook">
              <Icon name="icon-facebook" />
            </a>
            <a href="#" className="footer-social-btn" aria-label="Instagram">
              <Icon name="icon-instagram" />
            </a>
            <a href="#" className="footer-social-btn" aria-label="LinkedIn">
              <Icon name="icon-linkedin" />
            </a>
          </div>
        </div>

        <div className="footer-links-grid">
          <div className="footer-column">
            <h4>Marketplace</h4>
            <ul>
              <li><Link to="/#categories">Textbooks & Notes</Link></li>
              <li><Link to="/#categories">Electronics & Laptops</Link></li>
              <li><Link to="/#categories">Hostel Furniture</Link></li>
              <li><Link to="/#categories">Student Fashion</Link></li>
            </ul>
          </div>

          <div className="footer-column">
            <h4>Campus & Safety</h4>
            <ul>
              <li><Link to="/#trust">Verification Process</Link></li>
              <li><Link to="/#trust">Safe Meetup Spots</Link></li>
              <li><Link to="/listings/new">List an Item for Free</Link></li>
              <li><Link to="/profile">My Student Hub</Link></li>
            </ul>
          </div>

          <div className="footer-column">
            <h4>Get To Know Us</h4>
            <ul>
              <li><Link to="/#top">About Nussy Store</Link></li>
              <li><Link to="/register">Join as a Student</Link></li>
              <li><Link to="/login">Log In</Link></li>
              <li><Link to="/profile?tab=saved">Saved Items</Link></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-inner">
          <p className="inline-flex items-center gap-1.5">
            <span>© {new Date().getFullYear()} Nussy Store. Created with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
            <span>for LUC Campus Community.</span>
          </p>
          <div className="footer-badges">
            <span className="footer-secure-pill">
              <Icon name="icon-check-circle" /> 100% Student Verified
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}

