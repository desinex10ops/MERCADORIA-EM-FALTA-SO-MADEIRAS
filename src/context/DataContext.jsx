import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { correctSpellingAndUppercase } from '../lib/spellChecker';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

const normalizeQuote = (q) => ({
  id: q.id || uuidv4(),
  storeName: q.storeName || q.store_id || 'Só Madeiras',
  quoteLinkId: q.quoteLinkId || q.quote_link_id || 'default',
  supplierName: q.supplierName || q.supplier_name || 'Fornecedor',
  supplierPhone: q.supplierPhone || q.supplier_phone || '',
  deliveryDate: q.deliveryDate || q.delivery_date || '',
  items: q.items || [],
  totalValue: Number(q.totalValue ?? q.total_value ?? 0),
  created_at: q.created_at || new Date().toISOString(),
  status: q.status || 'Pendente'
});

const enrichRecordWithStore = (r) => {
  if (!r) return r;
  return {
    ...r,
    loja: r.loja || 'Só Madeiras'
  };
};

const defaultSuppliersList = [
  { id: 'sup_1', nome: 'ATACADÃO MADEIRAS', representante: 'João Silva', telefone: '(79) 99811-2233', email: 'joao@atacadaomadeiras.com.br', ultimaCotacao: new Date().toISOString(), totalCotacoes: 5 },
  { id: 'sup_2', nome: 'DISTRIBUIDORA ESTÂNCIA', representante: 'Carlos Eduardo', telefone: '(79) 99122-4455', email: 'carlos@estancia.com.br', ultimaCotacao: new Date().toISOString(), totalCotacoes: 3 },
  { id: 'sup_3', nome: 'MEGA FORNECIMENTOS', representante: 'Luciana Santos', telefone: '(79) 98877-6655', email: 'luciana@mega.com.br', ultimaCotacao: new Date().toISOString(), totalCotacoes: 4 },
  { id: 'sup_4', nome: 'MADEIREIRA RIO REAL', representante: 'Marcos Oliveira', telefone: '(79) 99655-3322', email: 'marcos@rioreal.com.br', ultimaCotacao: new Date().toISOString(), totalCotacoes: 2 },
  { id: 'sup_5', nome: 'GIGA ATACADO DA CONSTRUÇÃO', representante: 'Fernando Costa', telefone: '(79) 98111-9988', email: 'fernando@giga.com.br', ultimaCotacao: new Date().toISOString(), totalCotacoes: 6 }
];

const defaultProductsList = [
  { id: 'p1', nome: 'CIMENTO VOTORANTIM 50KG', setor: 'Básico' },
  { id: 'p2', nome: 'TUBO PVC 100MM TIGRE', setor: 'Hidráulica' },
  { id: 'p3', nome: 'FIO FLEXÍVEL 2.5MM SIL', setor: 'Elétrica' },
  { id: 'p4', nome: 'TINTA ACRÍLICA CORAL 18L', setor: 'Pintura' },
  { id: 'p5', nome: 'ARGAMASSA ACIII QUARTZOLIT', setor: 'Básico' },
  { id: 'p6', nome: 'COMPENSADO NAVAL 18MM 2.20X1.60M', setor: 'Marcenaria' },
  { id: 'p7', nome: 'MDF BRANCO TX 15MM 2.75X1.85M', setor: 'Marcenaria' },
  { id: 'p8', nome: 'DISCO DE CORTE 4.1/2 POL NORTON', setor: 'Ferramentas' },
  { id: 'p9', nome: 'PREGO COM CABEÇA 18X27 1KG', setor: 'Ferragens' },
  { id: 'p10', nome: 'FECHADURA STAM ROSETTA INOX', setor: 'Ferragens' }
];

