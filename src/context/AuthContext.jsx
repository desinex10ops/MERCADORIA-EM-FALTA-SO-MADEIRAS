import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [usersInfo, setUsersInfo] = useState([]);

  // Load from localStorage on mount
  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase.from('users').select('*');
      if (data) {
        setUsersInfo(data);
      }
    };
    
    const storedLocalUser = localStorage.getItem('@MercadoriaAuth:user');
    const storedSessionUser = sessionStorage.getItem('@MercadoriaAuth:user');
    if (storedLocalUser) {
      setUser(JSON.parse(storedLocalUser));
    } else if (storedSessionUser) {
      setUser(JSON.parse(storedSessionUser));
    }
    
    fetchUsers().finally(() => setLoading(false));
  }, []);

  const login = async (username, password, keepConnected = true) => {
    const searchUsername = username.trim().toLowerCase();
    
    const { data: dbUsers, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', searchUsername)
      .eq('password', password);

    if (error || !dbUsers || dbUsers.length === 0) {
      throw new Error('Usuário ou senha inválidos.');
    }

    const foundUser = dbUsers[0];
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

  const registerUser = async (username, nome, setor) => {
    const usernameStandard = username.trim().toLowerCase();
    
    const { data: existingUser } = await supabase.from('users').select('id').eq('username', usernameStandard);
    if (existingUser && existingUser.length > 0) {
      throw new Error('Já existe um usuário com este login.');
    }
    
    const newUserUid = `u_${Date.now()}`;
    const newUser = {
      uid: newUserUid,
      username: usernameStandard,
      password: '123', // Senha padrão
      role: 'vendedor',
      nome: nome.trim(),
      setor: setor.trim()
    };

    const { error } = await supabase.from('users').insert([newUser]);
    if (error) {
      throw new Error('Erro ao registrar usuário no banco.');
    }

    setUsersInfo([...usersInfo, newUser]);
  };

  const changePassword = async (newPassword) => {
    if (!user) return;
    
    const { error } = await supabase.from('users').update({ password: newPassword }).eq('uid', user.uid);
    if (error) throw new Error('Falha ao alterar a senha.');

    const updatedUsers = usersInfo.map(u => u.uid === user.uid ? { ...u, password: newPassword } : u);
    setUsersInfo(updatedUsers);
    
    const updatedSession = { ...user, password: newPassword };
    setUser(updatedSession);
    
    if (localStorage.getItem('@MercadoriaAuth:user')) {
      localStorage.setItem('@MercadoriaAuth:user', JSON.stringify(updatedSession));
    } else if (sessionStorage.getItem('@MercadoriaAuth:user')) {
      sessionStorage.setItem('@MercadoriaAuth:user', JSON.stringify(updatedSession));
    }
  };

  const deleteUser = async (uid) => {
    if (uid === 'u_juliano' || uid === 'u_admin') return;
    
    const { error } = await supabase.from('users').delete().eq('uid', uid);
    if (!error) {
      setUsersInfo(usersInfo.filter(u => u.uid !== uid));
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('@MercadoriaAuth:user');
    sessionStorage.removeItem('@MercadoriaAuth:user');
  };

  return (
    <AuthContext.Provider value={{ user, usersList: usersInfo, login, logout, loading, registerUser, changePassword, deleteUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
