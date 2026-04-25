import React, { useState } from 'react';
import Layout from '../components/Layout';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { History as HistoryIcon, CheckCircle, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function History() {
  const { records, purchases } = useData();
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');

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

  // History is defined as everything that "chegou"
  // Todos veem todo o histórico agora, conforme solicitado.
  const historyRecords = records.filter(r => {
    if (!r.chegou) return false;
    return smartSearch(r.produto_nome, searchTerm);
  }).sort((a, b) => new Date(b.data_atualizacao) - new Date(a.data_atualizacao));

  return (
    <Layout>
      <div style={{ display: 'grid', gap: '2rem' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
              <HistoryIcon size={24} color="var(--status-green)" />
            </div>
            <div>
              <h3>Histórico de Reposições</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Produtos que já foram comprados e chegaram na loja.</p>
            </div>
          </div>
          
          <input 
            type="text" 
            placeholder="Buscar itens no histórico..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid var(--border-color)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', width: '300px', maxWidth: '100%' }}
          />
        </div>

        <div style={{ display: 'grid', gap: '1rem' }}>
          {historyRecords.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Nenhum histórico encontrado.
            </div>
          ) : (
            historyRecords.map(record => (
              <div key={record.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid var(--status-green)' }}>
                
                <div style={{ flex: '1 1 200px' }}>
                  <div style={{ fontWeight: '600', fontSize: '1.1rem', marginBottom: '0.25rem' }}>{record.produto_nome}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Clock size={14} /> 
                    Chegou em {format(parseISO(record.data_atualizacao), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </div>
                </div>

                <div style={{ flex: '1 1 150px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Solicitado por</div>
                  <div style={{ fontWeight: 'bold' }}>{record.vendedor_nome}</div>
                </div>

                {user.role === 'comprador' && (() => {
                  const purchase = purchases.find(p => p.record_id === record.id);
                  if (purchase) {
                    return (
                      <div style={{ flex: '1 1 200px', background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                          <span>Fornecedor:</span> <strong>{purchase.fornecedor}</strong>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                          <span>Qtd x Valor:</span> <span>{purchase.quantidade} un x R$ {purchase.valor_unitario.toFixed(2)}</span>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'white', display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', fontWeight: 'bold' }}>
                          <span>Total Pago:</span> <span>R$ {purchase.valor_total.toFixed(2)}</span>
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
                </div>

              </div>
            ))
          )}
        </div>

      </div>
    </Layout>
  );
}
