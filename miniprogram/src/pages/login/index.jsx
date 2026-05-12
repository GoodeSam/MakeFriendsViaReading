import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Input, Picker } from '@tarojs/components'
import { api } from '../../api'
import './index.scss'

const AGE_OPTIONS = ['0-3岁', '3-6岁', '6-9岁', '9-12岁']
const AGE_VALUES = ['0-3', '3-6', '6-9', '9-12']

export default function Login() {
  const [step, setStep] = useState(1)
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [nickname, setNickname] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [communities, setCommunities] = useState([])
  const [communityIdx, setCommunityIdx] = useState(0)
  const [ages, setAges] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = Taro.getStorageSync('mfvr_token')
    if (token) {
      Taro.switchTab({ url: '/pages/home/index' })
    }
  }, [])

  async function handleSendCode() {
    if (phone.length !== 11) { setError('请输入11位手机号'); return }
    setError('')
    setLoading(true)
    try {
      await api.sendCode(phone)
      setStep(2)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  async function handleVerify() {
    if (!code) { setError('请输入验证码'); return }
    setError('')
    setLoading(true)
    try {
      const data = await api.login({ phone, code })
      Taro.setStorageSync('mfvr_token', data.access_token)
      Taro.setStorageSync('mfvr_user_id', String(data.user_id))
      const user = await api.me()
      Taro.setStorageSync('mfvr_nickname', user.nickname)
      Taro.setStorageSync('mfvr_community_id', String(user.community_id))
      Taro.switchTab({ url: '/pages/home/index' })
    } catch (e) {
      if (e.status === 404) {
        const comms = await api.getCommunities()
        setCommunities(comms)
        setStep(3)
      } else { setError(e.message) }
    }
    finally { setLoading(false) }
  }

  async function handleRegister() {
    if (!nickname.trim()) { setError('请输入昵称'); return }
    if (!communities.length) { setError('无可用小区'); return }
    setError('')
    setLoading(true)
    try {
      const data = await api.register({
        phone, code,
        nickname: nickname.trim(),
        invite_code: inviteCode.trim() || null,
        community_id: communities[communityIdx].id,
        children_age_ranges: ages,
      })
      Taro.setStorageSync('mfvr_token', data.access_token)
      Taro.setStorageSync('mfvr_user_id', String(data.user_id))
      const user = await api.me()
      Taro.setStorageSync('mfvr_nickname', user.nickname)
      Taro.setStorageSync('mfvr_community_id', String(user.community_id))
      Taro.switchTab({ url: '/pages/home/index' })
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  function toggleAge(v) {
    setAges(prev => prev.includes(v) ? prev.filter(a => a !== v) : [...prev, v])
  }

  return (
    <View>
      <View className="login-hero">
        <Text className="login-hero-title">📚 以书会友</Text>
        <Text className="login-hero-sub">{'把孩子读完的绘本，送给同小区需要的家庭\n让好书流动起来'}</Text>
      </View>
      <View className="login-body">
        <View className="step-dots">
          {[1,2,3].map(s => (
            <View key={s} className={`step-dot ${step >= s ? 'step-dot-active' : ''}`} />
          ))}
        </View>
        {error ? <View className="error-bar">{error}</View> : null}

        {step === 1 && (
          <View>
            <View className="form-group">
              <Text className="form-label">手机号</Text>
              <Input className="form-input" type="number" maxlength={11} placeholder="请输入手机号"
                value={phone} onInput={e => setPhone(e.detail.value)} />
            </View>
            <View className={`btn btn-primary btn-full ${loading || phone.length !== 11 ? 'btn-disabled' : ''}`}
              onClick={!loading && phone.length === 11 ? handleSendCode : undefined}>
              {loading ? '发送中…' : '获取验证码'}
            </View>
          </View>
        )}

        {step === 2 && (
          <View>
            <View className="form-group">
              <Text className="form-label">验证码（已发至 {phone}）</Text>
              <Input className="form-input" type="number" maxlength={6} placeholder="输入验证码"
                value={code} onInput={e => setCode(e.detail.value)} />
              <View className="code-hint">💡 演示模式验证码：123456</View>
            </View>
            <View className={`btn btn-primary btn-full ${loading || !code ? 'btn-disabled' : ''}`}
              onClick={!loading && code ? handleVerify : undefined}>
              {loading ? '验证中…' : '继续'}
            </View>
            <View style={{ textAlign: 'center', marginTop: 14 }}
              onClick={() => { setStep(1); setCode(''); setError('') }}>
              <Text style={{ color: '#888', fontSize: '14px' }}>重新输入手机号</Text>
            </View>
          </View>
        )}

        {step === 3 && (
          <View>
            <Text style={{ fontSize: '14px', color: '#666', display: 'block', marginBottom: '20px' }}>
              首次使用，完善一下信息
            </Text>
            <View className="form-group">
              <Text className="form-label">家长昵称</Text>
              <Input className="form-input" placeholder="如：小明妈妈"
                value={nickname} onInput={e => setNickname(e.detail.value)} />
            </View>
            <View className="form-group">
              <Text className="form-label">所在小区</Text>
              <Picker mode="selector" range={communities.map(c => `${c.name}（${c.district}）`)}
                value={communityIdx} onChange={e => setCommunityIdx(Number(e.detail.value))}>
                <View className="form-input" style={{ color: '#222' }}>
                  {communities[communityIdx] ? `${communities[communityIdx].name}（${communities[communityIdx].district}）` : '选择小区'}
                </View>
              </Picker>
            </View>
            <View className="form-group">
              <Text className="form-label">孩子年龄段（可多选）</Text>
              <View className="toggle-row">
                {AGE_VALUES.map((v, i) => (
                  <View key={v} className={`toggle-chip ${ages.includes(v) ? 'toggle-chip-on' : ''}`}
                    onClick={() => toggleAge(v)}>
                    <Text>{AGE_OPTIONS[i]}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View className="form-group">
              <Text className="form-label">邀请码（可选）</Text>
              <Input className="form-input" placeholder="如：WELCOME001"
                value={inviteCode} onInput={e => setInviteCode(e.detail.value)} />
              <Text className="form-hint">演示码：WELCOME001（阳光花园）</Text>
            </View>
            <View className={`btn btn-primary btn-full ${loading ? 'btn-disabled' : ''}`}
              onClick={!loading ? handleRegister : undefined}>
              {loading ? '注册中…' : '完成注册'}
            </View>
          </View>
        )}
      </View>
    </View>
  )
}
