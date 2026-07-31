import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { ToastProvider } from './components/shell'
import { StoreProvider } from './state/store'
import './styles.css'

const root = document.getElementById('root')
if (!root) throw new Error('#root 未找到')

createRoot(root).render(
  <StrictMode>
    <StoreProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </StoreProvider>
  </StrictMode>,
)

// PWA：注册 Service Worker，让 App 可添加到主屏并离线可用
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      // 离线能力属增强项，注册失败不影响使用
    })
  })
}
