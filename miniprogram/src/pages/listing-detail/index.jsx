import { useState, useEffect } from 'react'
import Taro, { useLoad } from '@tarojs/taro'
import { View, Text, Image } from '@tarojs/components'
import { api } from '../../api'
import './index.scss'

const OFFER_TYPES = [
  { value: 'gift', label: '申请赠送', icon: '🎁', desc: '对方将此书赠送给你', key: 'can_gift' },
  { value: 'swap', label: '申请换书', icon: '🔄', desc: '你提供一本书来换', key: 'can_swap' },
  { value: 'borrow', label: '申请借阅', icon: '📖', desc: '借来阅读，到期归还', key: 'can_borrow' },
  { value: 'sell', label: '购买', icon: '💰', desc: '按标价购买', key: 'can_sell' },
]
const WANTED_TYPES = [
  { value: 'gift', label: '我愿意赠送', icon: '🎁', desc: '免费送给对方', key: 'can_gift' },
  { value: 'swap', label: '我愿意换书', icon: '🔄', desc: '换一本书给对方', key: 'can_swap' },
  { value: 'sell', label: '我愿意出售', icon: '💰', desc: '按对方出价出售', key: 'can_sell' },
]

export default function ListingDetail() {
  const [id, setId] = useState(null)
  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showSheet, setShowSheet] = useState(false)
  const [appType, setAppType] = useState('')
  const [appMessage, setAppMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  useLoad(params => { setId(params.id) })

  useEffect(() => {
    if (!id) return
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
    } catch (e) { setError(e.message) }
    finally { setSubmitting(false) }
  }

  const userId = Number(Taro.getStorageSync('mfvr_user_id'))
  const isWanted = listing?.listing_type === 'wanted'
  const typeOptions = isWanted ? WANTED_TYPES : OFFER_TYPES

  if (loading) return <View className="loading"><Text>加载中…</Text></View>

  return (
    <View className="page">
      {error ? <View className="error-bar">{error}</View> : null}
      {success ? <View className="success-bar">{isWanted ? '✅ 已告知对方，等待TA回复' : '✅ 申请已发送，等待对方同意'}</View> : null}
      {listing && (
        <View>
          <View className={`cover-large ${isWanted ? 'cover-large-wanted' : ''}`}>
            {isWanted
              ? <Text style={{ fontSize: '72px' }}>🔍</Text>
              : listing.book.cover_url
                ? <Image src={listing.book.cover_url} style={{ width: '100%', height: '180px' }} />
                : <Text style={{ fontSize: '72px' }}>📖</Text>}
          </View>
          <View style={{ padding: '16px 16px 0' }}>
            {isWanted ? <Text style={{ fontSize: '12px', color: '#3f51b5', fontWeight: '600', display: 'block', marginBottom: '4px' }}>🔍 正在求购</Text> : null}
            <Text style={{ fontSize: '20px', fontWeight: '700', display: 'block', marginBottom: '4px' }}>{listing.book.title}</Text>
            <Text style={{ fontSize: '14px', color: '#888', display: 'block', marginBottom: '10px' }}>
              {listing.book.author}{listing.book.publisher ? ` · ${listing.book.publisher}` : ''}
            </Text>
            <View className="tags" style={{ marginBottom: '10px' }}>
              {isWanted ? (
                <View className="tags">
                  {listing.can_gift && <Text className="tag tag-wanted">求赠</Text>}
                  {listing.can_swap && <Text className="tag tag-wanted">求换</Text>}
                  {listing.can_sell && <Text className="price-tag">出价 ¥{listing.sell_price ?? '面议'}</Text>}
                </View>
              ) : (
                <View className="tags">
                  {listing.can_gift && <Text className="tag tag-gift">可赠送</Text>}
                  {listing.can_swap && <Text className="tag tag-swap">可换书</Text>}
                  {listing.can_borrow && <Text className="tag tag-borrow">可借阅</Text>}
                  {listing.can_sell && <Text className="price-tag">¥{listing.sell_price ?? '面议'}</Text>}
                </View>
              )}
            </View>
            {!isWanted && listing.book.circulation_count > 0 && (
              <Text style={{ fontSize: '13px', color: listing.book.circulation_count >= 5 ? '#bf360c' : listing.book.circulation_count >= 2 ? '#e65100' : '#999', display: 'block', marginBottom: '6px' }}>
                {listing.book.circulation_count >= 5 ? '🔥🔥' : listing.book.circulation_count >= 2 ? '🔥' : '📊'} 已在小区流转 {listing.book.circulation_count} 次
              </Text>
            )}
          </View>
          <View className="section-bg" />
          <View className="info-row">
            <Text className="info-label">{isWanted ? '补充说明' : '书况'}</Text>
            <Text className="info-value">{listing.condition_note || '暂无说明'}</Text>
          </View>
          {!isWanted && listing.can_borrow && listing.borrow_terms && (
            <View>
              <View className="divider" />
              <View className="info-row">
                <Text className="info-label">借阅条件</Text>
                <Text className="info-value">{listing.borrow_terms}</Text>
              </View>
            </View>
          )}
          <View className="section-bg" />
          <View style={{ padding: '14px 16px', background: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <View className="avatar" style={{ width: '36px', height: '36px', fontSize: '16px' }}>
              <Text style={{ color: '#fff' }}>{listing.owner.nickname[0]}</Text>
            </View>
            <View>
              <Text style={{ fontSize: '14px', fontWeight: '600', display: 'block' }}>
                {listing.owner.nickname}{isWanted ? ' · 求书中' : ''}
              </Text>
              {listing.community && <Text style={{ fontSize: '12px', color: '#aaa', display: 'block' }}>{listing.community.name}</Text>}
            </View>
          </View>
          {listing.owner_id !== userId && !success && (
            <View style={{ padding: '16px' }}>
              <View className="btn btn-primary btn-full" onClick={() => setShowSheet(true)}>
                <Text>{isWanted ? '我有这本书' : '申请这本书'}</Text>
              </View>
            </View>
          )}
        </View>
      )}

      {showSheet && listing && (
        <View className="overlay" onClick={e => { if (e.target === e.currentTarget) setShowSheet(false) }}>
          <View className="sheet">
            <View className="sheet-title">
              <Text>{isWanted ? '告诉TA你有什么' : '选择申请方式'}</Text>
              <Text className="sheet-close" onClick={() => setShowSheet(false)}>✕</Text>
            </View>
            {error ? <View className="error-bar">{error}</View> : null}
            <View className="type-options">
              {typeOptions.filter(o => listing[o.key]).map(o => (
                <View key={o.value} className={`type-option ${appType === o.value ? 'type-option-active' : ''}`}
                  onClick={() => setAppType(o.value)}>
                  <Text className="type-option-icon">{o.icon}</Text>
                  <View>
                    <Text style={{ display: 'block' }}>{o.label}</Text>
                    <Text className="type-option-desc">{o.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
            <View className="form-group">
              <Text className="form-label">留言（选填）</Text>
              <View style={{ border: '1.5px solid #e8e8e8', borderRadius: '8px', padding: '11px 14px' }}>
                <Text
                  style={{ fontSize: '15px', color: appMessage ? '#222' : '#aaa' }}
                  onClick={() => {
                    Taro.showModal({
                      title: '留言给对方',
                      editable: true,
                      placeholderText: isWanted ? '说明你有这本书的书况…' : '自我介绍或说明需求…',
                      content: appMessage,
                      success(res) { if (res.confirm) setAppMessage(res.content || '') },
                    })
                  }}>
                  {appMessage || (isWanted ? '说明你有这本书的书况…' : '自我介绍或说明需求…')}
                </Text>
              </View>
            </View>
            <View className={`btn btn-primary btn-full ${!appType || submitting ? 'btn-disabled' : ''}`}
              onClick={appType && !submitting ? handleApply : undefined}>
              <Text>{submitting ? '提交中…' : '确认'}</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
