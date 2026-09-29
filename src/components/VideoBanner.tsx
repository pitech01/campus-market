import Icon from './Icon'

export default function VideoBanner() {
  return (
    <section className="video-banner">
      <div className="container">
        <div
          className="video-banner-frame"
          style={{
            backgroundImage:
              "url('/images/students/campus-video-bg.jpg')",
          }}
        >
          <span className="video-banner-overlay" />
          <div className="video-banner-content">
            <span className="video-play-btn" aria-hidden="true">
              <Icon name="icon-play" />
            </span>
            <h3>See how a campus handover works</h3>
            <p>Verify, meet up, trade — safe and simple in under 5 minutes.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
