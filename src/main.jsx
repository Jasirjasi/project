import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './custom-fonts.css'
import App from './App.jsx'
import { ConfigProvider } from './context/ConfigContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ConfigProvider>
      <App />
    </ConfigProvider>
  </StrictMode>,
)
