import Icon from './Icon'

export default function TrustSection() {
  return (
    <section className="trust-section" id="trust">
      <div className="trust-header">
        <span className="trust-eyebrow">Campus-First Marketplace</span>
        <h2>Built Exclusively for Lincoln Nasarawa Students</h2>
        <p>No outside strangers, no delivery delays, and no listing cuts. Just safe, direct trading right on campus.</p>
      </div>

      <div className="trust-grid">
        <div className="trust-card">
          <div className="trust-icon-box bg-red">
            <Icon name="icon-shield" />
          </div>
          <h3>Verified Student IDs</h3>
          <p>
            Every user is authenticated with their Lincoln University College, Nasarawa State email and student ID so you always know who you're trading with.
          </p>
        </div>

        <div className="trust-card">
          <div className="trust-icon-box bg-orange">
            <Icon name="icon-map-pin" />
          </div>
          <h3>Walkable Campus Meetups</h3>
          <p>
            No shipping fees or long courier waits. Meet your coursemate at Central Library, Main Gate, or Hostel Courtyard in 5 minutes.
          </p>
        </div>

        <div className="trust-card">
          <div className="trust-icon-box bg-green">
            <Icon name="icon-tag" />
          </div>
          <h3>Transparent 80/20 Escrow</h3>
          <p>
            Free to list items. Sellers keep 80% of every completed sale in their wallet, while 20% supports platform escrow and campus safety.
          </p>
        </div>

        <div className="trust-card">
          <div className="trust-icon-box bg-crimson">
            <Icon name="icon-sparkles" />
          </div>
          <h3>Sustainable Student Circularity</h3>
          <p>
            Give textbooks, dorm appliances, and outfits a second life across semesters while saving up to 70% off retail prices.
          </p>
        </div>
      </div>
    </section>
  )
}
