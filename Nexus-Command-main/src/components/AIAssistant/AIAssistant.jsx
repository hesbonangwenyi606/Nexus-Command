import React, { useState, useEffect, useRef } from 'react'
import { useApp } from '../../App'

const MODES = [
  { id: 'chat', label: 'Free Chat', desc: 'Ask anything about your career or job search' },
  { id: 'cover', label: 'Cover Letter', desc: 'Get help writing or improving cover letter sections' },
  { id: 'email', label: 'Email Tone', desc: 'Adjust tone or summarise email drafts' },
  { id: 'interview', label: 'Interview Prep', desc: 'Practice answers and get feedback' }
]

const STARTER_PROMPTS = {
  chat: [
    'How should I follow up after an interview?',
    'What makes a strong LinkedIn profile?',
    'How do I negotiate salary effectively?'
  ],
  cover: [
    'Review my opening paragraph and suggest improvements',
    'Help me write a closing paragraph that stands out',
    'Make this section sound more confident'
  ],
  email: [
    'Make this email more professional',
    'Make this more concise and direct',
    'Summarise this email thread in 3 bullet points'
  ],
  interview: [
    'What are common behavioural interview questions?',
    'Help me structure a STAR answer for leadership',
    'How do I answer "What is your greatest weakness?"'
  ]
}

function Message({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold
        ${isUser ? 'bg-blue-600 text-white' : 'bg-cyan-700 text-white'}`}>
        {isUser ? 'U' : 'AI'}
      </div>
      <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed
        ${isUser
          ? 'bg-blue-600 text-white rounded-tr-none'
          : 'bg-slate-700 text-slate-100 rounded-tl-none'
        }`}>
        {msg.content.split('\n').map((line, i) => (
          <span key={i}>{line}{i < msg.content.split('\n').length - 1 && <br />}</span>
        ))}
        {msg.loading && (
          <span className="inline-flex gap-1 ml-1">
            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
        )}
      </div>
    </div>
  )
}

