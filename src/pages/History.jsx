import React, { useState } from 'react';
import Layout from '../components/Layout';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Clock, CheckCircle, PackageCheck, Search, ShieldAlert, History as HistoryIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function History() {
  const { records, purchases, revertPurchaseToRecord } = useData();
  const { user } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const norm = (s) => (s || '').toLowerCase().trim();

  const smartSearch = (text, search) => {
    if (!search) return true;
    if (!text) return false;
    if (!search.includes('%')) return text.toLowerCase().includes(search.toLowerCase());
    try {
      const escapeRegExp = (str) => str.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
      const regexPattern = search.toLowerCase().split('%').map(escapeRegExp).join('.*');
      return new RegExp(regexPattern, 'i').test(text);
    } catch {
      return text.toLowerCase().includes(search.toLowerCase().replace(/%/g, ''));
    }
  };

  const historyRecords = records.filter(r => {
    if (!r.chegou) return false;
    return smartSearch(r.produto_nome, searchTerm);
  }).sort((a, b) => new Date(b.data_atualizacao) - new Date(a.data_atualizacao));

  const handleRevertItem = (record) => {
    const isOwnerSeller = norm(record.vendedor_nome) === norm(user?.nome || user?.username);

    if (!isOwnerSeller) {
      alert(`⚠️ Permissão Negada!\n\nApenas o vendedor "${record.vendedor_nome}" (que cadastrou e deu a baixa neste produto) pode devolvê-lo para a lista de faltas.`);
      return;
    }

    if (window.confirm(`Devolver "${record.produto_nome}" de volta para a lista de mercadorias em falta?`)) {
      const res = revertPurchaseToRecord(record.id, user);
      setFeedbackMsg(res.message);
      setTimeout(() => setFeedbackMsg(''), 5000);
    }
  };

  return (
    <Layout>
      <div style={{ display: 'grid', gap: '2rem' }}>
        
        {feedbackMsg && (
          <div className="bg-green-soft" style={{ padding: '1rem', borderRadius: 'var(--radius-sm)', fontWeight: 'bold' }}>
            {feedbackMsg}
          </div>
        )}

        {/* Top Header Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: 'var(--status-green)' }}>
              <PackageCheck size={28} /> Histórico de Reposição de Mercadorias
            </h1>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Registro dos produtos em falta que chegaram e tiveram baixa confirmada nas lojas.
            </p>
          </div>
          
          <input 
            type="text" 
            placeholder="Buscar no histórico..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', width: '280px', maxWidth: '100%' }}
          />
        </div>

        {/* Repositions History List */}
        <div style={{ display: 'grid', gap: '1rem' }}>
          {historyRecords.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Nenhum histórico de reposição encontrado.
            </div>
          ) : (
            historyRecords.map(record => {
              const isOwnerSeller = norm(record.vendedor_nome) === norm(user?.nome || user?.username);

              return (
                <div key={record.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid var(--status-green)' }}>
                  
                  <div style={{ flex: '1 1 200px' }}>
                    <div style={{ fontWeight: '600', fontSize: '1.1rem', marginBottom: '0.25rem' }}>{record.produto_nome}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Clock size={14} /> 
                      Chegou em {record.data_atualizacao ? (() => { try { const parsed = parseISO(record.data_atualizacao); return isNaN(parsed.getTime()) ? 'recente' : format(parsed, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }); } catch { return 'recente'; } })() : 'recente'}
                    </div>
                  </div>

                  <div style={{ flex: '1 1 150px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Solicitado por</div>
                    <div style={{ fontWeight: 'bold' }}>{record.vendedor_nome}</div>
                  </div>

                  {user?.role === 'comprador' && (() => {
                    const purchase = purchases.find(p => p.record_id === record.id);
                    if (purchase) {
                      return (
                        <div style={{ flex: '1 1 200px', background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                            <span>Fornecedor:</span> <strong>{purchase.fornecedor}</strong>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                            <span>Qtd x Valor:</span> <span>{purchase.quantidade} un x R$ {(Number(purchase.valor_unitario) || 0).toFixed(2)}</span>
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', fontWeight: 'bold' }}>
                            <span>Total Pago:</span> <span>R$ {(Number(purchase.valor_total) || 0).toFixed(2)}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ color: 'var(--status-green)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                      <CheckCircle size={20} /> Reposto
                    </div>

                    <button
                      onClick={() => handleRevertItem(record)}
                      title={isOwnerSeller ? 'Devolver este produto de volta para a lista de faltas' : `Apenas o vendedor "${record.vendedor_nome}" pode devolver esta falta`}
                      style={{
                        background: isOwnerSeller ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.04)',
                        color: isOwnerSeller ? 'var(--status-red)' : 'var(--text-secondary)',
                        border: isOwnerSeller ? '1px solid rgba(239,68,68,0.3)' : '1px solid var(--border-color)',
                        padding: '0.5rem 0.85rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        cursor: isOwnerSeller ? 'pointer' : 'not-allowed',
                        opacity: isOwnerSeller ? 1 : 0.4,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem'
                      }}
                    >
                      {isOwnerSeller ? '↩️ Devolver p/ Faltas' : '🔒 Devolução Restrita'}
                    </button>
                  </div>

                </div>
              );
            })
          )}
        </div>

      </div>
    </Layout>
  );
}
