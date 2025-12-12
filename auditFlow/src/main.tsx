import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
// Import theme variables
import './styles/theme.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
          <App />
  </StrictMode>,
)