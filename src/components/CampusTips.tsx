import Icon from './Icon'

const TIPS = [
  {
    date: 'Aug 12',
    title: 'How to Price Your Used Textbooks Fairly',
    excerpt: 'A quick guide to pricing notes and course books so they actually sell.',
    image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=500&auto=format&fit=crop&q=80',
  },
  {
    date: 'Aug 05',
    title: 'Meeting Up Safely on Campus',
    excerpt: 'Best spots on NSUK Keffi campus to hand off items and what to check before you pay.',
    image: '/images/nsuk-gate-1.jpg',
  },
  {
    date: 'Jul 28',
    title: '5 Things Every Freshman Should Buy Used',
    excerpt: 'Save money in your first semester by trading with students who just graduated.',
    image: '/images/nsuk-senate-building.jpg',
  },
  {
    date: 'Jul 15',
    title: 'Why Verified Trading Beats Random Group Chats',
    excerpt: 'The risks of untraceable sellers, and how student ID verification fixes that.',
    image: '/images/nsuk-official-hero-2.jpg',
  },
]

export default function CampusTips() {
  return (
    <section className="campus-tips-section">
      <div className="container">
        <div className="section-heading-row">
          <div className="section-heading-block">
            <span className="section-eyebrow">Campus Trading 101</span>
            <h2>
              Tips &amp; <span className="text-primary">Guides</span>
            </h2>
          </div>
        </div>

        <div className="tips-grid">
          {TIPS.map((tip) => (
            <article className="tip-card" key={tip.title}>
              <div className="tip-card-media">
                <img src={tip.image} alt="" loading="lazy" />
              </div>
              <div className="tip-card-body">
                <span className="tip-date">
                  <Icon name="icon-calendar" />
                  {tip.date}
                </span>
                <h3>{tip.title}</h3>
                <p>{tip.excerpt}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
