import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { ProtocolProvider } from './context/ProtocolContext.jsx'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ProtocolProvider>
      <App />
    </ProtocolProvider>
  </React.StrictMode>
)
