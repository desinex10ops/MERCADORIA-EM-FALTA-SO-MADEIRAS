import React, { useState, useRef } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { PlusCircle, Search, AlertTriangle, PackageCheck, Package, Clock, Camera, X, Trash2, MessageCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function SellerPanel() {
  const { user } = useAuth();
  const { products, records, addRecord, markAsArrived, deleteRecord } = useData();
  
  const [produtoName, setProdutoName] = useState('');
  const [qtdAtual, setQtdAtual] = useState('');
  const [qtdIdeal, setQtdIdeal] = useState('');
  const [chegou, setChegou] = useState(false);
  const [clienteEsperando, setClienteEsperando] = useState(false);
  const [fotoPreview, setFotoPreview] = useState(null);
  
  const fileInputRef = useRef(null);
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

  // Filter products for suggestions (simulating autocomplete)
  const suggestions = produtoName.length > 1 
    ? products.filter(p => smartSearch(p.nome, produtoName))
    : [];

  const handleAdd = (e) => {
    e.preventDefault();
    if (!produtoName) return;

    // Try to find if product exists to get sector, else use generic
    const prod = products.find(p => p.nome.toLowerCase() === produtoName.toLowerCase());
    
    addRecord({
      produto_nome: produtoName.trim(),
      vendedor_nome: user.nome,
      vendedor_id: user.uid,
      setor: prod ? prod.setor : user.setor, // Fallback to user sector
      quantidade_atual: qtdAtual ? Number(qtdAtual) : 0,
      quantidade_ideal: qtdIdeal ? Number(qtdIdeal) : null,
      chegou: chegou,
      cliente_esperando: clienteEsperando,
      foto: fotoPreview
    });

    // Reset form
    setProdutoName('');
    setQtdAtual('');
    setQtdIdeal('');
    setChegou(false);
    setClienteEsperando(false);
    setFotoPreview(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const getUrgencyColor = (urgencia) => {
    switch(urgencia) {
      case 'Alta': return 'bg-red-soft text-red';
      case 'Média': return 'bg-yellow-soft text-yellow';
      default: return 'bg-green-soft text-green';
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Pendente': return 'var(--text-secondary)';
      case 'Comprou': return 'var(--status-green)';
      default: return 'white';
    }
  };

  // Only show active records (not arrived yet) for the current seller
  const activeRecords = records.filter(r => r.vendedor_id === user.uid || !r.vendedor_id); // mock uses global for now if no ID, but let's filter by arrived = false
  const myRecords = records.filter(r => !r.chegou && smartSearch(r.produto_nome, searchTerm));

  return (
    <Layout>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        
        {/* Registration Form */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'var(--bg-secondary)', padding: '0.5rem', borderRadius: 'var(--radius-full)'}}>
              <PlusCircle size={24} color="var(--accent-blue)" />
            </div>
            <h3>Registrar Produto em Falta</h3>
          </div>

          <form onSubmit={handleAdd} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            
            <div style={{ gridColumn: '1 / -1', position: 'relative' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Nome do Produto</label>
              <input 
                type="text" 
                value={produtoName}
                onChange={(e) => setProdutoName(e.target.value)}
                placeholder="Ex: Cimento, Prego 17x21..."
                style={{
                  width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', 
                  background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-primary)'
                }}
                required 
              />
              {/* Fake Autocomplete Dropdown */}
              {suggestions.length > 0 && produtoName !== suggestions[0].nome && (
                <div style={{ 
                  position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', zIndex: 10,
                  maxHeight: '150px', overflowY: 'auto', marginTop: '4px'
                }}>
                  {suggestions.map(s => (
                    <div 
                      key={s.id} 
                      onClick={() => setProdutoName(s.nome)}
                      style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid var(--border-color)' }}
                    >
                      {s.nome}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Quantidade Atual (em estoque)</label>
              <input 
                type="number" 
                value={qtdAtual}
                onChange={(e) => setQtdAtual(e.target.value)}
                placeholder="Opcional. Padrão: 0"
                min="0"
                style={{
                  width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', 
                  background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-primary)'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Quantidade Ideal</label>
              <input 
                type="number" 
                value={qtdIdeal}
                onChange={(e) => setQtdIdeal(e.target.value)}
                placeholder="Opcional. Ex: 50"
                min="1"
                style={{
                  width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', 
                  background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-primary)'
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '1.5rem', gridColumn: '1 / -1', flexWrap: 'wrap' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input 
                  type="checkbox" 
                  id="cliente_esperando"
                  checked={clienteEsperando}
                  onChange={(e) => setClienteEsperando(e.target.checked)}
                  style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--status-red)' }}
                />
                <label htmlFor="cliente_esperando" style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  🚨 Cliente Esperando na Loja
                </label>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input 
                  type="checkbox" 
                  id="chegou"
                  checked={chegou}
                  onChange={(e) => setChegou(e.target.checked)}
                  style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--accent-blue)' }}
                />
                <label htmlFor="chegou" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  Já chegou na loja? (Registro retroativo)
                </label>
              </div>
            </div>

            {/* Câmera e Botão Submit */}
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
              
              <div>
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  style={{ display: 'none' }} 
                />
                
                {!fotoPreview ? (
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text-primary)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600' }}
                  >
                    <Camera size={20} /> Anexar Foto
                  </button>
                ) : (
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img src={fotoPreview} alt="Preview" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '2px solid var(--accent-blue)' }} />
                    <button 
                      type="button" 
                      onClick={() => setFotoPreview(null)}
                       style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--status-red)', color: 'var(--text-primary)', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>

              <button type="submit" style={{
                background: 'var(--accent-blue)', color: 'var(--text-primary)', padding: '0.75rem 2rem', borderRadius: 'var(--radius-md)',
                border: 'none', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem'
              }}>
                <PlusCircle size={20} />
                Registrar Falta
              </button>
            </div>

          </form>
        </div>

        {/* My Records List */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Package size={20} /> Registros Ativos da Loja ({myRecords.length})
            </h3>
            <input 
                type="text" 
                placeholder="Buscar produto..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', width: '250px' }}
              />
          </div>
          
          <div style={{ display: 'grid', gap: '1rem' }}>
            {myRecords.length === 0 ? (
              <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Nenhum produto em falta registrado por você no momento.
              </div>
            ) : (
              myRecords.map(record => (
                <div key={record.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'space-between', alignItems: 'center' }}>
                  
                  <div style={{ flex: '1 1 250px' }}>
                    <div style={{ fontWeight: '600', fontSize: '1.1rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {record.produto_nome}
                      {record.cliente_esperando && (
                        <span style={{ fontSize: '0.65rem', background: 'var(--status-red)', color: 'var(--text-primary)', padding: '0.2rem 0.4rem', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🚨 Cliente Esperando</span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                      Solicitado por: <span style={{ color: 'var(--accent-blue)', fontWeight: 'bold' }}>{record.vendedor_nome}</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Clock size={14} /> 
                      Atualizado em {format(parseISO(record.data_atualizacao), "dd/MM 'às' HH:mm", { locale: ptBR })}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ textAlign: 'center', background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Estoque</div>
                      <div style={{ fontWeight: 'bold' }}>{record.quantidade_atual} / {record.quantidade_ideal}</div>
                    </div>

                    <div className={getUrgencyColor(record.urgencia)} style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)', fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <AlertTriangle size={14} /> {record.urgencia}
                    </div>

                    {(record.urgencia === 'Alta' || record.cliente_esperando) && (
                       <a 
                          href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                            record.cliente_esperando 
                              ? `🚨 *CLIENTE NA LOJA ESPERANDO!*\n\nFala, tudo bem?\nA peça *${record.produto_nome}* acabou e tem cliente no balcão aguardando a reposição ou previsão!\n\n_Enviado via App de Controle_` 
                              : `⚠️ *FALTA URGENTE!*\n\nFala, tudo bem?\nO estoque de *${record.produto_nome}* zerou por aqui na loja.\n\n_Enviado via App de Controle_`
                          )}`}
                          target="_blank" rel="noreferrer"
                          style={{
                            background: '#25D366', color: 'var(--text-primary)', textDecoration: 'none',
                            padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)',
                            fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.4rem', border: '1px solid #1da851'
                          }}
                          title="Avisar no WhatsApp"
                       >
                          <MessageCircle size={14} /> Avisar
                       </a>
                    )}

                    <div style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)', fontSize: '0.85rem', fontWeight: '600', border: '1px solid var(--border-color)', color: getStatusColor(record.status_compra) }}>
                      {record.status_compra}
                    </div>
                    {record.status_compra === 'Comprou' && (
                      <button 
                        onClick={() => markAsArrived(record.id)}
                        style={{
                          background: 'rgba(16, 185, 129, 0.2)', color: 'var(--status-green)',
                          border: '1px solid var(--status-green)', padding: '0.5rem',
                          borderRadius: 'var(--radius-full)', cursor: 'pointer',
                          display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600'
                        }}
                        title="Confirmar que o produto chegou"
                      >
                        <PackageCheck size={18} /> Chegou na Loja
                      </button>
                    )}

                    {record.vendedor_nome === user.nome && (
                      <button 
                        onClick={() => {
                          if (window.confirm('Tem certeza que deseja excluir este registro de falta?')) {
                            deleteRecord(record.id);
                          }
                        }}
                        style={{
                          background: 'transparent', color: 'var(--status-red)',
                          border: 'none', padding: '0.5rem',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                        title="Excluir este seu registro"
                      >
                        <Trash2 size={20} />
                      </button>
                    )}
                  </div>

                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </Layout>
  );
}
