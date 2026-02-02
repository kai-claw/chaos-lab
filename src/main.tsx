import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Remove loading spinner with graceful fade
const loader = document.getElementById('app-loader');
if (loader) {
  loader.classList.add('fade-out');
  setTimeout(() => loader.remove(), 600);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