export default function AIAssistant() {
  const { addNotification } = useApp()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [ollamaStatus, setOllamaStatus] = useState('checking') // checking | online | offline
  const [models, setModels] = useState([])
  const [selectedModel, setSelectedModel] = useState('')
  const [mode, setMode] = useState('chat')
  const [conversationHistory, setConversationHistory] = useState([])
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    checkOllama()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function checkOllama() {
    if (!window.electronAPI) {
      setOllamaStatus('offline')
      return
    }
    try {
      const result = await window.electronAPI.aiPing()
      if (result.online) {
        setOllamaStatus('online')
        const modelsResult = await window.electronAPI.aiGetModels()
        const modelList = modelsResult.models || []
        setModels(modelList)
        if (modelList.length > 0) setSelectedModel(modelList[0])
      } else {
        setOllamaStatus('offline')
      }
    } catch {
      setOllamaStatus('offline')
    }
  }

  async function sendMessage(text) {
    const userText = text || input.trim()
    if (!userText || loading) return
    setInput('')

    const userMsg = { role: 'user', content: userText }
    const loadingMsg = { role: 'assistant', content: '', loading: true }

    setMessages(prev => [...prev, userMsg, loadingMsg])
    setLoading(true)

    const newHistory = [...conversationHistory, { role: 'user', content: userText }]

    const systemPrompts = {
      chat: 'You are a helpful career coach assistant. Give concise, practical career advice.',
      cover: 'You are an expert cover letter writer. Help improve cover letter sections with professional, tailored language.',
      email: 'You are a professional email editor. Help adjust tone, improve clarity, or summarise email content.',
      interview: 'You are an interview coach. Help prepare strong, structured answers to interview questions.'
    }

    const prompt = `${systemPrompts[mode]}\n\nConversation so far:\n${newHistory.slice(-6).map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n')}\n\nRespond helpfully and concisely.`

    try {
      const result = await window.electronAPI.aiQuery(selectedModel || 'llama3', prompt)
      const assistantText = result.response || 'Sorry, I could not generate a response.'

      setMessages(prev => prev.slice(0, -1).concat({ role: 'assistant', content: assistantText }))
      setConversationHistory([...newHistory, { role: 'assistant', content: assistantText }])
    } catch (err) {
      setMessages(prev => prev.slice(0, -1).concat({
        role: 'assistant',
        content: 'Error: Could not reach Ollama. Make sure it is running and a model is downloaded.'
      }))
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  function clearChat() {
    setMessages([])
    setConversationHistory([])
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-64 border-r border-slate-800 flex flex-col bg-slate-950 flex-shrink-0">
        <div className="p-4 border-b border-slate-800">
          <h2 className="text-sm font-bold text-slate-100">AI Assistant</h2>
          <p className="text-xs text-slate-500 mt-0.5">Powered by Ollama (local)</p>
        </div>

        {/* Ollama status */}
        <div className="p-3 border-b border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-2 h-2 rounded-full ${ollamaStatus === 'online' ? 'bg-green-400' : ollamaStatus === 'offline' ? 'bg-red-400' : 'bg-yellow-400 animate-pulse'}`} />
            <span className="text-xs text-slate-400">
              {ollamaStatus === 'online' ? 'Ollama running' : ollamaStatus === 'offline' ? 'Ollama offline' : 'Checking...'}
            </span>
            {ollamaStatus !== 'online' && (
              <button onClick={checkOllama} className="text-xs text-blue-400 hover:text-blue-300 ml-auto">Retry</button>
            )}
          </div>
          {ollamaStatus === 'online' && models.length > 0 && (
            <select
              value={selectedModel}
              onChange={e => setSelectedModel(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200"
            >
              {models.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          )}
        </div>

        {/* Mode selection */}
        <div className="p-3 border-b border-slate-800">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Mode</p>
          <div className="space-y-1">
            {MODES.map(m => (
              <button
                key={m.id}
                onClick={() => { setMode(m.id); clearChat() }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${mode === m.id ? 'bg-cyan-700 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
              >
                <div className="font-medium">{m.label}</div>
                <div className={`mt-0.5 ${mode === m.id ? 'text-cyan-200' : 'text-slate-500'}`}>{m.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="p-3 mt-auto">
          <button
            onClick={clearChat}
            className="w-full px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-lg text-xs transition-colors"
          >
            Clear conversation
          </button>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-lg font-bold text-slate-100">
              {MODES.find(m => m.id === mode)?.label}
            </h1>
            <p className="text-xs text-slate-400">{MODES.find(m => m.id === mode)?.desc}</p>
          </div>
          {selectedModel && (
            <span className="text-xs bg-cyan-900/40 text-cyan-300 border border-cyan-800 px-2 py-1 rounded-full">
              {selectedModel}
            </span>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
              {ollamaStatus === 'offline' && (
                <div className="max-w-md bg-slate-800 border border-slate-700 rounded-xl p-5">
                  <div className="text-yellow-400 font-semibold mb-2">Ollama is not running</div>
                  <p className="text-sm text-slate-400 mb-3">
                    To use AI features, install and start Ollama, then download a model:
                  </p>
                  <ol className="text-xs text-slate-400 text-left space-y-1">
                    <li>1. Download Ollama from <span className="text-blue-400">ollama.ai</span></li>
                    <li>2. Run: <code className="bg-slate-700 px-1 rounded">ollama pull llama3</code></li>
                    <li>3. Ollama starts automatically on port 11434</li>
                    <li>4. Click Retry above</li>
                  </ol>
                  <p className="text-xs text-slate-500 mt-3">All AI runs 100% offline on your device.</p>
                </div>
              )}

              {ollamaStatus === 'online' && (
                <>
                  <div className="w-14 h-14 bg-cyan-700/30 rounded-full flex items-center justify-center">
                    <svg className="w-7 h-7 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H4a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-1" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm mb-4">Try a starter prompt:</p>
                    <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                      {STARTER_PROMPTS[mode].map((p, i) => (
                        <button
                          key={i}
                          onClick={() => sendMessage(p)}
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded-lg text-xs text-slate-300 transition-colors text-left"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {messages.map((msg, i) => (
            <Message key={i} msg={msg} />
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-slate-800 flex-shrink-0">
          <div className="flex gap-3 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={ollamaStatus === 'online' ? 'Type a message… (Enter to send, Shift+Enter for new line)' : 'Ollama is not running'}
              disabled={ollamaStatus !== 'online' || loading}
              rows={1}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 resize-none focus:outline-none focus:border-cyan-600 disabled:opacity-50"
              style={{ maxHeight: '120px', overflowY: 'auto' }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading || ollamaStatus !== 'online'}
              className="flex-shrink-0 w-10 h-10 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl flex items-center justify-center transition-colors"
            >
              <svg className="w-4 h-4 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-slate-600 mt-2 text-center">All AI processing runs locally on your device. Nothing is sent to external servers.</p>
        </div>
      </div>
    </div>
  )
}
