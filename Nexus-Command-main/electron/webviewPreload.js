// Injected into every social-hub webview session before page scripts run.
// Overrides browser fingerprinting APIs so Google (and others) treat
// this as a real Chrome window and allow sign-in.

;(function () {
  // 1. Fix navigator.userAgentData — Electron exposes wrong brand list
  try {
    Object.defineProperty(navigator, 'userAgentData', {
      get: () => ({
        brands: [
          { brand: 'Chromium', version: '122' },
          { brand: 'Google Chrome', version: '122' },
          { brand: 'Not(A:Brand', version: '24' }
        ],
        mobile: false,
        platform: 'Windows',
        getHighEntropyValues: () => Promise.resolve({
          architecture: 'x86',
          bitness: '64',
          model: '',
          platformVersion: '10.0.0',
          uaFullVersion: '122.0.6261.112',
          fullVersionList: [
            { brand: 'Chromium', version: '122.0.6261.112' },
            { brand: 'Google Chrome', version: '122.0.6261.112' },
            { brand: 'Not(A:Brand', version: '24.0.0.0' }
          ]
        })
      })
    })
  } catch (_) {}

  // 2. Add window.chrome — absent in Electron, checked by Google
  try {
    if (!window.chrome) {
      Object.defineProperty(window, 'chrome', {
        value: {
          runtime: {},
          loadTimes: function () {},
          csi: function () {}
        },
        writable: false,
        configurable: true
      })
    }
  } catch (_) {}

  // 3. Block WebAuthn passkey prompts — prevents Windows Security popup
  try {
    const origGet = navigator.credentials.get.bind(navigator.credentials)
    navigator.credentials.get = function (options) {
      if (options && options.publicKey) {
        return Promise.reject(new DOMException('Passkeys disabled', 'NotAllowedError'))
      }
      return origGet(options)
    }
  } catch (_) {}
})()
