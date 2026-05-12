import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api.js'
import { useAuth } from '../App.jsx'

const STATUS_LABELS = { active: '在架', reserved: '预约中', completed: '已完成', withdrawn: '已下架' }

export default function Profile() {
  const { nickname, logout } = useAuth()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [myListings, setMyListings] = useState([])
  const [allApps, setAllApps] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.me(), api.getMyListings(), api.getApplications()])
      .then(([u, listings, apps]) => { setUser(u); setMyListings(listings); setAllApps(apps) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const completedCount = allApps.filter(a => a.status === 'completed').length

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  if (loading) return <div className="loading"><div className="spinner" /></div>

  return (
    <div className="page">
      <div className="profile-header">
        <div className="avatar">{(nickname || '?')[0]}</div>
        <div>
          <div className="profile-name">{user?.nickname || nickname}</div>
          <div className="profile-meta">ID: {user?.id}</div>
        </div>
      </div>
      <div className="stat-row">
        <div className="stat-item">
          <div className="stat-num">{myListings.length}</div>
          <div className="stat-label">上架书籍</div>
        </div>
        <div className="stat-item">
          <div className="stat-num">{completedCount}</div>
          <div className="stat-label">完成交流</div>
        </div>
        <div className="stat-item">
          <div className="stat-num">{user?.is_endorsed ? '✓' : '—'}</div>
          <div className="stat-label">邻里认证</div>
        </div>
      </div>
      <div className="section-bg" />
      <div className="section-header">我上架的书</div>
      {myListings.length === 0
        ? <div style={{ padding: '20px 16px', color: '#aaa', fontSize: 14 }}>还没有上架书籍</div>
        : myListings.map(l => (
          <div key={l.id} className="menu-item" onClick={() => navigate(`/listing/${l.id}`)}>
            <div>
              <div style={{ fontWeight: 600 }}>{l.book.title}</div>
              <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>
                {[l.can_gift && '可赠', l.can_swap && '可换', l.can_borrow && '可借'].filter(Boolean).join(' · ')}
              </div>
            </div>
            <span className={`status status-${l.status}`}>{STATUS_LABELS[l.status] || l.status}</span>
          </div>
        ))
      }
      <div className="section-bg" />
      <div className="menu-item" style={{ color: '#e53935' }} onClick={handleLogout}>
        退出登录
      </div>
    </div>
  )
}
