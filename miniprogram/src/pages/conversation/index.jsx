import { useState, useEffect, useCallback } from 'react'
import Taro, { useLoad } from '@tarojs/taro'
import { View, Text, ScrollView, Input } from '@tarojs/components'
import { api } from '../../api'
import './index.scss'

export default function Conversation() {
  const [convId, setConvId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const userId = Number(Taro.getStorageSync('mfvr_user_id'))

  useLoad(params => { setConvId(params.id) })

  const loadMessages = useCallback(async () => {
    if (!convId) return
    try { setMessages(await api.getMessages(convId)) }
    catch (e) { setError(e.message) }
  }, [convId])

  useEffect(() => {
    if (!convId) return
    loadMessages()
    const t = setInterval(loadMessages, 5000)
    return () => clearInterval(t)
  }, [convId, loadMessages])

  async function handleSend() {
    if (!input.trim()) return
    setSending(true); setError('')
    try {
      await api.sendMessage(convId, input.trim())
      setInput('')
      loadMessages()
    } catch (e) { setError(e.message) }
    finally { setSending(false) }
  }

  function fmtTime(iso) {
    const d = new Date(iso)
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
  }

  return (
    <View className="page" style={{ paddingBottom: '0' }}>
      {error ? <View className="error-bar">{error}</View> : null}
      <ScrollView scrollY scrollIntoView={`msg-${messages.length - 1}`}
        style={{ height: 'calc(100vh - 120px)', background: '#f5f5f5' }}>
        <View className="messages-list">
          {messages.length === 0 && (
            <View className="empty">
              <Text className="empty-icon">💬</Text>
              <Text className="empty-text" style={{ display: 'block' }}>开始约定时间地点吧</Text>
            </View>
          )}
          {messages.map((msg, i) => {
            const isMine = msg.sender_id === userId
            const isSystem = msg.type === 'system' || msg.sender_id === null
            if (isSystem) return (
              <View key={msg.id} id={`msg-${i}`} style={{ textAlign: 'center', margin: '8px 0' }}>
                <Text className="bubble bubble-system">{msg.content}</Text>
              </View>
            )
            return (
              <View key={msg.id} id={`msg-${i}`} className={`bubble-row ${isMine ? 'bubble-row-mine' : ''}`}>
                <Text className={`bubble ${isMine ? 'bubble-mine' : 'bubble-theirs'}`}>{msg.content}</Text>
                <Text className="bubble-time">{fmtTime(msg.created_at)}</Text>
              </View>
            )
          })}
        </View>
      </ScrollView>
      <View className="chat-input-bar">
        <Input className="form-input" placeholder="约定时间地点…" value={input}
          onInput={e => setInput(e.detail.value)}
          confirmType="send" onConfirm={handleSend} />
        <View className={`btn btn-primary btn-sm ${sending || !input.trim() ? 'btn-disabled' : ''}`}
          onClick={!sending && input.trim() ? handleSend : undefined}>
          <Text>发送</Text>
        </View>
      </View>
    </View>
  )
}
