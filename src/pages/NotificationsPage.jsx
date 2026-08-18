import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Bell, Sparkles, Clock, CheckCircle2, Eye, EyeOff, CheckCheck } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function NotificationsPage() {
  const { records, readNotificationIds, markAllNotificationsAsRead, toggleNotificationRead } = useData();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const arrivedNotifications = records.filter(r => {
    if (!r.chegou) return false;

    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (r.produto_nome || '').toLowerCase().includes(term) ||
           (r.vendedor_nome || '').toLowerCase().includes(term) ||
           (r.setor || '').toLowerCase().includes(term);
  }).sort((a, b) => new Date(b.data_atualizacao || b.data_criacao) - new Date(a.data_atualizacao || a.data_criacao));

  // Automatically mark all notifications as read upon opening page
  useEffect(() => {
    if (arrivedNotifications.length > 0) {
      const ids = arrivedNotifications.map(r => r.id);
      markAllNotificationsAsRead(ids);
    }
  }, [records]);

  const handleMarkAllRead = () => {
    const ids = arrivedNotifications.map(r => r.id);
    markAllNotificationsAsRead(ids);
  };

  return (
    <Layout>
      <div style={{ display: 'grid', gap: '2rem' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: 'var(--status-green)' }}>
              <Bell size={28} /> Central de Notificações de Chegada
            </h1>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Avisos informativos de mercadorias em falta que chegaram e estão disponíveis na loja.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <input 
              type="text" 
              placeholder="Buscar notificação..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ background: 'rgba(0,0,0,0.2)', color: '#fff', border: '1px solid var(--border-color)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', width: '240px', maxWidth: '100%' }}
            />

            {arrivedNotifications.length > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--status-green)', border: '1px solid var(--status-green)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
              >
                <CheckCheck size={16} /> Marcar Todas como Lidas
              </button>
            )}
          </div>
        </div>

        {/* Arrived Notifications List */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={20} color="var(--status-green)" /> Notificações de Produtos que Chegaram na Loja ({arrivedNotifications.length})
          </h3>

          {arrivedNotifications.length === 0 ? (
            <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Bell size={40} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
              <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#fff' }}>Nenhuma notificação no momento</div>
              <div style={{ fontSize: '0.85rem', marginTop: '0.3rem' }}>
                Quando os produtos em falta tiverem a compra concluída e chegarem na loja, os alertas aparecerão exclusivamente aqui.
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1.25rem' }}>
              {arrivedNotifications.map(record => {
                const dateStr = record.data_atualizacao ? (() => { try { const parsed = parseISO(record.data_atualizacao); return isNaN(parsed.getTime()) ? 'Recentemente' : format(parsed, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }); } catch { return 'Recentemente'; } })() : 'Recentemente';
                const isRead = (readNotificationIds || []).includes(record.id);

                return (
                  <div 
                    key={record.id} 
                    style={{ 
                      background: isRead 
                        ? 'rgba(30,41,59,0.5)' 
                        : 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(30,41,59,0.8) 100%)', 
                      padding: '1.25rem 1.5rem', 
                      borderRadius: 'var(--radius-md)', 
                      border: isRead ? '1px solid var(--border-color)' : '2px solid var(--status-green)', 
                      display: 'flex', 
                      justify: 'space-between', 
                      alignItems: 'center', 
                      flexWrap: 'wrap', 
                      gap: '1.25rem',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ flex: '1 1 280px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                        <strong style={{ color: '#fff', fontSize: '1.15rem' }}>{record.produto_nome}</strong>
                        
                        {/* Tag de Estado Lida / Não Lida */}
                        {!isRead ? (
                          <span style={{ fontSize: '0.7rem', background: 'var(--status-green)', color: '#fff', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                            🟢 NÃO LIDA (Nova!)
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.1)', color: 'var(--text-secondary)', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                            ⚪ LIDA
                          </span>
                        )}

                        <span style={{ fontSize: '0.7rem', background: 'rgba(16,185,129,0.2)', color: 'var(--status-green)', border: '1px solid var(--status-green)', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 800 }}>
                          ✓ CHEGOU NA LOJA!
                        </span>

                        {record.cliente_esperando && (
                          <span style={{ fontSize: '0.65rem', background: 'var(--status-red)', color: '#fff', padding: '0.2rem 0.5rem', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 800 }}>
                            🚨 Cliente Esperando
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                        <span>👤 Solicitante: <strong style={{ color: 'var(--accent-blue)' }}>{record.vendedor_nome}</strong></span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Clock size={14} /> Chegou em {dateStr}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--status-green)', fontWeight: 700, fontSize: '0.85rem', background: 'rgba(16,185,129,0.1)', padding: '0.5rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--status-green)' }}>
                        <CheckCircle2 size={16} /> Disponível no Estoque
                      </div>

                      <button
                        onClick={() => toggleNotificationRead(record.id)}
                        title={isRead ? 'Marcar como NÃO LIDA' : 'Marcar como LIDA'}
                        style={{
                          background: isRead ? 'rgba(255,255,255,0.05)' : 'rgba(59,130,246,0.15)',
                          color: isRead ? 'var(--text-secondary)' : 'var(--accent-blue)',
                          border: isRead ? '1px solid var(--border-color)' : '1px solid var(--accent-blue)',
                          padding: '0.5rem 0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          fontSize: '0.75rem',
                          fontWeight: 700
                        }}
                      >
                        {isRead ? <EyeOff size={14} /> : <Eye size={14} />}
                        {isRead ? 'Marcar não lida' : 'Marcar lida'}
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </Layout>
  );
}
