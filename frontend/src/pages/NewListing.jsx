import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api.js'

export default function NewListing() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initType = searchParams.get('type') === 'wanted' ? 'wanted' : 'offer'

  const [listingType, setListingType] = useState(initType)
  const [isbn, setIsbn] = useState('')
  const [book, setBook] = useState(null)
  const [looking, setLooking] = useState(false)
  const [condition, setCondition] = useState('')
  const [canGift, setCanGift] = useState(false)
  const [canSwap, setCanSwap] = useState(false)
  const [canBorrow, setCanBorrow] = useState(false)
  const [canSell, setCanSell] = useState(false)
  const [sellPrice, setSellPrice] = useState('')
  const [borrowTerms, setBorrowTerms] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function switchType(t) {
    setListingType(t)
    setBook(null)
    setIsbn('')
    setCanGift(false); setCanSwap(false); setCanBorrow(false); setCanSell(false)
    setCondition(''); setSellPrice(''); setBorrowTerms('')
    setError('')
  }

  async function handleLookup() {
    if (!isbn.trim()) return
    setLooking(true)
    setError('')
    setBook(null)
    try {
      setBook(await api.lookupBook(isbn.trim()))
    } catch {
      setError('未找到该 ISBN，请检查号码')
    } finally {
      setLooking(false)
    }
  }

  async function handleSubmit() {
    if (!book) { setError('请先查询书籍'); return }
    const anyType = canGift || canSwap || canBorrow || canSell
    if (!anyType) {
      setError(listingType === 'wanted' ? '请至少选择一种求书方式' : '请至少选择一种共享方式')
      return
    }
    if (canSell && (!sellPrice || Number(sellPrice) <= 0)) {
      setError('请填写价格')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await api.createListing({
        isbn: book.isbn,
        listing_type: listingType,
        condition_note: condition || null,
        can_gift: canGift,
        can_swap: canSwap,
        can_borrow: canBorrow,
        can_sell: canSell,
        sell_price: canSell ? Number(sellPrice) : null,
        borrow_terms: canBorrow ? (borrowTerms || null) : null,
      })
      navigate('/', { replace: true })
    } catch (e) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const isWanted = listingType === 'wanted'

  return (
    <div className="page">
      <div className="header">
        <h1>{isWanted ? '发布求购' : '上架书籍'}</h1>
      </div>

      {/* Type toggle */}
      <div style={{ display: 'flex', gap: 10, padding: '12px 16px 0' }}>
        <button
          className={`toggle-chip ${!isWanted ? 'on' : ''}`}
          style={{ flex: 1, textAlign: 'center' }}
          onClick={() => switchType('offer')}>📚 我有这本书（上架）</button>
        <button
          className={`toggle-chip ${isWanted ? 'on' : ''}`}
          style={{ flex: 1, textAlign: 'center' }}
          onClick={() => switchType('wanted')}>🔍 我在找这本书（求购）</button>
      </div>

      <div className="form-section" style={{ paddingTop: 16 }}>
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
          <div className="form-hint">示例：9787544291293（猜猜我有多爱你）</div>
        </div>

        {book && (
          <div className="card" style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div className="book-cover"
              style={isWanted ? { background: 'linear-gradient(135deg,#c5cae9,#3f51b5)' } : {}}>
              {isWanted ? '🔍' : '📖'}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{book.title}</div>
              <div style={{ fontSize: 12, color: '#999', marginTop: 3 }}>{book.author}</div>
              <div style={{ fontSize: 12, color: '#999' }}>{book.publisher}</div>
              {book.is_high_value && (
                <div className="tag tag-sell" style={{ display: 'inline-block', marginTop: 6 }}>
                  ⚠️ 高价值套书
                </div>
              )}
            </div>
          </div>
        )}

        {book && (
          <>
            {!isWanted && (
              <div className="form-group">
                <label className="form-label">书况说明</label>
                <input className="form-input" placeholder="如：九成新，无划损" value={condition}
                  onChange={e => setCondition(e.target.value)} />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">
                {isWanted ? '我可以接受的方式' : '共享方式'}
              </label>
              <div className="toggle-row">
                <button className={`toggle-chip ${canGift ? 'on' : ''}`}
                  onClick={() => setCanGift(!canGift)}>
                  {isWanted ? '🎁 接受赠送' : '🎁 可赠送'}
                </button>
                <button className={`toggle-chip ${canSwap ? 'on' : ''}`}
                  onClick={() => setCanSwap(!canSwap)}>
                  {isWanted ? '🔄 接受换书' : '🔄 可换书'}
                </button>
                {!isWanted && !book.is_high_value && (
                  <button className={`toggle-chip ${canBorrow ? 'on' : ''}`}
                    onClick={() => setCanBorrow(!canBorrow)}>📖 可借阅</button>
                )}
                <button className={`toggle-chip ${canSell ? 'on' : ''}`}
                  onClick={() => setCanSell(!canSell)}>
                  {isWanted ? '💰 愿意购买' : '💰 出售'}
                </button>
              </div>
            </div>

            {canSell && (
              <div className="form-group">
                <label className="form-label">
                  {isWanted ? '最高出价（元）' : '售价（元）'}
                </label>
                <input className="form-input" type="number" min={1} placeholder="如：15"
                  value={sellPrice} onChange={e => setSellPrice(e.target.value)} />
              </div>
            )}

            {canBorrow && !isWanted && (
              <div className="form-group">
                <label className="form-label">借阅条件（选填）</label>
                <textarea className="form-textarea" rows={2}
                  placeholder="如：借期2周，请保持书况"
                  value={borrowTerms} onChange={e => setBorrowTerms(e.target.value)} />
              </div>
            )}

            {isWanted && (
              <div className="form-group">
                <label className="form-label">补充说明（选填）</label>
                <input className="form-input"
                  placeholder="如：需要1-3岁版本，急找"
                  value={condition} onChange={e => setCondition(e.target.value)} />
              </div>
            )}

            <button className="btn btn-primary btn-full" onClick={handleSubmit} disabled={submitting}>
              {submitting ? '提交中…' : isWanted ? '发布求购' : '确认上架'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
