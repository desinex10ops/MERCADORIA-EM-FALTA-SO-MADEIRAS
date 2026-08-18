import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('React ErrorBoundary caught error:', error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      if ('caches' in window) {
        caches.keys().then(names => names.forEach(name => caches.delete(name)));
      }
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
      }
    } catch (e) {}
    setTimeout(() => { window.location.href = '/login'; }, 500);
  };

  render() {
    if (this.state.hasError) {
      const errMsg = this.state.error ? String(this.state.error.message || this.state.error) : 'Erro desconhecido';
      const errStack = this.state.error && this.state.error.stack ? this.state.error.stack.split('\n').slice(0, 5).join('\n') : '';
      
      return (
        <div style={{
          minHeight: '100vh',
          background: '#0f172a',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          fontFamily: 'sans-serif',
          textAlign: 'center'
        }}>
          <div style={{
            background: 'rgba(30, 41, 59, 0.9)',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            padding: '2.5rem',
            borderRadius: '12px',
            maxWidth: '600px',
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
          }}>
            <h2 style={{ color: '#f87171', marginBottom: '1rem', fontSize: '1.4rem' }}>
              Erro na Aplicação
            </h2>
            <div style={{ 
              background: 'rgba(0,0,0,0.4)', 
              padding: '1rem', 
              borderRadius: '8px', 
              marginBottom: '1.5rem',
              textAlign: 'left',
              fontSize: '0.8rem',
              color: '#fca5a5',
              maxHeight: '200px',
              overflow: 'auto',
              wordBreak: 'break-word'
            }}>
              <strong>Erro:</strong> {errMsg}
              {errStack && (
                <pre style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: '#94a3b8', whiteSpace: 'pre-wrap' }}>
                  {errStack}
                </pre>
              )}
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Clique abaixo para limpar todos os dados em cache e tentar novamente.
            </p>
            <button
              onClick={this.handleReset}
              style={{
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                padding: '0.8rem 1.5rem',
                borderRadius: '6px',
                fontWeight: 'bold',
                fontSize: '0.95rem',
                cursor: 'pointer'
              }}
            >
              Limpar Cache e Recarregar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
