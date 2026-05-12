import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api.js'
import { useAuth } from '../App.jsx'

const TYPE_OPTIONS = [
  { value: 'gift', label: '申请赠送', icon: '🎁', desc: '对方将这本书赠送给你', key: 'can_gift' },
  { value: 'swap', label: '申请换书', icon: '🔄', desc: '你提供一本书来换', key: 'can_swap' },
  { value: 'borrow', label: '申请借阅', icon: '📖', desc: '借来阅读，到期归还', key: 'can_borrow' },
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
      .then(data => { setListing(data); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  async function handleApply() {
    if (!appType) { return }
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

  return (
    <div className="page">
      <div className="header">
        <button className="header-back" onClick={() => navigate(-1)}>←</button>
        <h1>书籍详情</h1>
        <span />
      </div>
      {error && <div className="error-bar">{error}</div>}
      {success && <div style={{ background: '#e8f5e9', color: '#1b5e20', padding: '10px 16px', fontSize: 13, borderRadius: 8, margin: '12px 16px' }}>✅ 申请已发送，等待对方同意</div>}
      {listing && (
        <>
          <div className="cover-large">
            {listing.book.cover_url ? <img src={listing.book.cover_url} alt={listing.book.title} /> : '📖'}
          </div>
          <div style={{ padding: '16px 16px 0' }}>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{listing.book.title}</div>
            <div style={{ fontSize: 14, color: '#888', marginBottom: 10 }}>
              {listing.book.author}{listing.book.publisher ? ` · ${listing.book.publisher}` : ''}
            </div>
            <div className="tags" style={{ marginBottom: 12 }}>
              {listing.can_gift && <span className="tag tag-gift">可赠送</span>}
              {listing.can_swap && <span className="tag tag-swap">可换书</span>}
              {listing.can_borrow && <span className="tag tag-borrow">可借阅</span>}
            </div>
          </div>
          <div className="section-bg" />
          <div style={{ padding: '14px 16px', background: '#fff' }}>
            <div style={{ fontSize: 13, color: '#aaa', marginBottom: 6 }}>书况</div>
            <div style={{ fontSize: 14 }}>{listing.condition_note || '暂无说明'}</div>
          </div>
          {listing.can_borrow && listing.borrow_terms && (
            <>
              <div className="divider" />
              <div style={{ padding: '14px 16px', background: '#fff' }}>
                <div style={{ fontSize: 13, color: '#aaa', marginBottom: 6 }}>借阅条件</div>
                <div style={{ fontSize: 14 }}>{listing.borrow_terms}</div>
              </div>
            </>
          )}
          <div className="section-bg" />
          <div style={{ padding: '14px 16px', background: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#ffb347,#ff5722)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#fff', fontWeight: 700 }}>
              {listing.owner.nickname[0]}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{listing.owner.nickname}</div>
              {listing.owner.is_endorsed && <div style={{ fontSize: 11, color: '#2e7d32' }}>✅ 邻里认证</div>}
            </div>
          </div>
          {listing.owner_id !== userId && !success && (
            <div style={{ padding: 16 }}>
              <button className="btn btn-primary btn-full" onClick={() => setShowSheet(true)}>申请这本书</button>
            </div>
          )}
        </>
      )}
      {showSheet && listing && (
        <div className="overlay" onClick={e => { if (e.target === e.currentTarget) setShowSheet(false) }}>
          <div className="sheet">
            <div className="sheet-title">申请方式 <button className="sheet-close" onClick={() => setShowSheet(false)}>✕</button></div>
            {error && <div className="error-bar">{error}</div>}
            <div className="type-options">
              {TYPE_OPTIONS.filter(o => listing[o.key]).map(o => (
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
              <textarea className="form-textarea" rows={2} maxLength={200} placeholder="自我介绍或说明需求…"
                value={appMessage} onChange={e => setAppMessage(e.target.value)} />
            </div>
            <button className="btn btn-primary btn-full" onClick={handleApply} disabled={!appType || submitting}>
              {submitting ? '提交中…' : '确认申请'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
