import Icon from './Icon'

const SERVICES = [
  { icon: 'icon-truck', title: 'Free Campus Pickup', sub: 'Meet at your block' },
  { icon: 'icon-headset', title: 'Verified Sellers', sub: 'Lincoln student ID only' },
  { icon: 'icon-refresh-cw', title: 'Fair Meetup Guarantee', sub: 'Inspect before you pay' },
  { icon: 'icon-gift', title: '80% Seller Payouts', sub: '20% platform escrow fee' },
]

export default function ServiceBadges() {
  return (
    <section className="service-badges">
      <div className="container">
        <div className="service-badges-grid">
          {SERVICES.map((s) => (
            <div className="service-badge-item" key={s.title}>
              <div className="service-badge-icon">
                <Icon name={s.icon} />
              </div>
              <div className="service-badge-text">
                <strong>{s.title}</strong>
                <span>{s.sub}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
