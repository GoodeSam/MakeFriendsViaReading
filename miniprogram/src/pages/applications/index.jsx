import { useState, useCallback } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import { api } from '../../api'
import './index.scss'

const STATUS_LABELS = {
  pending: '待回复', accepted: '已同意', rejected: '已拒绝',
  completed: '已完成', in_progress: '进行中', canceled: '已取消', disputed: '争议中',
}
const TYPE_LABELS = { gift: '赠送', swap: '换书', borrow: '借阅', sell: '购买' }

export default function Applications() {
  const [tab, setTab] = useState('received')
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const userId = Number(Taro.getStorageSync('mfvr_user_id'))

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setApps(await api.getApplications(tab))
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [tab])

  useDidShow(() => {
    if (!Taro.getStorageSync('mfvr_token')) {
      Taro.reLaunch({ url: '/pages/login/index' })
      return
    }
    load()
  })

  async function doAction(action, id) {
    try { await action(id); load() }
    catch (e) { Taro.showToast({ title: e.message, icon: 'none' }) }
  }

  return (
    <View className="page">
      <View className="header">
        <Text className="header-title">申请</Text>
      </View>
      <View className="tabs">
        <View className={`tab ${tab === 'received' ? 'tab-active' : ''}`} onClick={() => setTab('received')}>
          <Text>收到的</Text>
        </View>
        <View className={`tab ${tab === 'sent' ? 'tab-active' : ''}`} onClick={() => setTab('sent')}>
          <Text>发出的</Text>
        </View>
      </View>
      {error ? <View className="error-bar">{error}</View> : null}
      {loading
        ? <View className="loading"><Text>加载中…</Text></View>
        : apps.length === 0
          ? <View className="empty"><Text className="empty-icon">🔔</Text><Text className="empty-text" style={{ display: 'block' }}>暂无申请</Text></View>
          : <View style={{ padding: '8px 16px 0' }}>
              {apps.map(app => {
                const isOwner = app.owner_id === userId
                const other = isOwner ? app.applicant_nickname : app.owner_nickname
                return (
                  <View key={app.id} className="card">
                    <View style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <Text style={{ fontSize: '15px', fontWeight: '600', flex: 1, marginRight: '8px' }}>{app.book_title}</Text>
                      <Text className={`status status-${app.status}`}>{STATUS_LABELS[app.status] || app.status}</Text>
                    </View>
                    <Text style={{ fontSize: '12px', color: '#aaa', display: 'block', marginBottom: '10px' }}>
                      {TYPE_LABELS[app.type] || app.type} · {isOwner ? '申请人：' : '书主：'}{other}
                      {app.message ? ` · "${app.message}"` : ''}
                    </Text>
                    <View style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {isOwner && app.status === 'pending' && (
                        <View>
                          <View className="btn btn-success-ghost btn-sm" style={{ display: 'inline-flex', marginRight: '8px' }}
                            onClick={() => doAction(api.acceptApplication, app.id)}>
                            <Text>同意</Text>
                          </View>
                          <View className="btn btn-danger-ghost btn-sm" style={{ display: 'inline-flex' }}
                            onClick={() => doAction(api.rejectApplication, app.id)}>
                            <Text>拒绝</Text>
                          </View>
                        </View>
                      )}
                      {app.status === 'accepted' && app.conversation_id && (
                        <View className="btn btn-ghost btn-sm" style={{ display: 'inline-flex', marginRight: '8px' }}
                          onClick={() => Taro.navigateTo({ url: `/pages/conversation/index?id=${app.conversation_id}` })}>
                          <Text>💬 聊天</Text>
                        </View>
                      )}
                      {app.status === 'accepted' && (
                        <View className="btn btn-secondary btn-sm" style={{ display: 'inline-flex' }}
                          onClick={() => doAction(api.completeApplication, app.id)}>
                          <Text>确认完成</Text>
                        </View>
                      )}
                      {app.status === 'completed' && app.conversation_id && (
                        <View className="btn btn-secondary btn-sm" style={{ display: 'inline-flex' }}
                          onClick={() => Taro.navigateTo({ url: `/pages/conversation/index?id=${app.conversation_id}` })}>
                          <Text>查看记录</Text>
                        </View>
                      )}
                    </View>
                  </View>
                )
              })}
            </View>
      }
    </View>
  )
}
