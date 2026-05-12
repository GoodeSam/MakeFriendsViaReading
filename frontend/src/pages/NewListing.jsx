import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api.js'

export default function NewListing() {
  const navigate = useNavigate()
  const [isbn, setIsbn] = useState('')
  const [book, setBook] = useState(null)
  const [looking, setLooking] = useState(false)
  const [condition, setCondition] = useState('')
  const [canGift, setCanGift] = useState(false)
  const [canSwap, setCanSwap] = useState(false)
  const [canBorrow, setCanBorrow] = useState(false)
  const [borrowTerms, setBorrowTerms] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleLookup() {
    if (!isbn.trim()) return
    setLooking(true)
    setError('')
    setBook(null)
    try {
      const b = await api.lookupBook(isbn.trim())
      setBook(b)
    } catch (e) {
      setError('未找到该 ISBN，请检查号码或手动输入')
    } finally {
      setLooking(false)
    }
  }

  async function handleSubmit() {
    if (!book) { setError('请先查询 ISBN'); return }
    if (!canGift && !canSwap && !canBorrow) { setError('至少选择一种共享方式'); return }
    setSubmitting(true)
    setError('')
    try {
      await api.createListing({
        isbn: book.isbn,
        condition_note: condition || null,
        can_gift: canGift,
        can_swap: canSwap,
        can_borrow: canBorrow,
        borrow_terms: canBorrow ? (borrowTerms || null) : null,
      })
      navigate('/', { replace: true })
    } catch (e) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page">
      <div className="header">
        <h1>上架书籍</h1>
      </div>
      <div className="form-section">
        {error && <div className="error-bar">{error}</div>}
        <div className="form-group">
          <label className="form-label">书籍 ISBN</label>
          <div className="input-row">
            <input className="form-input" placeholder="扫描或输入 ISBN" value={isbn}
              onChange={e => setIsbn(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLookup()} />
            <button className="btn btn-secondary" onClick={handleLookup} disabled={looking || !isbn.trim()}>
              {looking ? '…' : '查询'}
            </button>
          </div>
          <div className="form-hint">试试：9787544291293（猜猜我有多爱你）</div>
        </div>
        {book && (
          <div className="card" style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div className="book-cover">📖</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{book.title}</div>
              <div style={{ fontSize: 12, color: '#999', marginTop: 3 }}>{book.author}</div>
              <div style={{ fontSize: 12, color: '#999' }}>{book.publisher}</div>
              {book.is_high_value && <div className="tag" style={{ background: '#fff3e0', color: '#e65100', display: 'inline-block', marginTop: 6 }}>⚠️ 高价值套书（仅可赠/换）</div>}
            </div>
          </div>
        )}
        {book && (
          <>
            <div className="form-group">
              <label className="form-label">书况说明</label>
              <input className="form-input" placeholder="如：九成新，无划损" value={condition}
                onChange={e => setCondition(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">共享方式</label>
              <div className="toggle-row">
                <button className={`toggle-chip ${canGift ? 'on' : ''}`} onClick={() => setCanGift(!canGift)}>🎁 可赠送</button>
                <button className={`toggle-chip ${canSwap ? 'on' : ''}`} onClick={() => setCanSwap(!canSwap)}>🔄 可换书</button>
                {!book.is_high_value && (
                  <button className={`toggle-chip ${canBorrow ? 'on' : ''}`} onClick={() => setCanBorrow(!canBorrow)}>📖 可借阅</button>
                )}
              </div>
            </div>
            {canBorrow && (
              <div className="form-group">
                <label className="form-label">借阅条件（选填）</label>
                <textarea className="form-textarea" rows={2} placeholder="如：借期2周，请保持书况"
                  value={borrowTerms} onChange={e => setBorrowTerms(e.target.value)} />
              </div>
            )}
            <button className="btn btn-primary btn-full" onClick={handleSubmit} disabled={submitting}>
              {submitting ? '上架中…' : '确认上架'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
