import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { BrowserRouter, Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Home from './pages/Home.jsx'
import ListingDetail from './pages/ListingDetail.jsx'
import NewListing from './pages/NewListing.jsx'
import Applications from './pages/Applications.jsx'
import Conversation from './pages/Conversation.jsx'
import Profile from './pages/Profile.jsx'
import { api } from './api.js'

export const AuthContext = createContext(null)
export function useAuth() { return useContext(AuthContext) }

function NavBar() {
  const location = useLocation()
  const hide = ['/login'].includes(location.pathname)
  if (hide) return null
  return (
    <nav className="nav-bar">
      <NavLink to="/" end className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
        <span className="nav-icon">📚</span>
        <span>首页</span>
      </NavLink>
      <NavLink to="/new" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
        <span className="nav-icon">➕</span>
        <span>上架</span>
      </NavLink>
      <NavLink to="/applications" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
        <span className="nav-icon">🔔</span>
        <span>申请</span>
      </NavLink>
      <NavLink to="/me" className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
        <span className="nav-icon">👤</span>
        <span>我的</span>
      </NavLink>
    </nav>
  )
}

function RequireAuth({ children }) {
  const { token } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('mfvr_token'))
  const [userId, setUserId] = useState(() => localStorage.getItem('mfvr_user_id'))
  const [nickname, setNickname] = useState(() => localStorage.getItem('mfvr_nickname'))
  const [communityId, setCommunityId] = useState(() => localStorage.getItem('mfvr_community_id'))

  const login = useCallback((tokenData) => {
    localStorage.setItem('mfvr_token', tokenData.access_token)
    localStorage.setItem('mfvr_user_id', String(tokenData.user_id))
    setToken(tokenData.access_token)
    setUserId(String(tokenData.user_id))
  }, [])

  const setProfile = useCallback((user) => {
    localStorage.setItem('mfvr_nickname', user.nickname)
    localStorage.setItem('mfvr_community_id', String(user.community_id))
    setNickname(user.nickname)
    setCommunityId(String(user.community_id))
  }, [])

  const logout = useCallback(() => {
    ['mfvr_token', 'mfvr_user_id', 'mfvr_nickname', 'mfvr_community_id'].forEach(k => localStorage.removeItem(k))
    setToken(null)
    setUserId(null)
    setNickname(null)
    setCommunityId(null)
  }, [])

  // Load profile if we have a token but no nickname
  useEffect(() => {
    if (token && !nickname) {
      api.me().then(setProfile).catch(() => logout())
    }
  }, [token, nickname, setProfile, logout])

  return (
    <AuthContext.Provider value={{ token, userId: Number(userId), nickname, communityId: Number(communityId), login, setProfile, logout }}>
      <BrowserRouter>
        <div className="app-shell">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<RequireAuth><Home /></RequireAuth>} />
            <Route path="/listing/:id" element={<RequireAuth><ListingDetail /></RequireAuth>} />
            <Route path="/new" element={<RequireAuth><NewListing /></RequireAuth>} />
            <Route path="/applications" element={<RequireAuth><Applications /></RequireAuth>} />
            <Route path="/conversation/:id" element={<RequireAuth><Conversation /></RequireAuth>} />
            <Route path="/me" element={<RequireAuth><Profile /></RequireAuth>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <NavBar />
        </div>
      </BrowserRouter>
    </AuthContext.Provider>
  )
}
