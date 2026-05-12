import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api.js'
import { useAuth } from '../App.jsx'

const STATUS_LABELS = {
  pending: '待回复',
  accepted: '已同意',
  rejected: '已拒绝',
  completed: '已完成',
  in_progress: '进行中',
  canceled: '已取消',
  disputed: '争议中',
}
const TYPE_LABELS = { gift: '赠送', swap: '换书', borrow: '借阅' }

export default function Applications() {
  const { userId } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('received')
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    api.getApplications(tab)
      .then(setApps)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [tab])

  useEffect(() => { load() }, [load])

  async function doAction(action, id) {
    try {
      await action(id)
      load()
    } catch (e) { setError(e.message) }
  }

  return (
    <div className="page">
      <div className="header"><h1>申请</h1></div>
      <div className="tabs">
        <button className={`tab ${tab === 'received' ? 'active' : ''}`} onClick={() => setTab('received')}>收到的</button>
        <button className={`tab ${tab === 'sent' ? 'active' : ''}`} onClick={() => setTab('sent')}>发出的</button>
      </div>
      {error && <div className="error-bar">{error}</div>}
      {loading
        ? <div className="loading"><div className="spinner" /></div>
        : apps.length === 0
          ? <div className="empty"><div className="empty-icon">🔔</div><div className="empty-text">暂无申请</div></div>
          : <div className="app-list">
              {apps.map(app => {
                const isOwner = app.owner_id === userId
                const otherName = isOwner ? app.applicant_nickname : app.owner_nickname
                return (
                  <div key={app.id} className="app-card">
                    <div className="app-card-top">
                      <div className="app-book-title">{app.book_title}</div>
                      <span className={`status status-${app.status}`}>{STATUS_LABELS[app.status] || app.status}</span>
                    </div>
                    <div className="app-card-meta">
                      {TYPE_LABELS[app.type]} · {isOwner ? '👤 申请人：' : '🏠 书主：'}{otherName}
                      {app.message && <span> · "{app.message}"</span>}
                    </div>
                    <div className="app-card-actions">
                      {isOwner && app.status === 'pending' && (
                        <>
                          <button className="btn btn-success-ghost btn-sm" onClick={() => doAction(api.acceptApplication, app.id)}>同意</button>
                          <button className="btn btn-danger-ghost btn-sm" onClick={() => doAction(api.rejectApplication, app.id)}>拒绝</button>
                        </>
                      )}
                      {app.status === 'accepted' && (
                        <>
                          {app.conversation_id && (
                            <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/conversation/${app.conversation_id}`)}>💬 聊天</button>
                          )}
                          <button className="btn btn-secondary btn-sm" onClick={() => doAction(api.completeApplication, app.id)}>确认完成</button>
                        </>
                      )}
                      {app.conversation_id && app.status === 'completed' && (
                        <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/conversation/${app.conversation_id}`)}>查看记录</button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
      }
    </div>
  )
}
