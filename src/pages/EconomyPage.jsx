import React, { useState } from 'react';
import Layout from '../components/Layout';
import { useData } from '../context/DataContext';
import { TrendingDown, Sparkles, ShoppingBag, Award, Calendar, Search, CheckCircle2, ArrowRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function EconomyPage() {
  const { economyHistory, supplierQuotes, purchases } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'inteligente' | 'pedido'

  // Calculate totals
  const totalEconomia = (economyHistory || []).reduce((acc, curr) => acc + Number(curr.economiaTotal || curr.economia_bruta || 0), 0);
  const inteligenteEconomia = (economyHistory || [])
    .filter(e => (e.tipo || e.origem) === 'Inteligente' || (e.tipo || e.origem) === 'Lote')
    .reduce((acc, curr) => acc + Number(curr.economiaTotal || curr.economia_bruta || 0), 0);

  const filteredHistory = (economyHistory || []).filter(item => {
    const matchSearch = (item.produto_nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (item.fornecedor || item.fornecedor_vencedor || '').toLowerCase().includes(searchTerm.toLowerCase());
    if (filterType === 'all') return matchSearch;
    if (filterType === 'inteligente') return matchSearch && ((item.tipo || item.origem) === 'Inteligente');
    return matchSearch;
  });

  return (
    <Layout>
      <div style={{ display: 'grid', gap: '2rem' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: 'var(--status-green)' }}>
              <TrendingDown size={28} /> Painel & Histórico de Economia
            </h1>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Acompanhe os valores salvos em reais através do comparador inteligente e da aprovação dos menores preços.
            </p>
          </div>

          <input 
            type="text" 
            placeholder="Buscar por produto ou fornecedor..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ background: 'rgba(0,0,0,0.2)', color: '#fff', border: '1px solid var(--border-color)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', width: '280px', maxWidth: '100%' }}
          />
        </div>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
          
          {/* Total Acumulado */}
          <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '6px solid var(--status-green)', background: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(30,41,59,0.7) 100%)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '0.75rem' }}>
              <div style={{ background: 'var(--status-green)', padding: '0.6rem', borderRadius: '10px', color: '#fff' }}>
                <Award size={24} />
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--status-green)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Economia Total Acumulada
              </span>
            </div>
            <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#fff' }}>
              R$ {totalEconomia.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
              Total economizado desde o início do sistema
            </div>
          </div>

          {/* Geração Inteligente */}
          <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '6px solid var(--accent-blue)', background: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(30,41,59,0.7) 100%)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '0.75rem' }}>
              <div style={{ background: 'var(--accent-blue)', padding: '0.6rem', borderRadius: '10px', color: '#fff' }}>
                <Sparkles size={24} />
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-blue)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Por Pedidos Inteligentes
              </span>
            </div>
            <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#fff' }}>
              R$ {(inteligenteEconomia || totalEconomia).toFixed(2)}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
              Economizado pela combinação de menores preços
            </div>
          </div>

          {/* Total de Pedidos Otimizados */}
          <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '6px solid var(--status-yellow)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '0.75rem' }}>
              <div style={{ background: 'var(--status-yellow)', padding: '0.6rem', borderRadius: '10px', color: '#fff' }}>
                <ShoppingBag size={24} />
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--status-yellow)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Pedidos Otimizados
              </span>
            </div>
            <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#fff' }}>
              {(economyHistory || []).length}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
              Lançamentos de compra otimizados no sistema
            </div>
          </div>

        </div>

        {/* Filter Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setFilterType('all')}
            style={{ padding: '0.6rem 1.2rem', borderRadius: 'var(--radius-sm)', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem', background: filterType === 'all' ? 'var(--accent-blue)' : 'rgba(255,255,255,0.05)', color: filterType === 'all' ? '#fff' : 'var(--text-secondary)' }}
          >
            Todos os Registros ({(economyHistory || []).length})
          </button>
          <button
            onClick={() => setFilterType('inteligente')}
            style={{ padding: '0.6rem 1.2rem', borderRadius: 'var(--radius-sm)', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem', background: filterType === 'inteligente' ? 'var(--accent-blue)' : 'rgba(255,255,255,0.05)', color: filterType === 'inteligente' ? '#fff' : 'var(--text-secondary)' }}
          >
            ⚡ Pedidos Inteligentes
          </button>
        </div>

        {/* History List */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', color: '#fff', fontSize: '1.1rem' }}>
            Detalhamento de Economia por Pedido
          </h3>

          {filteredHistory.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Nenhum registro de economia encontrado com os filtros aplicados.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {filteredHistory.map((item, idx) => {
                const pNome = item.produto_nome || item.produto || 'Produto';
                const fNome = item.fornecedor || item.fornecedor_vencedor || 'Fornecedor';
                const pPago = Number(item.valorMenor || item.preco_pago || 0);
                const pMaior = Number(item.valorMaior || item.preco_maior || 0);
                const qtd = Number(item.quantidade || 1);
                const econ = Number(item.economiaTotal || item.economia_bruta || 0);
                const dateStr = item.timestamp ? format(parseISO(item.timestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'Recentemente';

                return (
                  <div key={item.id || idx} style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    
                    <div style={{ flex: '1 1 220px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                        <strong style={{ color: '#fff', fontSize: '1rem' }}>{pNome}</strong>
                        <span style={{ fontSize: '0.7rem', background: 'rgba(16,185,129,0.2)', color: 'var(--status-green)', border: '1px solid var(--status-green)', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 'bold' }}>
                          ⚡ Pedido Inteligente
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Fornecedor Vencedor: <strong style={{ color: 'var(--accent-blue)' }}>{fNome}</strong> • {qtd} un • {dateStr}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                      
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Preço Pago vs Maior Orçado</div>
                        <div style={{ fontSize: '0.85rem', color: '#fff' }}>
                          <span style={{ color: 'var(--status-green)', fontWeight: 'bold' }}>R$ {pPago.toFixed(2)}</span>
                          {pMaior > pPago && (
                            <span style={{ color: 'var(--status-red)', textDecoration: 'line-through', marginLeft: '0.4rem', fontSize: '0.8rem' }}>
                              R$ {pMaior.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid var(--status-green)', padding: '0.5rem 1rem', borderRadius: '8px', textAlign: 'right' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--status-green)', fontWeight: 'bold', textTransform: 'uppercase' }}>Economizado</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--status-green)' }}>
                          + R$ {econ.toFixed(2)}
                        </div>
                      </div>

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
