import React, { useState, useRef } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { PlusCircle, Package, Clock, Camera, X, CheckCircle, AlertTriangle, Sparkles, Building2, Eye, Lock, ShoppingCart, Send, UserPlus, Users, Trash2, FileCode } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import DanfeModal from '../components/DanfeModal';

export default function FilialPanel() {
  const { user, usersInfo, registerUser, deleteUser } = useAuth();
  const { products, records, addRecord, deleteRecord, addFilialPurchase, filialPurchases } = useData();

  const [produtoName, setProdutoName] = useState('');
  const [qtdAtual, setQtdAtual] = useState('');
  const [qtdIdeal, setQtdIdeal] = useState('');
  const [clienteEsperando, setClienteEsperando] = useState(false);
  const [fotoPreview, setFotoPreview] = useState(null);
  const fileInputRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('filial'); // 'filial' | 'matriz' | 'compras_diretas'
  const [showDanfeModal, setShowDanfeModal] = useState(false);

  // State for Direct Purchase Form (Multi-product support)
  const [directSupplier, setDirectSupplier] = useState('');
  const [directItems, setDirectItems] = useState([
    { id: 1, produto_nome: '', quantidade: '', valor_unitario: '' }
  ]);
  const [directSuccessMsg, setDirectSuccessMsg] = useState('');

  const handleAddDirectItem = () => {
    setDirectItems(prev => [
      ...prev,
      { id: Date.now(), produto_nome: '', quantidade: '', valor_unitario: '' }
    ]);
  };

  const handleRemoveDirectItem = (id) => {
    if (directItems.length <= 1) return;
    setDirectItems(prev => prev.filter(item => item.id !== id));
  };

  const handleItemChange = (id, field, value) => {
    setDirectItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleAddDirectPurchase = (e) => {
    e.preventDefault();
    if (!directSupplier.trim()) {
      alert('Por favor, informe o nome do fornecedor.');
      return;
    }

    const validItems = directItems.filter(item => item.produto_nome.trim().length > 0);
    if (validItems.length === 0) {
      alert('Por favor, preencha pelo menos um produto.');
      return;
    }

    validItems.forEach(item => {
      addFilialPurchase({
        produto_nome: item.produto_nome.trim().toUpperCase(),
        fornecedor: directSupplier.trim().toUpperCase(),
        quantidade: item.quantidade ? Number(item.quantidade) : 1,
        valor_unitario: item.valor_unitario ? Number(item.valor_unitario) : 0,
        comprador_nome: user?.nome || 'ADMIN KI MADEIRAS'
      });
    });

    setDirectSuccessMsg(`✅ Compra de ${validItems.length} produto(s) no fornecedor "${directSupplier.toUpperCase()}" registrada com sucesso! Notificação enviada para as Notificações e para o Admin Geral Juliano.`);
    setDirectSupplier('');
    setDirectItems([{ id: Date.now(), produto_nome: '', quantidade: '', valor_unitario: '' }]);
    setTimeout(() => setDirectSuccessMsg(''), 6000);
  };

  // State for Filial Seller Registration (Admin Ki Madeiras)
  const [newSellerUsername, setNewSellerUsername] = useState('');
  const [newSellerNome, setNewSellerNome] = useState('');
  const [newSellerSetor, setNewSellerSetor] = useState('Balcão Filial');
  const [newSellerPassword, setNewSellerPassword] = useState('123');
  const [sellerError, setSellerError] = useState('');
  const [sellerSuccess, setSellerSuccess] = useState('');

  const handleRegisterFilialSeller = (e) => {
    e.preventDefault();
    setSellerError('');
    setSellerSuccess('');
    if (!newSellerUsername.trim() || !newSellerNome.trim()) return;

    const res = registerUser({
      username: newSellerUsername.trim(),
      nome: newSellerNome.trim(),
      setor: newSellerSetor.trim(),
      password: newSellerPassword.trim() || '123',
      loja: 'Ki Madeiras',
      role: 'vendedor'
    });

    if (res && res.success === false) {
      setSellerError(res.message);
    } else {
      setSellerSuccess(`Vendedor(a) ${newSellerNome.toUpperCase()} cadastrado com sucesso para a Filial Ki Madeiras!`);
      setNewSellerUsername('');
      setNewSellerNome('');
      setNewSellerSetor('Balcão Filial');
      setNewSellerPassword('123');
      setTimeout(() => setSellerSuccess(''), 4000);
    }
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!produtoName.trim()) return;

    const prod = products.find(p => p.nome.toLowerCase() === produtoName.trim().toLowerCase());

    addRecord({
      produto_nome: produtoName.trim().toUpperCase(),
      vendedor_nome: user?.nome || 'VENDEDOR KI MADEIRAS',
      vendedor_id: user?.uid,
      setor: prod ? prod.setor : user?.setor || 'GERAL',
      loja: 'Ki Madeiras',
      quantidade_atual: qtdAtual ? Number(qtdAtual) : 0,
      quantidade_ideal: qtdIdeal ? Number(qtdIdeal) : null,
      chegou: false,
      cliente_esperando: clienteEsperando,
      foto: fotoPreview,
      status_compra: 'Pendente'
    });

    setProdutoName('');
    setQtdAtual('');
    setQtdIdeal('');
    setClienteEsperando(false);
    setFotoPreview(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // Records for Ki Madeiras
  const filialRecords = records.filter(r => (r.loja === 'Ki Madeiras' || r.vendedor_nome?.includes('Ki Madeiras')) && (!searchTerm || r.produto_nome.toLowerCase().includes(searchTerm.toLowerCase())));

  // Records for Matriz (Só Madeiras) - Read-only for Filial
  const matrizRecords = records.filter(r => (!r.loja || r.loja === 'Só Madeiras') && !r.chegou && (!searchTerm || r.produto_nome.toLowerCase().includes(searchTerm.toLowerCase())));

  // Sellers of Ki Madeiras ONLY (Filtered strictly)
  const filialSellers = (usersInfo || []).filter(u => u.loja === 'Ki Madeiras' && u.role === 'vendedor');

  return (
    <Layout>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        
        {/* Header Filial Banner */}
        <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '4px solid var(--accent-blue)', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Building2 size={24} color="var(--accent-blue)" />
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Painel da Filial Ki Madeiras</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {user?.role === 'admin_filial' ? 'Gestão da Filial Ki Madeiras: insira compras efetuadas, cadastre vendedores da filial e consulte faltas da matriz.' : 'Registre mercadorias em falta nesta filial para sincronização com a matriz.'}
              </p>
            </div>
          </div>
          <div style={{ background: 'rgba(37,99,235,0.15)', color: 'var(--accent-blue)', padding: '0.35rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700 }}>
            {user?.role === 'admin_filial' ? 'CARGO: ADMIN KI MADEIRAS' : 'LOJA: KI MADEIRAS'}
          </div>
        </div>

        {/* Gestão de Vendedores da Filial Ki Madeiras (Disponível apenas para o Admin Ki Madeiras) */}
        {user?.role === 'admin_filial' && (
          <div className="glass-panel" style={{ padding: '1.75rem', background: 'rgba(30,41,59,0.7)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ background: 'var(--accent-blue)', padding: '0.5rem', borderRadius: 'var(--radius-full)', color: '#fff' }}>
                <UserPlus size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Cadastrar Vendedor da Filial Ki Madeiras</h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Cadastre novos vendedores exclusivos para a loja Ki Madeiras. Permissões restritas estritamente à filial.
                </p>
              </div>
            </div>

            {sellerSuccess && (
              <div style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid var(--status-green)', color: '#fff', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontWeight: 'bold', fontSize: '0.85rem' }}>
                {sellerSuccess}
              </div>
            )}
            {sellerError && (
              <div style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid var(--status-red)', color: '#fff', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontWeight: 'bold', fontSize: '0.85rem' }}>
                {sellerError}
              </div>
            )}

            <form onSubmit={handleRegisterFilialSeller} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'end', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Nome de Usuário (Login)</label>
                <input 
                  type="text"
                  placeholder="EX: joao_kimadeiras"
                  value={newSellerUsername}
                  onChange={e => setNewSellerUsername(e.target.value.toLowerCase().trim())}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.85rem' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Nome Completo do Vendedor</label>
                <input 
                  type="text"
                  placeholder="EX: JOÃO SILVA"
                  value={newSellerNome}
                  onChange={e => setNewSellerNome(e.target.value.toUpperCase())}
                  spellCheck={true}
                  lang="pt-BR"
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.85rem' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Setor</label>
                <input 
                  type="text"
                  placeholder="EX: BALCÃO FILIAL"
                  value={newSellerSetor}
                  onChange={e => setNewSellerSetor(e.target.value.toUpperCase())}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Senha de Acesso</label>
                <input 
                  type="text"
                  placeholder="Senha (padrão: 123)"
                  value={newSellerPassword}
                  onChange={e => setNewSellerPassword(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <button type="submit" style={{ width: '100%', background: 'var(--accent-blue)', color: '#fff', border: 'none', padding: '0.65rem 1rem', borderRadius: 'var(--radius-sm)', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <UserPlus size={16} /> Cadastrar Vendedor
                </button>
              </div>
            </form>

            {/* List of Ki Madeiras Sellers Only */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Users size={16} color="var(--accent-blue)" /> Vendedores Cadastrados na Ki Madeiras ({filialSellers.length})
              </div>

              {filialSellers.length === 0 ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Nenhum vendedor cadastrado ainda para a filial Ki Madeiras.</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                  {filialSellers.map(seller => (
                    <div key={seller.uid || seller.username} style={{ background: 'rgba(0,0,0,0.25)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '0.85rem' }}>{seller.nome}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Login: @{seller.username} • {seller.setor}</div>
                      </div>

                      <button
                        onClick={() => {
                          if (window.confirm(`Remover o vendedor ${seller.nome} da Filial Ki Madeiras?`)) {
                            deleteUser(seller.username);
                          }
                        }}
                        title="Excluir este vendedor da Filial"
                        style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--status-red)', border: '1px solid var(--status-red)', padding: '0.3rem 0.5rem', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* Lançamento de Compra Direta pelo Admin da Ki Madeiras (Múltiplos Produtos) */}
        <div className="glass-panel" style={{ padding: '1.75rem', background: 'linear-gradient(135deg, rgba(37,99,235,0.1) 0%, rgba(30,41,59,0.7) 100%)', border: '1px solid var(--accent-blue)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ background: 'var(--accent-blue)', padding: '0.6rem', borderRadius: '10px', color: '#fff' }}>
                <ShoppingCart size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>
                  Lançar Compra Efetuada Direto pela Ki Madeiras (Múltiplos Itens)
                </h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Insira manualmente os produtos comprados. Ao clicar no botão de "+", o fornecedor é mantido automaticamente para todos os itens da compra!
                </p>
              </div>
            </div>
          </div>

          {directSuccessMsg && (
            <div style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid var(--status-green)', color: '#fff', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontWeight: 'bold', fontSize: '0.85rem' }}>
              {directSuccessMsg}
            </div>
          )}

          <form onSubmit={handleAddDirectPurchase} style={{ display: 'grid', gap: '1.25rem' }}>
            {/* Fornecedor da Compra (Compartilhado) */}
            <div style={{ maxWidth: '420px' }}>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', color: '#fff', fontWeight: 'bold' }}>
                🏢 Nome do Fornecedor / Distribuidora *
              </label>
              <input 
                type="text"
                placeholder="EX: TINTAS & CIA, ATACADÃO..."
                value={directSupplier}
                onChange={e => setDirectSupplier(e.target.value.toUpperCase())}
                spellCheck={true}
                lang="pt-BR"
                style={{ width: '100%', padding: '0.75rem 0.9rem', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--accent-blue)', color: '#fff', fontSize: '0.9rem', fontWeight: 'bold' }}
                required
              />
            </div>

            {/* Lista Dinâmica de Produtos da Compra */}
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'bold', textTransform: 'uppercase' }}>
                📦 Produtos desta Compra ({directItems.length} item(ns)):
              </label>

              {directItems.map((item, idx) => (
                <div key={item.id} style={{ background: 'rgba(0,0,0,0.25)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr)) auto', gap: '1rem', alignItems: 'end' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                      Produto #{idx + 1} *
                    </label>
                    <input 
                      type="text"
                      placeholder="EX: TINTAS SUVINIL 18L"
                      value={item.produto_nome}
                      onChange={e => handleItemChange(item.id, 'produto_nome', e.target.value.toUpperCase())}
                      spellCheck={true}
                      lang="pt-BR"
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.85rem' }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                      Quantidade
                    </label>
                    <input 
                      type="number"
                      placeholder="EX: 10"
                      min="1"
                      value={item.quantidade}
                      onChange={e => handleItemChange(item.id, 'quantidade', e.target.value)}
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.85rem' }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                      Valor Unitário (R$)
                    </label>
                    <input 
                      type="number"
                      step="0.01"
                      placeholder="EX: 280.00"
                      value={item.valor_unitario}
                      onChange={e => handleItemChange(item.id, 'valor_unitario', e.target.value)}
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.85rem' }}
                    />
                  </div>

                  {directItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveDirectItem(item.id)}
                      title="Remover este produto da compra"
                      style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--status-red)', border: '1px solid var(--status-red)', padding: '0.65rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Buttons: + Adicionar Produto e Submit */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={handleAddDirectItem}
                style={{ background: 'rgba(59,130,246,0.15)', color: 'var(--accent-blue)', border: '1px solid var(--accent-blue)', padding: '0.65rem 1.25rem', borderRadius: 'var(--radius-sm)', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}
              >
                ➕ Adicionar Outro Produto nesta Compra
              </button>

              <button
                type="submit"
                style={{ background: 'var(--accent-blue)', color: '#fff', border: 'none', padding: '0.75rem 1.75rem', borderRadius: 'var(--radius-sm)', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}
              >
                <Send size={16} /> Registrar Compra ({directItems.length} produto{directItems.length > 1 ? 's' : ''})
              </button>
            </div>
          </form>
        </div>

        {/* Registration Form for Missing Items */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'var(--bg-secondary)', padding: '0.5rem', borderRadius: 'var(--radius-full)'}}>
              <PlusCircle size={24} color="var(--accent-blue)" />
            </div>
            <h3>Anotar Falta na Filial Ki Madeiras</h3>
          </div>

          <form onSubmit={handleAdd} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Nome do Produto em Falta</label>
              <input 
                type="text" 
                value={produtoName}
                onChange={(e) => setProdutoName(e.target.value.toUpperCase())}
                spellCheck={true}
                lang="pt-BR"
                placeholder="EX: TÁBUA DE PINUS, VIGA 6X12, CIMENTO..."
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', textTransform: 'uppercase' }}
                required 
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Quantidade Atual na Filial</label>
              <input 
                type="number" 
                value={qtdAtual}
                onChange={(e) => setQtdAtual(e.target.value)}
                placeholder="0"
                min="0"
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Quantidade Ideal Desejada</label>
              <input 
                type="number" 
                value={qtdIdeal}
                onChange={(e) => setQtdIdeal(e.target.value)}
                placeholder="Ex: 20"
                min="1"
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '1rem', gridColumn: '1 / -1' }}>
              <input 
                type="checkbox" 
                id="cliente_esperando_filial"
                checked={clienteEsperando}
                onChange={(e) => setClienteEsperando(e.target.checked)}
                style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--status-red)' }}
              />
              <label htmlFor="cliente_esperando_filial" style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                🚨 Cliente Esperando no Balcão da Filial
              </label>
            </div>

            {/* Foto e Submit */}
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
                {!fotoPreview ? (
                  <button type="button" onClick={() => fileInputRef.current.click()} style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text-primary)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600' }}>
                    <Camera size={20} /> Anexar Foto
                  </button>
                ) : (
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img src={fotoPreview} alt="Preview" style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                    <button type="button" onClick={() => setFotoPreview(null)} style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--status-red)', color: '#fff', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={12} /></button>
                  </div>
                )}
              </div>

              <button type="submit" style={{ background: 'var(--accent-blue)', color: 'var(--text-primary)', padding: '0.75rem 2rem', borderRadius: 'var(--radius-md)', border: 'none', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <PlusCircle size={20} /> Anotar Falta para Matriz
              </button>
            </div>

          </form>
        </div>

        {/* Tab Buttons: Filial Items vs Matriz Items Read-Only */}
        <div className="glass-panel" style={{ padding: '1rem 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => setActiveTab('filial')}
                style={{
                  padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem',
                  background: activeTab === 'filial' ? 'var(--accent-blue)' : 'rgba(255,255,255,0.05)',
                  color: activeTab === 'filial' ? '#fff' : 'var(--text-secondary)',
                  display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}
              >
                <Package size={18} /> Solicitados por Ki Madeiras ({filialRecords.length})
              </button>

              <button
                onClick={() => setActiveTab('matriz')}
                style={{
                  padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem',
                  background: activeTab === 'matriz' ? 'var(--status-yellow)' : 'rgba(255,255,255,0.05)',
                  color: activeTab === 'matriz' ? '#000' : 'var(--text-secondary)',
                  display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}
              >
                <Eye size={18} /> 🏢 Faltas da Matriz - Só Madeiras ({matrizRecords.length})
                <span style={{ fontSize: '0.65rem', background: 'rgba(0,0,0,0.2)', padding: '0.1rem 0.4rem', borderRadius: '4px', border: '1px solid currentColor' }}>
                  Apenas Leitura
                </span>
              </button>

              <button
                onClick={() => setActiveTab('compras_diretas')}
                style={{
                  padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem',
                  background: activeTab === 'compras_diretas' ? 'var(--status-green)' : 'rgba(255,255,255,0.05)',
                  color: activeTab === 'compras_diretas' ? '#fff' : 'var(--text-secondary)',
                  display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}
              >
                <ShoppingCart size={18} /> 🛒 Compras Diretas Filial ({(filialPurchases || []).length})
              </button>
            </div>

            <input 
              type="text" 
              placeholder="Buscar produto..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', width: '220px' }}
            />
          </div>

          {/* TAB 1: FILIAL KI MADEIRAS (Com Gestão Ativa) */}
          {activeTab === 'filial' && (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {filialRecords.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  Nenhum registro de falta anotado pela filial Ki Madeiras no momento.
                </div>
              ) : (
                filialRecords.map(record => (
                  <div key={record.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: '1 1 250px' }}>
                      <div style={{ fontWeight: '600', fontSize: '1.1rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {record.produto_nome}
                        {record.cliente_esperando && (
                          <span style={{ fontSize: '0.65rem', background: 'var(--status-red)', color: '#fff', padding: '0.2rem 0.4rem', borderRadius: '4px', textTransform: 'uppercase' }}>🚨 Cliente Esperando</span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={14} /> Solicitado em {format(parseISO(record.data_criacao), "dd/MM 'às' HH:mm", { locale: ptBR })}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <div style={{ textAlign: 'center', background: 'rgba(0,0,0,0.2)', padding: '0.5rem 0.8rem', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Estoque Filial</div>
                        <div style={{ fontWeight: 'bold' }}>{record.quantidade_atual} / {record.quantidade_ideal || '—'}</div>
                      </div>

                      {/* Status Badge from Matriz */}
                      <div style={{
                        padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)', fontSize: '0.85rem', fontWeight: 700,
                        background: record.chegou ? 'rgba(16,185,129,0.2)' : record.status_compra === 'Em Separação na Matriz' ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)',
                        color: record.chegou ? 'var(--status-green)' : record.status_compra === 'Em Separação na Matriz' ? 'var(--accent-blue)' : 'var(--text-secondary)',
                        border: `1px solid ${record.chegou ? 'var(--status-green)' : record.status_compra === 'Em Separação na Matriz' ? 'var(--accent-blue)' : 'var(--border-color)'}`
                      }}>
                        {record.chegou ? '✓ O produto que você solicitou chegou!' : record.status_compra || 'Aguardando Matriz'}
                      </div>

                      {record.chegou && (
                        <button
                          onClick={() => deleteRecord(record.id)}
                          style={{ background: 'var(--status-green)', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          Dar Baixa (Recebido)
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: MATRIZ SÓ MADEIRAS (APENAS VISUALIZAÇÃO - SEM INTERAÇÃO) */}
          {activeTab === 'matriz' && (
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid var(--status-yellow)', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: 'var(--status-yellow)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                <Lock size={18} /> Lista de Faltas da Matriz (Só Madeiras) — Modo de Leitura/Consulta. Nenhuma alteração é permitida nesta aba.
              </div>

              {matrizRecords.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  Nenhuma falta cadastrada na Matriz (Só Madeiras) no momento.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                        <th style={{ padding: '0.75rem' }}>Produto (Matriz)</th>
                        <th style={{ padding: '0.75rem' }}>Setor</th>
                        <th style={{ padding: '0.75rem' }}>Solicitante (Vendedor)</th>
                        <th style={{ padding: '0.75rem', textAlign: 'center' }}>Estoque / Ideal</th>
                        <th style={{ padding: '0.75rem', textAlign: 'center' }}>Urgência</th>
                        <th style={{ padding: '0.75rem', textAlign: 'center' }}>Status Compra</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right' }}>Acesso</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matrizRecords.map(record => {
                        const daysWaiting = differenceInDays(new Date(), parseISO(record.data_criacao));

                        return (
                          <tr key={record.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', opacity: 0.9 }}>
                            <td style={{ padding: '0.85rem 0.75rem', fontWeight: 'bold', color: '#fff' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                {record.produto_nome}
                                {record.cliente_esperando && (
                                  <span style={{ fontSize: '0.65rem', background: 'var(--status-red)', color: '#fff', padding: '0.15rem 0.35rem', borderRadius: '4px' }}>🚨 Cliente Esperando</span>
                                )}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
                                Cadastrado há {daysWaiting} {daysWaiting === 1 ? 'dia' : 'dias'}
                              </div>
                            </td>

                            <td style={{ padding: '0.85rem 0.75rem', color: 'var(--text-secondary)' }}>
                              {record.setor || 'Geral'}
                            </td>

                            <td style={{ padding: '0.85rem 0.75rem', color: '#fff' }}>
                              {record.vendedor_nome}
                            </td>

                            <td style={{ padding: '0.85rem 0.75rem', textAlign: 'center', fontWeight: 'bold' }}>
                              {record.quantidade_atual} / {record.quantidade_ideal || '—'}
                            </td>

                            <td style={{ padding: '0.85rem 0.75rem', textAlign: 'center' }}>
                              {record.urgencia === 'Alta' && <span style={{ color: 'var(--status-red)', fontWeight: 'bold' }}>Alta</span>}
                              {record.urgencia === 'Média' && <span style={{ color: 'var(--status-yellow)' }}>Média</span>}
                              {record.urgencia === 'Baixa' && <span style={{ color: 'var(--status-green)' }}>Baixa</span>}
                            </td>

                            <td style={{ padding: '0.85rem 0.75rem', textAlign: 'center' }}>
                              <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
                                {record.status_compra || 'Pendente'}
                              </span>
                            </td>

                            <td style={{ padding: '0.85rem 0.75rem', textAlign: 'right' }}>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                                <Lock size={12} /> Apenas Leitura
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: COMPRAS DIRETAS DA KI MADEIRAS */}
          {activeTab === 'compras_diretas' && (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {(filialPurchases || []).length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  Nenhuma compra direta registrada pelo Admin da Ki Madeiras ainda.
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
                        <th style={{ padding: '0.75rem', textAlign: 'right' }}>Total (R$)</th>
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

      </div>
    </Layout>
  );
}
