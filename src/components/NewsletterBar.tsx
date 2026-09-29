import { useState } from 'react'
import Icon from './Icon'

export default function NewsletterBar() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setSubscribed(true)
    setEmail('')
  }

  return (
    <section className="newsletter-bar">
      <div className="container newsletter-inner">
        <div className="newsletter-text">
          <Icon name="icon-mail" className="newsletter-icon" />
          <div>
            <strong>Get notified about new campus listings</strong>
            <span>Fresh textbooks, gear and deals — straight to your inbox.</span>
          </div>
        </div>

        {subscribed ? (
          <span className="newsletter-success">
            <Icon name="icon-check-circle" />
            You're on the list!
          </span>
        ) : (
          <form className="newsletter-form" onSubmit={handleSubmit}>
            <input
              type="email"
              required
              placeholder="Enter your student email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-label="Email address"
            />
            <button type="submit" className="btn btn-cta">
              Subscribe
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
