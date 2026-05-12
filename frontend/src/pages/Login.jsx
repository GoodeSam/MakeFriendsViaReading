import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api.js'
import { useAuth } from '../App.jsx'

const AGE_OPTIONS = [
  { value: '0-3', label: '0-3岁' },
  { value: '3-6', label: '3-6岁' },
  { value: '6-9', label: '6-9岁' },
  { value: '9-12', label: '9-12岁' },
]

export default function Login() {
  const { login, setProfile } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [nickname, setNickname] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [communities, setCommunities] = useState([])
  const [communityId, setCommunityId] = useState('')
  const [ages, setAges] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSendCode() {
    if (phone.length !== 11) { setError('请输入11位手机号'); return }
    setError('')
    setLoading(true)
    try {
      await api.sendCode(phone)
      setCodeSent(true)
      setStep(2)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify() {
    if (!code) { setError('请输入验证码'); return }
    setError('')
    setLoading(true)
    try {
      const data = await api.login({ phone, code })
      login(data)
      const user = await api.me()
      setProfile(user)
      navigate('/', { replace: true })
    } catch (e) {
      if (e.status === 404) {
        // New user — go to register step
        const comms = await api.getCommunities()
        setCommunities(comms)
        if (comms.length > 0) setCommunityId(String(comms[0].id))
        setStep(3)
      } else {
        setError(e.message)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister() {
    if (!nickname.trim()) { setError('请输入昵称'); return }
    if (!communityId) { setError('请选择小区'); return }
    setError('')
    setLoading(true)
    try {
      const data = await api.register({
        phone,
        code,
        nickname: nickname.trim(),
        invite_code: inviteCode.trim() || null,
        community_id: Number(communityId),
        children_age_ranges: ages,
      })
      login(data)
      const user = await api.me()
      setProfile(user)
      navigate('/', { replace: true })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function toggleAge(v) {
    setAges(prev => prev.includes(v) ? prev.filter(a => a !== v) : [...prev, v])
  }

  return (
    <div className="login-wrap">
      <div className="login-hero">
        <h1>📚 以书会友</h1>
        <p>把孩子读完的绘本，送给同小区需要的家庭<br />让好书流动起来</p>
      </div>
      <div className="login-body">
        <div className="step-indicator" style={{ marginBottom: 28 }}>
          {[1,2,3].map(s => <div key={s} className={`step-dot ${step >= s ? 'active' : ''}`} />)}
        </div>
        {error && <div className="error-bar">{error}</div>}
        {step === 1 && (
          <>
            <div className="form-group">
              <label className="form-label">手机号</label>
              <input className="form-input" type="tel" maxLength={11} placeholder="请输入手机号"
                value={phone} onChange={e => setPhone(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendCode()} />
            </div>
            <button className="btn btn-primary btn-full" onClick={handleSendCode} disabled={loading || phone.length !== 11}>
              {loading ? '发送中…' : '获取验证码'}
            </button>
          </>
        )}
        {step === 2 && (
          <>
            <div className="form-group">
              <label className="form-label">验证码（已发送至 {phone}）</label>
              <input className="form-input" type="text" maxLength={6} placeholder="输入验证码"
                value={code} onChange={e => setCode(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleVerify()} />
              <div className="code-hint">💡 演示模式验证码：<strong>123456</strong></div>
            </div>
            <button className="btn btn-primary btn-full" onClick={handleVerify} disabled={loading || !code}>
              {loading ? '验证中…' : '继续'}
            </button>
            <div style={{ textAlign: 'center', marginTop: 14 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => { setStep(1); setCode(''); setError('') }}>
                重新输入手机号
              </button>
            </div>
          </>
        )}
        {step === 3 && (
          <>
            <p style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>首次使用，完善一下信息</p>
            <div className="form-group">
              <label className="form-label">家长昵称</label>
              <input className="form-input" placeholder="如：小明妈妈" value={nickname}
                onChange={e => setNickname(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">所在小区</label>
              <select className="form-select" value={communityId} onChange={e => setCommunityId(e.target.value)}>
                {communities.map(c => <option key={c.id} value={c.id}>{c.name}（{c.district}）</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">孩子年龄段（可多选）</label>
              <div className="toggle-row">
                {AGE_OPTIONS.map(o => (
                  <button key={o.value} className={`toggle-chip ${ages.includes(o.value) ? 'on' : ''}`}
                    onClick={() => toggleAge(o.value)}>{o.label}</button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">邀请码（可选）</label>
              <input className="form-input" placeholder="如：WELCOME001" value={inviteCode}
                onChange={e => setInviteCode(e.target.value)} />
              <div className="form-hint">演示邀请码：WELCOME001（阳光花园）、WELCOME003（星河湾）</div>
            </div>
            <button className="btn btn-primary btn-full" onClick={handleRegister} disabled={loading}>
              {loading ? '注册中…' : '完成注册'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
