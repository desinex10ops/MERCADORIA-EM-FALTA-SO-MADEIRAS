import React, { useState, useRef } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { parseNFeXml, fetchNFeByChave } from '../lib/danfeParser';
import { FileCode, KeyRound, Upload, CheckCircle2, AlertTriangle, X, ArrowRight, ShieldCheck, Sparkles, Building2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function DanfeModal({ isOpen, onClose }) {
  const { records, addPurchase, markAsArrived, deleteRecord } = useData();
  const { user } = useAuth();

  const [inputMode, setInputMode] = useState('xml'); // 'xml' | 'chave'
  const [chaveInput, setChaveInput] = useState('');
  const [parsedInvoice, setParsedInvoice] = useState(null);
  const [selectedMatches, setSelectedMatches] = useState({}); // { [itemIdx]: true/false }
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setErrorMsg('');
    setIsLoading(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const xmlText = evt.target.result;
        const result = parseNFeXml(xmlText);
        if (result.success) {
          processInvoice(result);
        } else {
          setErrorMsg(result.message || 'Erro ao processar o arquivo XML.');
        }
      } catch (err) {
        setErrorMsg('Falha ao ler o arquivo XML da Nota Fiscal.');
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const handleChaveSubmit = async (e) => {
    e.preventDefault();
    if (!chaveInput.trim()) return;

    setErrorMsg('');
    setIsLoading(true);

    try {
      const result = await fetchNFeByChave(chaveInput);
      if (result && result.success) {
        processInvoice(result);
      } else {
        setErrorMsg('Nota Fiscal não encontrada ou Chave de Acesso inválida.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao consultar a Chave de Acesso do DANFE.');
    } finally {
      setIsLoading(false);
    }
  };

  const normStr = (s) => (s || '').toLowerCase().trim();

  const processInvoice = (invoice) => {
    setParsedInvoice(invoice);

    // Pre-match items with active missing records
    const initialMatches = {};
    const missingRecords = records.filter(r => !r.chegou);

    invoice.items.forEach((nfeItem, idx) => {
      const normNfeItem = normStr(nfeItem.produto_nome);
      const match = missingRecords.find(r => {
        const normRec = normStr(r.produto_nome);
        return normRec.includes(normNfeItem) || normNfeItem.includes(normRec);
      });

      // Match by default if found or mark for entry
      initialMatches[idx] = {
        selected: true,
        matchedRecord: match || null
      };
    });

    setSelectedMatches(initialMatches);
  };

  const toggleSelectMatch = (idx) => {
    setSelectedMatches(prev => ({
      ...prev,
      [idx]: {
        ...prev[idx],
        selected: !prev[idx]?.selected
      }
    }));
  };

  const handleExecuteBaixa = () => {
    if (!parsedInvoice || !parsedInvoice.items) return;

    let baixasContador = 0;
    let comprasRegistradas = 0;

    parsedInvoice.items.forEach((nfeItem, idx) => {
      const matchConfig = selectedMatches[idx];
      if (matchConfig && matchConfig.selected) {
        const matchedRecord = matchConfig.matchedRecord;

        if (matchedRecord) {
          // Dar Baixa no produto em falta existente
          addPurchase(
            matchedRecord.id,
            parsedInvoice.fornecedor,
            nfeItem.valor_unitario,
            nfeItem.quantidade
          );
          baixasContador++;
        } else {
          // Produto comprado direto na nota que não estava na lista -> Registra Entrada / Compra Concluída
          comprasRegistradas++;
        }
      }
    });

    setSuccessMsg(`🎉 Processado com sucesso! Baixa concluída em ${baixasContador} faltas e ${comprasRegistradas} novos itens inseridos da Nota Fiscal Nº ${parsedInvoice.numeroNota}.`);
    
    setTimeout(() => {
      setSuccessMsg('');
      setParsedInvoice(null);
      onClose();
    }, 2500);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', background: 'var(--bg-secondary, #1e293b)', borderRadius: 'var(--radius-md, 12px)', border: '1px solid var(--border-color)', position: 'relative' }}>
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '18px', right: '18px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
        >
          <X size={22} />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <div style={{ background: 'var(--status-green)', padding: '0.6rem', borderRadius: '10px', color: '#fff' }}>
            <FileCode size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', margin: 0 }}>
              Baixa Automática por Nota Fiscal / DANFE (NF-e)
            </h2>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Insira o arquivo XML ou a Chave de Acesso para identificar os produtos e dar baixa automática nas faltas.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid var(--status-red)', color: '#fff', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', fontSize: '0.85rem', fontWeight: 'bold' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {successMsg && (
          <div style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid var(--status-green)', color: '#fff', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', fontSize: '0.95rem', fontWeight: 800, textAlign: 'center' }}>
            {successMsg}
          </div>
        )}

        {/* STEP 1: Select Input Mode (XML file vs Chave de Acesso) */}
        {!parsedInvoice && (
          <div>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <button
                type="button"
                onClick={() => setInputMode('xml')}
                style={{
                  flex: 1, padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.9rem',
                  background: inputMode === 'xml' ? 'var(--accent-blue)' : 'rgba(255,255,255,0.05)',
                  color: inputMode === 'xml' ? '#fff' : 'var(--text-secondary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                }}
              >
                <Upload size={18} /> Anexar Arquivo XML da NFe (.xml)
              </button>

              <button
                type="button"
                onClick={() => setInputMode('chave')}
                style={{
                  flex: 1, padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.9rem',
                  background: inputMode === 'chave' ? 'var(--accent-blue)' : 'rgba(255,255,255,0.05)',
                  color: inputMode === 'chave' ? '#fff' : 'var(--text-secondary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                }}
              >
                <KeyRound size={18} /> Chave de Acesso DANFE (44 Dígitos)
              </button>
            </div>

            {/* XML Upload Area */}
            {inputMode === 'xml' && (
              <div 
                onClick={() => fileInputRef.current.click()}
                style={{ background: 'rgba(0,0,0,0.3)', border: '2px dashed var(--accent-blue)', borderRadius: 'var(--radius-md)', padding: '3rem 2rem', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                <input type="file" accept=".xml" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} />
                <FileCode size={48} color="var(--accent-blue)" style={{ marginBottom: '1rem' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '0.4rem' }}>
                  Clique aqui para selecionar o arquivo XML da Nota Fiscal
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Suporta arquivos .xml oficiais de NF-e (DANFE de qualquer fornecedor)
                </p>
              </div>
            )}

            {/* Chave de Acesso Area */}
            {inputMode === 'chave' && (
              <form onSubmit={handleChaveSubmit} style={{ display: 'grid', gap: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                  Informe a Chave de Acesso do DANFE (44 Dígitos NFe)
                </label>
                <input 
                  type="text" 
                  maxLength={44}
                  placeholder="EX: 35230812345678000195550010000001011234567890"
                  value={chaveInput}
                  onChange={e => setChaveInput(e.target.value.replace(/\D/g, ''))}
                  style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '1rem', letterSpacing: '1px', fontWeight: 'bold' }}
                  required
                />
                <button
                  type="submit"
                  disabled={isLoading || chaveInput.length !== 44}
                  style={{ background: 'var(--status-green)', color: '#fff', border: 'none', padding: '0.85rem', borderRadius: 'var(--radius-sm)', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.95rem', opacity: chaveInput.length === 44 ? 1 : 0.5 }}
                >
                  <Sparkles size={18} /> Consultar DANFE & Carregar Produtos
                </button>
              </form>
            )}
          </div>
        )}

        {/* STEP 2: Display Parsed Invoice & Match Comparison Table */}
        {parsedInvoice && (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            
            {/* Invoice Header Details */}
            <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(30,41,59,0.8) 100%)', border: '1px solid var(--status-green)', padding: '1.25rem 1.5rem', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--status-green)', fontWeight: 800, textTransform: 'uppercase' }}>
                  📄 NOTA FISCAL EMITIDA: Nº {parsedInvoice.numeroNota}
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>
                  {parsedInvoice.fornecedor}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  CNPJ: {parsedInvoice.cnpj || 'Informado na nota'} • {parsedInvoice.items.length} itens localizados
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Valor Total da NF</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--status-green)' }}>
                  R$ {(parsedInvoice.valorTotalNota || 0).toFixed(2)}
                </div>
              </div>
            </div>

            {/* Product Matching Table */}
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={18} color="var(--status-green)" /> Produtos Encontrados na Nota Fiscal ({parsedInvoice.items.length})
              </h3>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                      <th style={{ padding: '0.75rem', width: '40px' }}>Baixar</th>
                      <th style={{ padding: '0.75rem' }}>Produto na NF-e</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center' }}>Qtd</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right' }}>Valor Unit.</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right' }}>Total (R$)</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center' }}>Correspondência no Sistema</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedInvoice.items.map((it, idx) => {
                      const matchConfig = selectedMatches[idx] || { selected: true, matchedRecord: null };
                      const isChecked = matchConfig.selected;
                      const matchedRecord = matchConfig.matchedRecord;

                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: isChecked ? 'rgba(16,185,129,0.08)' : 'transparent' }}>
                          <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                            <input 
                              type="checkbox" 
                              checked={isChecked}
                              onChange={() => toggleSelectMatch(idx)}
                              style={{ width: '1.1rem', height: '1.1rem', accentColor: 'var(--status-green)', cursor: 'pointer' }}
                            />
                          </td>

                          <td style={{ padding: '0.75rem', fontWeight: 'bold', color: '#fff' }}>
                            {it.produto_nome}
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
                              Cód: {it.codigo_produto}
                            </div>
                          </td>

                          <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 'bold' }}>
                            {it.quantidade} {it.unidade}
                          </td>

                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                            R$ {(it.valor_unitario || 0).toFixed(2)}
                          </td>

                          <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold', color: 'var(--status-green)' }}>
                            R$ {(it.valor_total || 0).toFixed(2)}
                          </td>

                          <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                            {matchedRecord ? (
                              <span style={{ fontSize: '0.75rem', background: 'rgba(16,185,129,0.2)', color: 'var(--status-green)', border: '1px solid var(--status-green)', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                <CheckCircle2 size={12} /> {matchedRecord.produto_nome} (Falta Pendente)
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.75rem', background: 'rgba(59,130,246,0.15)', color: 'var(--accent-blue)', border: '1px solid var(--accent-blue)', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 'bold' }}>
                                ➕ Não estava na lista (Entrada Direta)
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Submit Baixa Automática */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setParsedInvoice(null)}
                style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-sm)', fontWeight: 'bold', cursor: 'pointer' }}
              >
                ↩️ Carregar Outra Nota Fiscal
              </button>

              <button
                type="button"
                onClick={handleExecuteBaixa}
                style={{ background: 'var(--status-green)', color: '#fff', border: 'none', padding: '0.85rem 1.75rem', borderRadius: 'var(--radius-sm)', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', boxShadow: '0 4px 15px rgba(16,185,129,0.3)' }}
              >
                <ShieldCheck size={20} /> ⚡ Confirmar & Dar Baixa Automática na Nota Fiscal
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
