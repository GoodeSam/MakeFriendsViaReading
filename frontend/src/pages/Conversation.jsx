import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api.js'
import { useAuth } from '../App.jsx'

export default function Conversation() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { userId } = useAuth()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef(null)

  const loadMessages = useCallback(() => {
    api.getMessages(id)
      .then(data => {
        setMessages(data)
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      })
      .catch(e => setError(e.message))
  }, [id])

  useEffect(() => {
    loadMessages()
    const t = setInterval(loadMessages, 5000)
    return () => clearInterval(t)
  }, [loadMessages])

  async function handleSend() {
    if (!input.trim()) return
    setSending(true)
    setError('')
    try {
      await api.sendMessage(id, input.trim())
      setInput('')
      loadMessages()
    } catch (e) {
      setError(e.message)
    } finally {
      setSending(false)
    }
  }

  function formatTime(iso) {
    const d = new Date(iso)
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="page" style={{ paddingBottom: 120 }}>
      <div className="header">
        <button className="header-back" onClick={() => navigate(-1)}>←</button>
        <h1>约定留言</h1>
        <span />
      </div>
      {error && <div className="error-bar">{error}</div>}
      <div className="messages-list">
        {messages.length === 0 && (
          <div className="empty"><div className="empty-icon">💬</div><div className="empty-text">开始约定时间地点吧</div></div>
        )}
        {messages.map(msg => {
          const isMine = msg.sender_id === userId
          const isSystem = msg.type === 'system' || msg.sender_id === null
          if (isSystem) return (
            <div key={msg.id} style={{ textAlign: 'center' }}>
              <span className="bubble system">{msg.content}</span>
            </div>
          )
          return (
            <div key={msg.id} className={`bubble-row ${isMine ? 'mine' : ''}`}>
              <div className={`bubble ${isMine ? 'mine' : 'theirs'}`}>{msg.content}</div>
              <div className="bubble-time">{formatTime(msg.created_at)}</div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
      <div className="chat-input-bar">
        <input className="form-input" placeholder="约定时间地点…" value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()} />
        <button className="btn btn-primary btn-sm" onClick={handleSend} disabled={sending || !input.trim()}>发送</button>
      </div>
    </div>
  )
}
