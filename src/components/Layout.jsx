import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { LogOut, LayoutDashboard, History, PackagePlus, Lock, X, List, ArrowUp, Sun, Moon, Users, TrendingDown, Bell, Menu, ChevronRight, Building2 } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';

export default function Layout({ children }) {
  const { user, logout, changePassword } = useAuth();
  const { records, readNotificationIds } = useData();
  const location = useLocation();

  const isVendedor = user?.role === 'vendedor';

  const arrivedRecords = (records || []).filter(r => r.chegou);

  const unreadCount = arrivedRecords.filter(r => !(readNotificationIds || []).includes(r.id)).length;
  
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('@MercadoriaData:theme') || 'dark');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
    localStorage.setItem('@MercadoriaData:theme', theme);
  }, [theme]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (newPassword.length < 3) {
      setPassError('A senha deve ter pelo menos 3 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError('As senhas não coincidem.');
      return;
    }

    changePassword(newPassword);
    setPassSuccess('Senha alterada com sucesso!');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => {
      setPassSuccess('');
      setShowPasswordModal(false);
    }, 2000);
  };

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const mainDashboardPath = user?.role === 'vendedor' ? "/vendedor" : "/comprador";

  return (
    <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column', overflowX: 'hidden' }}>
      
      {/* Top Navbar */}
      <nav className="glass-panel mobile-nav" style={{ 
        position: 'sticky', top: 0, zIndex: 100, display: 'flex', justifyContent: 'space-between', 
        alignItems: 'center', padding: '0.85rem 1.5rem', borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0 
      }}>
        <div className="mobile-gap" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          
          {/* Mobile Hamburger Menu Icon */}
          <button 
            type="button"
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(true)}
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border-color)', color: '#fff', padding: '0.45rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Abrir Menu"
          >
            <Menu size={22} />
          </button>

          <div style={{ background: 'var(--accent-blue)', padding: '0.45rem', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center' }}>
            {isVendedor ? <PackagePlus size={20} color="white" /> : <LayoutDashboard size={20} color="white" />}
          </div>
          <h2 className="mobile-h2 hide-on-mobile" style={{ fontSize: '1.2rem', fontWeight: 800 }}>Controle de Faltas</h2>
        </div>
        
        <div className="mobile-gap" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ textAlign: 'right', display: 'block' }}>
            <div style={{ fontWeight: '700', color: 'var(--accent-blue)', fontSize: '0.9rem' }}>{user?.nome}</div>
            <div className="hide-on-mobile" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
              {user?.role === 'vendedor' ? user?.setor : (user?.role === 'cotador' ? 'Auxiliar de Cotações' : 'Administração')}
            </div>
          </div>

          <button onClick={toggleTheme} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }} title="Alternar Tema">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button onClick={() => setShowPasswordModal(true)} className="hide-on-mobile" style={{ 
            background: 'transparent', border: 'none', color: 'var(--text-secondary)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem'
          }} title="Alterar Senha">
            <Lock size={18} />
          </button>

          <button onClick={logout} className="hide-on-mobile" style={{ 
            background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)',
            padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 600
          }}>
            <LogOut size={15} /> <span>Sair</span>
          </button>
        </div>
      </nav>

      {/* MOBILE OFF-CANVAS SIDE DRAWER MENU (Surge do lado esquerdo) */}
      {mobileMenuOpen && (
        <div 
          className="mobile-menu-backdrop" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div className={`mobile-menu-drawer ${mobileMenuOpen ? 'open' : ''}`}>
        {/* Drawer Header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: 'var(--accent-blue)', padding: '0.5rem', borderRadius: '8px', color: '#fff' }}>
              <Building2 size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.95rem' }}>{user?.nome}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {user?.role === 'vendedor' ? `Vendedor • ${user?.setor || 'Geral'}` : user?.role === 'cotador' ? 'Cotador' : 'Administração'}
              </div>
            </div>
          </div>

          <button 
            onClick={() => setMobileMenuOpen(false)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Drawer Nav Links */}
        <div style={{ padding: '1rem', display: 'grid', gap: '0.5rem', flex: 1, overflowY: 'auto' }}>
          
          <NavLink 
            to={mainDashboardPath} 
            end
            onClick={() => setMobileMenuOpen(false)}
            style={({ isActive }) => ({
              padding: '0.85rem 1rem', color: isActive ? '#fff' : 'var(--text-secondary)', textDecoration: 'none',
              background: isActive ? 'var(--accent-blue)' : 'transparent',
              borderRadius: 'var(--radius-sm)', fontWeight: isActive ? '800' : '600',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.9rem'
            })}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {isVendedor ? <PackagePlus size={18} /> : <LayoutDashboard size={18} />} Painel Principal
            </span>
            <ChevronRight size={16} />
          </NavLink>

          {(user?.role === 'comprador' || user?.role === 'cotador') && (
            <NavLink 
              to="/equipe" 
              onClick={() => setMobileMenuOpen(false)}
              style={({ isActive }) => ({
                padding: '0.85rem 1rem', color: isActive ? '#fff' : 'var(--text-secondary)', textDecoration: 'none',
                background: isActive ? 'var(--accent-blue)' : 'transparent',
                borderRadius: 'var(--radius-sm)', fontWeight: isActive ? '800' : '600',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.9rem'
              })}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Users size={18} color="var(--accent-blue)" /> GESTÃO DE EQUIPE
              </span>
              <ChevronRight size={16} />
            </NavLink>
          )}

          {user?.role === 'comprador' && (
            <NavLink 
              to="/economia" 
              onClick={() => setMobileMenuOpen(false)}
              style={({ isActive }) => ({
                padding: '0.85rem 1rem', color: isActive ? '#fff' : 'var(--text-secondary)', textDecoration: 'none',
                background: isActive ? 'var(--accent-blue)' : 'transparent',
                borderRadius: 'var(--radius-sm)', fontWeight: isActive ? '800' : '600',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.9rem'
              })}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <TrendingDown size={18} color="var(--status-green)" /> ECONOMIA
              </span>
              <ChevronRight size={16} />
            </NavLink>
          )}

          <NavLink 
            to="/notificacoes" 
            onClick={() => setMobileMenuOpen(false)}
            style={({ isActive }) => ({
              padding: '0.85rem 1rem', color: isActive ? '#fff' : 'var(--text-secondary)', textDecoration: 'none',
              background: isActive ? 'var(--status-green)' : 'transparent',
              borderRadius: 'var(--radius-sm)', fontWeight: isActive ? '800' : '600',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.9rem'
            })}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Bell size={18} color={unreadCount > 0 ? "var(--status-green)" : "currentColor"} /> NOTIFICAÇÕES
            </span>
            <span style={{ 
              background: unreadCount > 0 ? 'var(--status-green)' : 'rgba(255,255,255,0.1)', 
              color: unreadCount > 0 ? '#fff' : 'var(--text-secondary)', 
              borderRadius: '12px', padding: '0.1rem 0.6rem', fontSize: '0.75rem', fontWeight: 'bold' 
            }}>
              {unreadCount}
            </span>
          </NavLink>

          <NavLink 
            to="/produtos" 
            onClick={() => setMobileMenuOpen(false)}
            style={({ isActive }) => ({
              padding: '0.85rem 1rem', color: isActive ? '#fff' : 'var(--text-secondary)', textDecoration: 'none',
              background: isActive ? 'var(--accent-blue)' : 'transparent',
              borderRadius: 'var(--radius-sm)', fontWeight: isActive ? '800' : '600',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.9rem'
            })}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <List size={18} /> Catálogo
            </span>
            <ChevronRight size={16} />
          </NavLink>

          <NavLink 
            to="/historico" 
            onClick={() => setMobileMenuOpen(false)}
            style={({ isActive }) => ({
              padding: '0.85rem 1rem', color: isActive ? '#fff' : 'var(--text-secondary)', textDecoration: 'none',
              background: isActive ? 'var(--accent-blue)' : 'transparent',
              borderRadius: 'var(--radius-sm)', fontWeight: isActive ? '800' : '600',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.9rem'
            })}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <History size={18} /> Histórico
            </span>
            <ChevronRight size={16} />
          </NavLink>
        </div>

        {/* Drawer Footer Actions */}
        <div style={{ padding: '1.25rem 1rem', borderTop: '1px solid var(--border-color)', display: 'grid', gap: '0.75rem', background: 'rgba(0,0,0,0.2)' }}>
          <button 
            onClick={() => { setMobileMenuOpen(false); setShowPasswordModal(true); }}
            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)', padding: '0.65rem 1rem', borderRadius: 'var(--radius-sm)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}
          >
            <Lock size={16} /> Alterar Senha
          </button>

          <button 
            onClick={logout}
            style={{ width: '100%', background: 'rgba(239,68,68,0.15)', color: 'var(--status-red)', border: '1px solid var(--status-red)', padding: '0.65rem 1rem', borderRadius: 'var(--radius-sm)', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}
          >
            <LogOut size={16} /> Sair do Sistema
          </button>
        </div>
      </div>

      {/* DESKTOP NAV TABS BAR */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div className="desktop-tab-bar" style={{ width: '100%', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '1rem', padding: '0 2rem', overflowX: 'auto' }}>
          <NavLink 
            to={mainDashboardPath} 
            end
            style={({ isActive }) => ({
              padding: '1rem 0', color: isActive ? 'white' : 'var(--text-secondary)', textDecoration: 'none',
              borderBottom: isActive ? '2px solid var(--accent-blue)' : '2px solid transparent',
              fontWeight: isActive ? '600' : 'normal', display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap'
            })}
          >
            {isVendedor ? <PackagePlus size={18} /> : <LayoutDashboard size={18} />}
            Painel Principal
          </NavLink>

          {(user?.role === 'comprador' || user?.role === 'cotador') && (
            <NavLink 
              to="/equipe" 
              style={({ isActive }) => ({
                padding: '1rem 0', color: isActive ? 'white' : 'var(--text-secondary)', textDecoration: 'none',
                borderBottom: isActive ? '2px solid var(--accent-blue)' : '2px solid transparent',
                fontWeight: isActive ? '600' : 'normal', display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap'
              })}
            >
              <Users size={18} color="var(--accent-blue)" /> GESTÃO DE EQUIPE
            </NavLink>
          )}

          {user?.role === 'comprador' && (
            <NavLink 
              to="/economia" 
              style={({ isActive }) => ({
                padding: '1rem 0', color: isActive ? 'white' : 'var(--text-secondary)', textDecoration: 'none',
                borderBottom: isActive ? '2px solid var(--accent-blue)' : '2px solid transparent',
                fontWeight: isActive ? '600' : 'normal', display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap'
              })}
            >
              <TrendingDown size={18} color="var(--status-green)" /> ECONOMIA
            </NavLink>
          )}

          <NavLink 
            to="/notificacoes" 
            style={({ isActive }) => ({
              padding: '1rem 0', color: isActive ? 'white' : 'var(--text-secondary)', textDecoration: 'none',
              borderBottom: isActive ? '2px solid var(--status-green)' : '2px solid transparent',
              fontWeight: isActive ? '600' : 'normal', display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap'
            })}
          >
            <Bell size={18} color={unreadCount > 0 ? "var(--status-green)" : "currentColor"} /> NOTIFICAÇÕES
            <span style={{ 
              background: unreadCount > 0 ? 'var(--status-green)' : 'rgba(255,255,255,0.1)', 
              color: unreadCount > 0 ? '#fff' : 'var(--text-secondary)', 
              borderRadius: '12px', padding: '0.1rem 0.5rem', fontSize: '0.75rem', fontWeight: 'bold' 
            }}>
              {unreadCount}
            </span>
          </NavLink>

          <NavLink 
            to="/produtos" 
            style={({ isActive }) => ({
              padding: '1rem 0', color: isActive ? 'white' : 'var(--text-secondary)', textDecoration: 'none',
              borderBottom: isActive ? '2px solid var(--accent-blue)' : '2px solid transparent',
              fontWeight: isActive ? '600' : 'normal', display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap'
            })}
          >
            <List size={18} /> Catálogo
          </NavLink>
          <NavLink 
            to="/historico" 
            style={({ isActive }) => ({
              padding: '1rem 0', color: isActive ? 'white' : 'var(--text-secondary)', textDecoration: 'none',
              borderBottom: isActive ? '2px solid var(--accent-blue)' : '2px solid transparent',
              fontWeight: isActive ? '600' : 'normal', display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap'
            })}
          >
            <History size={18} /> Histórico
          </NavLink>
        </div>

        {/* Main Content */}
        <main style={{ flex: 1, padding: '1.5rem 1rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
          {children}
        </main>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1200, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
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
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Confirmar Nova Senha</label>
                <input 
                  type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>

              <button type="submit" style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--accent-blue)', color: 'var(--text-primary)', fontWeight: 'bold', cursor: 'pointer', marginTop: '0.5rem' }}>
                Salvar Senha
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            background: 'var(--accent-blue)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 90,
            transition: 'all 0.3s ease',
          }}
          title="Voltar ao topo"
        >
          <ArrowUp size={24} />
        </button>
      )}
    </div>
  );
}
