import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
  const [records, setRecords] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [products, setProducts] = useState([]);

  // Load records from local storage
  useEffect(() => {
    const stored = localStorage.getItem('@MercadoriaData:records');
    const storedPurchases = localStorage.getItem('@MercadoriaData:purchases');
    const storedProducts = localStorage.getItem('@MercadoriaData:products');
    
    if (storedPurchases) {
      setPurchases(JSON.parse(storedPurchases));
    }

    if (storedProducts) {
      setProducts(JSON.parse(storedProducts));
    } else {
      const initialProducts = [
        { id: 'p1', nome: 'Cimento Votorantim 50kg', setor: 'Básico' },
        { id: 'p2', nome: 'Tubo PVC 100mm Tigre', setor: 'Hidráulica' },
        { id: 'p3', nome: 'Fio Flexível 2.5mm Sil', setor: 'Elétrica' },
        { id: 'p4', nome: 'Tinta Acrílica Coral 18L', setor: 'Pintura' },
        { id: 'p5', nome: 'Argamassa ACIII Quartzolit', setor: 'Básico' },
      ];
      setProducts(initialProducts);
      localStorage.setItem('@MercadoriaData:products', JSON.stringify(initialProducts));
    }

    if (stored) {
      setRecords(JSON.parse(stored));
    } else {
      // Mock initial data
      const initial = [
        {
          id: uuidv4(),
          produto_nome: 'Cimento Votorantim 50kg',
          vendedor_nome: 'João Vendedor',
          setor: 'Básico',
          quantidade_atual: 10,
          quantidade_ideal: 100,
          urgencia: 'Alta',
          status_compra: 'Pendente',
          chegou: false,
          data_criacao: new Date().toISOString(),
          data_atualizacao: new Date().toISOString(),
        }
      ];
      setRecords(initial);
      localStorage.setItem('@MercadoriaData:records', JSON.stringify(initial));
    }
  }, []);

  const saveRecords = (newRecords) => {
    setRecords(newRecords);
    localStorage.setItem('@MercadoriaData:records', JSON.stringify(newRecords));
  };

  const savePurchases = (newPurchases) => {
    setPurchases(newPurchases);
    localStorage.setItem('@MercadoriaData:purchases', JSON.stringify(newPurchases));
  };

  const saveProducts = (newProducts) => {
    setProducts(newProducts);
    localStorage.setItem('@MercadoriaData:products', JSON.stringify(newProducts));
  };

  const updateProduct = (id, nome, setor) => {
    const updated = products.map(p => p.id === id ? { ...p, nome: nome.trim(), setor: setor.trim() } : p);
    saveProducts(updated);
  };

  const addProduct = (nome, setor) => {
    const nameStd = nome.trim().toLowerCase();
    if (products.find(p => p.nome.toLowerCase() === nameStd)) {
      throw new Error('Produto já existente no catálogo!');
    }
    const newProduct = {
      id: uuidv4(),
      nome: nome.trim(),
      setor: setor.trim() || 'Geral'
    };
    saveProducts([newProduct, ...products]);
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

  const addRecord = (record) => {
    // Check and save new product dynamically to memory (Auto-learn feature)
    const prodExists = products.find(p => p.nome.toLowerCase() === record.produto_nome.toLowerCase());
    if (!prodExists) {
      const newProduct = {
        id: uuidv4(),
        nome: record.produto_nome,
        setor: record.setor || 'Geral'
      };
      saveProducts([...products, newProduct]);
    }

    const urgency = calculateUrgency(record.quantidade_atual, record.quantidade_ideal);
    const newRecord = {
      ...record,
      id: uuidv4(),
      urgencia: urgency,
      status_compra: 'Pendente',
      chegou: false,
      data_criacao: new Date().toISOString(),
      data_atualizacao: new Date().toISOString(),
    };
    saveRecords([newRecord, ...records]);
  };

  const updateRecordStatus = (id, newStatus) => {
    const updated = records.map(r => 
      r.id === id ? { ...r, status_compra: newStatus, data_atualizacao: new Date().toISOString() } : r
    );
    saveRecords(updated);
  };

  const markAsArrived = (id) => {
    const updated = records.map(r => 
      r.id === id ? { ...r, chegou: true, data_atualizacao: new Date().toISOString() } : r
    );
    saveRecords(updated);
  };

  const deleteRecord = (id) => {
    const updated = records.filter(r => r.id !== id);
    saveRecords(updated);
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

  const addProductsBulk = (lines, defaultSetor) => {
    let currentProducts = [...products];
    let count = 0;
    
    for (let line of lines) {
      const nameStd = line.trim().toLowerCase();
      if (!nameStd) continue;
      
      if (!currentProducts.find(p => p.nome.toLowerCase() === nameStd)) {
        currentProducts.unshift({
          id: uuidv4(),
          nome: line.trim(),
          setor: defaultSetor || 'Geral'
        });
        count++;
      }
    }
    
    if (count > 0) {
      saveProducts(currentProducts);
    }
    return count;
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
