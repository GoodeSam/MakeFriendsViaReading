import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import { useAuth } from '../App.jsx'

const FILTERS = [
  { value: '', label: '全部' },
  { value: 'gift', label: '可赠' },
  { value: 'swap', label: '可换' },
  { value: 'borrow', label: '可借' },
]

function BookCard({ listing }) {
  return (
    <Link to={`/listing/${listing.id}`} className="book-card">
      <div className="book-cover">
        {listing.book.cover_url
          ? <img src={listing.book.cover_url} alt={listing.book.title} />
          : '📖'}
      </div>
      <div className="book-info">
        <div className="book-title">{listing.book.title}</div>
        <div className="book-author">{listing.book.author || '—'}</div>
        <div className="tags">
          {listing.can_gift && <span className="tag tag-gift">可赠</span>}
          {listing.can_swap && <span className="tag tag-swap">可换</span>}
          {listing.can_borrow && <span className="tag tag-borrow">可借</span>}
        </div>
        <div className="book-owner">👤 {listing.owner.nickname} · {listing.condition_note || '书况良好'}</div>
      </div>
    </Link>
  )
}

export default function Home() {
  const { nickname } = useAuth()
  const [listings, setListings] = useState([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    api.getListings(filter)
      .then(setListings)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [filter])

  return (
    <div className="page">
      <div className="header">
        <h1>以书会友</h1>
        <span style={{ fontSize: 13, color: '#aaa' }}>👋 {nickname || '…'}</span>
      </div>
      <div className="tabs">
        {FILTERS.map(f => (
          <button key={f.value} className={`tab ${filter === f.value ? 'active' : ''}`}
            onClick={() => setFilter(f.value)}>{f.label}</button>
        ))}
      </div>
      {error && <div className="error-bar">{error}</div>}
      {loading
        ? <div className="loading"><div className="spinner" /></div>
        : listings.length === 0
          ? <div className="empty"><div className="empty-icon">📭</div><div className="empty-text">暂无书籍，成为第一个上架的人吧</div></div>
          : <div style={{ marginTop: 8, background: '#fff', borderRadius: 12, overflow: 'hidden', margin: '8px 16px' }}>
              {listings.map(l => <BookCard key={l.id} listing={l} />)}
            </div>
      }
    </div>
  )
}
