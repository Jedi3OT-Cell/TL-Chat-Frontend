import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { IS_DEMO } from './lib/config'
import { installDemoBackend } from './lib/demoHub'

if (IS_DEMO) installDemoBackend()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
