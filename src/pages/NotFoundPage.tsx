import { Link } from 'react-router-dom'
import Icon from '../components/Icon'

export default function NotFoundPage() {
  return (
    <section className="state-page">
      <div className="state-icon-box">
        <Icon name="icon-search" />
      </div>
      <h1>Page not found</h1>
      <p>The page or listing you are looking for might have been moved or removed.</p>
      <Link to="/" className="btn btn-primary">
        Back to campus marketplace
      </Link>
    </section>
  )
}
