import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { connectSocket, disconnectSocket } from '../services/socket';
import { serverService } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (user) {
      connectSocket();
    }
    return () => disconnectSocket();
  }, [user]);

  function login(userData, token) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);

    // Se o usuario veio de um link de convite, completa a entrada no grupo agora
    const pendingInvite = sessionStorage.getItem('pendingInvite');
    if (pendingInvite) {
      sessionStorage.removeItem('pendingInvite');
      serverService
        .join(pendingInvite)
        .then((data) => {
          window.location.href = data.channelId
            ? `/servers/${data.channelId}`
            : '/servers';
        })
        .catch(() => {
          window.location.href = '/servers';
        });
    }
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    disconnectSocket();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
