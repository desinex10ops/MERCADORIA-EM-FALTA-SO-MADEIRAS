import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
  const [records, setRecords] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [products, setProducts] = useState([]);

  // Load records from local storage
  useEffect(() => {
    const storedPurchases = localStorage.getItem('@MercadoriaData:purchases');
    if (storedPurchases) setPurchases(JSON.parse(storedPurchases));

    const fetchData = async () => {
      const [{ data: localRecords }, { data: localProducts }] = await Promise.all([
        supabase.from('records').select('*').order('data_criacao', { ascending: false }),
        supabase.from('products').select('*').order('created_at', { ascending: false })
      ]);
      if (localRecords) setRecords(localRecords);
      if (localProducts) setProducts(localProducts);
    };

    fetchData();

    // Supabase Real-time Subscriptions!
    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'records' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setRecords(prev => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setRecords(prev => prev.map(r => r.id === payload.new.id ? payload.new : r));
        } else if (payload.eventType === 'DELETE') {
          setRecords(prev => prev.filter(r => r.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setProducts(prev => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setProducts(prev => prev.map(r => r.id === payload.new.id ? payload.new : r));
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

  const updateProduct = async (id, nome, setor) => {
    await supabase.from('products').update({ nome: nome.trim(), setor: setor.trim() }).eq('id', id);
  };

  const addProduct = async (nome, setor) => {
    const nameStd = nome.trim().toLowerCase();
    if (products.find(p => p.nome.toLowerCase() === nameStd)) {
      throw new Error('Produto já existente no catálogo!');
    }
    const newProduct = {
      nome: nome.trim(),
      setor: setor.trim() || 'Geral'
    };
    await supabase.from('products').insert([newProduct]);
    return newProduct;
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
    const prodExists = products.find(p => p.nome.toLowerCase() === record.produto_nome.toLowerCase());
    if (!prodExists) {
      await supabase.from('products').insert([{ nome: record.produto_nome, setor: record.setor || 'Geral' }]);
    }

    const urgency = calculateUrgency(record.quantidade_atual, record.quantidade_ideal);
    const newRecord = {
      ...record,
      urgencia: urgency,
      status_compra: 'Pendente',
      chegou: record.chegou || false,
      data_criacao: new Date().toISOString(),
      data_atualizacao: new Date().toISOString(),
    };
    // remove id if generated locally so supabase inserts valid UUID
    delete newRecord.id; 
    
    await supabase.from('records').insert([newRecord]);
  };

  const updateRecordStatus = async (id, newStatus) => {
    await supabase.from('records').update({ status_compra: newStatus, data_atualizacao: new Date().toISOString() }).eq('id', id);
  };

  const markAsArrived = async (id) => {
    await supabase.from('records').update({ chegou: true, data_atualizacao: new Date().toISOString() }).eq('id', id);
  };

  const deleteRecord = async (id) => {
    await supabase.from('records').delete().eq('id', id);
  };

  const addPurchase = (recordId, fornecedor, valorUnitario, quantidade) => {
    const record = records.find(r => r.id === recordId);
    if (!record) return;

    const newPurchase = {
      id: uuidv4(),
      record_id: recordId,
      produto_nome: record.produto_nome,
      fornecedor,
      valor_unitario: Number(valorUnitario),
      quantidade: Number(quantidade),
      valor_total: Number(valorUnitario) * Number(quantidade),
      data_compra: new Date().toISOString()
    };

    savePurchases([newPurchase, ...purchases]);
    updateRecordStatus(recordId, 'Comprou');
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

  return (
    <DataContext.Provider value={{ 
      records, 
      products,
      purchases,
      addRecord, 
      updateRecordStatus, 
      markAsArrived,
      calculateUrgency,
      addPurchase,
      getProductPriceStats,
      updateProduct,
      addProduct,
      addProductsBulk,
      deleteRecord
    }}>
      {children}
    </DataContext.Provider>
  );
};
