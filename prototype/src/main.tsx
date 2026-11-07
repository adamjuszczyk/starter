import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { seed } from './demo/seed'

// The fake data goes into the real query cache before anything is drawn, so the first paint already has it (Overload's main.tsx).
seed()
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
