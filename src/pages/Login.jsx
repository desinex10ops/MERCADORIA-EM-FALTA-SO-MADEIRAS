import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { PackageOpen } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      setError('');
      login(username, password);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <PackageOpen size={48} color="var(--accent-blue)" style={{ marginBottom: '1rem' }} />
          <h2>Controle de Faltas</h2>
          <p>Login na sua conta</p>
        </div>

        {error && (
          <div className="bg-red-soft" style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Usuário</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ex: admin"
              style={{
                width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', 
                background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)',
                color: 'var(--text-primary)', transition: 'border-color var(--transition-fast)'
              }}
              required 
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Senha</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Qualquer senha"
              style={{
                width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', 
                background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)',
                color: 'var(--text-primary)'
              }}
              required 
            />
          </div>
          <button type="submit" style={{
            background: 'var(--accent-blue)', color: 'var(--text-primary)', padding: '0.75rem', borderRadius: 'var(--radius-sm)',
            border: 'none', fontWeight: '600', cursor: 'pointer', marginTop: '1rem'
          }}>
            Entrar
          </button>
        </form>

      </div>
    </div>
  );
}
