import React, { useState } from 'react';
import Layout from '../components/Layout';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, PackageSearch, Activity, CheckCircle, Truck, Clock, Trophy, X, Users, UserPlus, Trash2, History, Send, Share2, DollarSign, CheckCheck, Sparkles, Building2, Copy, TrendingDown } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function BuyerDashboard() {
  const { records, purchases, suppliers, supplierQuotes, filialPurchases, approveCheapestQuotes, economyHistory, updateRecordStatus, markAsArrived, getProductPriceStats, getProductPriceHistory, addPurchase, addRecord, addMultipleSupplierQuotes, clearSupplierQuotes } = useData();
  const { user, users, registerUser, deleteUser } = useAuth();
  
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [filterUrgency, setFilterUrgency] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [mainTab, setMainTab] = useState('replenishment'); // 'replenishment' | 'quotes'

  // Quote Generation State
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [generatedQuoteUrl, setGeneratedQuoteUrl] = useState('');
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteSuccessMsg, setQuoteSuccessMsg] = useState('');

  // Purchase Modal State
  const [purchasingRecord, setPurchasingRecord] = useState(null);
  const [fornecedor, setFornecedor] = useState('');
  const [valorUnitario, setValorUnitario] = useState('');
  const [quantidadeComprada, setQuantidadeComprada] = useState('');
  const [viewingImage, setViewingImage] = useState(null);
  const [priceHistoryProduct, setPriceHistoryProduct] = useState(null);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [showSupplierSuggestions, setShowSupplierSuggestions] = useState(false);

  // Supplier autocomplete suggestions
  const supplierSuggestions = supplierSearch.length > 0
    ? suppliers.filter(s => s.nome.toLowerCase().includes(supplierSearch.toLowerCase()))
    : [];

  // Seller Admin State
  const [newSellerUsername, setNewSellerUsername] = useState('');
  const [newSellerNome, setNewSellerNome] = useState('');
  const [newSellerSetor, setNewSellerSetor] = useState('');
  const [sellerError, setSellerError] = useState('');
  const [sellerSuccess, setSellerSuccess] = useState('');

  const handleRegisterSeller = (e) => {
    e.preventDefault();
    setSellerError('');
    setSellerSuccess('');
    if (!newSellerUsername || !newSellerNome || !newSellerSetor) return;
    try {
      registerUser(newSellerUsername, newSellerNome, newSellerSetor);
      setSellerSuccess(`Vendedor(a) ${newSellerNome} cadastrado com sucesso!`);
      setNewSellerUsername('');
      setNewSellerNome('');
      setNewSellerSetor('');
      setTimeout(() => setSellerSuccess(''), 3000);
    } catch (err) {
      setSellerError(err.message);
    }
  };

  // Dashboard Stats
  const activeRecords = records.filter(r => !r.chegou);
  const totalFaltas = activeRecords.length;
  const totalUrgentes = activeRecords.filter(r => r.urgencia === 'Alta').length;
  const aCaminho = activeRecords.filter(r => r.status_compra === 'A caminho').length;

  const supplierRanking = (() => {
    if (!purchases || purchases.length === 0) return [];
    
    const stats = {};
    purchases.forEach(p => {
      const f = p.fornecedor.trim().toUpperCase();
      if (!stats[f]) {
        stats[f] = { nome: p.fornecedor, qtd_pedidos: 0, valor_total_gasto: 0 };
      }
      stats[f].qtd_pedidos += 1;
      stats[f].valor_total_gasto += p.valor_total;
    });

    return Object.values(stats)
      .sort((a, b) => b.qtd_pedidos - a.qtd_pedidos || b.valor_total_gasto - a.valor_total_gasto)
      .slice(0, 3);
  })();

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

  // Filtered List
  const filteredRecords = activeRecords
    .filter(r => filterStatus === 'Todos' || r.status_compra === filterStatus)
    .filter(r => filterUrgency === 'Todos' || r.urgencia === filterUrgency)
    .filter(r => smartSearch(r.produto_nome, searchTerm) || smartSearch(r.vendedor_nome, searchTerm))
    .sort((a, b) => {
      // Sort by urgency first
      const val = { 'Alta': 3, 'Média': 2, 'Baixa': 1 };
      if (val[b.urgencia] !== val[a.urgencia]) {
        return val[b.urgencia] - val[a.urgencia];
      }
      // Then by date oldest to newest
      return new Date(a.data_criacao) - new Date(b.data_criacao);
    });

  const StatusButton = ({ record, status, currentStatus, color, icon: Icon }) => (
    <button 
      onClick={() => {
        if (status === 'Comprou' && currentStatus !== 'Comprou') {
          setPurchasingRecord({ ...record, stats: getProductPriceStats(record.produto_nome) });
          setQuantidadeComprada(record.quantidade_ideal - record.quantidade_atual > 0 ? (record.quantidade_ideal - record.quantidade_atual).toString() : '1');
          setFornecedor('');
          setValorUnitario('');
        } else {
          updateRecordStatus(record.id, status);
        }
      }}
      style={{
        background: currentStatus === status ? color : 'transparent',
        border: `1px solid ${color}`,
        color: currentStatus === status ? 'white' : color,
        padding: '0.4rem 0.75rem',
        borderRadius: 'var(--radius-sm)',
        fontSize: '0.75rem',
        fontWeight: '600',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem',
        transition: 'all 0.2s'
      }}
    >
      {Icon && <Icon size={12} />} {status}
    </button>
  );

  const handleCompletePurchase = (e) => {
    e.preventDefault();
    if (!fornecedor || !valorUnitario || !quantidadeComprada) return;
    
    addPurchase(purchasingRecord.id, fornecedor, valorUnitario, quantidadeComprada);
    setPurchasingRecord(null);
  };

  const toggleSelectItem = (id) => {
    setSelectedItemIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedItemIds.length === filteredRecords.length && filteredRecords.length > 0) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(filteredRecords.map(r => r.id));
    }
  };

  const handleGenerateQuoteForSelection = () => {
    const idsToQuote = selectedItemIds.length > 0 ? selectedItemIds : activeRecords.map(r => r.id);
    if (idsToQuote.length === 0) {
      alert('Nenhum item pendente para cotar.');
      return;
    }
    const url = `${window.location.origin}/cotacao-fornecedor?items=${idsToQuote.join(',')}&store=Só Madeiras`;
    setGeneratedQuoteUrl(url);
    setShowQuoteModal(true);
  };

  const handleGenerate5DemoQuotes = () => {
    clearSupplierQuotes();
    setSupplierOverrides({});

    const suppliersDemo = [
      { name: 'ATACADÃO MADEIRAS (JOÃO)', phone: '(79) 99811-2233', delivery: '2026-08-14' },
      { name: 'DISTRIBUIDORA ESTÂNCIA (CARLOS)', phone: '(79) 99122-4455', delivery: '2026-08-15' },
      { name: 'MEGA FORNECIMENTOS (LUCIANA)', phone: '(79) 98877-6655', delivery: '2026-08-13' },
      { name: 'MADEIREIRA RIO REAL (MARCOS)', phone: '(79) 99655-3322', delivery: '2026-08-16' },
      { name: 'GIGA ATACADO DA CONSTRUÇÃO (FERNANDO)', phone: '(79) 98111-9988', delivery: '2026-08-12' }
    ];

    const sampleRecords = [
      { id: 'rec_1', produto_nome: 'Viga de Madeira 6x12 - 3m', setor: 'Madeiras', quantidade_atual: 0, quantidade_ideal: 20 },
      { id: 'rec_2', produto_nome: 'Tábua Pinus 30cm x 3m', setor: 'Madeiras', quantidade_atual: 5, quantidade_ideal: 50 },
      { id: 'rec_3', produto_nome: 'Cimento CP-II 50kg', setor: 'Construção', quantidade_atual: 10, quantidade_ideal: 100 },
      { id: 'rec_4', produto_nome: 'Prego com Cabeça 18x27 (kg)', setor: 'Ferragens', quantidade_atual: 2, quantidade_ideal: 15 },
      { id: 'rec_5', produto_nome: 'Verniz Marítimo 3.6L', setor: 'Tintas', quantidade_atual: 1, quantidade_ideal: 12 }
    ];

    if (activeRecords.length === 0) {
      sampleRecords.forEach(sample => {
        addRecord({
          id: sample.id,
          produto_nome: sample.produto_nome,
          vendedor_nome: 'Admin Comprador',
          setor: sample.setor,
          loja: 'Só Madeiras',
          quantidade_atual: sample.quantidade_atual,
          quantidade_ideal: sample.quantidade_ideal,
          chegou: false,
          status_compra: 'Pendente'
        });
      });
    }

    const targetItems = activeRecords.length > 0 ? activeRecords : sampleRecords;

    const quotesToSubmit = suppliersDemo.map((sup, supIdx) => {
      const quoteItems = targetItems.map((item, itemIdx) => {
        const qty = item.quantidade_ideal ? Math.max(item.quantidade_ideal - item.quantidade_atual, 1) : 10;
        const basePrice = 30 + ((itemIdx * 23 + 11) % 70);
        
        // Exact rotation so each supplier wins distinct products!
        let factor = 1.15;
        if (itemIdx % 5 === supIdx) {
          factor = 0.82; // winning price
        } else if ((itemIdx + 1) % 5 === supIdx) {
          factor = 0.94;
        } else if ((itemIdx + 2) % 5 === supIdx) {
          factor = 1.05;
        }

        const unitPrice = Math.max(5.00, Math.round((basePrice * factor) * 100) / 100);

        return {
          id: item.id,
          produto_nome: item.produto_nome,
          setor: item.setor || 'Geral',
          quantidade: qty,
          price: unitPrice
        };
      });

      const totalVal = quoteItems.reduce((acc, it) => acc + (it.price * it.quantidade), 0);

      return {
        storeName: 'Só Madeiras',
        quoteLinkId: 'quote_demo_5',
        supplierName: sup.name,
        supplierPhone: sup.phone,
        deliveryDate: sup.delivery,
        items: quoteItems,
        totalValue: Math.round(totalVal * 100) / 100,
        timestamp: new Date().toISOString(),
        status: 'Pendente'
      };
    });

    addMultipleSupplierQuotes(quotesToSubmit);
    setQuoteSuccessMsg('5 Orçamentos de teste gerados com sucesso! Cada fornecedor venceu em produtos diferentes.');
    setTimeout(() => setQuoteSuccessMsg(''), 4000);
  };

  const [approvalModalData, setApprovalModalData] = useState(null);
  const [supplierOverrides, setSupplierOverrides] = useState({}); // { [produto_nome]: 'NOME FORNECEDOR' }
  const [reassignModalItem, setReassignModalItem] = useState(null); // { id, produto_nome, currentSupplier }

  const normStr = (s) => (s || '').toLowerCase().trim();

  const getAssignedSupplierForItem = (produtoNome) => {
    if (supplierOverrides[produtoNome]) {
      return supplierOverrides[produtoNome];
    }

    let lowestPrice = Infinity;
    let winningSupplier = null;

    supplierQuotes.forEach(sq => {
      const match = (sq.items || []).find(sqIt => normStr(sqIt.produto_nome) === normStr(produtoNome));
      if (match && match.price && Number(match.price) > 0 && !match.indisponivel) {
        if (Number(match.price) < lowestPrice) {
          lowestPrice = Number(match.price);
          winningSupplier = sq.supplierName;
        }
      }
    });

    return winningSupplier;
  };

  const handleOpenApprovalModalForQuote = (quote) => {
    const winningItems = (quote.items || []).filter(it => {
      if (!it.price || Number(it.price) <= 0 || it.indisponivel) return false;
      const assignedSup = getAssignedSupplierForItem(it.produto_nome);
      return assignedSup === quote.supplierName;
    });

    if (winningItems.length === 0) {
      alert(`O orçamento de ${quote.supplierName} não possui nenhum produto atribuído no momento.`);
      return;
    }

    setApprovalModalData({
      supplierName: quote.supplierName,
      supplierPhone: quote.supplierPhone || '',
      deliveryDate: quote.deliveryDate || '',
      items: winningItems.map(it => ({
        id: it.id,
        produto_nome: it.produto_nome,
        fornecedor: quote.supplierName,
        price: Number(it.price),
        quantity: Number(it.quantidade) || 10,
        packInfo: it.packInfo || null
      }))
    });
  };

  const handleOpenApprovalModalForCheapest = () => {
    if (supplierQuotes.length === 0) return;

    const itemsMap = new Map();
    activeRecords.forEach(r => {
      itemsMap.set(r.produto_nome, {
        id: r.id,
        produto_nome: r.produto_nome,
        quantity: r.quantidade_ideal ? Math.max(r.quantidade_ideal - r.quantidade_atual, 1) : 10
      });
    });

    supplierQuotes.forEach(q => {
      (q.items || []).forEach(it => {
        if (!itemsMap.has(it.produto_nome)) {
          itemsMap.set(it.produto_nome, {
            id: it.id || `quote_item_${it.produto_nome}`,
            produto_nome: it.produto_nome,
            quantity: it.quantidade || 10
          });
        }
      });
    });

    const itemsToBuy = [];
    itemsMap.forEach(item => {
      const assignedSup = getAssignedSupplierForItem(item.produto_nome);
      if (assignedSup) {
        const sq = supplierQuotes.find(q => q.supplierName === assignedSup);
        const match = (sq?.items || []).find(it => normStr(it.produto_nome) === normStr(item.produto_nome));
        if (match && match.price && Number(match.price) > 0 && !match.indisponivel) {
          itemsToBuy.push({
            id: item.id,
            produto_nome: item.produto_nome,
            fornecedor: assignedSup,
            supplierPhone: sq?.supplierPhone || '',
            price: Number(match.price),
            quantity: item.quantity,
            packInfo: match.packInfo || null
          });
        }
      }
    });

    if (itemsToBuy.length === 0) {
      alert('Nenhum produto disponível nos orçamentos para aprovação.');
      return;
    }

    setApprovalModalData({
      supplierName: 'Distribuição Personalizada por Menor Preço',
      supplierPhone: '',
      deliveryDate: '',
      items: itemsToBuy
    });
  };

  const handleUpdateApprovalQty = (itemId, newQty) => {
    const qtyNum = Math.max(1, Number(newQty) || 1);
    setApprovalModalData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        items: prev.items.map(it => it.id === itemId ? { ...it, quantity: qtyNum } : it)
      };
    });
  };

  const handleConfirmApprovalModal = () => {
    if (!approvalModalData || approvalModalData.items.length === 0) return;

    approvalModalData.items.forEach(it => {
      if (it.id) {
        addPurchase(it.id, it.fornecedor, Number(it.price), Number(it.quantity));
      }
    });

    let msg = `Olá! Aprovamos o pedido de compra para a loja *Só Madeiras*!\n\n*Produtos e Quantidades Aprovadas:*\n`;
    let totalAmt = 0;
    approvalModalData.items.forEach((it, i) => {
      const itemSub = Number(it.price) * Number(it.quantity);
      totalAmt += itemSub;
      msg += `${i + 1}. *${it.produto_nome}* — ${it.quantity} un x R$ ${Number(it.price).toFixed(2)} = R$ ${itemSub.toFixed(2)} (${it.fornecedor})\n`;
    });

    msg += `\n*Valor Total do Pedido:* R$ ${totalAmt.toFixed(2)}`;
    if (approvalModalData.deliveryDate) {
      msg += `\n*Previsão de Entrega:* ${approvalModalData.deliveryDate}`;
    }
    msg += `\n\nPor favor, confirme a emissão e envio dos itens. Obrigado!`;

    const phoneClean = String(approvalModalData.supplierPhone || '').replace(/\D/g, '');
    const waUrl = phoneClean 
      ? `https://api.whatsapp.com/send?phone=${phoneClean}&text=${encodeURIComponent(msg)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;

    window.open(waUrl, '_blank');
    setQuoteSuccessMsg(`🎉 Pedido aprovado com sucesso! Quantidades lançadas no sistema e mensagem enviada no WhatsApp.`);
    setApprovalModalData(null);
    setTimeout(() => setQuoteSuccessMsg(''), 6000);
  };

  return (
    <Layout>
      <div style={{ display: 'grid', gap: '2rem' }}>
        
        {/* KPI Dashboard */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
          
          <div className="glass-panel kpi-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
              <PackageSearch size={24} color="white" />
            </div>
            <div>
              <div className="kpi-number" style={{ fontSize: '2rem', fontWeight: 'bold' }}>{totalFaltas}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Total em Falta</div>
            </div>
          </div>

          <div className="glass-panel bg-red-soft kpi-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'var(--status-red)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
              <AlertTriangle size={24} color="white" />
            </div>
            <div>
              <div className="kpi-number" style={{ fontSize: '2rem', fontWeight: 'bold' }}>{totalUrgentes}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Alta Urgência</div>
            </div>
          </div>

          <div className="glass-panel kpi-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'var(--accent-blue)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
              <Truck size={24} color="white" />
            </div>
            <div>
              <div className="kpi-number" style={{ fontSize: '2rem', fontWeight: 'bold' }}>{aCaminho}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>A Caminho</div>
            </div>
          </div>

        </div>

        {/* Ranking de Fornecedores */}
        {supplierRanking.length > 0 && (
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--status-yellow)' }}>
              <Trophy size={20} /> Top 3 Fornecedores (Parceiros)
            </h3>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {supplierRanking.map((forn, index) => (
                <div key={index} style={{ flex: '1 1 200px', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-md)', borderLeft: `4px solid ${index === 0 ? '#facc15' : index === 1 ? '#94a3b8' : '#b45309'}` }}>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{index + 1}º {forn.nome}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                    <strong>{forn.qtd_pedidos}</strong> compras realizadas
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Total Pago: R$ {forn.valor_total_gasto.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Tab Buttons: Replenishment vs Quotes */}
        <div style={{ display: 'flex', gap: '0.75rem', borderBottom: '1px solid var(--border-color)', pb: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setMainTab('replenishment')}
            style={{
              padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem',
              background: mainTab === 'replenishment' ? 'var(--accent-blue)' : 'rgba(255,255,255,0.05)',
              color: mainTab === 'replenishment' ? '#fff' : 'var(--text-secondary)'
            }}
          >
            Fila de Reposição ({totalFaltas})
          </button>
          <button
            onClick={() => setMainTab('quotes')}
            style={{
              padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem',
              background: mainTab === 'quotes' ? 'var(--accent-blue)' : 'rgba(255,255,255,0.05)',
              color: mainTab === 'quotes' ? '#fff' : 'var(--text-secondary)',
              display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}
          >
            Cotações de Representantes & Menor Preço
            {supplierQuotes.length > 0 && (
              <span style={{ background: 'var(--status-green)', color: '#fff', borderRadius: '12px', padding: '0.1rem 0.5rem', fontSize: '0.75rem' }}>
                {supplierQuotes.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setMainTab('filial_purchases')}
            style={{
              padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem',
              background: mainTab === 'filial_purchases' ? 'var(--accent-blue)' : 'rgba(255,255,255,0.05)',
              color: mainTab === 'filial_purchases' ? '#fff' : 'var(--text-secondary)',
              display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}
          >
            🛒 Pedidos Comprados pelo Admin Ki Madeiras
            {(filialPurchases || []).length > 0 && (
              <span style={{ background: 'var(--accent-blue)', color: '#fff', borderRadius: '12px', padding: '0.1rem 0.5rem', fontSize: '0.75rem' }}>
                {(filialPurchases || []).length}
              </span>
            )}
          </button>
        </div>

        {/* Tab 1: Replenishment Queue */}
        {mainTab === 'replenishment' && (
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            
            {/* Quotation Generator Toolbar */}
            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <strong style={{ color: '#fff', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Send size={18} color="var(--accent-blue)" /> Ferramenta de Seleção & Cotação Rápida
                </strong>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {selectedItemIds.length > 0 
                    ? `✓ ${selectedItemIds.length} item(ns) selecionado(s) para cotação.` 
                    : 'Marque os itens nas caixas de seleção ou clique abaixo para cotar todos.'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={toggleSelectAll}
                  style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', padding: '0.6rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  {selectedItemIds.length === filteredRecords.length && filteredRecords.length > 0 ? 'Desmarcar Todos' : 'Selecionar Todos'}
                </button>

                <button
                  onClick={handleGenerateQuoteForSelection}
                  style={{ background: 'var(--accent-blue)', color: '#fff', padding: '0.6rem 1.2rem', borderRadius: 'var(--radius-sm)', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
                >
                  <Share2 size={16} /> Enviar Para Cotação ({selectedItemIds.length > 0 ? selectedItemIds.length : 'Todos'})
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={20} /> Fila de Reposição
              </h3>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', flex: '1' }}>
                <input 
                  type="text" 
                  placeholder="Buscar produto ou vendedor..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', flex: '1 1 200px', maxWidth: '100%' }}
                />

                <select 
                  value={filterStatus} 
                  onChange={e => setFilterStatus(e.target.value)}
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}
                >
                  <option value="Todos">Todos Status</option>
                  <option value="Pendente">Pendente</option>
                  <option value="Comprou">Comprou</option>
                </select>

                <select 
                  value={filterUrgency} 
                  onChange={e => setFilterUrgency(e.target.value)}
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}
                >
                  <option value="Todos">Todas Urgências</option>
                  <option value="Alta">Alta</option>
                  <option value="Média">Média</option>
                  <option value="Baixa">Baixa</option>
                </select>
              </div>
            </div>

            {/* Table/List View */}
            <div style={{ overflowX: 'hidden' }}>
              <table className="responsive-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                    <th style={{ padding: '1rem 0.5rem', width: '40px', textAlign: 'center' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedItemIds.length > 0 && selectedItemIds.length === filteredRecords.length}
                        onChange={toggleSelectAll}
                        style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--accent-blue)' }}
                        title="Selecionar todos os itens da lista"
                      />
                    </th>
                    <th style={{ padding: '1rem 0.5rem' }}>Produto</th>
                    <th style={{ padding: '1rem 0.5rem' }}>Referência de Preço</th>
                    <th style={{ padding: '1rem 0.5rem' }}>Solicitante</th>
                    <th style={{ padding: '1rem 0.5rem', textAlign: 'center' }}>Estoque</th>
                    <th style={{ padding: '1rem 0.5rem', textAlign: 'center' }}>Urgência</th>
                    <th style={{ padding: '1rem 0.5rem' }}>Gestão de Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Nada encontrado.</td>
                    </tr>
                  ) : (
                    filteredRecords.map(record => {
                      const daysWaiting = differenceInDays(new Date(), parseISO(record.data_criacao));
                      const stats = getProductPriceStats(record.produto_nome);
                      const isFilial = record.loja === 'Ki Madeiras' || record.solicitado_por_filial || record.mensagem_filial;
                      const isSelected = selectedItemIds.includes(record.id);

                      return (
                        <tr key={record.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: isSelected ? 'rgba(37,99,235,0.1)' : 'transparent' }}>
                          <td style={{ padding: '1rem 0.5rem', textAlign: 'center' }}>
                            <input 
                              type="checkbox" 
                              checked={isSelected}
                              onChange={() => toggleSelectItem(record.id)}
                              style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--accent-blue)' }}
                            />
                          </td>
                          <td data-label="Produto" style={{ padding: '1rem 0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                              {record.foto && (
                                <img 
                                  src={record.foto} 
                                  alt="Foto" 
                                  onClick={() => setViewingImage(record.foto)}
                                  style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer', border: '1px solid var(--border-color)', objectPosition: 'center' }} 
                                />
                              )}
                              <div>
                                <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                  {record.produto_nome}
                                  {record.cliente_esperando && (
                                    <span style={{ fontSize: '0.65rem', background: 'var(--status-red)', color: 'var(--text-primary)', padding: '0.2rem 0.4rem', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🚨 Cliente Esperando</span>
                                  )}
                                  {isFilial && (
                                    <span style={{ fontSize: '0.65rem', background: 'rgba(245,158,11,0.2)', color: 'var(--status-yellow)', border: '1px solid var(--status-yellow)', padding: '0.2rem 0.4rem', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 700 }}>
                                      🏷️ Solicitado por Ki Madeiras
                                    </span>
                                  )}
                                  <button
                                    onClick={() => setPriceHistoryProduct(record.produto_nome)}
                                    title="Ver histórico de preços"
                                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', color: 'var(--accent-blue)', opacity: 0.7 }}
                                  >
                                    <History size={14} />
                                  </button>
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                  Cadastrado há {daysWaiting} {daysWaiting === 1 ? 'dia' : 'dias'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td data-label="Referência de Preço" style={{ padding: '1rem 0.5rem' }}>
                            {stats ? (
                              <div style={{ fontSize: '0.8rem' }}>
                                <div style={{ color: 'var(--status-green)', fontWeight: '600' }}>
                                  Menor: R$ {stats.menor_preco.toFixed(2)} ({stats.melhor_fornecedor})
                                </div>
                                <div style={{ color: 'var(--text-secondary)' }}>
                                  Último: R$ {stats.ultimo_preco.toFixed(2)}
                                </div>
                              </div>
                            ) : (
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Sem histórico.</div>
                            )}
                          </td>
                          <td data-label="Solicitante" style={{ padding: '1rem 0.5rem' }}>
                            <div>{record.vendedor_nome}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{record.setor}</div>
                          </td>
                          <td data-label="Estoque / Ideal" style={{ padding: '1rem 0.5rem', textAlign: 'center', fontWeight: 'bold' }}>
                            {record.quantidade_atual} / {record.quantidade_ideal}
                          </td>
                          <td data-label="Urgência" style={{ padding: '1rem 0.5rem', textAlign: 'center' }}>
                            {record.urgencia === 'Alta' && <span style={{ color: 'var(--status-red)', fontWeight: 'bold' }}>Alta</span>}
                            {record.urgencia === 'Média' && <span style={{ color: 'var(--status-yellow)' }}>Média</span>}
                            {record.urgencia === 'Baixa' && <span style={{ color: 'var(--status-green)' }}>Baixa</span>}
                          </td>
                          <td data-label="Gestão de Status" style={{ padding: '1rem 0.5rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <StatusButton record={record} status="Pendente" currentStatus={record.status_compra} color="var(--text-secondary)" />
                              <StatusButton record={record} status="Comprou" currentStatus={record.status_compra} color="var(--status-green)" />
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* Tab 2: Supplier Quotes & Lowest Price Comparison */}
        {mainTab === 'quotes' && (
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                  <Sparkles size={20} color="var(--status-green)" /> Orçamentos Recebidos & Comparativo de Menor Preço
                </h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  O sistema agrupa e separa automaticamente os pedidos pelos fornecedores mais baratos para cada produto.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  onClick={handleGenerate5DemoQuotes}
                  style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid var(--border-color)', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-sm)', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}
                >
                  <Sparkles size={16} color="var(--status-yellow)" /> Gerar 5 Orçamentos de Exemplo
                </button>

                {supplierQuotes.length > 0 && (
                  <button
                    onClick={handleOpenApprovalModalForCheapest}
                    style={{ background: 'var(--status-green)', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-sm)', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <CheckCheck size={18} /> Aprovar & Gerar Pedidos pelo Menor Preço
                  </button>
                )}
              </div>
            </div>

            {supplierQuotes.length > 0 && (() => {
              // Calculate potential savings for all items in quotes
              const itemsMap = new Map();
              supplierQuotes.forEach(q => {
                (q.items || []).forEach(it => {
                  if (it && it.produto_nome && !it.indisponivel && it.price !== null && it.price !== undefined) {
                    const priceNum = Number(it.price);
                    if (!isNaN(priceNum) && priceNum > 0) {
                      if (!itemsMap.has(it.produto_nome)) {
                        itemsMap.set(it.produto_nome, {
                          produto_nome: it.produto_nome,
                          quantidade: Number(it.quantidade) || 10,
                          prices: []
                        });
                      }
                      itemsMap.get(it.produto_nome).prices.push(priceNum);
                    }
                  }
                });
              });

              let totalPotentialSavings = 0;
              itemsMap.forEach(item => {
                if (item.prices && item.prices.length > 1) {
                  const minP = Math.min(...item.prices);
                  const maxP = Math.max(...item.prices);
                  if (isFinite(minP) && isFinite(maxP) && maxP > minP) {
                    totalPotentialSavings += (maxP - minP) * item.quantidade;
                  }
                }
              });

              const displaySavings = isNaN(totalPotentialSavings) ? '0.00' : totalPotentialSavings.toFixed(2);

              return (
                <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(6,78,59,0.3) 100%)', border: '1px solid var(--status-green)', borderRadius: 'var(--radius-md)', padding: '1.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: 'var(--status-green)', padding: '0.85rem', borderRadius: '50%', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <TrendingDown size={28} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--status-green)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        🎉 Economia Calculada Inteligente
                      </div>
                      <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>
                        R$ {displaySavings} economizados!
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Valor salvo ao escolher o fornecedor mais em conta item por item entre os {supplierQuotes.length} orçamentos.
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleOpenApprovalModalForCheapest}
                    style={{ background: 'var(--status-green)', color: '#fff', border: 'none', padding: '0.85rem 1.75rem', borderRadius: 'var(--radius-sm)', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1rem', boxShadow: '0 4px 15px rgba(16,185,129,0.3)' }}
                  >
                    <CheckCheck size={22} /> Aprovar Tudo & Economizar R$ {displaySavings}
                  </button>
                </div>
              );
            })()}

            {quoteSuccessMsg && (
              <div className="bg-green-soft" style={{ padding: '1.25rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '1.05rem', fontWeight: 'bold', color: 'var(--status-green)', border: '2px solid var(--status-green)', textAlign: 'center' }}>
                {quoteSuccessMsg}
              </div>
            )}

            {supplierQuotes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                Nenhum orçamento de fornecedor recebido ainda. Use o botão "Gerar Cotação" para enviar o link aos representantes!
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                
                {/* List of Quotes Received in Rich Cards */}
                <h4 style={{ color: '#fff', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
                  <Building2 size={18} color="var(--accent-blue)" /> Cards dos Orçamentos Recebidos ({supplierQuotes.length})
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                  {supplierQuotes.map((q, idx) => {
                    return (
                      <div key={q.id || idx} className="glass-panel" style={{ padding: '1.25rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--accent-blue)' }}>{q.supplierName}</div>
                            {q.deliveryDate && (
                              <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.08)', color: 'var(--text-secondary)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                                🚚 {q.deliveryDate}
                              </span>
                            )}
                          </div>

                          {q.supplierPhone && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <span>Whats: {q.supplierPhone}</span>
                              <a
                                href={`https://api.whatsapp.com/send?phone=${String(q.supplierPhone || '').replace(/\D/g, '')}`}
                                target="_blank" rel="noreferrer"
                                style={{ color: '#25D366', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.75rem' }}
                              >
                                [ Abrir Whats ]
                              </a>
                            </div>
                          )}

                          {/* List of Products in this Quote */}
                          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 'bold', marginBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.3rem' }}>
                              ITENS ORÇADOS:
                            </div>
                            <div style={{ display: 'grid', gap: '0.5rem' }}>
                              {(q.items || []).map((it, itemIdx) => {
                                const assignedSup = getAssignedSupplierForItem(it.produto_nome);
                                const isAssignedToThisQuote = assignedSup === q.supplierName;
                                const isManuallyAssigned = supplierOverrides[it.produto_nome] === q.supplierName;

                                return (
                                  <div key={itemIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', padding: '0.2rem 0' }}>
                                    <div style={{ color: '#fff', flex: '1' }}>
                                      {it.produto_nome} <span style={{ color: 'var(--text-secondary)' }}>({it.quantidade} un)</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                      {isAssignedToThisQuote ? (
                                        <button
                                          type="button"
                                          onClick={() => setReassignModalItem({ id: it.id, produto_nome: it.produto_nome, currentSupplier: q.supplierName })}
                                          title="Clique para transferir a compra deste item para outro fornecedor"
                                          style={{ fontSize: '0.65rem', background: isManuallyAssigned ? 'rgba(59,130,246,0.2)' : 'rgba(16,185,129,0.2)', color: isManuallyAssigned ? 'var(--accent-blue)' : 'var(--status-green)', border: isManuallyAssigned ? '1px solid var(--accent-blue)' : '1px solid var(--status-green)', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                                        >
                                          {isManuallyAssigned ? `↪️ Transferido Aqui` : `🏆 Menor Preço!`}
                                        </button>
                                      ) : null}

                                      <span 
                                        onClick={() => setReassignModalItem({ id: it.id, produto_nome: it.produto_nome, currentSupplier: q.supplierName })}
                                        title="Clique para ver opções e transferir este produto"
                                        style={{ fontWeight: 'bold', color: isAssignedToThisQuote ? 'var(--status-green)' : 'var(--text-secondary)', cursor: 'pointer' }}
                                      >
                                        {it.indisponivel ? (
                                          <span style={{ color: 'var(--status-red)', fontSize: '0.75rem', fontStyle: 'italic' }}>Indisponível</span>
                                        ) : (
                                          `R$ ${Number(it.price || 0).toFixed(2)}`
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total do Orçamento:</span>
                            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--status-green)' }}>
                              R$ {(q.totalValue || 0).toFixed(2)}
                            </span>
                          </div>

                          <button
                            onClick={() => {
                              if (user?.role === 'cotador') {
                                alert('🔒 Acesso Restrito!\n\nVocê está conectado como Auxiliar de Cotações. Seu cargo permite criar e enviar cotações para representantes de vendas, mas não autoriza aprovar orçamentos.');
                                return;
                              }
                              handleOpenApprovalModalForQuote(q);
                            }}
                            style={{ 
                              background: user?.role === 'cotador' ? 'rgba(255,255,255,0.05)' : '#25D366', 
                              color: user?.role === 'cotador' ? 'var(--text-secondary)' : '#fff', 
                              border: user?.role === 'cotador' ? '1px dashed var(--border-color)' : 'none', 
                              padding: '0.65rem 1rem', 
                              borderRadius: 'var(--radius-sm)', 
                              fontWeight: 'bold', 
                              cursor: user?.role === 'cotador' ? 'not-allowed' : 'pointer', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              gap: '0.5rem', 
                              fontSize: '0.85rem' 
                            }}
                          >
                            {user?.role === 'cotador' ? (
                              <>🔒 Aprovação Restrita a Comprador/Admin</>
                            ) : (
                              <><Send size={16} /> Aprovar Orçamento & Ajustar Quantidades</>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Comparative Table */}
                <h4 style={{ color: '#fff', fontSize: '1rem', marginTop: '1rem' }}>Tabela Comparativa de Preços por Fornecedor</h4>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                        <th style={{ padding: '0.75rem' }}>Produto</th>
                        <th style={{ padding: '0.75rem', textAlign: 'center' }}>Qtd Desejada</th>
                        {supplierQuotes.map((q, idx) => (
                          <th key={idx} style={{ padding: '0.75rem', textAlign: 'right' }}>{q.supplierName}</th>
                        ))}
                        <th style={{ padding: '0.75rem', textAlign: 'right', color: 'var(--status-green)' }}>Menor Preço</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        // Extract all unique items from activeRecords AND from supplierQuotes
                        const itemsMap = new Map();
                        
                        activeRecords.forEach(r => {
                          itemsMap.set(r.produto_nome, {
                            id: r.id,
                            produto_nome: r.produto_nome,
                            setor: r.setor,
                            quantidade: r.quantidade_ideal ? Math.max(r.quantidade_ideal - r.quantidade_atual, 1) : 10
                          });
                        });

                        supplierQuotes.forEach(q => {
                          (q.items || []).forEach(it => {
                            if (!itemsMap.has(it.produto_nome)) {
                              itemsMap.set(it.produto_nome, {
                                id: it.id || `quote_item_${it.produto_nome}`,
                                produto_nome: it.produto_nome,
                                setor: it.setor || 'Geral',
                                quantidade: it.quantidade || 10
                              });
                            }
                          });
                        });

                        const comparisonList = Array.from(itemsMap.values());

                        if (comparisonList.length === 0) {
                          return (
                            <tr>
                              <td colSpan={supplierQuotes.length + 3} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                Nenhum produto encontrado nos orçamentos.
                              </td>
                            </tr>
                          );
                        }

                        const normStr = (s) => (s || '').toLowerCase().trim();

                        return comparisonList.map(item => {
                          // Gather prices for this item across all quotes
                          const itemPrices = supplierQuotes.map(q => {
                            const itemMatch = (q.items || []).find(it => (it.id && String(it.id) === String(item.id)) || normStr(it.produto_nome) === normStr(item.produto_nome));
                            const isNoStock = itemMatch?.indisponivel;
                            const priceVal = (itemMatch && !isNoStock && itemMatch.price !== null && itemMatch.price !== undefined) ? Number(itemMatch.price) : null;
                            return { supplierName: q.supplierName, price: (priceVal && priceVal > 0) ? priceVal : null };
                          }).filter(ip => ip.price !== null && !isNaN(ip.price) && ip.price > 0);

                          const lowestPriceObj = itemPrices.length > 0 ? itemPrices.reduce((min, p) => p.price < min.price ? p : min) : null;
                          const qty = item.quantidade;

                          return (
                            <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                              <td style={{ padding: '0.75rem', fontWeight: 'bold', color: '#fff' }}>{item.produto_nome}</td>
                              <td style={{ padding: '0.75rem', textAlign: 'center' }}>{qty} un</td>
                              {supplierQuotes.map((q, idx) => {
                                const itemMatch = (q.items || []).find(it => (it.id && String(it.id) === String(item.id)) || normStr(it.produto_nome) === normStr(item.produto_nome));
                                const isNoStock = itemMatch?.indisponivel;
                                const p = (itemMatch && !isNoStock && itemMatch.price && Number(itemMatch.price) > 0) ? Number(itemMatch.price) : null;
                                const isLowest = lowestPriceObj && p === lowestPriceObj.price;

                                return (
                                  <td key={idx} style={{ padding: '0.75rem', textAlign: 'right', background: isLowest ? 'rgba(16,185,129,0.2)' : 'transparent', color: isLowest ? 'var(--status-green)' : 'var(--text-secondary)', fontWeight: isLowest ? 'bold' : 'normal' }}>
                                    {isNoStock ? (
                                      <span style={{ color: 'var(--status-red)', fontSize: '0.75rem' }}>Indisponível</span>
                                    ) : p ? (
                                      `R$ ${p.toFixed(2)}`
                                    ) : (
                                      '—'
                                    )}
                                  </td>
                                );
                              })}
                              <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold', color: 'var(--status-green)', background: 'rgba(16,185,129,0.1)' }}>
                                {lowestPriceObj ? `R$ ${lowestPriceObj.price.toFixed(2)} (${lowestPriceObj.supplierName})` : '—'}
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>

              </div>
            )}
          </div>
        )}

        {/* Tab 3: Filial Admin Direct Purchases */}
        {mainTab === 'filial_purchases' && (
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: '#fff' }}>
                  <Building2 size={22} color="var(--accent-blue)" /> Pedidos Comprados Direto pelo Admin da Ki Madeiras
                </h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Relatório e acompanhamento dos produtos e insumos comprados diretamente pela gestão da filial Ki Madeiras.
                </p>
              </div>
            </div>

            {(filialPurchases || []).length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Nenhuma compra direta registrada pelo Admin da Ki Madeiras até o momento.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                      <th style={{ padding: '0.75rem' }}>Data</th>
                      <th style={{ padding: '0.75rem' }}>Produto Comprado</th>
                      <th style={{ padding: '0.75rem' }}>Fornecedor</th>
                      <th style={{ padding: '0.75rem' }}>Comprador (Admin Ki Madeiras)</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center' }}>Qtd</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right' }}>Valor Unit.</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right', color: 'var(--status-green)' }}>Total Pago (R$)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(filialPurchases || []).map(fp => (
                      <tr key={fp.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>
                          {format(parseISO(fp.data_compra), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </td>
                        <td style={{ padding: '0.75rem', fontWeight: 'bold', color: '#fff' }}>{fp.produto_nome}</td>
                        <td style={{ padding: '0.75rem', color: 'var(--accent-blue)', fontWeight: 600 }}>{fp.fornecedor}</td>
                        <td style={{ padding: '0.75rem', color: '#fff' }}>{fp.comprador_nome}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 'bold' }}>{fp.quantidade} un</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>R$ {(fp.valor_unitario || 0).toFixed(2)}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 800, color: 'var(--status-green)' }}>
                          R$ {(fp.valor_total || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}



      </div>

      {/* Modal de Compra */}
      {purchasingRecord && (
        <div style={{ fixed: 'fixed', top: 0, left: 0, right: 0, bottom: 0, position: 'fixed', zIndex: 100, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '2rem', background: 'var(--bg-secondary)' }}>
            <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              Registrar Compra
            </h3>
            <div style={{ marginBottom: '1.5rem' }}>
              <strong>Produto:</strong> {purchasingRecord.produto_nome}
            </div>

            <form onSubmit={handleCompletePurchase} style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ position: 'relative' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Fornecedor</label>
                <input 
                  type="text" required
                  value={fornecedor}
                  onChange={e => { setFornecedor(e.target.value); setSupplierSearch(e.target.value); setShowSupplierSuggestions(true); }}
                  onBlur={() => setTimeout(() => setShowSupplierSuggestions(false), 150)}
                  onFocus={() => { setSupplierSearch(fornecedor); setShowSupplierSuggestions(true); }}
                  placeholder="Ex: Fornecedor ABC"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
                {showSupplierSuggestions && supplierSuggestions.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', zIndex: 20, maxHeight: '150px', overflowY: 'auto', marginTop: '2px' }}>
                    {supplierSuggestions.map(s => (
                      <div
                        key={s.id}
                        onMouseDown={() => { setFornecedor(s.nome); setShowSupplierSuggestions(false); }}
                        style={{ padding: '0.65rem 1rem', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem' }}
                      >
                        {s.nome}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Quantidade</label>
                  <input 
                    type="number" required min="1" value={quantidadeComprada} onChange={e => setQuantidadeComprada(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Valor Unitário (R$)</label>
                  <input 
                    type="number" required step="0.01" min="0" value={valorUnitario} onChange={e => setValorUnitario(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Valor Total:</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                  R$ {((Number(valorUnitario) || 0) * (Number(quantidadeComprada) || 0)).toFixed(2)}
                </span>
              </div>

              {/* Alerta Inteligente */}
              {purchasingRecord.stats && valorUnitario && (
                <div style={{ marginTop: '0.5rem' }}>
                  {Number(valorUnitario) < purchasingRecord.stats.menor_preco ? (
                     <div className="bg-green-soft" style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontWeight: '600' }}>
                       Boa compra! Valor abaixo do histórico. (Menor era R$ {purchasingRecord.stats.menor_preco.toFixed(2)})
                     </div>
                  ) : Number(valorUnitario) > purchasingRecord.stats.menor_preco ? (
                    <div className="bg-red-soft" style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontWeight: '600' }}>
                       Atenção: este produto já foi comprado por um valor menor anteriormente! (R$ {purchasingRecord.stats.menor_preco.toFixed(2)} - {purchasingRecord.stats.melhor_fornecedor})
                    </div>
                  ) : (
                    <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: 'var(--status-yellow)', background: 'rgba(245, 158, 11, 0.15)' }}>
                       Valor igual ao melhor preço histórico ({purchasingRecord.stats.melhor_fornecedor}).
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem', flexWrap: 'wrap' }}>
                <button type="button" onClick={() => setPurchasingRecord(null)} style={{ padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    updateRecordStatus(purchasingRecord.id, 'Comprou');
                    setPurchasingRecord(null);
                  }} 
                  style={{ padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--accent-blue)', background: 'transparent', color: 'var(--accent-blue)', fontWeight: 'bold', cursor: 'pointer', flex: '1 1 auto', textAlign: 'center' }}
                >
                  Pular (Só Mudar Status)
                </button>
                <button type="submit" style={{ padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--status-green)', color: 'var(--text-primary)', fontWeight: 'bold', cursor: 'pointer' }}>
                  Confirmar Compra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Histórico de Preços */}
      {priceHistoryProduct && (() => {
        const history = getProductPriceHistory(priceHistoryProduct);
        return (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 110, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', overflow: 'hidden', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', fontSize: '1.1rem' }}>
                    <History size={18} color="var(--accent-blue)" />
                    Histórico de Preços
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{priceHistoryProduct}</div>
                </div>
                <button onClick={() => setPriceHistoryProduct(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}>
                  <X size={22} />
                </button>
              </div>
              <div style={{ overflowY: 'auto', flex: 1, padding: '0.5rem 1rem' }}>
                {history.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Nenhuma compra registrada para este produto.</div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                        <th style={{ padding: '0.65rem 0.5rem', textAlign: 'left' }}>Data</th>
                        <th style={{ padding: '0.65rem 0.5rem', textAlign: 'left' }}>Fornecedor</th>
                        <th style={{ padding: '0.65rem 0.5rem', textAlign: 'center' }}>Qtd</th>
                        <th style={{ padding: '0.65rem 0.5rem', textAlign: 'right' }}>Unit.</th>
                        <th style={{ padding: '0.65rem 0.5rem', textAlign: 'right' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((p, i) => (
                        <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                          <td style={{ padding: '0.6rem 0.5rem', color: 'var(--text-secondary)' }}>{format(parseISO(p.data_compra), "dd/MM/yy HH:mm", { locale: ptBR })}</td>
                          <td style={{ padding: '0.6rem 0.5rem', fontWeight: '500' }}>{p.fornecedor}</td>
                          <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center' }}>{p.quantidade}</td>
                          <td style={{ padding: '0.6rem 0.5rem', textAlign: 'right', color: 'var(--status-green)', fontWeight: '600' }}>R$ {p.valor_unitario.toFixed(2)}</td>
                          <td style={{ padding: '0.6rem 0.5rem', textAlign: 'right' }}>R$ {p.valor_total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              <div style={{ padding: '0.75rem 1.5rem', borderTop: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'right' }}>
                {history.length} registro(s) — últimas 100 compras
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal Popup de Aprovação & Ajuste de Quantidades */}
      {approvalModalData && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '650px', padding: '2rem', background: 'var(--bg-secondary)', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            <button 
              onClick={() => setApprovalModalData(null)}
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <X size={22} />
            </button>

            <h3 style={{ marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--status-green)' }}>
              <CheckCheck size={24} /> Aprovação de Pedido — {approvalModalData.supplierName}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Ajuste as quantidades finais que deseja comprar de cada produto para este pedido antes de confirmar e enviar no WhatsApp.
            </p>

            {/* List of items with editable quantities */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {(approvalModalData.items || []).map((item, idx) => {
                const subtotal = (Number(item.price) || 0) * (Number(item.quantity) || 1);
                return (
                  <div key={idx} style={{ background: 'rgba(0,0,0,0.25)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ flex: '1 1 200px' }}>
                      <strong style={{ color: '#fff', fontSize: '0.95rem' }}>{item.produto_nome}</strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Fornecedor: <span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>{item.fornecedor}</span>
                        {item.packInfo && <span style={{ marginLeft: '0.5rem', color: 'var(--status-yellow)' }}>• {item.packInfo}</span>}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '2px' }}>Preço Unit.</label>
                        <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--status-green)' }}>
                          R$ {Number(item.price || 0).toFixed(2)}
                        </span>
                      </div>

                      <div style={{ width: '110px' }}>
                        <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '2px', fontWeight: 'bold' }}>Qtd Comprada</label>
                        <input 
                          type="number" 
                          min="1"
                          value={item.quantity} 
                          onChange={(e) => handleUpdateApprovalQty(item.id, e.target.value)}
                          style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '4px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-color)', color: '#fff', fontWeight: 'bold', fontSize: '0.95rem', textAlign: 'center' }}
                        />
                      </div>

                      <div style={{ textAlign: 'right', minWidth: '90px' }}>
                        <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '2px' }}>Subtotal</label>
                        <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff' }}>
                          R$ {subtotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Footer */}
            {(() => {
              const grandTotal = (approvalModalData.items || []).reduce((acc, it) => acc + (Number(it.price || 0) * Number(it.quantity || 1)), 0);
              return (
                <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid var(--status-green)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Total Final do Pedido:</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--status-green)' }}>
                    R$ {grandTotal.toFixed(2)}
                  </span>
                </div>
              );
            })()}

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setApprovalModalData(null)}
                style={{ background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-sm)', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Cancelar
              </button>

              <button
                onClick={handleConfirmApprovalModal}
                style={{ background: '#25D366', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-sm)', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}
              >
                <Send size={18} /> Confirmar & Disparar no WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Reatribuição / Transferência de Fornecedor por Item */}
      {reassignModalItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '580px', padding: '2rem', background: 'var(--bg-secondary)', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            <button 
              onClick={() => setReassignModalItem(null)}
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <X size={22} />
            </button>

            <h3 style={{ marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-blue)' }}>
              <Repeat size={22} /> Transferir Produto para outro Fornecedor
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 'bold', marginBottom: '0.2rem' }}>
              Produto: <span style={{ color: 'var(--accent-blue)' }}>{reassignModalItem.produto_nome}</span>
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Se o fornecedor de menor preço não vende este item isoladamente (ex: apenas 1 peça), escolha abaixo para qual distribuidora você deseja transferir a compra:
            </p>

            {/* Supplier choices */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {supplierQuotes.map((sq, idx) => {
                const match = (sq.items || []).find(it => normStr(it.produto_nome) === normStr(reassignModalItem.produto_nome));
                if (!match || !match.price || Number(match.price) <= 0 || match.indisponivel) return null;

                const assignedSup = getAssignedSupplierForItem(reassignModalItem.produto_nome);
                const isCurrent = assignedSup === sq.supplierName;
                const p = Number(match.price || 0);

                return (
                  <div key={idx} style={{ background: isCurrent ? 'rgba(16,185,129,0.1)' : 'rgba(0,0,0,0.25)', border: isCurrent ? '1px solid var(--status-green)' : '1px solid var(--border-color)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                      <strong style={{ color: '#fff', fontSize: '0.9rem' }}>{sq.supplierName}</strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Preço Unitário: <span style={{ color: 'var(--status-green)', fontWeight: 'bold' }}>R$ {p.toFixed(2)}</span>
                        {match.packInfo && <span style={{ marginLeft: '0.4rem', color: 'var(--status-yellow)' }}>({match.packInfo})</span>}
                      </div>
                    </div>

                    {isCurrent ? (
                      <span style={{ fontSize: '0.75rem', background: 'rgba(16,185,129,0.2)', color: 'var(--status-green)', border: '1px solid var(--status-green)', padding: '0.35rem 0.75rem', borderRadius: '4px', fontWeight: 'bold' }}>
                        ✓ Atribuído Atualmente
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          setSupplierOverrides(prev => ({ ...prev, [reassignModalItem.produto_nome]: sq.supplierName }));
                          setReassignModalItem(null);
                        }}
                        style={{ background: 'var(--accent-blue)', color: '#fff', border: 'none', padding: '0.45rem 0.85rem', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' }}
                      >
                        Transferir para este Fornecedor
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {supplierOverrides[reassignModalItem.produto_nome] && (
              <button
                onClick={() => {
                  setSupplierOverrides(prev => {
                    const copy = { ...prev };
                    delete copy[reassignModalItem.produto_nome];
                    return copy;
                  });
                  setReassignModalItem(null);
                }}
                style={{ width: '100%', background: 'rgba(239,68,68,0.15)', color: 'var(--status-red)', border: '1px solid rgba(239,68,68,0.3)', padding: '0.65rem', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}
              >
                🔄 Restaurar Menor Preço Original
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modal de Cotação */}
      {showQuoteModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 110, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', padding: '2rem', background: 'var(--bg-secondary)', position: 'relative' }}>
            <button 
              onClick={() => setShowQuoteModal(false)}
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <X size={22} />
            </button>

            <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-blue)' }}>
              <Send size={22} /> Link de Cotação para Fornecedores
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Envie este link para seus representantes de vendas. Eles responderão com seus preços e o sistema escolherá automaticamente a melhor oferta!
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Link da Cotação Pública</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="text" 
                  readOnly 
                  value={generatedQuoteUrl} 
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.85rem' }} 
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedQuoteUrl);
                    alert('Link copiado para a área de transferência!');
                  }}
                  style={{ background: 'var(--accent-blue)', color: '#fff', border: 'none', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Copy size={16} /> Copiar
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Olá, tudo bem?\n\nSegue o link para cotar os valores dos produtos pendentes na loja *Só Madeiras*:\n\n${generatedQuoteUrl}\n\nPor favor, preencha seus preços unitários diretamente pelo link acima!`)}`}
                target="_blank" rel="noreferrer"
                style={{ background: '#25D366', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-sm)', fontWeight: 'bold', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Send size={18} /> Enviar via WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Foto */}
      {viewingImage && (
        <div style={{ fixed: 'fixed', top: 0, left: 0, right: 0, bottom: 0, position: 'fixed', zIndex: 105, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }}>
            <button 
              onClick={() => setViewingImage(null)}
              style={{ position: 'absolute', top: '-15px', right: '-15px', background: 'var(--status-red)', color: 'var(--text-primary)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
            >
              <X size={20} />
            </button>
            <img src={viewingImage} alt="Ampliada" style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '8px', border: '2px solid rgba(255,255,255,0.1)' }} />
          </div>
        </div>
      )}
    </Layout>
  );
}
