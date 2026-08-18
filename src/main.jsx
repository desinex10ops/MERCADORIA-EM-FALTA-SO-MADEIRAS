import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext.jsx'
import { DataProvider } from './context/DataContext.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

function AppWrapper() {
  useEffect(() => {
    window.__appRendered = true;
  }, []);

  return (
    <AuthProvider>
      <DataProvider>
        <App />
      </DataProvider>
    </AuthProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AppWrapper />
    </ErrorBoundary>
  </React.StrictMode>,
)
