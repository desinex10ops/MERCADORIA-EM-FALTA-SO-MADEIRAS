import React, { useState } from 'react';
import Layout from '../components/Layout';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Bell, Sparkles, Clock, CheckCircle2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function NotificationsPage() {
  const { records } = useData();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  // Filter arrived merchandise notifications for user's store or all for admin
  const isVendedorFilial = user?.role === 'vendedor' && user?.loja === 'Ki Madeiras';
  const isVendedorMatriz = user?.role === 'vendedor' && (user?.loja === 'Só Madeiras' || !user?.loja);

  const arrivedNotifications = records.filter(r => {
    if (!r.chegou) return false;

    // Filter by store context
    if (isVendedorFilial) {
      if (r.loja !== 'Ki Madeiras' && !r.vendedor_nome?.includes('Ki Madeiras')) return false;
    } else if (isVendedorMatriz) {
      if (r.loja === 'Ki Madeiras' && !r.vendedor_nome?.includes('Ki Madeiras')) return false;
    }

    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (r.produto_nome || '').toLowerCase().includes(term) ||
           (r.vendedor_nome || '').toLowerCase().includes(term) ||
           (r.setor || '').toLowerCase().includes(term);
  }).sort((a, b) => new Date(b.data_atualizacao || b.data_criacao) - new Date(a.data_atualizacao || a.data_criacao));

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

          <input 
            type="text" 
            placeholder="Buscar notificação..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ background: 'rgba(0,0,0,0.2)', color: '#fff', border: '1px solid var(--border-color)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', width: '280px', maxWidth: '100%' }}
          />
        </div>

        {/* Arrived Notifications List (Informativo Puro - Sem Ação de Baixa) */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={20} color="var(--status-green)" /> Notificações de Produtos que Chegaram na Loja ({arrivedNotifications.length})
          </h3>

          {arrivedNotifications.length === 0 ? (
            <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Bell size={40} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
              <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#fff' }}>Nenhuma nova notificação no momento</div>
              <div style={{ fontSize: '0.85rem', marginTop: '0.3rem' }}>
                Quando os produtos em falta tiverem a compra concluída e chegarem na loja, os alertas aparecerão exclusivamente aqui.
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1.25rem' }}>
              {arrivedNotifications.map(record => {
                const dateStr = record.data_atualizacao ? format(parseISO(record.data_atualizacao), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'Recentemente';

                return (
                  <div key={record.id} style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(0,0,0,0.3) 100%)', padding: '1.25rem 1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--status-green)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
                    
                    <div style={{ flex: '1 1 280px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                        <strong style={{ color: '#fff', fontSize: '1.15rem' }}>{record.produto_nome}</strong>
                        <span style={{ fontSize: '0.7rem', background: 'var(--status-green)', color: '#fff', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 800 }}>
                          ✓ CHEGOU NA LOJA!
                        </span>
                        {record.cliente_esperando && (
                          <span style={{ fontSize: '0.65rem', background: 'var(--status-red)', color: '#fff', padding: '0.2rem 0.5rem', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 800 }}>
                            🚨 Cliente Esperando
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                        <span>🏢 Loja: <strong style={{ color: '#fff' }}>{record.loja || 'Só Madeiras'}</strong></span>
                        <span>👤 Solicitante: <strong style={{ color: 'var(--accent-blue)' }}>{record.vendedor_nome}</strong></span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Clock size={14} /> Chegou em {dateStr}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--status-green)', fontWeight: 700, fontSize: '0.9rem', background: 'rgba(16,185,129,0.1)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--status-green)' }}>
                      <CheckCircle2 size={18} /> Disponível no Estoque
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
