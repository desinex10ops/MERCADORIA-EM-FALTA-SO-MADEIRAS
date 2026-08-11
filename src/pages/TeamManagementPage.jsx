import React, { useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Users, UserPlus, ShieldAlert, ShieldCheck, Lock, Trash2, Key, Store, CheckCircle, Shield, Contact, Phone, MessageSquare, Plus, Search, Building2, UserCheck } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { correctSpellingAndUppercase } from '../lib/spellChecker';

export default function TeamManagementPage() {
  const { user, users, registerUser, updateUserRole, deleteUser } = useAuth();
  const { suppliers, addOrUpdateSupplierContact, deleteSupplierContact } = useData();

  const [activeTab, setActiveTab] = useState('agenda'); // 'agenda' | 'equipe'

  const isGeneralAdmin = user?.role === 'comprador';

  // Form states for Team Member
  const [username, setUsername] = useState('');
  const [nome, setNome] = useState('');
  const [password, setPassword] = useState('123');
  const [setor, setSetor] = useState('Geral');
  const [loja, setLoja] = useState('Só Madeiras');
  const [role, setRole] = useState(isGeneralAdmin ? 'cotador' : 'vendedor');

  // Form states for Representative Agenda
  const [empresaNome, setEmpresaNome] = useState('');
  const [repNome, setRepNome] = useState('');
  const [repTelefone, setRepTelefone] = useState('');
  const [repEmail, setRepEmail] = useState('');
  const [repObs, setRepObs] = useState('');
  const [searchAgenda, setSearchAgenda] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Handle Team Member Submission
  const handleAddUser = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!username.trim() || !nome.trim()) {
      setErrorMsg('Por favor, preencha o nome de usuário e nome completo.');
      return;
    }

    const roleToRegister = isGeneralAdmin ? role : 'vendedor';

    const res = registerUser({
      username: username.trim().toLowerCase(),
      nome: nome.trim(),
      password: password.trim() || '123',
      setor: setor.trim(),
      loja,
      role: roleToRegister
    });

    if (!res.success) {
      setErrorMsg(res.message);
      return;
    }

    setSuccessMsg(`Usuário "${nome}" cadastrado com sucesso com o cargo de ${roleToRegister === 'comprador' ? 'Comprador/Admin' : roleToRegister === 'cotador' ? 'Auxiliar de Cotações' : 'Vendedor'}!`);
    setUsername('');
    setNome('');
    setPassword('123');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Handle Representative Contact Submission
  const handleAddSupplierContact = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!empresaNome.trim()) {
      setErrorMsg('Informe o nome da empresa ou distribuidora.');
      return;
    }

    const formattedEmpresa = correctSpellingAndUppercase(empresaNome);
    const formattedRep = correctSpellingAndUppercase(repNome || 'REPRESENTANTE DE VENDAS');

    addOrUpdateSupplierContact({
      nome: formattedEmpresa,
      representante: formattedRep,
      telefone: repTelefone.trim(),
      email: repEmail.trim(),
      observacao: correctSpellingAndUppercase(repObs)
    });

    setSuccessMsg(`Representante "${formattedEmpresa}" cadastrado com sucesso na agenda em MAIÚSCULAS!`);
    setEmpresaNome('');
    setRepNome('');
    setRepTelefone('');
    setRepEmail('');
    setRepObs('');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleChangeRole = (targetUsername, newRole) => {
    if (!isGeneralAdmin) {
      alert('Apenas o Administrador Geral (Juliano) pode alterar permissões e cargos de usuários.');
      return;
    }
    updateUserRole(targetUsername, newRole);
    setSuccessMsg(`Cargo de ${targetUsername} atualizado para ${newRole}!`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleDeleteUser = (targetUsername) => {
    const targetUser = (users || []).find(u => u.username === targetUsername);
    if (!isGeneralAdmin && (targetUser?.role === 'comprador' || targetUser?.role === 'admin_filial')) {
      alert('Você não tem permissão para excluir usuários administradores.');
      return;
    }
    if (window.confirm(`Tem certeza que deseja remover o acesso de "${targetUsername}"?`)) {
      deleteUser(targetUsername);
      setSuccessMsg(`Acesso de ${targetUsername} removido permanentemente.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const handleDeleteSupplier = (id, nome) => {
    if (window.confirm(`Remover "${nome}" da agenda de representantes?`)) {
      deleteSupplierContact(id);
      setSuccessMsg(`Representante ${nome} removido da agenda.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  // Filtered suppliers for search
  const filteredSuppliers = (suppliers || []).filter(s => {
    const term = searchAgenda.toLowerCase();
    return (s.nome || '').toLowerCase().includes(term) ||
           (s.representante || '').toLowerCase().includes(term) ||
           (s.telefone || '').includes(term);
  });

  return (
    <Layout>
      <div style={{ display: 'grid', gap: '2rem' }}>
        
        {/* Header & Tabs */}
        <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: 'var(--accent-blue)' }}>
                <Contact size={28} /> Agenda de Representantes & Gestão de Equipe
              </h1>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Consulte contatos de fornecedores cadastrados automaticamente e gerencie autorizações dos funcionários.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => setActiveTab('agenda')}
              style={{
                padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem',
                background: activeTab === 'agenda' ? 'var(--accent-blue)' : 'rgba(255,255,255,0.05)',
                color: activeTab === 'agenda' ? '#fff' : 'var(--text-secondary)',
                display: 'flex', alignItems: 'center', gap: '0.5rem'
              }}
            >
              <Contact size={18} /> Agenda de Representantes ({(suppliers || []).length})
            </button>

            <button
              onClick={() => setActiveTab('equipe')}
              style={{
                padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem',
                background: activeTab === 'equipe' ? 'var(--accent-blue)' : 'rgba(255,255,255,0.05)',
                color: activeTab === 'equipe' ? '#fff' : 'var(--text-secondary)',
                display: 'flex', alignItems: 'center', gap: '0.5rem'
              }}
            >
              <Users size={18} /> Equipe & Permissões ({(users || []).length})
            </button>
          </div>
        </div>

        {errorMsg && <div className="bg-red-soft" style={{ padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>{errorMsg}</div>}
        {successMsg && <div className="bg-green-soft" style={{ padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontWeight: 'bold' }}>{successMsg}</div>}

        {/* TAB 1: AGENDA DE REPRESENTANTES */}
        {activeTab === 'agenda' && (
          <div style={{ display: 'grid', gap: '2rem' }}>
            
            {/* Form Add Representative */}
            <div className="glass-panel" style={{ padding: '1.75rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plus size={20} color="var(--status-green)" /> Adicionar Representante Manualmente
              </h3>

              <form onSubmit={handleAddSupplierContact} className="form-responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Empresa / Distribuidora *</label>
                  <input 
                    type="text" 
                    placeholder="ex: MADEREIRA RIO REAL" 
                    value={empresaNome}
                    onChange={e => setEmpresaNome(e.target.value)}
                    style={{ width: '100%', padding: '0.7rem', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: '#fff' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Nome do Representante</label>
                  <input 
                    type="text" 
                    placeholder="ex: Marcos Oliveira" 
                    value={repNome}
                    onChange={e => setRepNome(e.target.value)}
                    style={{ width: '100%', padding: '0.7rem', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: '#fff' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Telefone / WhatsApp</label>
                  <input 
                    type="text" 
                    placeholder="ex: (79) 99655-3322" 
                    value={repTelefone}
                    onChange={e => setRepTelefone(e.target.value)}
                    style={{ width: '100%', padding: '0.7rem', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: '#fff' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>E-mail (Opcional)</label>
                  <input 
                    type="email" 
                    placeholder="ex: marcos@rioreal.com.br" 
                    value={repEmail}
                    onChange={e => setRepEmail(e.target.value)}
                    style={{ width: '100%', padding: '0.7rem', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: '#fff' }}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <button 
                    type="submit"
                    style={{ width: '100%', padding: '0.8rem', background: 'var(--status-green)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.95rem' }}
                  >
                    <UserCheck size={18} /> Salvar Representante na Agenda
                  </button>
                </div>
              </form>
            </div>

            {/* Address Book List Header & Search */}
            <div className="glass-panel" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Building2 size={20} color="var(--accent-blue)" /> Lista de Representantes Cadastrados ({(filteredSuppliers || []).length})
                </h3>

                <input 
                  type="text" 
                  placeholder="Buscar fornecedor ou representante..."
                  value={searchAgenda}
                  onChange={e => setSearchAgenda(e.target.value)}
                  style={{ background: 'rgba(0,0,0,0.2)', color: '#fff', border: '1px solid var(--border-color)', padding: '0.6rem 1rem', borderRadius: 'var(--radius-sm)', width: '280px', maxWidth: '100%' }}
                />
              </div>

              {filteredSuppliers.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  Nenhum representante encontrado.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
                  {filteredSuppliers.map((sup, idx) => {
                    const phoneClean = (sup.telefone || '').replace(/\D/g, '');
                    const waUrl = phoneClean ? `https://api.whatsapp.com/send?phone=${phoneClean}&text=${encodeURIComponent(`Olá ${sup.representante || ''}! Gostaria de consultar preços e prazo com a ${sup.nome}.`)}` : null;

                    return (
                      <div key={sup.id || idx} style={{ background: 'rgba(0,0,0,0.25)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                            <strong style={{ color: 'var(--accent-blue)', fontSize: '1.05rem' }}>{sup.nome}</strong>
                            <span style={{ fontSize: '0.65rem', background: 'rgba(59,130,246,0.15)', color: 'var(--accent-blue)', border: '1px solid var(--accent-blue)', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 'bold' }}>
                              Auto-Cadastrado
                            </span>
                          </div>

                          <div style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 'bold', marginBottom: '0.2rem' }}>
                            👤 {sup.representante || 'Representante de Vendas'}
                          </div>

                          <div style={{ fontSize: '0.85rem', color: 'var(--status-green)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.4rem' }}>
                            <Phone size={14} /> {sup.telefone || 'Sem telefone informado'}
                          </div>

                          {sup.email && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              ✉️ {sup.email}
                            </div>
                          )}

                          {sup.totalCotacoes && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
                              📊 {sup.totalCotacoes} cotação(ões) registrada(s)
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                          {waUrl ? (
                            <a 
                              href={waUrl} target="_blank" rel="noreferrer"
                              style={{ flex: 1, background: '#25D366', color: '#fff', padding: '0.5rem', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.8rem', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                            >
                              <MessageSquare size={15} /> Falar no WhatsApp
                            </a>
                          ) : (
                            <button disabled style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', padding: '0.5rem', borderRadius: '4px', border: 'none', fontSize: '0.8rem' }}>
                              Sem WhatsApp
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteSupplier(sup.id, sup.nome)}
                            style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--status-red)', border: '1px solid rgba(239,68,68,0.3)', padding: '0.5rem 0.75rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                            title="Remover representante"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 2: GESTÃO DE EQUIPE DE FUNCIONÁRIOS */}
        {activeTab === 'equipe' && (
          <div style={{ display: 'grid', gap: '2rem' }}>
            
            {/* Roles Banner Explanation */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              
              <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid var(--status-green)' }}>
                <strong style={{ color: 'var(--status-green)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.95rem' }}>
                  👑 Comprador / Admin
                </strong>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.3rem', margin: 0 }}>
                  Acesso total. Pode enviar cotações, <strong>aprovar orçamentos</strong>, gerenciar estoque, fornecedores e equipe.
                </p>
              </div>

              <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-blue)' }}>
                <strong style={{ color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.95rem' }}>
                  📋 Auxiliar de Cotações
                </strong>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.3rem', margin: 0 }}>
                  Pode enviar links de cotações para os representantes, <strong>MAS NÃO PODE APROVAR COTAÇÕES</strong>.
                </p>
              </div>

              <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid var(--status-yellow)' }}>
                <strong style={{ color: 'var(--status-yellow)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.95rem' }}>
                  📦 Vendedor de Loja
                </strong>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.3rem', margin: 0 }}>
                  Pode anotar produtos em falta na loja e dar baixa na chegada das mercadorias.
                </p>
              </div>

            </div>

            {/* Form Add New User */}
            <div className="glass-panel" style={{ padding: '1.75rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserPlus size={20} color="var(--accent-blue)" /> Cadastrar Novo Membro na Equipe
              </h3>

              <form onSubmit={handleAddUser} className="form-responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Usuário / Login *</label>
                  <input 
                    type="text" 
                    placeholder="ex: mateus" 
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    style={{ width: '100%', padding: '0.7rem', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: '#fff' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Nome Completo *</label>
                  <input 
                    type="text" 
                    placeholder="ex: Mateus Santos" 
                    value={nome}
                    onChange={e => setNome(e.target.value)}
                    style={{ width: '100%', padding: '0.7rem', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: '#fff' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Senha Inicial *</label>
                  <input 
                    type="text" 
                    placeholder="ex: 123" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={{ width: '100%', padding: '0.7rem', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: '#fff' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Loja / Unidade</label>
                  <select
                    value={loja}
                    onChange={e => setLoja(e.target.value)}
                    style={{ width: '100%', padding: '0.7rem', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: '#fff' }}
                  >
                    <option value="Só Madeiras">Só Madeiras (Matriz)</option>
                    <option value="Ki Madeiras">Ki Madeiras (Filial)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Setor / Departamento</label>
                  <input 
                    type="text" 
                    placeholder="ex: Marcenaria / Cotação" 
                    value={setor}
                    onChange={e => setSetor(e.target.value)}
                    style={{ width: '100%', padding: '0.7rem', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: '#fff' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--status-yellow)', display: 'block', marginBottom: '0.3rem', fontWeight: 700 }}>Autorização / Cargo *</label>
                  <select
                    value={isGeneralAdmin ? role : 'vendedor'}
                    onChange={e => setRole(e.target.value)}
                    disabled={!isGeneralAdmin}
                    style={{ width: '100%', padding: '0.7rem', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--accent-blue)', color: '#fff', fontWeight: 'bold' }}
                  >
                    <option value="vendedor">📦 Vendedor de Loja (Faltas)</option>
                    {isGeneralAdmin && (
                      <>
                        <option value="cotador">📋 Auxiliar de Cotações (Sem Aprovação)</option>
                        <option value="comprador">👑 Comprador / Admin (Acesso Total)</option>
                      </>
                    )}
                  </select>
                </div>

                <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>
                  <button 
                    type="submit"
                    style={{ width: '100%', padding: '0.8rem', background: 'var(--accent-blue)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.95rem' }}
                  >
                    <UserPlus size={18} /> Cadastrar Membro na Equipe
                  </button>
                </div>
              </form>
            </div>

            {/* Active Team Members List */}
            <div className="glass-panel" style={{ padding: '1.75rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={20} color="var(--status-green)" /> Membros Ativos da Equipe ({(users || []).length})
              </h3>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                      <th style={{ padding: '0.75rem' }}>Usuário / Nome</th>
                      <th style={{ padding: '0.75rem' }}>Loja / Setor</th>
                      <th style={{ padding: '0.75rem' }}>Cargo / Autorização</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center' }}>Permissão de Aprovação</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(users || []).map((u, idx) => {
                      const uRole = u.role || 'vendedor';
                      const isCotadorNoApproval = uRole === 'cotador';
                      const isAdmin = uRole === 'comprador';

                      return (
                        <tr key={u.username || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '0.85rem 0.75rem' }}>
                            <strong style={{ color: '#fff', fontSize: '0.95rem', display: 'block' }}>{u.nome}</strong>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>@{u.username}</span>
                          </td>

                          <td style={{ padding: '0.85rem 0.75rem' }}>
                            <div style={{ color: '#fff' }}>{u.loja || 'Só Madeiras'}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{u.setor || 'Geral'}</div>
                          </td>

                          <td style={{ padding: '0.85rem 0.75rem' }}>
                            <select
                              value={uRole}
                              disabled={!isGeneralAdmin}
                              onChange={(e) => handleChangeRole(u.username, e.target.value)}
                              style={{ padding: '0.4rem 0.6rem', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: isAdmin ? 'var(--status-green)' : isCotadorNoApproval ? 'var(--accent-blue)' : 'var(--status-yellow)', fontWeight: 'bold', fontSize: '0.8rem', cursor: isGeneralAdmin ? 'pointer' : 'not-allowed' }}
                            >
                              <option value="comprador">👑 Comprador / Admin</option>
                              <option value="cotador">📋 Auxiliar de Cotações</option>
                              <option value="vendedor">📦 Vendedor de Loja</option>
                            </select>
                          </td>

                          <td style={{ padding: '0.85rem 0.75rem', textAlign: 'center' }}>
                            {isAdmin ? (
                              <span style={{ fontSize: '0.75rem', background: 'rgba(16,185,129,0.15)', color: 'var(--status-green)', border: '1px solid var(--status-green)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 'bold' }}>
                                ✓ Aprovação Liberada
                              </span>
                            ) : isCotadorNoApproval ? (
                              <span style={{ fontSize: '0.75rem', background: 'rgba(239,68,68,0.15)', color: 'var(--status-red)', border: '1px solid rgba(239,68,68,0.3)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                <Lock size={12} /> Sem Acesso a Aprovar
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                Faltas de Loja
                              </span>
                            )}
                          </td>

                          <td style={{ padding: '0.85rem 0.75rem', textAlign: 'right' }}>
                            {u.username !== user?.username && (
                              (!isGeneralAdmin && (uRole === 'comprador' || uRole === 'admin_filial')) ? (
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }} title="Apenas Admin Geral pode excluir admins">
                                  <Lock size={13} /> Protegido
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleDeleteUser(u.username)}
                                  style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--status-red)', border: '1px solid rgba(239,68,68,0.3)', padding: '0.4rem 0.65rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}
                                  title="Remover acesso"
                                >
                                  <Trash2 size={14} /> Excluir
                                </button>
                              )
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </div>
    </Layout>
  );
}
