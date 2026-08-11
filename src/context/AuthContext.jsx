import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const defaultInitialUsers = [
  {
    uid: 'u_admin',
    username: 'admin',
    password: '123',
    role: 'comprador',
    nome: 'Juliano (Comprador Admin)',
    setor: 'Compras',
    loja: 'Só Madeiras'
  },
  {
    uid: 'u_cotador',
    username: 'cotador',
    password: '123',
    role: 'cotador',
    nome: 'Carlos (Auxiliar de Cotações)',
    setor: 'Cotação & Vendas',
    loja: 'Só Madeiras'
  },
  {
    uid: 'u_admin_ki',
    username: 'admin_ki',
    password: '123',
    role: 'admin_filial',
    nome: 'Admin Ki Madeiras',
    setor: 'Gerência Filial',
    loja: 'Ki Madeiras'
  },
  {
    uid: 'u_raul',
    username: 'raul',
    password: '123',
    role: 'admin_filial',
    nome: 'Raul (Admin Ki Madeiras)',
    setor: 'Gerência Filial',
    loja: 'Ki Madeiras'
  },
  {
    uid: 'u_vendedor_ki',
    username: 'vendedor_ki',
    password: '123',
    role: 'vendedor',
    nome: 'Vendedor Ki Madeiras',
    setor: 'Geral',
    loja: 'Ki Madeiras'
  },
  {
    uid: 'u_vendedor_matriz',
    username: 'vendedor_matriz',
    password: '123',
    role: 'vendedor',
    nome: 'Mateus (Vendedor Matriz)',
    setor: 'Balcão',
    loja: 'Só Madeiras'
  }
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Synchronously initialize users list from localStorage or defaults
  const [usersInfo, setUsersInfo] = useState(() => {
    const map = new Map();
    defaultInitialUsers.forEach(u => map.set(u.username.toLowerCase(), u));

    const saved = localStorage.getItem('@MercadoriaAuth:users_list');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          parsed.forEach(u => {
            if (u && u.username) map.set(u.username.toLowerCase(), u);
          });
        }
      } catch (e) {}
    }
    const merged = Array.from(map.values());
    localStorage.setItem('@MercadoriaAuth:users_list', JSON.stringify(merged));
    return merged;
  });

  // Load active user and sync remote users on mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await supabase.from('users').select('*');
        if (data && data.length > 0) {
          setUsersInfo(prev => {
            const map = new Map();
            // Put remote users first
            data.forEach(u => map.set(u.username, u));
            // Supplement with local users
            prev.forEach(u => {
              if (!map.has(u.username)) map.set(u.username, u);
            });
            const merged = Array.from(map.values());
            localStorage.setItem('@MercadoriaAuth:users_list', JSON.stringify(merged));
            return merged;
          });
        }
      } catch (e) {}
    };
    
    const storedLocalUser = localStorage.getItem('@MercadoriaAuth:user');
    const storedSessionUser = sessionStorage.getItem('@MercadoriaAuth:user');
    if (storedLocalUser) {
      try { setUser(JSON.parse(storedLocalUser)); } catch (e) {}
    } else if (storedSessionUser) {
      try { setUser(JSON.parse(storedSessionUser)); } catch (e) {}
    }
    
    fetchUsers().finally(() => setLoading(false));
  }, []);

  const login = async (username, password, keepConnected = true) => {
    const searchUsername = username.trim().toLowerCase();
    
    let foundUser = null;

    // Check loaded users list first
    const norm = (s) => (s || '').trim().toLowerCase();
    foundUser = usersInfo.find(u => norm(u.username) === searchUsername && String(u.password) === String(password));

    // Try Supabase if not found locally
    if (!foundUser) {
      try {
        const { data: dbUsers } = await supabase
          .from('users')
          .select('*')
          .eq('username', searchUsername)
          .eq('password', password);

        if (dbUsers && dbUsers.length > 0) {
          foundUser = dbUsers[0];
        }
      } catch (e) {}
    }

    if (!foundUser) {
      throw new Error('Usuário ou senha inválidos.');
    }

    if (!foundUser.loja) {
      foundUser.loja = 'Só Madeiras';
    }

    setUser(foundUser);
    
    if (keepConnected) {
      localStorage.setItem('@MercadoriaAuth:user', JSON.stringify(foundUser));
      sessionStorage.removeItem('@MercadoriaAuth:user');
    } else {
      sessionStorage.setItem('@MercadoriaAuth:user', JSON.stringify(foundUser));
      localStorage.removeItem('@MercadoriaAuth:user');
    }
    
    return foundUser;
  };

  const registerUser = (userData, paramNome, paramSetor, paramLoja, paramRole) => {
    let input = {};
    if (typeof userData === 'object' && userData !== null) {
      input = userData;
    } else {
      input = {
        username: userData,
        nome: paramNome,
        setor: paramSetor,
        loja: paramLoja,
        role: paramRole
      };
    }

    const usernameStandard = (input.username || '').trim().toLowerCase();
    const nomeStr = (input.nome || '').trim();

    if (!usernameStandard || !nomeStr) {
      return { success: false, message: 'Por favor, preencha o nome de usuário e o nome completo.' };
    }

    const norm = (s) => (s || '').trim().toLowerCase();
    const existingUser = usersInfo.find(u => norm(u.username) === usernameStandard);
    if (existingUser) {
      return { success: false, message: 'Já existe um membro cadastrado com este nome de usuário / login.' };
    }
    
    const newUserUid = `u_${Date.now()}`;
    const newUser = {
      uid: newUserUid,
      username: usernameStandard,
      password: input.password ? String(input.password).trim() : '123',
      role: input.role || 'cotador',
      nome: nomeStr,
      setor: (input.setor || 'Geral').trim(),
      loja: input.loja || 'Só Madeiras'
    };

    const updatedUsers = [newUser, ...usersInfo];
    setUsersInfo(updatedUsers);
    localStorage.setItem('@MercadoriaAuth:users_list', JSON.stringify(updatedUsers));

    try {
      supabase.from('users').insert([newUser]).then();
    } catch (e) {}

    return { success: true, user: newUser };
  };

  const updateUserRole = (username, newRole) => {
    const norm = (s) => (s || '').trim().toLowerCase();
    const updatedUsers = usersInfo.map(u => norm(u.username) === norm(username) ? { ...u, role: newRole } : u);
    setUsersInfo(updatedUsers);
    localStorage.setItem('@MercadoriaAuth:users_list', JSON.stringify(updatedUsers));

    try {
      supabase.from('users').update({ role: newRole }).eq('username', norm(username)).then();
    } catch (e) {}
  };

  const changePassword = async (newPassword) => {
    if (!user) return;
    
    try {
      await supabase.from('users').update({ password: newPassword }).eq('uid', user.uid);
    } catch (e) {}

    const updatedUsers = usersInfo.map(u => u.uid === user.uid ? { ...u, password: newPassword } : u);
    setUsersInfo(updatedUsers);
    localStorage.setItem('@MercadoriaAuth:users_list', JSON.stringify(updatedUsers));
    
    const updatedSession = { ...user, password: newPassword };
    setUser(updatedSession);
    
    if (localStorage.getItem('@MercadoriaAuth:user')) {
      localStorage.setItem('@MercadoriaAuth:user', JSON.stringify(updatedSession));
    } else if (sessionStorage.getItem('@MercadoriaAuth:user')) {
      sessionStorage.setItem('@MercadoriaAuth:user', JSON.stringify(updatedSession));
    }
  };

  const deleteUser = async (target) => {
    const norm = (s) => (s || '').trim().toLowerCase();
    const updatedUsers = usersInfo.filter(u => norm(u.username) !== norm(target) && u.uid !== target);
    setUsersInfo(updatedUsers);
    localStorage.setItem('@MercadoriaAuth:users_list', JSON.stringify(updatedUsers));

    try {
      await supabase.from('users').delete().eq('username', norm(target));
    } catch (e) {}
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('@MercadoriaAuth:user');
    sessionStorage.removeItem('@MercadoriaAuth:user');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      users: usersInfo, 
      usersList: usersInfo, 
      login, 
      logout, 
      loading, 
      registerUser, 
      updateUserRole, 
      changePassword, 
      deleteUser 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
