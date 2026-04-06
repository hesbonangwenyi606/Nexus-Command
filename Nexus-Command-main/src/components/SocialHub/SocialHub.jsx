import React, { useState, useRef, useEffect } from 'react'

const PLATFORMS = [
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    url: 'https://web.whatsapp.com',
    color: 'bg-green-600',
    activeColor: 'bg-green-700',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    )
  },
  {
    id: 'facebook',
    label: 'Facebook',
    url: 'https://www.facebook.com',
    color: 'bg-blue-600',
    activeColor: 'bg-blue-700',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    )
  },
  {
    id: 'instagram',
    label: 'Instagram',
    url: 'https://www.instagram.com',
    color: 'bg-gradient-to-br from-purple-600 to-pink-500',
    activeColor: 'bg-pink-700',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    )
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    url: 'https://www.linkedin.com',
    color: 'bg-blue-700',
    activeColor: 'bg-blue-800',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    )
  },
  {
    id: 'twitter',
    label: 'X / Twitter',
    url: 'https://www.x.com',
    color: 'bg-slate-800',
    activeColor: 'bg-slate-900',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.63L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
      </svg>
    )
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    url: 'https://www.tiktok.com',
    color: 'bg-black',
    activeColor: 'bg-neutral-900',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/>
      </svg>
    )
  }
]

export default function SocialHub() {
  const [active, setActive] = useState('whatsapp')
  const [loadStates, setLoadStates] = useState({})
  const webviewRefs = useRef({})

  const currentPlatform = PLATFORMS.find(p => p.id === active)

  function handleWebviewRef(id, el) {
    if (el && !webviewRefs.current[id]) {
      webviewRefs.current[id] = el
      el.addEventListener('did-start-loading', () => {
        setLoadStates(prev => ({ ...prev, [id]: 'loading' }))
      })
      el.addEventListener('did-stop-loading', () => {
        setLoadStates(prev => ({ ...prev, [id]: 'ready' }))
      })
      el.addEventListener('did-fail-load', () => {
        setLoadStates(prev => ({ ...prev, [id]: 'error' }))
      })
    }
  }

  function reload() {
    const wv = webviewRefs.current[active]
    if (wv) wv.reload()
  }

  function goBack() {
    const wv = webviewRefs.current[active]
    if (wv && wv.canGoBack()) wv.goBack()
  }

  function goForward() {
    const wv = webviewRefs.current[active]
    if (wv && wv.canGoForward()) wv.goForward()
  }

  return (
    <div className="flex h-full">
      {/* Platform tabs sidebar */}
      <div className="w-52 bg-slate-950 border-r border-slate-800 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-slate-800">
          <h2 className="text-sm font-bold text-slate-100">Social Hub</h2>
          <p className="text-xs text-slate-500 mt-0.5">Your social platforms</p>
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {PLATFORMS.map(platform => (
            <button
              key={platform.id}
              onClick={() => setActive(platform.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all text-sm font-medium
                ${active === platform.id
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white
                ${active === platform.id ? platform.color : 'bg-slate-700'}`}>
                {platform.icon}
              </div>
              <span>{platform.label}</span>
              {loadStates[platform.id] === 'loading' && (
                <div className="ml-auto w-3 h-3 border-2 border-slate-500 border-t-blue-400 rounded-full animate-spin flex-shrink-0" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-800">
          <p className="text-xs text-slate-600 text-center leading-relaxed">
            All sessions stay on your device. No data is shared with Nexus.
          </p>
        </div>
      </div>

      {/* Webview area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Browser toolbar */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-800 bg-slate-900 flex-shrink-0">
          <div className={`w-6 h-6 rounded flex items-center justify-center text-white flex-shrink-0 ${currentPlatform?.color}`}>
            {currentPlatform?.icon && React.cloneElement(currentPlatform.icon, { className: 'w-3.5 h-3.5' })}
          </div>
          <span className="text-sm font-medium text-slate-300">{currentPlatform?.label}</span>
          <div className="flex-1 mx-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1 text-xs text-slate-500 truncate">
            {currentPlatform?.url}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={goBack}
              className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded transition-colors"
              title="Back">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button onClick={goForward}
              className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded transition-colors"
              title="Forward">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button onClick={reload}
              className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded transition-colors"
              title="Reload">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
          {loadStates[active] === 'loading' && (
            <div className="w-4 h-4 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin flex-shrink-0" />
          )}
        </div>

        {/* Webviews — all rendered but only active one visible */}
        <div className="flex-1 relative overflow-hidden">
          {PLATFORMS.map(platform => (
            <webview
              key={platform.id}
              ref={el => handleWebviewRef(platform.id, el)}
              src={platform.url}
              className="absolute inset-0 w-full h-full"
              style={{ display: active === platform.id ? 'flex' : 'none' }}
              partition={`persist:${platform.id}`}
              useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
              allowpopups="true"
            />
          ))}
        </div>
      </div>
    </div>
  )
}
