import { useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { View, Text, Input } from '@tarojs/components'
import { api } from '../../api'
import './index.scss'

export default function NewListing() {
  useDidShow(() => {
    if (!Taro.getStorageSync('mfvr_token')) Taro.reLaunch({ url: '/pages/login/index' })
  })

  const [listingType, setListingType] = useState('offer')
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
    setListingType(t); setBook(null); setIsbn(''); setError('')
    setCanGift(false); setCanSwap(false); setCanBorrow(false); setCanSell(false)
    setCondition(''); setSellPrice(''); setBorrowTerms('')
  }

  async function handleLookup() {
    if (!isbn.trim()) return
    setLooking(true); setError(''); setBook(null)
    try { setBook(await api.lookupBook(isbn.trim())) }
    catch { setError('未找到该 ISBN，请检查号码') }
    finally { setLooking(false) }
  }

  async function handleSubmit() {
    if (!book) { setError('请先查询书籍'); return }
    if (!canGift && !canSwap && !canBorrow && !canSell) {
      setError(listingType === 'wanted' ? '请选择求书方式' : '请选择共享方式'); return
    }
    if (canSell && (!sellPrice || Number(sellPrice) <= 0)) { setError('请填写价格'); return }
    setSubmitting(true); setError('')
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
      Taro.showToast({ title: listingType === 'wanted' ? '求购已发布' : '上架成功', icon: 'success' })
      setTimeout(() => Taro.switchTab({ url: '/pages/home/index' }), 1500)
    } catch (e) { setError(e.message) }
    finally { setSubmitting(false) }
  }

  const isWanted = listingType === 'wanted'

  return (
    <View className="page">
      <View style={{ display: 'flex', gap: '10px', padding: '12px 16px 0' }}>
        <View className={`toggle-chip ${!isWanted ? 'toggle-chip-on' : ''}`}
          style={{ flex: 1, textAlign: 'center' }} onClick={() => switchType('offer')}>
          <Text>📚 上架书籍</Text>
        </View>
        <View className={`toggle-chip ${isWanted ? 'toggle-chip-on' : ''}`}
          style={{ flex: 1, textAlign: 'center' }} onClick={() => switchType('wanted')}>
          <Text>🔍 发布求购</Text>
        </View>
      </View>

      <View className="form-section">
        {error ? <View className="error-bar">{error}</View> : null}

        <View className="form-group">
          <Text className="form-label">书籍 ISBN</Text>
          <View className="input-row">
            <Input className="form-input" type="number" placeholder="扫描或输入 ISBN"
              value={isbn} onInput={e => setIsbn(e.detail.value)} />
            <View className={`btn btn-secondary ${looking || !isbn.trim() ? 'btn-disabled' : ''}`}
              onClick={!looking && isbn.trim() ? handleLookup : undefined}>
              <Text>{looking ? '…' : '查询'}</Text>
            </View>
          </View>
          <Text className="form-hint">示例：9787544291293（猜猜我有多爱你）</Text>
        </View>

        {book && (
          <View className="card" style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <View className={`book-cover ${isWanted ? 'book-cover-wanted' : ''}`}>
              <Text>{isWanted ? '🔍' : '📖'}</Text>
            </View>
            <View>
              <Text style={{ fontWeight: '700', fontSize: '15px', display: 'block' }}>{book.title}</Text>
              <Text style={{ fontSize: '12px', color: '#999', display: 'block' }}>{book.author}</Text>
              <Text style={{ fontSize: '12px', color: '#999', display: 'block' }}>{book.publisher}</Text>
              {book.is_high_value && <Text className="tag tag-sell" style={{ marginTop: '6px', display: 'inline-block' }}>⚠️ 高价值套书</Text>}
            </View>
          </View>
        )}

        {book && (
          <View>
            {!isWanted && (
              <View className="form-group">
                <Text className="form-label">书况说明</Text>
                <Input className="form-input" placeholder="如：九成新，无划损"
                  value={condition} onInput={e => setCondition(e.detail.value)} />
              </View>
            )}

            <View className="form-group">
              <Text className="form-label">{isWanted ? '我可以接受的方式' : '共享方式'}</Text>
              <View className="toggle-row">
                <View className={`toggle-chip ${canGift ? 'toggle-chip-on' : ''}`} onClick={() => setCanGift(!canGift)}>
                  <Text>{isWanted ? '🎁 接受赠送' : '🎁 可赠送'}</Text>
                </View>
                <View className={`toggle-chip ${canSwap ? 'toggle-chip-on' : ''}`} onClick={() => setCanSwap(!canSwap)}>
                  <Text>{isWanted ? '🔄 接受换书' : '🔄 可换书'}</Text>
                </View>
                {!isWanted && !book.is_high_value && (
                  <View className={`toggle-chip ${canBorrow ? 'toggle-chip-on' : ''}`} onClick={() => setCanBorrow(!canBorrow)}>
                    <Text>📖 可借阅</Text>
                  </View>
                )}
                <View className={`toggle-chip ${canSell ? 'toggle-chip-on' : ''}`} onClick={() => setCanSell(!canSell)}>
                  <Text>{isWanted ? '💰 愿意购买' : '💰 出售'}</Text>
                </View>
              </View>
            </View>

            {canSell && (
              <View className="form-group">
                <Text className="form-label">{isWanted ? '最高出价（元）' : '售价（元）'}</Text>
                <Input className="form-input" type="number" placeholder="如：15"
                  value={sellPrice} onInput={e => setSellPrice(e.detail.value)} />
              </View>
            )}

            {canBorrow && !isWanted && (
              <View className="form-group">
                <Text className="form-label">借阅条件（选填）</Text>
                <Input className="form-input" placeholder="如：借期2周，请保持书况"
                  value={borrowTerms} onInput={e => setBorrowTerms(e.detail.value)} />
              </View>
            )}

            {isWanted && (
              <View className="form-group">
                <Text className="form-label">补充说明（选填）</Text>
                <Input className="form-input" placeholder="如：需要1-3岁版本"
                  value={condition} onInput={e => setCondition(e.detail.value)} />
              </View>
            )}

            <View className={`btn btn-primary btn-full ${submitting ? 'btn-disabled' : ''}`}
              onClick={!submitting ? handleSubmit : undefined}>
              <Text>{submitting ? '提交中…' : isWanted ? '发布求购' : '确认上架'}</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  )
}