const defaultRecordsList = [
  {
    id: 'rec_1',
    produto_nome: 'COMPENSADO NAVAL 18MM 2.20X1.60M',
    vendedor_nome: 'Mateus (Vendedor)',
    setor: 'Marcenaria',
    quantidade_atual: 2,
    quantidade_ideal: 20,
    urgencia: 'Alta',
    status_compra: 'Pendente',
    chegou: false,
    cliente_esperando: true,
    data_criacao: new Date().toISOString(),
    data_atualizacao: new Date().toISOString()
  },
  {
    id: 'rec_2',
    produto_nome: 'MDF BRANCO TX 15MM 2.75X1.85M',
    vendedor_nome: 'Mateus (Vendedor)',
    setor: 'Marcenaria',
    quantidade_atual: 5,
    quantidade_ideal: 30,
    urgencia: 'Média',
    status_compra: 'Pendente',
    chegou: false,
    cliente_esperando: false,
    data_criacao: new Date().toISOString(),
    data_atualizacao: new Date().toISOString()
  },
  {
    id: 'rec_3',
    produto_nome: 'CIMENTO VOTORANTIM 50KG',
    vendedor_nome: 'Carlos (Cotador)',
    setor: 'Básico',
    quantidade_atual: 0,
    quantidade_ideal: 50,
    urgencia: 'Alta',
    status_compra: 'Cotando',
    chegou: false,
    cliente_esperando: true,
    data_criacao: new Date().toISOString(),
    data_atualizacao: new Date().toISOString()
  }
];

const defaultPurchasesList = [
  {
    id: 'pur_1',
    record_id: 'rec_demo_1',
    produto_nome: 'COMPENSADO NAVAL 18MM 2.20X1.60M',
    fornecedor: 'MADEIREIRA RIO REAL',
    valor_unitario: 145.00,
    quantidade: 15,
    valor_total: 2175.00,
    data_compra: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'pur_2',
    record_id: 'rec_demo_2',
    produto_nome: 'MDF BRANCO TX 15MM 2.75X1.85M',
    fornecedor: 'ATACADÃO MADEIRAS',
    valor_unitario: 180.00,
    quantidade: 25,
    valor_total: 4500.00,
    data_compra: new Date(Date.now() - 86400000 * 4).toISOString()
  },
  {
    id: 'pur_3',
    record_id: 'rec_demo_3',
    produto_nome: 'CIMENTO VOTORANTIM 50KG',
    fornecedor: 'GIGA ATACADO DA CONSTRUÇÃO',
    valor_unitario: 34.50,
    quantidade: 50,
    valor_total: 1725.00,
    data_compra: new Date(Date.now() - 86400000 * 6).toISOString()
  }
];

