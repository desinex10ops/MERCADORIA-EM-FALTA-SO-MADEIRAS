import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [usersInfo, setUsersInfo] = useState([]);

  // Load from localStorage on mount
  useEffect(() => {
    // Bootstrap Admin 
    let storedUsers = localStorage.getItem('@MercadoriaAuth:users');
    if (!storedUsers) {
      storedUsers = [
        { uid: 'u_admin', username: 'juliano', password: '123', role: 'comprador', nome: 'Juliano', setor: 'Diretoria' }
      ];
      localStorage.setItem('@MercadoriaAuth:users', JSON.stringify(storedUsers));
    } else {
      storedUsers = JSON.parse(storedUsers);
    }
    setUsersInfo(storedUsers);

    const storedUser = localStorage.getItem('@MercadoriaAuth:user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (username, password) => {
    const foundUser = usersInfo.find(u => u.username === username.trim().toLowerCase() && u.password === password);
    if (!foundUser) {
      throw new Error('Usuário ou senha inválidos.');
    }

    setUser(foundUser);
    localStorage.setItem('@MercadoriaAuth:user', JSON.stringify(foundUser));
    return foundUser;
  };

  const registerUser = (username, nome, setor) => {
    const usernameStandard = username.trim().toLowerCase();
    if (usersInfo.find(u => u.username === usernameStandard)) {
      throw new Error('Já existe um usuário com este login.');
    }
    
    const newUser = {
      uid: uuidv4(),
      username: usernameStandard,
      password: '123', // Senha padrão
      role: 'vendedor',
      nome: nome.trim(),
      setor: setor.trim()
    };

    const newUsersList = [...usersInfo, newUser];
    setUsersInfo(newUsersList);
    localStorage.setItem('@MercadoriaAuth:users', JSON.stringify(newUsersList));
  };

  const changePassword = (newPassword) => {
    if (!user) return;
    
    const updatedUsers = usersInfo.map(u => {
      if (u.uid === user.uid) {
        return { ...u, password: newPassword };
      }
      return u;
    });

    setUsersInfo(updatedUsers);
    localStorage.setItem('@MercadoriaAuth:users', JSON.stringify(updatedUsers));
    
    // update current session
    const updatedSession = { ...user, password: newPassword };
    setUser(updatedSession);
    localStorage.setItem('@MercadoriaAuth:user', JSON.stringify(updatedSession));
  };

  const deleteUser = (uid) => {
    if (uid === 'u_admin') return;
    const newUsersList = usersInfo.filter(u => u.uid !== uid);
    setUsersInfo(newUsersList);
    localStorage.setItem('@MercadoriaAuth:users', JSON.stringify(newUsersList));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('@MercadoriaAuth:user');
  };

  return (
    <AuthContext.Provider value={{ user, usersList: usersInfo, login, logout, loading, registerUser, changePassword, deleteUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
