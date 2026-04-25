import React, { useState, useRef } from 'react';
import Layout from '../components/Layout';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Search, PlusCircle, Edit, ShoppingCart, Camera, X } from 'lucide-react';

export default function ProductsCatalog() {
  const { products, updateProduct, addProduct, addRecord, addProductsBulk } = useData();
  const { user } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSetor, setSelectedSetor] = useState('Todos');

  // Modals state
  const [editingProduct, setEditingProduct] = useState(null);
  const [shortageProduct, setShortageProduct] = useState(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState('');

  // Form State - Shortage
  const [qtdAtual, setQtdAtual] = useState('');
  const [fotoPreview, setFotoPreview] = useState(null);
  const fileInputRef = useRef(null);

  // Form State - Edit/Add Product
  const [prodNome, setProdNome] = useState('');
  const [prodSetor, setProdSetor] = useState('');
  const [prodError, setProdError] = useState('');

  // Extract unique sectors
  const setores = ['Todos', ...new Set(products.map(p => p.setor).filter(Boolean))];

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

  const filteredProducts = products.filter(p => {
    const matchName = smartSearch(p.nome, searchTerm);
    const matchSetor = selectedSetor === 'Todos' || p.setor === selectedSetor;
    return matchName && matchSetor;
  });

  const handleEditClick = (prod) => {
    setProdNome(prod.nome);
    setProdSetor(prod.setor);
    setEditingProduct(prod.id);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!prodNome || !prodSetor) return;
    updateProduct(editingProduct, prodNome, prodSetor);
    setEditingProduct(null);
  };

  const handleCreateProduct = (e) => {
    e.preventDefault();
    setProdError('');

    if (isBulkMode) {
      if (!bulkText.trim()) {
        setProdError('Você precisa adicionar pelo menos um produto na lista.');
        return;
      }
      const lines = bulkText.split('\n');
      const count = addProductsBulk(lines, prodSetor);
      alert(`${count} produto(s) cadastrado(s) com sucesso!`);
      
      setIsAddingProduct(false);
      setIsBulkMode(false);
      setBulkText('');
      setProdNome('');
      setProdSetor('');
      return;
    }

    if (!prodNome || !prodSetor) return;
    try {
      addProduct(prodNome, prodSetor);
      setIsAddingProduct(false);
      setProdNome('');
      setProdSetor('');
    } catch (err) {
      setProdError(err.message);
    }
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

  const handleSubmitShortage = (e) => {
    e.preventDefault();
    if (!shortageProduct) return;

    addRecord({
      produto_nome: shortageProduct.nome,
      vendedor_nome: user.nome,
      vendedor_id: user.uid,
      setor: shortageProduct.setor,
      quantidade_atual: qtdAtual ? Number(qtdAtual) : 0,
      quantidade_ideal: null,
      chegou: false,
      foto: fotoPreview
    });

    setShortageProduct(null);
    setQtdAtual('');
    setFotoPreview(null);
  };

  return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2>Catálogo de Produtos</h2>
        <button 
          onClick={() => { setProdNome(''); setProdSetor(''); setIsAddingProduct(true); }}
          style={{ background: 'var(--accent-blue)', color: 'var(--text-primary)', border: 'none', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <PlusCircle size={20} /> Novo Produto
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 300px', display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.5rem 1rem' }}>
            <Search size={18} color="var(--text-secondary)" style={{ marginRight: '0.5rem' }} />
            <input 
              type="text" 
              placeholder="Buscar por nome..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', width: '100%', outline: 'none' }}
            />
          </div>
          
          <select 
            value={selectedSetor} 
            onChange={e => setSelectedSetor(e.target.value)}
            style={{ flex: '0 1 250px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}
          >
            {setores.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', textAlign: 'left' }}>
              <th style={{ padding: '1rem 1.5rem' }}>Nome do Produto</th>
              <th style={{ padding: '1rem 1.5rem' }}>Setor/Categoria</th>
              <th style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>Ações Rápidas</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan="3" style={{ textAlign: 'center', padding: '2rem' }}>Nenhum produto listado.</td>
              </tr>
            ) : (
              filteredProducts.map(prod => (
                <tr key={prod.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem 1.5rem', fontWeight: 'bold' }}>{prod.nome}</td>
                  <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)' }}>{prod.setor}</td>
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button 
                         onClick={() => handleEditClick(prod)}
                         style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text-primary)', border: '1px solid transparent', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                      >
                         <Edit size={16} /> Editar
                      </button>
                      <button 
                         onClick={() => setShortageProduct(prod)}
                         style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--status-green)', border: '1px solid var(--status-green)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}
                      >
                         <ShoppingCart size={16} /> Avisar Falta
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Editor & Creator Modal */}
      {(editingProduct || isAddingProduct) && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2rem', background: 'var(--bg-secondary)', position: 'relative' }}>
            <button 
              onClick={() => { setEditingProduct(null); setIsAddingProduct(false); setIsBulkMode(false); setBulkText(''); }}
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
            <h3 style={{ marginBottom: '1.5rem' }}>{isAddingProduct ? 'Novo Produto' : 'Editar Produto'}</h3>
            
            {prodError && <div className="bg-red-soft" style={{ padding: '0.5rem', marginBottom: '1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>{prodError}</div>}

            {isAddingProduct && (
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', padding: '0.25rem', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)' }}>
                <button type="button" onClick={() => setIsBulkMode(false)} style={{ flex: 1, padding: '0.5rem', background: !isBulkMode ? 'var(--accent-blue)' : 'transparent', color: 'var(--text-primary)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: !isBulkMode ? 'bold' : 'normal' }}>Item Único</button>
                <button type="button" onClick={() => setIsBulkMode(true)} style={{ flex: 1, padding: '0.5rem', background: isBulkMode ? 'var(--accent-blue)' : 'transparent', color: 'var(--text-primary)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: isBulkMode ? 'bold' : 'normal' }}>Em Lote (Texto)</button>
              </div>
            )}

            <form onSubmit={isAddingProduct ? handleCreateProduct : handleSaveEdit} style={{ display: 'grid', gap: '1rem' }}>
              {isBulkMode ? (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Cole a lista (um item por linha)</label>
                  <textarea 
                    required 
                    value={bulkText} 
                    onChange={e => setBulkText(e.target.value)} 
                    placeholder="Exatamente como no bloco de notas:&#10;CIMENTO POTY 50KG&#10;PARAFUSO EXEMPLO 1" 
                    rows="6" 
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', resize: 'vertical', fontFamily: 'monospace' }} 
                  />
                </div>
              ) : (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Nome da Peça/Produto</label>
                  <input type="text" required value={prodNome} onChange={e => setProdNome(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                </div>
              )}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Setor Base {isBulkMode && '(Aplicado a todos)'}</label>
                <input type="text" required={!isBulkMode} value={prodSetor} onChange={e => setProdSetor(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
              </div>
              <button type="submit" style={{ padding: '0.75rem', fontWeight: 'bold', border: 'none', borderRadius: 'var(--radius-sm)', background: 'var(--accent-blue)', color: 'var(--text-primary)', cursor: 'pointer', marginTop: '0.5rem' }}>
                Salvar Catálogo
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Shortage Fast Track Modal */}
      {shortageProduct && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2rem', background: 'var(--bg-secondary)', position: 'relative', borderTop: '4px solid var(--status-yellow)' }}>
            <button 
              onClick={() => { setShortageProduct(null); setFotoPreview(null); }}
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
            
            <h3 style={{ marginBottom: '0.5rem' }}>Lançar Falta Rápida</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Produto: <strong>{shortageProduct.nome}</strong></p>

            <form onSubmit={handleSubmitShortage} style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Quantidade Atual (Estoque real agora)</label>
                <input type="number" min="0" value={qtdAtual} onChange={e => setQtdAtual(e.target.value)} placeholder="Opcional. Padrão: 0" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '1.2rem' }} />
              </div>

              <div>
                <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
                {!fotoPreview ? (
                  <button type="button" onClick={() => fileInputRef.current.click()} style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', padding: '0.75rem', width: '100%', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <Camera size={20} /> Anexar Foto Opcional
                  </button>
                ) : (
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img src={fotoPreview} alt="Preview" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '2px solid var(--accent-blue)' }} />
                    <button type="button" onClick={() => setFotoPreview(null)} style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--status-red)', color: 'var(--text-primary)', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>

              <button type="submit" style={{ padding: '1rem', fontWeight: 'bold', border: 'none', borderRadius: 'var(--radius-sm)', background: 'var(--status-green)', color: 'var(--text-primary)', cursor: 'pointer', marginTop: '1rem', fontSize: '1.1rem' }}>
                Enviar para o Comprador
              </button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