export const DataProvider = ({ children }) => {
  const [records, setRecords] = useState(() => {
    const storedRecords = localStorage.getItem('@MercadoriaData:records');
    if (storedRecords) {
      try {
        const parsed = JSON.parse(storedRecords);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(enrichRecordWithStore);
        }
      } catch {}
    }
    localStorage.setItem('@MercadoriaData:records', JSON.stringify(defaultRecordsList));
    return defaultRecordsList;
  });
  const [purchases, setPurchases] = useState(() => {
    const storedPurchases = localStorage.getItem('@MercadoriaData:purchases');
    if (storedPurchases) {
      try {
        const parsed = JSON.parse(storedPurchases);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    localStorage.setItem('@MercadoriaData:purchases', JSON.stringify(defaultPurchasesList));
    return defaultPurchasesList;
  });
  const [products, setProducts] = useState(() => {
    const storedProducts = localStorage.getItem('@MercadoriaData:products');
    if (storedProducts) {
      try {
        const parsed = JSON.parse(storedProducts);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    localStorage.setItem('@MercadoriaData:products', JSON.stringify(defaultProductsList));
    return defaultProductsList;
  });
  const [deletedSupplierIds, setDeletedSupplierIds] = useState(() => {
    const saved = localStorage.getItem('@MercadoriaData:deleted_supplier_ids');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  const [suppliers, setSuppliers] = useState(() => {
    const saved = localStorage.getItem('@MercadoriaData:suppliers');
    const delSaved = localStorage.getItem('@MercadoriaData:deleted_supplier_ids');
    const delList = delSaved ? (JSON.parse(delSaved) || []) : [];

    let baseList = defaultSuppliersList;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) baseList = parsed;
      } catch (e) {}
    }
    return baseList.filter(s => !delList.includes(s.id) && !delList.includes((s.nome || '').toLowerCase().trim()));
  });
  const [supplierQuotes, setSupplierQuotes] = useState([]);
  const [economyHistory, setEconomyHistory] = useState([]);
  const [readNotificationIds, setReadNotificationIds] = useState(() => {
    const saved = localStorage.getItem('@MercadoriaData:read_notifications');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });
  const [loading, setLoading] = useState(true);

  // Load records, quotes and economy from local storage and Supabase
  useEffect(() => {
    const storedRecords = localStorage.getItem('@MercadoriaData:records');
    if (storedRecords) {
      try { setRecords(JSON.parse(storedRecords)); } catch {}
    }

    const storedPurchases = localStorage.getItem('@MercadoriaData:purchases');
    if (storedPurchases) setPurchases(JSON.parse(storedPurchases));

    const storedQuotes = localStorage.getItem('@MercadoriaData:supplier_quotes');
    if (storedQuotes) {
      try {
        const parsed = JSON.parse(storedQuotes);
        setSupplierQuotes(parsed.map(normalizeQuote));
      } catch {}
    }

    const storedEconomy = localStorage.getItem('@MercadoriaData:economy_history');
    if (storedEconomy) setEconomyHistory(JSON.parse(storedEconomy));

    const fetchData = async () => {
      try {
        const [{ data: localRecords }, { data: localProducts }, { data: localSuppliers }, { data: localQuotes }] = await Promise.all([
          supabase.from('records').select('*').order('data_criacao', { ascending: false }),
          supabase.from('products').select('*').order('created_at', { ascending: false }),
          supabase.from('suppliers').select('*').order('nome', { ascending: true }),
          supabase.from('supplier_quotes').select('*').order('created_at', { ascending: false })
        ]);
        if (localRecords) {
          setRecords(prev => {
            const enrichedDbRecords = localRecords.map(dbItem => {
              const localMatch = prev.find(p => p.id === dbItem.id);
              const base = localMatch ? { ...localMatch, ...dbItem } : dbItem;
              return enrichRecordWithStore(base);
            });

            const merged = [...enrichedDbRecords];
            prev.forEach(localItem => {
              const enrichedLocal = enrichRecordWithStore(localItem);
              if (!merged.some(dbItem => dbItem.id === enrichedLocal.id || (dbItem.produto_nome === enrichedLocal.produto_nome && dbItem.vendedor_nome === enrichedLocal.vendedor_nome && dbItem.data_criacao === enrichedLocal.data_criacao))) {
                merged.push(enrichedLocal);
              }
            });
            localStorage.setItem('@MercadoriaData:records', JSON.stringify(merged));
            return merged;
          });
        }
        if (localProducts && localProducts.length > 0) {
          setProducts(prev => {
            const map = new Map();
            localProducts.forEach(p => map.set(p.nome.toLowerCase().trim(), p));
            prev.forEach(p => {
              if (!map.has(p.nome.toLowerCase().trim())) {
                map.set(p.nome.toLowerCase().trim(), p);
              }
            });
            const merged = Array.from(map.values());
            localStorage.setItem('@MercadoriaData:products', JSON.stringify(merged));
            return merged;
          });
        }
        if (localSuppliers) {
          const delSaved = localStorage.getItem('@MercadoriaData:deleted_supplier_ids');
          const delList = delSaved ? (JSON.parse(delSaved) || []) : [];
          const filteredSuppliers = localSuppliers.filter(s => !delList.includes(s.id) && !delList.includes((s.nome || '').toLowerCase().trim()));
          setSuppliers(filteredSuppliers);
          localStorage.setItem('@MercadoriaData:suppliers', JSON.stringify(filteredSuppliers));
        }
        if (localQuotes && localQuotes.length > 0) {
          setSupplierQuotes(prev => {
            const normDb = localQuotes.map(normalizeQuote);
            const combined = [...prev];
            normDb.forEach(dbQ => {
              if (!combined.find(c => c.id === dbQ.id || (c.supplierName === dbQ.supplierName && c.totalValue === dbQ.totalValue))) {
                combined.push(dbQ);
              }
            });
            localStorage.setItem('@MercadoriaData:supplier_quotes', JSON.stringify(combined));
            return combined;
          });
        }
      } catch (err) {
        console.warn('Supabase fetch error, using local state:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const timer = setTimeout(() => setLoading(false), 1500);

    // Supabase Real-time Subscriptions!
    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'records' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setRecords(prev => {
            if (prev.find(r => r.id === payload.new.id)) return prev;
            return [payload.new, ...prev];
          });
        } else if (payload.eventType === 'UPDATE') {
          setRecords(prev => prev.map(r => r.id === payload.new.id ? payload.new : r));
        } else if (payload.eventType === 'DELETE') {
          setRecords(prev => prev.filter(r => r.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          saveProducts(prev => {
            if (prev.find(p => p.id === payload.new.id || p.nome.toLowerCase() === payload.new.nome.toLowerCase())) return prev;
            return [payload.new, ...prev];
          });
        } else if (payload.eventType === 'UPDATE') {
          saveProducts(prev => prev.map(r => r.id === payload.new.id ? payload.new : r));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'suppliers' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setSuppliers(prev => {
            if (prev.find(s => s.id === payload.new.id)) return prev;
            return [...prev, payload.new].sort((a, b) => a.nome.localeCompare(b.nome));
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const saveRecords = (updateFn) => {
    setRecords(prev => {
      const nextRecords = typeof updateFn === 'function' ? updateFn(prev) : updateFn;
      try {
        localStorage.setItem('@MercadoriaData:records', JSON.stringify(nextRecords));
      } catch (e) {
        console.warn('Error saving records to localStorage:', e);
      }
      return nextRecords;
    });
  };

  const savePurchases = (newPurchases) => {
    setPurchases(newPurchases);
    localStorage.setItem('@MercadoriaData:purchases', JSON.stringify(newPurchases));
  };

  const saveSupplierQuotes = (updateFn) => {
    setSupplierQuotes(prev => {
      const next = typeof updateFn === 'function' ? updateFn(prev) : updateFn;
      localStorage.setItem('@MercadoriaData:supplier_quotes', JSON.stringify(next));
      return next;
    });
  };

  const saveEconomyHistory = (newEconomy) => {
    setEconomyHistory(newEconomy);
    localStorage.setItem('@MercadoriaData:economy_history', JSON.stringify(newEconomy));
  };

  const saveProducts = (updateFn) => {
    setProducts(prev => {
      const next = typeof updateFn === 'function' ? updateFn(prev) : updateFn;
      try {
        localStorage.setItem('@MercadoriaData:products', JSON.stringify(next));
      } catch (e) {
        console.warn('Error saving products to localStorage:', e);
      }
      return next;
    });
  };

  const updateProduct = async (id, nome, setor) => {
    saveProducts(prev => prev.map(p => p.id === id ? { ...p, nome: nome.trim(), setor: setor.trim() } : p));
    try {
      await supabase.from('products').update({ nome: nome.trim(), setor: setor.trim() }).eq('id', id);
    } catch (e) {}
  };

  const addProduct = async (nome, setor) => {
    const nameStd = nome.trim().toLowerCase();
    if (products.find(p => p.nome.toLowerCase() === nameStd)) {
      throw new Error('Produto já existente no catálogo!');
    }
    const newProduct = {
      id: uuidv4(),
      nome: nome.trim(),
      setor: setor.trim() || 'Geral'
    };
    saveProducts(prev => [newProduct, ...prev.filter(p => p.id !== newProduct.id)]);
    
    try {
      const { data, error } = await supabase.from('products').insert([{ nome: newProduct.nome, setor: newProduct.setor }]).select();
      if (!error && data && data.length > 0) {
        saveProducts(prev => [data[0], ...prev.filter(p => p.id !== newProduct.id && p.id !== data[0].id)]);
        return data[0];
      }
    } catch (e) {
      console.warn('Saved product locally:', e);
    }
    return newProduct;
  };

  const addSupplier = (nome, representante, telefone, email, observacao) => {
    if (!nome || !nome.trim()) return;
    addOrUpdateSupplierContact({ nome, representante, telefone, email, observacao });
  };

  const addOrUpdateSupplierContact = (data) => {
    if (!data || !data.nome) return;
    const norm = (s) => (s || '').toLowerCase().trim();
    const searchName = norm(data.nome);

    setSuppliers(prev => {
      const existingIdx = prev.findIndex(s => norm(s.nome) === searchName || (data.telefone && norm(s.telefone) === norm(data.telefone)));

      let updatedList = [];
      if (existingIdx >= 0) {
        const existing = prev[existingIdx];
        const updatedItem = {
          ...existing,
          nome: data.nome.trim(),
          representante: data.representante ? data.representante.trim() : (existing.representante || 'Representante'),
          telefone: data.telefone ? data.telefone.trim() : (existing.telefone || ''),
          email: data.email ? data.email.trim() : (existing.email || ''),
          observacao: data.observacao ? data.observacao.trim() : (existing.observacao || ''),
          ultimaCotacao: new Date().toISOString(),
          totalCotacoes: (existing.totalCotacoes || 1) + 1
        };
        updatedList = [...prev];
        updatedList[existingIdx] = updatedItem;
      } else {
        const newItem = {
          id: uuidv4(),
          nome: data.nome.trim(),
          representante: data.representante ? data.representante.trim() : 'Representante de Vendas',
          telefone: data.telefone ? data.telefone.trim() : '',
          email: data.email ? data.email.trim() : '',
          observacao: data.observacao ? data.observacao.trim() : '',
          dataCadastro: new Date().toISOString(),
          ultimaCotacao: new Date().toISOString(),
          totalCotacoes: 1
        };
        updatedList = [newItem, ...prev];
      }

      localStorage.setItem('@MercadoriaData:suppliers', JSON.stringify(updatedList));
      return updatedList;
    });

    try {
      supabase.from('suppliers').insert([{
        nome: data.nome.trim(),
        representante: data.representante || '',
        telefone: data.telefone || ''
      }]).then();
    } catch (e) {}
  };

  const deleteSupplierContact = (id) => {
    let supplierToDelete = suppliers.find(s => s.id === id);
    const deletedIdentifiers = [id];
    if (supplierToDelete && supplierToDelete.nome) {
      deletedIdentifiers.push(supplierToDelete.nome.toLowerCase().trim());
    }

    setDeletedSupplierIds(prev => {
      const updatedDel = Array.from(new Set([...prev, ...deletedIdentifiers]));
      localStorage.setItem('@MercadoriaData:deleted_supplier_ids', JSON.stringify(updatedDel));
      return updatedDel;
    });

    setSuppliers(prev => {
      const updated = prev.filter(s => s.id !== id && (supplierToDelete ? s.nome?.toLowerCase().trim() !== supplierToDelete.nome?.toLowerCase().trim() : true));
      localStorage.setItem('@MercadoriaData:suppliers', JSON.stringify(updated));
      return updated;
    });

    try {
      supabase.from('suppliers').delete().eq('id', id).then();
    } catch (e) {}
  };

  const calculateUrgency = (atual, ideal) => {
    const numAtual = Number(atual);
    const numIdeal = ideal ? Number(ideal) : null;
    if (numAtual === 0) return 'Alta';
    if (!numIdeal) return 'Média'; // Fallback if no ideal
    if (numAtual < numIdeal * 0.3) return 'Alta';
    if (numAtual < numIdeal * 0.6) return 'Média';
    return 'Baixa';
  };

  const ALLOWED_DB_COLUMNS = [
    'id',
    'produto_nome',
    'vendedor_nome',
    'vendedor_id',
    'setor',
    'quantidade_atual',
    'quantidade_ideal',
    'chegou',
    'cliente_esperando',
    'foto',
    'urgencia',
    'status_compra',
    'data_criacao',
    'data_atualizacao',
    'comprador_nome'
  ];

  const sanitizeDbRecord = (record) => {
    const sanitized = {};
    ALLOWED_DB_COLUMNS.forEach(key => {
      if (record[key] !== undefined && record[key] !== null) {
        sanitized[key] = record[key];
      }
    });
    if (!sanitized.vendedor_id) {
      sanitized.vendedor_id = record.vendedor_id || 'u_vendedor_sistema';
    }
    return sanitized;
  };

  const addRecord = async (record) => {
    const formattedProductName = correctSpellingAndUppercase(record.produto_nome);
    const formattedSetor = correctSpellingAndUppercase(record.setor || 'Geral');
    const formattedVendedor = correctSpellingAndUppercase(record.vendedor_nome || '');

    const recordFormatted = {
      ...record,
      produto_nome: formattedProductName,
      setor: formattedSetor,
      vendedor_nome: formattedVendedor
    };

    const prodExists = products.find(p => p.nome.toLowerCase() === recordFormatted.produto_nome.toLowerCase());
    if (!prodExists) {
      const newProd = { id: uuidv4(), nome: recordFormatted.produto_nome, setor: recordFormatted.setor };
      setProducts(prev => [newProd, ...prev]);
      try {
        await supabase.from('products').insert([{ nome: recordFormatted.produto_nome, setor: recordFormatted.setor }]);
      } catch (e) {}
    }

    const urgency = calculateUrgency(recordFormatted.quantidade_atual, recordFormatted.quantidade_ideal);
    const newRecord = {
      id: recordFormatted.id || uuidv4(),
      ...recordFormatted,
      vendedor_id: recordFormatted.vendedor_id || 'u_vendedor_sistema',
      loja: recordFormatted.loja || 'Só Madeiras',
      urgencia: urgency,
      status_compra: recordFormatted.status_compra || 'Pendente',
      chegou: recordFormatted.chegou || false,
      data_criacao: new Date().toISOString(),
      data_atualizacao: new Date().toISOString(),
    };

    // Save immediately to React state AND localStorage so it is 100% persistent!
    saveRecords(prev => [newRecord, ...prev.filter(r => r.id !== newRecord.id)]);

    try {
      const dbInsert = sanitizeDbRecord(newRecord);
      delete dbInsert.id; // Let database assign ID or handle primary key
      const { data: insertedData, error } = await supabase.from('records').insert([dbInsert]).select();
      if (error) {
        console.warn('Supabase insert warning (record saved locally):', error);
      } else if (insertedData && insertedData.length > 0) {
        const fullRecord = { ...newRecord, ...insertedData[0] };
        saveRecords(prev => [fullRecord, ...prev.filter(r => r.id !== newRecord.id && r.id !== insertedData[0].id)]);
      }
    } catch (e) {
      console.warn('Saved record locally (Supabase exception):', e);
    }
  };

  const updateRecordStatus = async (id, newStatus) => {
    saveRecords(prev => prev.map(r => r.id === id ? { ...r, status_compra: newStatus, data_atualizacao: new Date().toISOString() } : r));
    try {
      const { error } = await supabase.from('records').update({ status_compra: newStatus, data_atualizacao: new Date().toISOString() }).eq('id', id);
      if (error) console.warn('Supabase update status warning:', error);
    } catch (e) {}
  };

  const markAsArrived = async (id) => {
    saveRecords(prev => prev.map(r => r.id === id ? { ...r, chegou: true, data_atualizacao: new Date().toISOString() } : r));
    try {
      const { error } = await supabase.from('records').update({ chegou: true, data_atualizacao: new Date().toISOString() }).eq('id', id);
      if (error) console.warn('Supabase mark arrived warning:', error);
    } catch (e) {}
  };

  const deleteRecord = async (id) => {
    saveRecords(prev => prev.filter(r => r.id !== id));
    try {
      const { error } = await supabase.from('records').delete().eq('id', id);
      if (error) console.warn('Supabase delete record warning:', error);
    } catch (e) {}
  };



  const addPurchase = (recordId, fornecedor, valorUnitario, quantidade) => {
    const record = records.find(r => r.id === recordId);
    const prodNome = record ? record.produto_nome : 'Produto';

    const newPurchase = {
      id: uuidv4(),
      record_id: recordId,
      produto_nome: prodNome,
      fornecedor,
      valor_unitario: Number(valorUnitario),
      quantidade: Number(quantidade),
      valor_total: Number(valorUnitario) * Number(quantidade),
      data_compra: new Date().toISOString()
    };

    savePurchases([newPurchase, ...purchases]);
    if (recordId) {
      updateRecordStatus(recordId, 'Comprou');
    }
    // Auto-save supplier
    addSupplier(fornecedor);
    return newPurchase;
  };

  const revertPurchaseToRecord = (recordId, currentUser) => {
    const record = records.find(r => r.id === recordId);
    if (!record) return { success: false, message: 'Registro não encontrado.' };

    const norm = (s) => (s || '').toLowerCase().trim();
    const currentName = norm(currentUser?.nome || currentUser?.username);
    const ownerName = norm(record.vendedor_nome);

    // STRICT PERMISSION: ONLY the exact seller who created this missing record can revert it! (Admin cannot)
    const isOwnerSeller = currentName === ownerName;

    if (!isOwnerSeller) {
      return {
        success: false,
        message: `⚠️ Permissão negada! Apenas o vendedor "${record.vendedor_nome}" (que deu a baixa) tem permissão para devolver este item.`
      };
    }

    saveRecords(prev => prev.map(r => r.id === recordId ? {
      ...r,
      chegou: false,
      status_compra: 'Pendente',
      data_atualizacao: new Date().toISOString()
    } : r));

    savePurchases(purchases.filter(p => p.record_id !== recordId));

    try {
      supabase.from('records').update({
        chegou: false,
        status_compra: 'Pendente',
        data_atualizacao: new Date().toISOString()
      }).eq('id', recordId).then();
    } catch (e) {}

    return { success: true, message: `Mercadoria "${record.produto_nome}" devolvida para a lista de faltas com sucesso!` };
  };

  const submitSupplierQuote = (quoteData) => {
    const newQuote = {
      id: uuidv4(),
      ...quoteData,
      created_at: new Date().toISOString()
    };
    saveSupplierQuotes(prev => [newQuote, ...prev]);

    // Auto-register representative contact into contact agenda!
    addOrUpdateSupplierContact({
      nome: quoteData.supplierName,
      representante: quoteData.representativeName || '',
      telefone: quoteData.supplierPhone || ''
    });
    
    try {
      supabase.from('supplier_quotes').insert([{
        store_id: quoteData.storeName || 'Só Madeiras',
        quote_link_id: quoteData.quoteLinkId || 'default',
        supplier_name: quoteData.supplierName,
        supplier_phone: quoteData.supplierPhone || '',
        items: quoteData.items,
        total_value: quoteData.totalValue || 0,
        delivery_date: quoteData.deliveryDate || ''
      }]).then();
    } catch (e) {}
    
    return newQuote;
  };

  const addMultipleSupplierQuotes = (quotesArray) => {
    const newQuotes = quotesArray.map(q => ({
      id: uuidv4(),
      ...q,
      created_at: new Date().toISOString()
    }));
    saveSupplierQuotes(prev => [...newQuotes, ...prev]);

    quotesArray.forEach(q => {
      addOrUpdateSupplierContact({
        nome: q.supplierName,
        representante: q.representativeName || '',
        telefone: q.supplierPhone || ''
      });
    });
  };

  const approveCheapestQuotes = (itemIds, quotesList) => {
    if (!itemIds || itemIds.length === 0 || !quotesList || quotesList.length === 0) return 0;

    let totalEconomiaGerada = 0;
    const newEconomyLogs = [];

    itemIds.forEach(recordId => {
      const record = records.find(r => r.id === recordId);
      if (!record) return;

      // Collect all quoted prices for this item
      const itemQuotes = [];
      quotesList.forEach(q => {
        const itemObj = (q.items || []).find(it => it.id === recordId || it.produto_nome === record.produto_nome);
        if (itemObj && itemObj.price && Number(itemObj.price) > 0) {
          itemQuotes.push({
            supplierName: q.supplierName,
            price: Number(itemObj.price),
            quantidade: itemObj.quantidade || (record.quantidade_ideal ? Math.max(record.quantidade_ideal - record.quantidade_atual, 1) : 10)
          });
        }
      });

      if (itemQuotes.length === 0) return;

      // Sort by price ascending to find the cheapest
      itemQuotes.sort((a, b) => a.price - b.price);
      const cheapest = itemQuotes[0];
      const highest = itemQuotes[itemQuotes.length - 1];

      // Calculate savings compared to highest quoted price (or baseline)
      const qty = cheapest.quantidade;
      const refPrice = itemQuotes.length > 1 ? highest.price : (cheapest.price * 1.15);
      const economiaItem = (refPrice - cheapest.price) * qty;

      // Launch purchase
      addPurchase(record.id, cheapest.supplierName, cheapest.price, qty);

      if (economiaItem > 0) {
        totalEconomiaGerada += economiaItem;
        newEconomyLogs.push({
          id: uuidv4(),
          data: new Date().toISOString(),
          produto_nome: record.produto_nome,
          fornecedor_vencedor: cheapest.supplierName,
          quantidade: qty,
          preco_pago: cheapest.price,
          preco_referencia: refPrice,
          total_pago: cheapest.price * qty,
          economia_bruta: economiaItem,
          percentual_economia: Math.round(((refPrice - cheapest.price) / refPrice) * 100)
        });
      }
    });

    if (newEconomyLogs.length > 0) {
      saveEconomyHistory([...newEconomyLogs, ...economyHistory]);
    }

    return totalEconomiaGerada;
  };

  const getProductPriceStats = (produto_nome) => {
    const prodPurchases = purchases.filter(p => p.produto_nome === produto_nome);
    if (prodPurchases.length === 0) return null;

    const lowestPurchase = prodPurchases.reduce((prev, curr) => (curr.valor_unitario < prev.valor_unitario ? curr : prev));
    const sortedByDate = [...prodPurchases].sort((a, b) => new Date(b.data_compra) - new Date(a.data_compra));
    const latestPurchase = sortedByDate[0];
    const avgPrice = prodPurchases.reduce((acc, curr) => acc + curr.valor_unitario, 0) / prodPurchases.length;

    return {
      historyCount: prodPurchases.length,
      menor_preco: lowestPurchase.valor_unitario,
      melhor_fornecedor: lowestPurchase.fornecedor,
      ultimo_preco: latestPurchase.valor_unitario,
      media_preco: avgPrice
    };
  };

  const getProductPriceHistory = (produto_nome) => {
    return purchases
      .filter(p => p.produto_nome === produto_nome)
      .sort((a, b) => new Date(b.data_compra) - new Date(a.data_compra))
      .slice(0, 100);
  };

  const addProductsBulk = async (lines, defaultSetor) => {
    let toInsertLocal = [];
    let toInsertDb = [];
    
    for (let line of lines) {
      const nameStd = line.trim().toLowerCase();
      if (!nameStd) continue;
      
      if (!products.find(p => p.nome.toLowerCase() === nameStd) && !toInsertLocal.find(p => p.nome.toLowerCase() === nameStd)) {
        const prodItem = {
          id: uuidv4(),
          nome: line.trim(),
          setor: defaultSetor || 'Geral'
        };
        toInsertLocal.push(prodItem);
        toInsertDb.push({
          nome: line.trim(),
          setor: defaultSetor || 'Geral'
        });
      }
    }
    
    if (toInsertLocal.length > 0) {
      saveProducts(prev => [...toInsertLocal, ...prev]);
      try {
        await supabase.from('products').insert(toInsertDb);
      } catch (e) {
        console.warn('Saved bulk products locally:', e);
      }
    }
    return toInsertLocal.length;
  };

  const clearSupplierQuotes = () => {
    setSupplierQuotes([]);
    localStorage.removeItem('@MercadoriaData:supplier_quotes');
  };

  const markNotificationAsRead = (id) => {
    setReadNotificationIds(prev => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      localStorage.setItem('@MercadoriaData:read_notifications', JSON.stringify(updated));
      return updated;
    });
  };

  const markAllNotificationsAsRead = (ids = []) => {
    setReadNotificationIds(prev => {
      const set = new Set([...prev, ...ids]);
      const updated = Array.from(set);
      localStorage.setItem('@MercadoriaData:read_notifications', JSON.stringify(updated));
      return updated;
    });
  };

  const toggleNotificationRead = (id) => {
    setReadNotificationIds(prev => {
      const updated = prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id];
      localStorage.setItem('@MercadoriaData:read_notifications', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <DataContext.Provider value={{ 
      records, 
      products,
      purchases,
      suppliers,
      supplierQuotes,
      economyHistory,
      loading,
      addRecord, 
      updateRecordStatus, 
      markAsArrived,
      calculateUrgency,
      addPurchase,
      revertPurchaseToRecord,
      addSupplier,
      addOrUpdateSupplierContact,
      deleteSupplierContact,
      submitSupplierQuote,
      addMultipleSupplierQuotes,
      clearSupplierQuotes,
      approveCheapestQuotes,
      getProductPriceStats,
      getProductPriceHistory,
      updateProduct,
      addProduct,
      addProductsBulk,
      deleteRecord,
      readNotificationIds,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      toggleNotificationRead
    }}>
      {children}
    </DataContext.Provider>
  );
};
