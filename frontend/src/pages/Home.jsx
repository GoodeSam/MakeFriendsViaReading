import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import { useAuth } from '../App.jsx'

const OFFER_FILTERS = [
  { value: '', label: '全部' },
  { value: 'gift', label: '可赠' },
  { value: 'swap', label: '可换' },
  { value: 'borrow', label: '可借' },
  { value: 'sell', label: '出售' },
  { value: 'hot', label: '🔥' },
]

const WANTED_FILTERS = [
  { value: '', label: '全部' },
  { value: 'gift', label: '求赠' },
  { value: 'swap', label: '求换' },
  { value: 'sell', label: '求购' },
]

const SORTS = [
  { value: '', label: '最新' },
  { value: 'title', label: '书名' },
  { value: 'community', label: '🌍全城' },
]

function hotBadge(count) {
  if (count >= 5) return { label: `🔥🔥 ${count}次`, cls: 'tag-hot-high' }
  if (count >= 2) return { label: `🔥 ${count}次`, cls: 'tag-hot' }
  if (count >= 1) return { label: `${count}次`, cls: 'tag-circulated' }
  return null
}

function OfferCard({ listing }) {
  const badge = hotBadge(listing.book.circulation_count)
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
          {listing.can_sell && <span className="tag tag-sell">¥{listing.sell_price ?? '面议'}</span>}
          {badge && <span className={`tag ${badge.cls}`}>{badge.label}</span>}
        </div>
        <div className="book-owner">
          👤 {listing.owner.nickname}
          {listing.community && ` · ${listing.community.name}`}
          {listing.condition_note && ` · ${listing.condition_note}`}
        </div>
      </div>
    </Link>
  )
}

function WantedCard({ listing }) {
  return (
    <Link to={`/listing/${listing.id}`} className="book-card">
      <div className="book-cover" style={{ background: 'linear-gradient(135deg,#c5cae9,#3f51b5)', fontSize: 22 }}>
        🔍
      </div>
      <div className="book-info">
        <div className="book-title">{listing.book.title}</div>
        <div className="book-author">{listing.book.author || '—'}</div>
        <div className="tags">
          {listing.can_gift && <span className="tag tag-wanted">求赠</span>}
          {listing.can_swap && <span className="tag tag-wanted">求换</span>}
          {listing.can_sell && <span className="tag tag-sell">出价¥{listing.sell_price ?? '面议'}</span>}
        </div>
        <div className="book-owner">
          🔍 {listing.owner.nickname} 求书中
          {listing.community && ` · ${listing.community.name}`}
        </div>
      </div>
    </Link>
  )
}

export default function Home() {
  const { nickname } = useAuth()
  const [mode, setMode] = useState('offer')   // 'offer' | 'wanted'
  const [filter, setFilter] = useState('')
  const [sort, setSort] = useState('')
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    const isHot = mode === 'offer' && filter === 'hot'
    api.getListings({
      type: isHot ? '' : filter,
      listingType: mode,
      sort: sort === 'community' ? 'community' : (sort === 'title' ? 'title' : undefined),
      allCommunities: sort === 'community',
    })
      .then(data => {
        if (isHot) {
          data = [...data].sort((a, b) => b.book.circulation_count - a.book.circulation_count)
        }
        setListings(data)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [mode, filter, sort])

  function switchMode(m) {
    setMode(m)
    setFilter('')
  }

  const filters = mode === 'offer' ? OFFER_FILTERS : WANTED_FILTERS

  return (
    <div className="page">
      <div className="header">
        <h1>以书会友</h1>
        <span style={{ fontSize: 13, color: '#aaa' }}>👋 {nickname || '…'}</span>
      </div>

      {/* Mode tabs */}
      <div className="mode-tabs">
        <button className={`mode-tab ${mode === 'offer' ? 'active' : ''}`} onClick={() => switchMode('offer')}>
          📚 书源
        </button>
        <button className={`mode-tab ${mode === 'wanted' ? 'active' : ''}`} onClick={() => switchMode('wanted')}>
          🔍 求购
        </button>
      </div>

      {/* Type filter tabs */}
      <div className="tabs" style={{ margin: '8px 16px 0' }}>
        {filters.map(f => (
          <button key={f.value} className={`tab ${filter === f.value ? 'active' : ''}`}
            onClick={() => setFilter(f.value)}>{f.label}</button>
        ))}
      </div>

      {/* Sort controls */}
      <div className="sort-row">
        {SORTS.map(s => (
          <button key={s.value} className={`sort-chip ${sort === s.value ? 'active' : ''}`}
            onClick={() => setSort(s.value)}>{s.label}</button>
        ))}
        {sort === 'community' && (
          <span style={{ fontSize: 11, color: '#aaa', alignSelf: 'center', marginLeft: 4 }}>显示全城书目</span>
        )}
      </div>

      {error && <div className="error-bar">{error}</div>}

      {loading
        ? <div className="loading"><div className="spinner" /></div>
        : listings.length === 0
          ? <div className="empty">
              <div className="empty-icon">{mode === 'wanted' ? '🔍' : '📭'}</div>
              <div className="empty-text">
                {mode === 'wanted' ? '暂无求购信息' : '暂无书籍，成为第一个上架的人吧'}
              </div>
            </div>
          : <div style={{ marginTop: 8, background: '#fff', borderRadius: 12, overflow: 'hidden', margin: '8px 16px' }}>
              {listings.map(l =>
                l.listing_type === 'wanted'
                  ? <WantedCard key={l.id} listing={l} />
                  : <OfferCard key={l.id} listing={l} />
              )}
            </div>
      }
    </div>
  )
}
