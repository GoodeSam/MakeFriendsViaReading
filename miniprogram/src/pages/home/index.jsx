import { useState, useEffect } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import { api } from '../../api'
import './index.scss'

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

function BookCard({ listing }) {
  const badge = hotBadge(listing.book.circulation_count)
  const isWanted = listing.listing_type === 'wanted'
  return (
    <View className="book-card" onClick={() =>
      Taro.navigateTo({ url: `/pages/listing-detail/index?id=${listing.id}` })}>
      <View className={`book-cover ${isWanted ? 'book-cover-wanted' : ''}`}>
        {listing.book.cover_url
          ? <Image src={listing.book.cover_url} style={{ width: '56px', height: '72px', borderRadius: '6px' }} />
          : <Text>{isWanted ? '🔍' : '📖'}</Text>}
      </View>
      <View className="book-info">
        <Text className="book-title">{listing.book.title}</Text>
        <Text className="book-author">{listing.book.author || '—'}</Text>
        <View className="tags">
          {!isWanted && listing.can_gift && <Text className="tag tag-gift">可赠</Text>}
          {!isWanted && listing.can_swap && <Text className="tag tag-swap">可换</Text>}
          {!isWanted && listing.can_borrow && <Text className="tag tag-borrow">可借</Text>}
          {!isWanted && listing.can_sell && <Text className="tag tag-sell">¥{listing.sell_price ?? '面议'}</Text>}
          {isWanted && listing.can_gift && <Text className="tag tag-wanted">求赠</Text>}
          {isWanted && listing.can_swap && <Text className="tag tag-wanted">求换</Text>}
          {isWanted && listing.can_sell && <Text className="price-tag">出价¥{listing.sell_price ?? '面议'}</Text>}
          {!isWanted && badge && <Text className={`tag ${badge.cls}`}>{badge.label}</Text>}
        </View>
        <Text className="book-owner">
          {isWanted ? '🔍' : '👤'} {listing.owner.nickname}
          {listing.community ? ` · ${listing.community.name}` : ''}
          {listing.condition_note ? ` · ${listing.condition_note}` : ''}
        </Text>
      </View>
    </View>
  )
}

export default function Home() {
  const nickname = Taro.getStorageSync('mfvr_nickname') || '…'
  const [mode, setMode] = useState('offer')
  const [filter, setFilter] = useState('')
  const [sort, setSort] = useState('')
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useDidShow(() => {
    if (!Taro.getStorageSync('mfvr_token')) {
      Taro.reLaunch({ url: '/pages/login/index' })
    }
  })

  useEffect(() => {
    load()
  }, [mode, filter, sort])

  async function load() {
    setLoading(true)
    setError('')
    const isHot = mode === 'offer' && filter === 'hot'
    try {
      let data = await api.getListings({
        type: isHot ? '' : filter,
        listingType: mode,
        sort: sort === 'community' ? 'community' : sort === 'title' ? 'title' : undefined,
        allCommunities: sort === 'community',
      })
      if (isHot) {
        data = [...data].sort((a, b) => b.book.circulation_count - a.book.circulation_count)
      }
      setListings(data)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  function switchMode(m) { setMode(m); setFilter('') }
  const filters = mode === 'offer' ? OFFER_FILTERS : WANTED_FILTERS

  return (
    <View className="page">
      <View className="header">
        <Text className="header-title">以书会友</Text>
        <Text style={{ fontSize: '13px', color: '#aaa' }}>👋 {nickname}</Text>
      </View>

      <View className="mode-tabs">
        <View className={`mode-tab ${mode === 'offer' ? 'mode-tab-active' : ''}`} onClick={() => switchMode('offer')}>
          <Text>📚 书源</Text>
        </View>
        <View className={`mode-tab ${mode === 'wanted' ? 'mode-tab-active' : ''}`} onClick={() => switchMode('wanted')}>
          <Text>🔍 求购</Text>
        </View>
      </View>

      <View className="tabs">
        {filters.map(f => (
          <View key={f.value} className={`tab ${filter === f.value ? 'tab-active' : ''}`}
            onClick={() => setFilter(f.value)}>
            <Text>{f.label}</Text>
          </View>
        ))}
      </View>

      <View className="sort-row">
        {SORTS.map(s => (
          <View key={s.value} className={`sort-chip ${sort === s.value ? 'sort-chip-active' : ''}`}
            onClick={() => setSort(s.value)}>
            <Text>{s.label}</Text>
          </View>
        ))}
      </View>

      {error ? <View className="error-bar">{error}</View> : null}

      {loading
        ? <View className="loading"><Text>加载中…</Text></View>
        : listings.length === 0
          ? <View className="empty">
              <Text className="empty-icon">{mode === 'wanted' ? '🔍' : '📭'}</Text>
              <Text className="empty-text">{mode === 'wanted' ? '暂无求购信息' : '暂无书籍'}</Text>
            </View>
          : <View className="book-list">
              {listings.map(l => <BookCard key={l.id} listing={l} />)}
            </View>
      }
    </View>
  )
}
