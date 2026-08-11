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

const defaultSuppliersList = [
  { id: 'sup_1', nome: 'ATACADÃO MADEIRAS', representante: 'João Silva', telefone: '(79) 99811-2233', email: 'joao@atacadaomadeiras.com.br', ultimaCotacao: new Date().toISOString(), totalCotacoes: 5 },
  { id: 'sup_2', nome: 'DISTRIBUIDORA ESTÂNCIA', representante: 'Carlos Eduardo', telefone: '(79) 99122-4455', email: 'carlos@estancia.com.br', ultimaCotacao: new Date().toISOString(), totalCotacoes: 3 },
  { id: 'sup_3', nome: 'MEGA FORNECIMENTOS', representante: 'Luciana Santos', telefone: '(79) 98877-6655', email: 'luciana@mega.com.br', ultimaCotacao: new Date().toISOString(), totalCotacoes: 4 },
  { id: 'sup_4', nome: 'MADEIREIRA RIO REAL', representante: 'Marcos Oliveira', telefone: '(79) 99655-3322', email: 'marcos@rioreal.com.br', ultimaCotacao: new Date().toISOString(), totalCotacoes: 2 },
  { id: 'sup_5', nome: 'GIGA ATACADO DA CONSTRUÇÃO', representante: 'Fernando Costa', telefone: '(79) 98111-9988', email: 'fernando@giga.com.br', ultimaCotacao: new Date().toISOString(), totalCotacoes: 6 }
];

