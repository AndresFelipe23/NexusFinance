import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { configurarSweetAlert2 } from './utils/sweetalert2Config'

// Configurar SweetAlert2 globalmente
configurarSweetAlert2();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
