import { useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import { api } from '../../api'
import './index.scss'

const STATUS_LABELS = { active: '在架', reserved: '预约中', completed: '已完成', withdrawn: '已下架' }

export default function Profile() {
  const [user, setUser] = useState(null)
  const [myListings, setMyListings] = useState([])
  const [completedCount, setCompletedCount] = useState(0)
  const nickname = Taro.getStorageSync('mfvr_nickname') || '…'

  useDidShow(async () => {
    if (!Taro.getStorageSync('mfvr_token')) {
      Taro.reLaunch({ url: '/pages/login/index' })
      return
    }
    try {
      const [u, listings, apps] = await Promise.all([api.me(), api.getMyListings(), api.getApplications()])
      setUser(u)
      setMyListings(listings)
      setCompletedCount(apps.filter(a => a.status === 'completed').length)
    } catch {}
  })

  function handleLogout() {
    Taro.showModal({
      title: '退出登录',
      content: '确定要退出吗？',
      success(res) {
        if (res.confirm) {
          ['mfvr_token', 'mfvr_user_id', 'mfvr_nickname', 'mfvr_community_id'].forEach(k =>
            Taro.removeStorageSync(k))
          Taro.reLaunch({ url: '/pages/login/index' })
        }
      },
    })
  }

  return (
    <View className="page">
      <View className="profile-header">
        <View className="avatar">
          <Text style={{ color: '#fff', fontSize: '24px', fontWeight: '700' }}>{nickname[0]}</Text>
        </View>
        <View>
          <Text className="profile-name">{user?.nickname || nickname}</Text>
          <Text className="profile-meta" style={{ display: 'block' }}>ID: {user?.id}</Text>
        </View>
      </View>
      <View className="stat-row">
        <View className="stat-item">
          <Text className="stat-num" style={{ display: 'block' }}>{myListings.length}</Text>
          <Text className="stat-label" style={{ display: 'block' }}>上架书籍</Text>
        </View>
        <View className="stat-item">
          <Text className="stat-num" style={{ display: 'block' }}>{completedCount}</Text>
          <Text className="stat-label" style={{ display: 'block' }}>完成交流</Text>
        </View>
        <View className="stat-item">
          <Text className="stat-num" style={{ display: 'block' }}>{user?.is_endorsed ? '✓' : '—'}</Text>
          <Text className="stat-label" style={{ display: 'block' }}>邻里认证</Text>
        </View>
      </View>
      <View className="section-bg" />
      <Text className="section-header">我上架的书</Text>
      {myListings.length === 0
        ? <Text style={{ padding: '20px 16px', color: '#aaa', fontSize: '14px', display: 'block' }}>还没有上架书籍</Text>
        : myListings.map(l => (
          <View key={l.id} className="menu-item"
            onClick={() => Taro.navigateTo({ url: `/pages/listing-detail/index?id=${l.id}` })}>
            <View>
              <Text style={{ fontWeight: '600', display: 'block' }}>{l.book.title}</Text>
              <Text style={{ fontSize: '12px', color: '#aaa', display: 'block', marginTop: '2px' }}>
                {[l.can_gift && '可赠', l.can_swap && '可换', l.can_borrow && '可借', l.can_sell && '出售'].filter(Boolean).join(' · ')}
              </Text>
            </View>
            <Text className={`status status-${l.status}`}>{STATUS_LABELS[l.status] || l.status}</Text>
          </View>
        ))
      }
      <View className="section-bg" />
      <View className="menu-item" onClick={handleLogout}>
        <Text style={{ color: '#e53935' }}>退出登录</Text>
      </View>
    </View>
  )
}
