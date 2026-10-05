import React, { createContext, useContext, useEffect, useState } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('streamearn_token'));
  const [user, setUser] = useState(null);
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    if (!token) {
      setUser(null);
      setProfileError('');
      return;
    }

    let active = true;
    setProfileError('');
    client
      .get('/user/profile')
      .then((res) => {
        if (active) {
          setUser(res.data.user);
          setProfileError('');
        }
      })
      .catch((err) => {
        if (!active) return;
        if ([401, 403].includes(err.response?.status)) {
          logout();
          return;
        }
        setUser(null);
        setProfileError(
          'Signed in, but your profile could not be loaded. Check the API configuration and try reloading.'
        );
      });

    return () => {
      active = false;
    };
  }, [token]);

  function login(newToken) {
    localStorage.setItem('streamearn_token', newToken);
    setProfileError('');
    setToken(newToken);
  }

  function logout() {
    localStorage.removeItem('streamearn_token');
    setToken(null);
    setUser(null);
    setProfileError('');
  }

  return (
    <AuthContext.Provider value={{ token, user, profileError, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
