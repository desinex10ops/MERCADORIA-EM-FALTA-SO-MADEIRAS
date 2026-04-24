import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, LayoutDashboard, Fullscreen, History, PackagePlus, Lock, X, List } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export default function Layout({ children }) {
  const { user, logout, changePassword } = useAuth();
  
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');
    
    if (newPassword.length < 3) {
      return setPassError('A senha deve ter no mínimo 3 caracteres.');
    }
    if (newPassword !== confirmPassword) {
      return setPassError('As senhas não coincidem.');
    }

    changePassword(newPassword);
    setPassSuccess('Senha alterada com sucesso!');
    setTimeout(() => {
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
      setPassSuccess('');
    }, 1500);
  };
  
  const isVendedor = user?.role === 'vendedor';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <nav className="glass-panel" style={{ 
        position: 'sticky', top: 0, zIndex: 10, display: 'flex', justifyContent: 'space-between', 
        alignItems: 'center', padding: '1rem 2rem', borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'var(--accent-blue)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
            {isVendedor ? <PackagePlus size={20} color="white" /> : <LayoutDashboard size={20} color="white" />}
          </div>
          <h2 style={{ fontSize: '1.25rem' }}>Controle de Faltas</h2>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ textAlign: 'right', display: 'block' }}>
            <div style={{ fontWeight: '600', color: 'var(--accent-blue)' }}>{user?.nome}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{user?.role === 'vendedor' ? user?.setor : 'Administração'}</div>
          </div>
          <button onClick={() => setShowPasswordModal(true)} style={{ 
            background: 'transparent', border: 'none', color: 'var(--text-secondary)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem'
          }} title="Alterar Senha">
            <Lock size={18} />
          </button>
          <button onClick={logout} style={{ 
            background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)',
            padding: '0.5rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}>
            <LogOut size={16} /> <span>Sair</span>
          </button>
        </div>
      </nav>

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Top Tab Bar for Navigation */}
        <div style={{ width: '100%', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '1rem', padding: '0 2rem' }}>
          <NavLink 
            to="/" 
            style={({ isActive }) => ({
              padding: '1rem 0', color: isActive ? 'white' : 'var(--text-secondary)', textDecoration: 'none',
              borderBottom: isActive ? '2px solid var(--accent-blue)' : '2px solid transparent',
              fontWeight: isActive ? '600' : 'normal', display: 'flex', alignItems: 'center', gap: '0.5rem'
            })}
          >
            {isVendedor ? <PackagePlus size={18} /> : <LayoutDashboard size={18} />}
            Painel Principal
          </NavLink>
          <NavLink 
            to="/produtos" 
            style={({ isActive }) => ({
              padding: '1rem 0', color: isActive ? 'white' : 'var(--text-secondary)', textDecoration: 'none',
              borderBottom: isActive ? '2px solid var(--accent-blue)' : '2px solid transparent',
              fontWeight: isActive ? '600' : 'normal', display: 'flex', alignItems: 'center', gap: '0.5rem'
            })}
          >
            <List size={18} /> Catálogo
          </NavLink>
          <NavLink 
            to="/historico" 
            style={({ isActive }) => ({
              padding: '1rem 0', color: isActive ? 'white' : 'var(--text-secondary)', textDecoration: 'none',
              borderBottom: isActive ? '2px solid var(--accent-blue)' : '2px solid transparent',
              fontWeight: isActive ? '600' : 'normal', display: 'flex', alignItems: 'center', gap: '0.5rem'
            })}
          >
            <History size={18} /> Histórico
          </NavLink>
        </div>

        {/* Main Content */}
        <main style={{ flex: 1, padding: '2rem 1rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
          {children}
        </main>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2rem', background: 'var(--bg-secondary)', position: 'relative' }}>
            <button 
              onClick={() => setShowPasswordModal(false)}
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
            <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              Alterar Minha Senha
            </h3>
            
            {passError && <div className="bg-red-soft" style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.875rem' }}>{passError}</div>}
            {passSuccess && <div className="bg-green-soft" style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.875rem' }}>{passSuccess}</div>}

            <form onSubmit={handlePasswordSubmit} style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Nova Senha</label>
                <input 
                  type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'white' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Confirmar Nova Senha</label>
                <input 
                  type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'white' }}
                />
              </div>

              <button type="submit" style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--accent-blue)', color: 'white', fontWeight: 'bold', cursor: 'pointer', marginTop: '0.5rem' }}>
                Salvar Senha
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
