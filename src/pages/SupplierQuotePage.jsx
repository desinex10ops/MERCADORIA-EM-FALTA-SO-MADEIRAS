import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Hexagon, CheckCircle2, Send, ShoppingBag, Truck, Calendar, Loader2 } from 'lucide-react';

export default function SupplierQuotePage() {
  const [searchParams] = useSearchParams();
  const { records, submitSupplierQuote, loading } = useData();

  const storeName = searchParams.get('store') || 'SÓ MADEIRAS';
  const itemIds = searchParams.get('items') ? searchParams.get('items').split(',') : [];
  const quoteLinkId = searchParams.get('id') || 'quote_' + Date.now();

  const [supplierName, setSupplierName] = useState('');
  const [representativeName, setRepresentativeName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [prices, setPrices] = useState({});
  const [packModes, setPackModes] = useState({}); // { [id]: 'unit' | 'pack' }
  const [packSizes, setPackSizes] = useState({}); // { [id]: 12 }
  const [packPrices, setPackPrices] = useState({}); // { [id]: 36.00 }
  const [unavailable, setUnavailable] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Find requested records based on itemIds query param or fallback active missing records
  const requestedItems = useMemo(() => {
    if (itemIds.length > 0) {
      return records.filter(r => itemIds.includes(r.id));
    }
    return records.filter(r => !r.chegou && r.status_compra !== 'Comprou').slice(0, 10);
  }, [records, itemIds]);

  const handlePriceChange = (id, val) => {
    setPrices(prev => ({ ...prev, [id]: val }));
  };

  const handlePackSizeChange = (id, sizeVal) => {
    setPackSizes(prev => ({ ...prev, [id]: sizeVal }));
  };

  const handlePackPriceChange = (id, packPriceVal) => {
    setPackPrices(prev => ({ ...prev, [id]: packPriceVal }));
  };

  const handleTogglePackMode = (id, mode) => {
    setPackModes(prev => ({ ...prev, [id]: mode }));
  };

  const handleToggleUnavailable = (id) => {
    setUnavailable(prev => {
      const nextState = !prev[id];
      if (nextState) {
        setPrices(p => ({ ...p, [id]: '' }));
      }
      return { ...prev, [id]: nextState };
    });
  };

  const handleSubmitQuote = (e) => {
    e.preventDefault();
    if (!supplierName.trim()) {
      alert('Por favor, informe o nome da sua empresa/distribuidora.');
      return;
    }

    setIsSubmitting(true);

    const itemsSummary = requestedItems.map(item => {
      const suggestedQty = item.quantidade_ideal ? Math.max(item.quantidade_ideal - item.quantidade_atual, 1) : 10;
      const isItemUnavailable = !!unavailable[item.id];
      const mode = packModes[item.id] || 'unit';

      let finalUnitPrice = null;
      let packInfo = null;

      if (!isItemUnavailable) {
        if (mode === 'pack') {
          const size = Number(packSizes[item.id]) || 1;
          const pPrice = Number(packPrices[item.id]) || 0;
          if (size > 0 && pPrice > 0) {
            finalUnitPrice = pPrice / size;
            packInfo = `Pacote c/ ${size} un (R$ ${pPrice.toFixed(2)}/pct)`;
          }
        } else {
          finalUnitPrice = prices[item.id] ? Number(prices[item.id]) : null;
        }
      }

      return {
        id: item.id,
        produto_nome: item.produto_nome,
        setor: item.setor || 'Geral',
        quantidade: suggestedQty,
        price: finalUnitPrice ? Math.round(finalUnitPrice * 100) / 100 : null,
        packInfo: packInfo,
        indisponivel: isItemUnavailable
      };
    });

    const totalValue = itemsSummary.reduce((acc, curr) => acc + ((curr.price || 0) * curr.quantidade), 0);

    const quoteData = {
      storeName,
      quoteLinkId,
      supplierName: supplierName.trim().toUpperCase(),
      representativeName: representativeName.trim() || 'Representante de Vendas',
      supplierPhone: supplierPhone.trim(),
      deliveryDate: deliveryDate || null,
      items: itemsSummary,
      totalValue,
      timestamp: new Date().toISOString(),
      status: 'Pendente'
    };

    submitSupplierQuote(quoteData);
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary, #0f172a)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
        <div className="glass-panel" style={{ maxWidth: '440px', width: '100%', padding: '2.5rem', textAlign: 'center', borderRadius: 'var(--radius-md, 12px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ width: '48px', height: '48px', border: '4px solid rgba(59,130,246,0.2)', borderTop: '4px solid var(--accent-blue)', borderRadius: '50%' }} className="spinner" />
          <div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', marginBottom: '0.4rem' }}>
              Carregando Cotação...
            </h3>
            <p style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: '0.85rem', lineHeight: 1.5 }}>
              Buscando a lista de produtos solicitados pela loja <strong>{storeName}</strong>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary, #0f172a)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
        <div className="glass-panel" style={{ maxWidth: '480px', width: '100%', padding: '2.5rem', textAlign: 'center', borderRadius: 'var(--radius-md, 12px)', border: '1px solid var(--status-green, #10b981)' }}>
          <CheckCircle2 size={54} color="var(--status-green, #34d399)" style={{ margin: '0 auto 1rem auto' }} />
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>
            Cotação Enviada com Sucesso!
          </h2>
          <p style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            Obrigado, <strong>{supplierName}</strong>! Sua proposta de preços foi transmitida diretamente para o setor de compras de <strong>{storeName}</strong>.
          </p>
          <div style={{ padding: '0.75rem', background: 'rgba(16,185,129,0.15)', color: 'var(--status-green, #34d399)', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600' }}>
            ✓ O comprador analisará os valores e separará o pedido pelo mais em conta!
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary, #0f172a)', color: 'var(--text-primary, #f8fafc)', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--accent-blue, #2563eb)', padding: '0.35rem 0.85rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            <Hexagon size={16} /> PORTAL DE COTAÇÃO PARA REPRESENTANTES & FORNECEDORES
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>
            Solicitação de Cotação — {storeName}
          </h1>
          <p style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: '0.9rem' }}>
            Preencha seus valores unitários ou marque "Não tenho o produto" caso esteja em falta no seu estoque.
          </p>
        </div>

        <form onSubmit={handleSubmitQuote} className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-md, 12px)' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #94a3b8)', display: 'block', marginBottom: '0.3rem' }}>Nome da Empresa / Distribuidora *</label>
              <input 
                type="text" 
                placeholder="EX: ATACADÃO MADEIRAS" 
                value={supplierName}
                onChange={e => setSupplierName(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm, 6px)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: '#fff' }}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #94a3b8)', display: 'block', marginBottom: '0.3rem' }}>Nome do Representante de Vendas</label>
              <input 
                type="text" 
                placeholder="EX: João Silva" 
                value={representativeName}
                onChange={e => setRepresentativeName(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm, 6px)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: '#fff' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #94a3b8)', display: 'block', marginBottom: '0.3rem' }}>Telefone / WhatsApp *</label>
              <input 
                type="text" 
                placeholder="(79) 99811-2233" 
                value={supplierPhone}
                onChange={e => setSupplierPhone(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm, 6px)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: '#fff' }}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #94a3b8)', display: 'block', marginBottom: '0.3rem' }}>Previsão de Entrega no Estoque</label>
              <input 
                type="date" 
                value={deliveryDate}
                onChange={e => setDeliveryDate(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm, 6px)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: '#fff' }}
              />
            </div>
          </div>

          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <ShoppingBag size={18} color="var(--accent-blue)" /> Produtos Solicitados pela Loja ({requestedItems.length})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
            {requestedItems.length === 0 ? (
              <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center' }}>
                Nenhum produto pendente encontrado para esta cotação.
              </div>
            ) : (
              requestedItems.map(item => {
                const suggestedQty = item.quantidade_ideal ? Math.max(item.quantidade_ideal - item.quantidade_atual, 1) : 10;
                const isNoStock = !!unavailable[item.id];
                const mode = packModes[item.id] || 'unit';
                const pSize = Number(packSizes[item.id]) || '';
                const pPrice = Number(packPrices[item.id]) || '';
                const calcUnit = (pSize && pPrice) ? (pPrice / pSize).toFixed(2) : null;

                return (
                  <div key={item.id} style={{ background: isNoStock ? 'rgba(239,68,68,0.05)' : 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', border: isNoStock ? '1px solid rgba(239,68,68,0.3)' : '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <strong style={{ fontSize: '1rem', color: isNoStock ? 'var(--text-secondary)' : '#fff', textDecoration: isNoStock ? 'line-through' : 'none' }}>
                          {item.produto_nome}
                        </strong>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          Setor: {item.setor || 'Geral'} • Qtd desejada: <span style={{ color: 'var(--accent-blue)', fontWeight: 700 }}>{suggestedQty} un</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {!isNoStock && (
                          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', padding: '2px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                            <button
                              type="button"
                              onClick={() => handleTogglePackMode(item.id, 'unit')}
                              style={{ padding: '0.3rem 0.6rem', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold', background: mode === 'unit' ? 'var(--accent-blue)' : 'transparent', color: mode === 'unit' ? '#fff' : 'var(--text-secondary)' }}
                            >
                              Individual
                            </button>
                            <button
                              type="button"
                              onClick={() => handleTogglePackMode(item.id, 'pack')}
                              style={{ padding: '0.3rem 0.6rem', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold', background: mode === 'pack' ? 'var(--accent-blue)' : 'transparent', color: mode === 'pack' ? '#fff' : 'var(--text-secondary)' }}
                            >
                              Pacote / Caixa
                            </button>
                          </div>
                        )}

                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--status-red)', cursor: 'pointer', userSelect: 'none', background: 'rgba(239,68,68,0.1)', padding: '0.35rem 0.6rem', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.2)' }}>
                          <input 
                            type="checkbox"
                            checked={isNoStock}
                            onChange={() => handleToggleUnavailable(item.id)}
                            style={{ cursor: 'pointer', accentColor: 'var(--status-red)' }}
                          />
                          Não tenho o produto
                        </label>
                      </div>
                    </div>

                    {!isNoStock && (
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        {mode === 'unit' ? (
                          <div style={{ flex: '1 1 200px' }}>
                            <label style={{ fontSize: '0.75rem', color: 'var(--status-green)', display: 'block', fontWeight: 700, marginBottom: '0.2rem' }}>Preço Unitário Individual (R$) *</label>
                            <input 
                              type="number" 
                              step="0.01" 
                              placeholder="0.00" 
                              value={prices[item.id] || ''}
                              onChange={e => handlePriceChange(item.id, e.target.value)}
                              style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm, 6px)', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#fff', fontWeight: 'bold' }}
                              required
                            />
                          </div>
                        ) : (
                          <>
                            <div style={{ flex: '1 1 130px' }}>
                              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 700, marginBottom: '0.2rem' }}>Qtd no Pacote/Caixa</label>
                              <input 
                                type="number" 
                                placeholder="Ex: 12" 
                                value={packSizes[item.id] || ''}
                                onChange={e => handlePackSizeChange(item.id, e.target.value)}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm, 6px)', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#fff', fontWeight: 'bold' }}
                                required
                              />
                            </div>

                            <div style={{ flex: '1 1 150px' }}>
                              <label style={{ fontSize: '0.75rem', color: 'var(--status-green)', display: 'block', fontWeight: 700, marginBottom: '0.2rem' }}>Preço Total do Pacote (R$)</label>
                              <input 
                                type="number" 
                                step="0.01" 
                                placeholder="Ex: 36.00" 
                                value={packPrices[item.id] || ''}
                                onChange={e => handlePackPriceChange(item.id, e.target.value)}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm, 6px)', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#fff', fontWeight: 'bold' }}
                                required
                              />
                            </div>

                            {calcUnit && (
                              <div style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid var(--status-green)', padding: '0.5rem 0.75rem', borderRadius: '6px', color: 'var(--status-green)', fontSize: '0.8rem', fontWeight: 'bold', alignSelf: 'flex-end', marginBottom: '2px' }}>
                                = R$ {calcUnit} / unidade
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}

                  </div>
                );
              })
            )}
          </div>

          <button 
            type="submit" 
            disabled={requestedItems.length === 0}
            style={{ width: '100%', justifyContent: 'center', padding: '0.85rem', fontSize: '1rem', background: 'var(--accent-blue)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm, 6px)', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: requestedItems.length === 0 ? 0.5 : 1 }}
          >
            <Send size={18} /> Enviar Minha Proposta de Preços
          </button>
        </form>

      </div>
    </div>
  );
}