export const DataProvider = ({ children }) => {
  const [records, setRecords] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [products, setProducts] = useState([]);
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
  const [filialPurchases, setFilialPurchases] = useState(() => {
    const saved = localStorage.getItem('@MercadoriaData:filial_purchases');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(item => item.id !== 'fp_1');
        }
      } catch (e) {}
    }
    return [];
  });
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
          setRecords(localRecords);
          localStorage.setItem('@MercadoriaData:records', JSON.stringify(localRecords));
        }
        if (localProducts) setProducts(localProducts);
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
          setProducts(prev => {
            if (prev.find(p => p.id === payload.new.id)) return prev;
            return [payload.new, ...prev];
          });
        } else if (payload.eventType === 'UPDATE') {
          setProducts(prev => prev.map(r => r.id === payload.new.id ? payload.new : r));
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

  const updateProduct = async (id, nome, setor) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, nome: nome.trim(), setor: setor.trim() } : p));
    await supabase.from('products').update({ nome: nome.trim(), setor: setor.trim() }).eq('id', id);
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
    try {
      const { data } = await supabase.from('products').insert([{ nome: newProduct.nome, setor: newProduct.setor }]).select();
      if (data && data.length > 0) {
        setProducts(prev => [data[0], ...prev.filter(p => p.id !== newProduct.id)]);
        return data[0];
      }
    } catch (e) {
      console.warn('Saved product locally:', e);
    }
    setProducts(prev => [newProduct, ...prev]);
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
      loja: recordFormatted.loja || 'Só Madeiras',
      urgencia: urgency,
      status_compra: recordFormatted.status_compra || 'Pendente',
      chegou: recordFormatted.chegou || false,
      data_criacao: new Date().toISOString(),
      data_atualizacao: new Date().toISOString(),
    };
    
    setRecords(prev => [newRecord, ...prev.filter(r => r.id !== newRecord.id)]);

    try {
      const dbInsert = { ...newRecord };
      delete dbInsert.id; // Let Supabase insert UUID if column is UUID, or keep if text
      const { data: insertedData } = await supabase.from('records').insert([dbInsert]).select();
      if (insertedData && insertedData.length > 0) {
        setRecords(prev => [insertedData[0], ...prev.filter(r => r.id !== newRecord.id)]);
      }
    } catch (e) {
      console.warn('Saved record locally:', e);
    }
  };

  const updateRecordStatus = async (id, newStatus) => {
    setRecords(prev => prev.map(r => r.id === id ? { ...r, status_compra: newStatus, data_atualizacao: new Date().toISOString() } : r));
    try {
      await supabase.from('records').update({ status_compra: newStatus, data_atualizacao: new Date().toISOString() }).eq('id', id);
    } catch (e) {}
  };

  const markAsArrived = async (id) => {
    setRecords(prev => prev.map(r => r.id === id ? { ...r, chegou: true, data_atualizacao: new Date().toISOString() } : r));
    try {
      await supabase.from('records').update({ chegou: true, data_atualizacao: new Date().toISOString() }).eq('id', id);
    } catch (e) {}
  };

  const deleteRecord = async (id) => {
    setRecords(prev => prev.filter(r => r.id !== id));
    try {
      await supabase.from('records').delete().eq('id', id);
    } catch (e) {}
  };

  const sendFilialRequestToBuyer = async (id) => {
    setRecords(prev => prev.map(r => r.id === id ? {
      ...r,
      solicitado_por_filial: true,
      mensagem_filial: 'Solicitado por Ki Madeiras',
      status_compra: 'Pendente',
      data_atualizacao: new Date().toISOString()
    } : r));
    try {
      await supabase.from('records').update({
        solicitado_por_filial: true,
        mensagem_filial: 'Solicitado por Ki Madeiras',
        status_compra: 'Pendente',
        data_atualizacao: new Date().toISOString()
      }).eq('id', id);
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

    setRecords(prev => prev.map(r => r.id === recordId ? {
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
    let toInsert = [];
    
    for (let line of lines) {
      const nameStd = line.trim().toLowerCase();
      if (!nameStd) continue;
      
      if (!products.find(p => p.nome.toLowerCase() === nameStd) && !toInsert.find(p => p.nome.toLowerCase() === nameStd)) {
        toInsert.push({
          nome: line.trim(),
          setor: defaultSetor || 'Geral'
        });
      }
    }
    
    if (toInsert.length > 0) {
      await supabase.from('products').insert(toInsert);
    }
    return toInsert.length;
  };

  const clearSupplierQuotes = () => {
    setSupplierQuotes([]);
    localStorage.removeItem('@MercadoriaData:supplier_quotes');
  };

  const addFilialPurchase = ({ produto_nome, fornecedor, quantidade, valor_unitario, comprador_nome }) => {
    const fmtProd = correctSpellingAndUppercase(produto_nome);
    const fmtForn = correctSpellingAndUppercase(fornecedor || 'FORNECEDOR DIRETO');
    const fmtComp = correctSpellingAndUppercase(comprador_nome || 'ADMIN KI MADEIRAS');
    const qty = Number(quantidade) || 1;
    const valUnit = Number(valor_unitario) || 0;
    const valTotal = Math.round(qty * valUnit * 100) / 100;

    const newFilialPurchase = {
      id: uuidv4(),
      produto_nome: fmtProd,
      fornecedor: fmtForn,
      quantidade: qty,
      valor_unitario: valUnit,
      valor_total: valTotal,
      comprador_nome: fmtComp,
      loja: 'Ki Madeiras',
      data_compra: new Date().toISOString(),
      tipo: 'Compra Direta Filial'
    };

    const updatedFilialPurchases = [newFilialPurchase, ...filialPurchases];
    setFilialPurchases(updatedFilialPurchases);
    localStorage.setItem('@MercadoriaData:filial_purchases', JSON.stringify(updatedFilialPurchases));

    // Send arrival notification to Notifications Center for Admin & Store
    const notifRecord = {
      id: uuidv4(),
      produto_nome: fmtProd,
      vendedor_nome: fmtComp,
      setor: 'Filial Ki Madeiras',
      loja: 'Ki Madeiras',
      quantidade_atual: qty,
      quantidade_ideal: qty,
      chegou: true,
      status_compra: 'Comprado Direto por Admin Ki Madeiras',
      data_criacao: new Date().toISOString(),
      data_atualizacao: new Date().toISOString()
    };

    const updatedRecords = [notifRecord, ...records];
    setRecords(updatedRecords);
    localStorage.setItem('@MercadoriaData:records', JSON.stringify(updatedRecords));

    return newFilialPurchase;
  };

  const deleteFilialPurchase = (id) => {
    const updated = filialPurchases.filter(fp => fp.id !== id);
    setFilialPurchases(updated);
    localStorage.setItem('@MercadoriaData:filial_purchases', JSON.stringify(updated));
  };

  const markNotificationAsRead = (id) => {
    setReadNotificationIds(prev => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      localStorage.setItem('@MercadoriaData:read_notifications', JSON.stringify(updated));
      return updated;
    });
  };

  const markAllNotificationsAsRead = (notificationIds = []) => {
    setReadNotificationIds(prev => {
      const updated = Array.from(new Set([...prev, ...notificationIds]));
      localStorage.setItem('@MercadoriaData:read_notifications', JSON.stringify(updated));
      return updated;
    });
  };

  const toggleNotificationRead = (id) => {
    setReadNotificationIds(prev => {
      let updated;
      if (prev.includes(id)) {
        updated = prev.filter(i => i !== id);
      } else {
        updated = [...prev, id];
      }
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
      filialPurchases,
      loading,
      addRecord, 
      updateRecordStatus, 
      markAsArrived,
      calculateUrgency,
      addPurchase,
      addFilialPurchase,
      revertPurchaseToRecord,
      addSupplier,
      addOrUpdateSupplierContact,
      deleteSupplierContact,
      submitSupplierQuote,
      addMultipleSupplierQuotes,
      clearSupplierQuotes,
      approveCheapestQuotes,
      sendFilialRequestToBuyer,
      getProductPriceStats,
      getProductPriceHistory,
      updateProduct,
      addProduct,
      addProductsBulk,
      deleteRecord,
      deleteFilialPurchase,
      readNotificationIds,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      toggleNotificationRead
    }}>
      {children}
    </DataContext.Provider>
  );
};
