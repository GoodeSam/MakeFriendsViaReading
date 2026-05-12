import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api.js'
import { useAuth } from '../App.jsx'

// For offer listings: what the applicant is requesting
const OFFER_TYPE_OPTIONS = [
  { value: 'gift',   label: '申请赠送', icon: '🎁', desc: '对方将这本书赠送给你',     key: 'can_gift' },
  { value: 'swap',   label: '申请换书', icon: '🔄', desc: '你提供一本书来换',         key: 'can_swap' },
  { value: 'borrow', label: '申请借阅', icon: '📖', desc: '借来阅读，到期归还',       key: 'can_borrow' },
  { value: 'sell',   label: '购买',     icon: '💰', desc: '按标价购买',               key: 'can_sell' },
]

// For wanted listings: what the responder is offering
const WANTED_TYPE_OPTIONS = [
  { value: 'gift',   label: '我愿意赠送', icon: '🎁', desc: '免费送给对方',           key: 'can_gift' },
  { value: 'swap',   label: '我愿意换书', icon: '🔄', desc: '换一本书给对方',         key: 'can_swap' },
  { value: 'sell',   label: '我愿意出售', icon: '💰', desc: '按对方出价出售',         key: 'can_sell' },
]

export default function ListingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { userId } = useAuth()
  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showSheet, setShowSheet] = useState(false)
  const [appType, setAppType] = useState('')
  const [appMessage, setAppMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    api.getListing(id)
      .then(setListing)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  async function handleApply() {
    if (!appType) return
    setSubmitting(true)
    setError('')
    try {
      await api.createApplication({ listing_id: Number(id), type: appType, message: appMessage || null })
      setSuccess(true)
      setShowSheet(false)
    } catch (e) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="loading"><div className="spinner" /></div>

  const isWanted = listing?.listing_type === 'wanted'
  const typeOptions = isWanted ? WANTED_TYPE_OPTIONS : OFFER_TYPE_OPTIONS
  const ctaLabel = isWanted ? '我有这本书' : '申请这本书'
  const successMsg = isWanted ? '✅ 已告知对方，等待TA回复' : '✅ 申请已发送，等待对方同意'

  return (
    <div className="page">
      <div className="header">
        <button className="header-back" onClick={() => navigate(-1)}>←</button>
        <h1>{isWanted ? '求购详情' : '书籍详情'}</h1>
        <span />
      </div>
      {error && <div className="error-bar">{error}</div>}
      {success && (
        <div style={{ background: '#e8f5e9', color: '#1b5e20', padding: '10px 16px', fontSize: 13, borderRadius: 8, margin: '12px 16px' }}>
          {successMsg}
        </div>
      )}
      {listing && (
        <>
          <div className="cover-large" style={isWanted ? { background: 'linear-gradient(135deg,#c5cae9,#3f51b5)' } : {}}>
            {isWanted
              ? <span style={{ fontSize: 72 }}>🔍</span>
              : listing.book.cover_url
                ? <img src={listing.book.cover_url} alt={listing.book.title} />
                : '📖'}
          </div>

          <div style={{ padding: '16px 16px 0' }}>
            {isWanted && (
              <div style={{ fontSize: 12, color: '#3f51b5', fontWeight: 600, marginBottom: 4 }}>🔍 正在求购</div>
            )}
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{listing.book.title}</div>
            <div style={{ fontSize: 14, color: '#888', marginBottom: 10 }}>
              {listing.book.author}{listing.book.publisher ? ` · ${listing.book.publisher}` : ''}
            </div>

            {/* Tags row */}
            <div className="tags" style={{ marginBottom: 10 }}>
              {isWanted ? (
                <>
                  {listing.can_gift && <span className="tag tag-wanted">求赠</span>}
                  {listing.can_swap && <span className="tag tag-wanted">求换</span>}
                  {listing.can_sell && (
                    <span className="price-tag">出价 ¥{listing.sell_price ?? '面议'}</span>
                  )}
                </>
              ) : (
                <>
                  {listing.can_gift && <span className="tag tag-gift">可赠送</span>}
                  {listing.can_swap && <span className="tag tag-swap">可换书</span>}
                  {listing.can_borrow && <span className="tag tag-borrow">可借阅</span>}
                  {listing.can_sell && (
                    <span className="price-tag">¥{listing.sell_price ?? '面议'}</span>
                  )}
                </>
              )}
            </div>

            {/* Circulation */}
            {!isWanted && listing.book.circulation_count > 0 && (
              <div style={{ fontSize: 13, color: listing.book.circulation_count >= 5 ? '#bf360c' : listing.book.circulation_count >= 2 ? '#e65100' : '#999', marginBottom: 6 }}>
                {listing.book.circulation_count >= 5 ? '🔥🔥' : listing.book.circulation_count >= 2 ? '🔥' : '📊'}{' '}
                已在小区流转 <strong>{listing.book.circulation_count}</strong> 次，深受家长喜爱
              </div>
            )}
          </div>

          <div className="section-bg" />

          {/* Condition / note */}
          <div style={{ padding: '14px 16px', background: '#fff' }}>
            <div style={{ fontSize: 13, color: '#aaa', marginBottom: 6 }}>
              {isWanted ? '补充说明' : '书况'}
            </div>
            <div style={{ fontSize: 14 }}>{listing.condition_note || '暂无说明'}</div>
          </div>

          {!isWanted && listing.can_borrow && listing.borrow_terms && (
            <>
              <div className="divider" />
              <div style={{ padding: '14px 16px', background: '#fff' }}>
                <div style={{ fontSize: 13, color: '#aaa', marginBottom: 6 }}>借阅条件</div>
                <div style={{ fontSize: 14 }}>{listing.borrow_terms}</div>
              </div>
            </>
          )}

          <div className="section-bg" />

          {/* Owner row */}
          <div style={{ padding: '14px 16px', background: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#ffb347,#ff5722)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#fff', fontWeight: 700 }}>
              {listing.owner.nickname[0]}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>
                {listing.owner.nickname}
                {isWanted && <span style={{ fontSize: 12, color: '#3f51b5', marginLeft: 6 }}>求书中</span>}
              </div>
              {listing.community && (
                <div style={{ fontSize: 12, color: '#aaa' }}>{listing.community.name}</div>
              )}
              {listing.owner.is_endorsed && <div style={{ fontSize: 11, color: '#2e7d32' }}>✅ 邻里认证</div>}
            </div>
          </div>

          {listing.owner_id !== userId && !success && (
            <div style={{ padding: 16 }}>
              <button className="btn btn-primary btn-full" onClick={() => setShowSheet(true)}>
                {ctaLabel}
              </button>
            </div>
          )}
        </>
      )}

      {showSheet && listing && (
        <div className="overlay" onClick={e => { if (e.target === e.currentTarget) setShowSheet(false) }}>
          <div className="sheet">
            <div className="sheet-title">
              {isWanted ? '告诉TA你有什么' : '选择申请方式'}
              <button className="sheet-close" onClick={() => setShowSheet(false)}>✕</button>
            </div>
            {error && <div className="error-bar">{error}</div>}
            <div className="type-options">
              {typeOptions.filter(o => listing[o.key]).map(o => (
                <button key={o.value} className={`type-option ${appType === o.value ? 'selected' : ''}`}
                  onClick={() => setAppType(o.value)}>
                  <span className="type-option-icon">{o.icon}</span>
                  <div>
                    <div>{o.label}</div>
                    <div style={{ fontSize: 12, color: '#aaa', fontWeight: 400 }}>{o.desc}</div>
                  </div>
                </button>
              ))}
            </div>
            <div className="form-group">
              <label className="form-label">留言给对方（选填）</label>
              <textarea className="form-textarea" rows={2} maxLength={200}
                placeholder={isWanted ? '说明你有这本书的书况…' : '自我介绍或说明需求…'}
                value={appMessage} onChange={e => setAppMessage(e.target.value)} />
            </div>
            <button className="btn btn-primary btn-full" onClick={handleApply} disabled={!appType || submitting}>
              {submitting ? '提交中…' : '确认'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
