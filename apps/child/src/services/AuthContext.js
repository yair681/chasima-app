import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, connectSocket } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('token');
      const stored = await AsyncStorage.getItem('user');
      if (token && stored) {
        setUser(JSON.parse(stored));
        await connectSocket(token);
      }
      setLoading(false);
    })();
  }, []);

  const loginWithCode = async (code) => {
    const { token, user } = await api.post('/auth/child-login', { code });
    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    await connectSocket(token);
    setUser(user);
  };

  const updateUser = (updates) => {
    setUser(u => {
      const next = { ...u, ...updates };
      AsyncStorage.setItem('user', JSON.stringify(next));
      return next;
    });
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['token', 'user']);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithCode, updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
