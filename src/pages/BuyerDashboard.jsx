import React, { useState } from 'react';
import Layout from '../components/Layout';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, PackageSearch, Activity, CheckCircle, Truck, Clock, Trophy, X, Users, UserPlus, Trash2 } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
export default function BuyerDashboard() {
  const { records, purchases, updateRecordStatus, markAsArrived, getProductPriceStats, addPurchase } = useData();
  const { usersList, registerUser, deleteUser } = useAuth();
  
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [filterUrgency, setFilterUrgency] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');

  // Purchase Modal State
  const [purchasingRecord, setPurchasingRecord] = useState(null);
  const [fornecedor, setFornecedor] = useState('');
  const [valorUnitario, setValorUnitario] = useState('');
  const [quantidadeComprada, setQuantidadeComprada] = useState('');
  const [viewingImage, setViewingImage] = useState(null);

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

        {/* Filters and List */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          
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
                style={{ background: 'var(--bg-secondary)', color: 'white', border: '1px solid var(--border-color)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', flex: '1 1 200px', maxWidth: '100%' }}
              />

              <select 
                value={filterStatus} 
                onChange={e => setFilterStatus(e.target.value)}
                style={{ background: 'var(--bg-secondary)', color: 'white', border: '1px solid var(--border-color)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}
              >
                <option value="Todos">Todos Status</option>
                <option value="Pendente">Pendente</option>
                <option value="Comprou">Comprou</option>
              </select>

              <select 
                value={filterUrgency} 
                onChange={e => setFilterUrgency(e.target.value)}
                style={{ background: 'var(--bg-secondary)', color: 'white', border: '1px solid var(--border-color)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}
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
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Nada encontrado.</td>
                  </tr>
                ) : (
                  filteredRecords.map(record => {
                    const daysWaiting = differenceInDays(new Date(), parseISO(record.data_criacao));
                    const stats = getProductPriceStats(record.produto_nome);
                    
                    return (
                      <tr key={record.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
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
                                  <span style={{ fontSize: '0.65rem', background: 'var(--status-red)', color: 'white', padding: '0.2rem 0.4rem', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🚨 Cliente Esperando</span>
                                )}
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
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>

        {/* Gestão de Equipe (Comprador/Admin) */}
        <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '1rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--accent-blue)' }}>
            <Users size={20} /> Equipe de Vendedores (Acesso ao Sistema)
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '2rem' }}>
            {/* Form Cadastrar */}
            <div style={{ background: 'rgba(0,0,0,0.15)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontWeight: 'bold' }}>
                <UserPlus size={18} /> Novo Vendedor
              </div>
              
              {sellerError && <div className="bg-red-soft" style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.85rem' }}>{sellerError}</div>}
              {sellerSuccess && <div className="bg-green-soft" style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.85rem' }}>{sellerSuccess}</div>}

              <form onSubmit={handleRegisterSeller} style={{ display: 'grid', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>Nome Completo</label>
                  <input type="text" required value={newSellerNome} onChange={e => setNewSellerNome(e.target.value)} placeholder="Ex: Roberto Silva" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'white' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>Setor / Loja</label>
                  <input type="text" required value={newSellerSetor} onChange={e => setNewSellerSetor(e.target.value)} placeholder="Ex: Hidráulica" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'white' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>Login (Usuário)</label>
                  <input type="text" required value={newSellerUsername} onChange={e => setNewSellerUsername(e.target.value)} placeholder="Ex: roberto" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'white' }} />
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  A senha inicial padrão será: <strong style={{color: 'white'}}>123</strong>
                </div>
                <button type="submit" style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--accent-blue)', color: 'white', fontWeight: 'bold', cursor: 'pointer', marginTop: '0.5rem' }}>
                  Cadastrar Acesso
                </button>
              </form>
            </div>

            {/* Listagem da Equipe */}
            <div>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {usersList?.filter(u => u.role === 'vendedor').map(u => (
                  <div key={u.uid} style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ flex: '1 1 150px' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{u.nome}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Setor: {u.setor}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Usuário de login</div>
                        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', fontFamily: 'monospace', color: 'var(--accent-blue)', display: 'inline-block' }}>{u.username}</div>
                      </div>
                      <button 
                        onClick={() => {
                          if (window.confirm(`Tem certeza que deseja excluir o acesso de ${u.nome}?`)) {
                            deleteUser(u.uid);
                          }
                        }}
                        style={{
                          background: 'transparent', color: 'var(--status-red)',
                          border: 'none', padding: '0.5rem', borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                        title="Excluir Vendedor"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

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
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Fornecedor</label>
                <input 
                  type="text" required value={fornecedor} onChange={e => setFornecedor(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'white' }}
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Quantidade</label>
                  <input 
                    type="number" required min="1" value={quantidadeComprada} onChange={e => setQuantidadeComprada(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'white' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Valor Unitário (R$)</label>
                  <input 
                    type="number" required step="0.01" min="0" value={valorUnitario} onChange={e => setValorUnitario(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'white' }}
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
                <button type="button" onClick={() => setPurchasingRecord(null)} style={{ padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'transparent', color: 'white', cursor: 'pointer' }}>
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
                <button type="submit" style={{ padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--status-green)', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>
                  Confirmar Compra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Foto */}
      {viewingImage && (
        <div style={{ fixed: 'fixed', top: 0, left: 0, right: 0, bottom: 0, position: 'fixed', zIndex: 105, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }}>
            <button 
              onClick={() => setViewingImage(null)}
              style={{ position: 'absolute', top: '-15px', right: '-15px', background: 'var(--status-red)', color: 'white', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
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
