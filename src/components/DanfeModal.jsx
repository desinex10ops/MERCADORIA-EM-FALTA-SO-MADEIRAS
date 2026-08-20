import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { parseNFeXml } from '../lib/danfeParser';
import { FileCode, KeyRound, Upload, CheckCircle2, X, ShieldCheck, Sparkles, Camera, QrCode, RefreshCw, ZapOff } from 'lucide-react';

// ─── QR SCANNER COMPONENT ───────────────────────────────────────────────────
function QRScanner({ onResult, onError }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState('Iniciando câmera...');

  const stopCamera = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setScanning(false);
  }, []);

  const tick = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animRef.current = requestAnimationFrame(tick);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    try {
      const jsQR = (await import('jsqr')).default;
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        // Extract 44-digit chave from QR code URL or raw string
        const raw = code.data;
        const chaveMatch = raw.match(/\d{44}/);
        if (chaveMatch) {
          stopCamera();
          onResult(chaveMatch[0]);
          return;
        }
      }
    } catch (e) {
      // continue scanning
    }

    animRef.current = requestAnimationFrame(tick);
  }, [onResult, stopCamera]);

  useEffect(() => {
    let mounted = true;
    setStatus('Solicitando acesso à câmera...');

    navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
    }).then(stream => {
      if (!mounted) { stream.getTracks().forEach(t => t.stop()); return; }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().then(() => {
          setScanning(true);
          setStatus('Aponte a câmera para o QR Code do DANFE...');
          animRef.current = requestAnimationFrame(tick);
        });
      }
    }).catch(err => {
      onError('Câmera não disponível ou permissão negada. Use a Chave de 44 dígitos ou o arquivo XML.');
    });

    return () => {
      mounted = false;
      stopCamera();
    };
  }, [tick, stopCamera, onError]);

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <div style={{ position: 'relative', background: '#000', borderRadius: 'var(--radius-md)', overflow: 'hidden', aspectRatio: '16/9', maxHeight: '320px' }}>
        <video
          ref={videoRef}
          playsInline
          muted
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Scanning overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none'
        }}>
          <div style={{
            width: '200px', height: '200px',
            border: '3px solid var(--status-green)',
            borderRadius: '12px',
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)',
            position: 'relative'
          }}>
            {/* Corner markers */}
            {[['0','0','left','top'], ['auto','0','right','top'], ['0','auto','left','bottom'], ['auto','auto','right','bottom']].map(([t,r,h,v], i) => (
              <div key={i} style={{
                position: 'absolute', top: t === '0' ? '-3px' : 'auto', right: r === '0' ? '-3px' : 'auto',
                bottom: t === 'auto' ? '-3px' : 'auto', left: h === 'left' ? '-3px' : 'auto',
                width: '20px', height: '20px',
                borderTop: v === 'top' ? '4px solid var(--status-green)' : 'none',
                borderBottom: v === 'bottom' ? '4px solid var(--status-green)' : 'none',
                borderLeft: h === 'left' ? '4px solid var(--status-green)' : 'none',
                borderRight: h === 'right' ? '4px solid var(--status-green)' : 'none',
              }} />
            ))}
            <div style={{
              position: 'absolute', top: '50%', left: 0, right: 0, height: '2px',
              background: 'var(--status-green)', transform: 'translateY(-50%)',
              animation: 'scanLine 2s linear infinite', boxShadow: '0 0 8px var(--status-green)'
            }} />
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', fontSize: '0.85rem', color: scanning ? 'var(--status-green)' : 'var(--text-secondary)', fontWeight: scanning ? 700 : 400, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
        {scanning ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> {status}</> : status}
      </div>

      <style>{`
        @keyframes scanLine { 0% { top: 0; } 50% { top: calc(100% - 2px); } 100% { top: 0; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ─── MAIN MODAL ─────────────────────────────────────────────────────────────
export default function DanfeModal({ isOpen, onClose }) {
  const { records, addPurchase, markAsArrived, addRecord } = useData();
  const { user } = useAuth();

  const [inputMode, setInputMode] = useState('camera'); // 'camera' | 'xml' | 'chave'
  const [chaveInput, setChaveInput] = useState('');
  const [parsedInvoice, setParsedInvoice] = useState(null);
  const [selectedMatches, setSelectedMatches] = useState({});
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // ── XML Reader ──────────────────────────────────────────────────────────
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setErrorMsg('');
    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const result = parseNFeXml(evt.target.result);
        if (result.success && result.items.length > 0) {
          processInvoice(result);
        } else if (result.success) {
          setErrorMsg('XML lido mas nenhum produto (det) foi encontrado. Verifique se o arquivo é uma NF-e válida.');
        } else {
          setErrorMsg(result.message || 'Erro ao processar o arquivo XML.');
        }
      } catch (err) {
        setErrorMsg('Falha ao ler o arquivo XML da Nota Fiscal.');
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  // ── Chave de Acesso (44 dígitos) — parse estrutural offline ─────────────
  const handleChaveSubmit = async (e) => {
    e?.preventDefault();
    const clean = (chaveInput || '').replace(/\D/g, '');
    if (clean.length !== 44) {
      setErrorMsg('A Chave de Acesso deve ter exatamente 44 dígitos.');
      return;
    }
    setErrorMsg('');
    setIsLoading(true);

    try {
      // Try meudanfe API v2 (free tier — no auth required for GET xml by key)
      let parsed = null;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      try {
        // Step 1: register key
        await fetch(`https://api.meudanfe.com.br/v2/fd/add/${clean}`, {
          method: 'PUT', signal: controller.signal
        }).catch(() => {});

        // Step 2: fetch XML
        const res = await fetch(`https://api.meudanfe.com.br/v2/fd/get/xml/${clean}`, {
          signal: controller.signal
        });
        clearTimeout(timeout);

        if (res.ok) {
          const txt = await res.text();
          if (txt && txt.includes('<nNF>')) {
            parsed = parseNFeXml(txt);
          }
        }
      } catch (_) {
        clearTimeout(timeout);
      }

      if (parsed && parsed.success && parsed.items.length > 0) {
        processInvoice(parsed);
      } else {
        // Offline: parse structural data from the 44-digit key
        processInvoice(buildOfflineInvoice(clean));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // QR Scan result → set chave and submit
  const handleQRResult = (chave) => {
    setChaveInput(chave);
    setInputMode('chave');
    // auto-submit
    setTimeout(async () => {
      const clean = chave.replace(/\D/g, '');
      if (clean.length !== 44) return;
      setErrorMsg('');
      setIsLoading(true);
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        let parsed = null;
        try {
          await fetch(`https://api.meudanfe.com.br/v2/fd/add/${clean}`, { method: 'PUT', signal: controller.signal }).catch(() => {});
          const res = await fetch(`https://api.meudanfe.com.br/v2/fd/get/xml/${clean}`, { signal: controller.signal });
          clearTimeout(timeout);
          if (res.ok) {
            const txt = await res.text();
            if (txt && txt.includes('<nNF>')) parsed = parseNFeXml(txt);
          }
        } catch (_) { clearTimeout(timeout); }
        processInvoice(parsed && parsed.success && parsed.items.length > 0 ? parsed : buildOfflineInvoice(clean));
      } finally {
        setIsLoading(false);
      }
    }, 300);
  };

  // Build offline invoice from key structure
  const buildOfflineInvoice = (clean) => {
    const uf = clean.substring(0, 2);
    const cnpj = clean.substring(6, 20);
    const nfNum = parseInt(clean.substring(25, 34), 10).toString();
    const cnpjFmt = cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');

    return {
      success: true,
      fornecedor: `FORNECEDOR — CNPJ ${cnpjFmt}`,
      cnpj: cnpjFmt,
      numeroNota: nfNum,
      chaveAcesso: clean,
      dataEmissao: new Date().toISOString(),
      valorTotalNota: 0,
      items: [],
      offline: true
    };
  };

  // ── Process Invoice → match with missing records ─────────────────────────
  const normStr = (s) => (s || '').toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');

  const processInvoice = (invoice) => {
    setParsedInvoice(invoice);
    const missingRecords = records.filter(r => !r.chegou);
    const initialMatches = {};

    (invoice.items || []).forEach((item, idx) => {
      const normItem = normStr(item.produto_nome);
      let bestMatch = null;
      let bestScore = 0;

      missingRecords.forEach(r => {
        const normRec = normStr(r.produto_nome);

        // Exact match
        if (normItem === normRec) {
          bestMatch = r;
          bestScore = 100;
          return;
        }

        // Substring match
        if (normItem.includes(normRec) || normRec.includes(normItem)) {
          const score = 80;
          if (score > bestScore) {
            bestScore = score;
            bestMatch = r;
          }
        }

        // Word overlap match
        const itemWords = normItem.split(/\s+/).filter(w => w.length > 2);
        const recWords = normRec.split(/\s+/).filter(w => w.length > 2);

        const matchingWords = itemWords.filter(w => recWords.includes(w));
        if (matchingWords.length >= 2 || (matchingWords.length === 1 && itemWords.length <= 2 && recWords.length <= 2)) {
          const overlapScore = (matchingWords.length / Math.max(itemWords.length, recWords.length)) * 70;
          if (overlapScore > 40 && overlapScore > bestScore) {
            bestScore = overlapScore;
            bestMatch = r;
          }
        }
      });

      initialMatches[idx] = {
        selected: true, // By default, select all DANFE items so they get processed
        matchedRecord: bestMatch || null
      };
    });

    setSelectedMatches(initialMatches);
  };

  const toggleMatch = (idx) => {
    setSelectedMatches(prev => ({
      ...prev,
      [idx]: { ...prev[idx], selected: !prev[idx]?.selected }
    }));
  };

  const handleSelectMatch = (idx, recordId) => {
    const missingRecords = records.filter(r => !r.chegou);
    const matchedRecord = missingRecords.find(r => r.id === recordId) || null;
    setSelectedMatches(prev => ({
      ...prev,
      [idx]: {
        ...prev[idx],
        selected: true,
        matchedRecord: matchedRecord
      }
    }));
  };

  // ── Execute Baixa ────────────────────────────────────────────────────────
  const handleExecuteBaixa = async () => {
    if (!parsedInvoice) return;
    setIsLoading(true);
    setErrorMsg('');
    let baixasCount = 0;

    try {
      for (const [idx, item] of (parsedInvoice.items || []).entries()) {
        const m = selectedMatches[idx];
        if (!m?.selected) continue;

        let targetRecordId = m.matchedRecord?.id;

        if (!targetRecordId) {
          // If not matched to an existing missing record, create a new record already marked as arrived
          const newRec = await addRecord({
            produto_nome: item.produto_nome,
            vendedor_nome: user?.nome || 'Sistema (DANFE)',
            vendedor_id: user?.uid || 'u_danfe',
            setor: 'Geral',
            loja: 'Só Madeiras',
            quantidade_atual: item.quantidade,
            quantidade_ideal: item.quantidade,
            chegou: true,
            status_compra: 'Comprou',
            cliente_esperando: false,
          });
          targetRecordId = newRec?.id;
        }

        if (targetRecordId) {
          // Add purchase entry
          addPurchase(
            targetRecordId,
            parsedInvoice.fornecedor,
            item.valor_unitario,
            item.quantidade,
            item.produto_nome
          );

          // Crucial step: Mark record as arrived so it leaves missing list and goes to history!
          markAsArrived(targetRecordId);

          baixasCount++;
        }
      }

      setSuccessMsg(`🎉 Baixa automática concluída! ${baixasCount} produto(s) baixado(s) e registrado(s) no Histórico (NF Nº ${parsedInvoice.numeroNota}).`);
      setTimeout(() => {
        setSuccessMsg('');
        setParsedInvoice(null);
        onClose();
      }, 3000);
    } catch (err) {
      console.error('Erro ao dar baixa no DANFE:', err);
      setErrorMsg('Ocorreu um erro ao processar a baixa da nota fiscal.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Tab button style ─────────────────────────────────────────────────────
  const tabStyle = (active) => ({
    flex: 1, padding: '0.75rem 0.5rem', borderRadius: 'var(--radius-sm)', border: 'none',
    cursor: 'pointer', fontWeight: 800, fontSize: '0.82rem',
    background: active ? 'var(--accent-blue)' : 'rgba(255,255,255,0.05)',
    color: active ? '#fff' : 'var(--text-secondary)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
    transition: 'all 0.2s', whiteSpace: 'nowrap'
  });

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '860px', maxHeight: '92vh', overflowY: 'auto', padding: '1.75rem', background: 'var(--bg-secondary, #1e293b)', borderRadius: 'var(--radius-md, 12px)', border: '1px solid var(--border-color)', position: 'relative' }}>

        {/* Close */}
        <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
          <X size={22} />
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <div style={{ background: 'var(--status-green)', padding: '0.6rem', borderRadius: '10px', color: '#fff', flexShrink: 0 }}>
            <QrCode size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', margin: 0 }}>
              Baixa Automática por Nota Fiscal / DANFE (NF-e)
            </h2>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Escaneie o QR Code com a câmera, anexe o XML ou informe a Chave de 44 Dígitos.
            </p>
          </div>
        </div>

        {/* Messages */}
        {errorMsg && (
          <div style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid var(--status-red)', color: '#fff', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.85rem', fontWeight: 'bold' }}>
            ⚠️ {errorMsg}
          </div>
        )}
        {successMsg && (
          <div style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid var(--status-green)', color: '#fff', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.95rem', fontWeight: 800, textAlign: 'center' }}>
            {successMsg}
          </div>
        )}

        {/* Input selection — Step 1 */}
        {!parsedInvoice && (
          <div style={{ display: 'grid', gap: '1.25rem' }}>
            {/* Mode tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button type="button" onClick={() => { setInputMode('camera'); setErrorMsg(''); }} style={tabStyle(inputMode === 'camera')}>
                <Camera size={16} /> 📷 Câmera / QR Code
              </button>
              <button type="button" onClick={() => { setInputMode('xml'); setErrorMsg(''); }} style={tabStyle(inputMode === 'xml')}>
                <Upload size={16} /> Arquivo XML (.xml)
              </button>
              <button type="button" onClick={() => { setInputMode('chave'); setErrorMsg(''); }} style={tabStyle(inputMode === 'chave')}>
                <KeyRound size={16} /> Chave 44 Dígitos
              </button>
            </div>

            {/* Camera Mode */}
            {inputMode === 'camera' && (
              <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                <p style={{ margin: '0 0 1rem', fontSize: '0.82rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                  📱 Aponte a câmera para o <strong style={{ color: '#fff' }}>QR Code impresso no DANFE</strong> — a leitura é automática.
                </p>
                <QRScanner
                  onResult={handleQRResult}
                  onError={(msg) => { setErrorMsg(msg); setInputMode('chave'); }}
                />
              </div>
            )}

            {/* XML Mode */}
            {inputMode === 'xml' && (
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{ background: 'rgba(0,0,0,0.3)', border: '2px dashed var(--accent-blue)', borderRadius: 'var(--radius-md)', padding: '3rem 2rem', textAlign: 'center', cursor: 'pointer' }}
              >
                <input type="file" accept=".xml,text/xml" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} />
                <FileCode size={48} color="var(--accent-blue)" style={{ marginBottom: '1rem' }} />
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '0.4rem' }}>
                  Clique para selecionar o arquivo XML da NF-e
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Suporta arquivos .xml oficiais de NF-e (qualquer fornecedor)
                </p>
              </div>
            )}

            {/* Chave de Acesso Mode */}
            {inputMode === 'chave' && (
              <form onSubmit={handleChaveSubmit} style={{ display: 'grid', gap: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                    Chave de Acesso DANFE (44 Dígitos NFe)
                  </label>
                  <input
                    type="text"
                    maxLength={44}
                    placeholder="Ex: 35230812345678000195550010000001011234567890"
                    value={chaveInput}
                    onChange={e => setChaveInput(e.target.value.replace(/\D/g, ''))}
                    style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.3)', border: `1px solid ${chaveInput.length === 44 ? 'var(--status-green)' : 'var(--border-color)'}`, color: '#fff', fontSize: '0.95rem', letterSpacing: '1px', fontWeight: 'bold', fontFamily: 'monospace' }}
                    required
                  />
                  <div style={{ fontSize: '0.75rem', color: chaveInput.length === 44 ? 'var(--status-green)' : 'var(--text-secondary)', marginTop: '0.25rem', fontWeight: chaveInput.length === 44 ? 700 : 400 }}>
                    {chaveInput.length}/44 dígitos {chaveInput.length === 44 ? '✅ Pronto!' : ''}
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading || chaveInput.length !== 44}
                  style={{ background: chaveInput.length === 44 ? 'var(--status-green)' : 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', padding: '0.85rem', borderRadius: 'var(--radius-sm)', fontWeight: 800, cursor: chaveInput.length === 44 ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.95rem', opacity: chaveInput.length === 44 ? 1 : 0.5 }}
                >
                  {isLoading ? <><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Consultando...</> : <><Sparkles size={16} /> Consultar DANFE & Carregar Produtos</>}
                </button>
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
              </form>
            )}
          </div>
        )}

        {/* Step 2: Products table */}
        {parsedInvoice && (
          <div style={{ display: 'grid', gap: '1.25rem' }}>

            {/* Invoice info banner */}
            <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(30,41,59,0.8) 100%)', border: '1px solid var(--status-green)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--status-green)', fontWeight: 800, textTransform: 'uppercase' }}>
                  📄 NOTA FISCAL Nº {parsedInvoice.numeroNota}
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>{parsedInvoice.fornecedor}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  CNPJ: {parsedInvoice.cnpj || '—'} • {(parsedInvoice.items || []).length} itens
                  {parsedInvoice.offline && <span style={{ marginLeft: '0.5rem', background: 'rgba(234,179,8,0.2)', color: '#fbbf24', padding: '0.1rem 0.4rem', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 700 }}>MODO OFFLINE — XML não disponível</span>}
                </div>
              </div>
              {parsedInvoice.valorTotalNota > 0 && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Valor Total NF</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--status-green)' }}>
                    R$ {parsedInvoice.valorTotalNota.toFixed(2)}
                  </div>
                </div>
              )}
            </div>

            {/* Offline notice when no items */}
            {parsedInvoice.offline && (
              <div style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid #fbbf24', borderRadius: 'var(--radius-sm)', padding: '1rem', fontSize: '0.85rem', color: '#fbbf24', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ZapOff size={18} />
                A API não retornou o XML desta nota. Os produtos não puderam ser carregados automaticamente. Você pode dar baixa manualmente pelas faltas pendentes no painel.
              </div>
            )}

            {/* Products table */}
            {(parsedInvoice.items || []).length > 0 && (
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle2 size={16} color="var(--status-green)" /> Produtos da Nota Fiscal ({parsedInvoice.items.length})
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 400, marginLeft: '0.25rem' }}>
                    — Marque os que deseja dar baixa
                  </span>
                </h3>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                        <th style={{ padding: '0.6rem', width: '36px' }}>✔</th>
                        <th style={{ padding: '0.6rem' }}>Produto na NF-e</th>
                        <th style={{ padding: '0.6rem', textAlign: 'center' }}>Qtd</th>
                        <th style={{ padding: '0.6rem', textAlign: 'right' }}>Unit.</th>
                        <th style={{ padding: '0.6rem', textAlign: 'right' }}>Total</th>
                        <th style={{ padding: '0.6rem', textAlign: 'center' }}>Correspondência</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedInvoice.items.map((it, idx) => {
                        const m = selectedMatches[idx] || {};
                        return (
                          <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: m.selected ? 'rgba(16,185,129,0.07)' : 'transparent' }}>
                            <td style={{ padding: '0.6rem', textAlign: 'center' }}>
                              <input type="checkbox" checked={!!m.selected} onChange={() => toggleMatch(idx)} style={{ width: '1.1rem', height: '1.1rem', accentColor: 'var(--status-green)', cursor: 'pointer' }} />
                            </td>
                            <td style={{ padding: '0.6rem', fontWeight: 'bold', color: '#fff' }}>
                              {it.produto_nome}
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>Cód: {it.codigo_produto}</div>
                            </td>
                            <td style={{ padding: '0.6rem', textAlign: 'center', fontWeight: 'bold' }}>{it.quantidade} {it.unidade}</td>
                            <td style={{ padding: '0.6rem', textAlign: 'right' }}>R$ {(it.valor_unitario || 0).toFixed(2)}</td>
                            <td style={{ padding: '0.6rem', textAlign: 'right', fontWeight: 'bold', color: 'var(--status-green)' }}>R$ {(it.valor_total || 0).toFixed(2)}</td>
                            <td style={{ padding: '0.6rem', textAlign: 'center' }}>
                              <select
                                value={m.matchedRecord?.id || ''}
                                onChange={(e) => handleSelectMatch(idx, e.target.value)}
                                style={{
                                  background: m.matchedRecord ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
                                  color: m.matchedRecord ? 'var(--status-green)' : 'var(--text-secondary)',
                                  border: `1px solid ${m.matchedRecord ? 'var(--status-green)' : 'var(--border-color)'}`,
                                  borderRadius: 'var(--radius-sm, 6px)',
                                  padding: '0.35rem 0.5rem',
                                  fontSize: '0.75rem',
                                  fontWeight: 'bold',
                                  maxWidth: '240px',
                                  cursor: 'pointer'
                                }}
                              >
                                <option value="" style={{ background: '#1e293b', color: '#fff' }}>
                                  ➕ Salvar no Histórico (Sem falta prévia)
                                </option>
                                {records.filter(r => !r.chegou).map(r => (
                                  <option key={r.id} value={r.id} style={{ background: '#1e293b', color: '#fff' }}>
                                    📌 Falta: {r.produto_nome} ({r.vendedor_nome})
                                  </option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => { setParsedInvoice(null); setChaveInput(''); setInputMode('camera'); }}
                disabled={isLoading}
                style={{ background: 'rgba(255,255,255,0.07)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', padding: '0.7rem 1.1rem', borderRadius: 'var(--radius-sm)', fontWeight: 'bold', cursor: 'pointer' }}
              >
                ↩️ Carregar Outra Nota
              </button>

              {(parsedInvoice.items || []).length > 0 && (
                <button
                  type="button"
                  onClick={handleExecuteBaixa}
                  disabled={isLoading}
                  style={{ background: 'var(--status-green)', color: '#fff', border: 'none', padding: '0.85rem 1.5rem', borderRadius: 'var(--radius-sm)', fontWeight: 800, cursor: isLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', boxShadow: '0 4px 15px rgba(16,185,129,0.3)', opacity: isLoading ? 0.7 : 1 }}
                >
                  {isLoading ? (
                    <><RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} /> Processando baixa...</>
                  ) : (
                    <><ShieldCheck size={18} /> ⚡ Confirmar Baixa Automática</>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
