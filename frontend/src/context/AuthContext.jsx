import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('tecflix_token') || null);
  const [currentProfile, setCurrentProfile] = useState(() => {
    const saved = localStorage.getItem('tecflix_current_profile');
    return saved ? JSON.parse(saved) : null;
  });
  const [profiles, setProfiles] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [introCompleted, setIntroCompleted] = useState(() => {
    return sessionStorage.getItem('tecflix_intro_completed') === 'true';
  });

  // Cargar sesión guardada al iniciar
  useEffect(() => {
    async function loadSession() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.auth.getMe();
        setUser(res.user);
        setSubscription(res.subscription);
        setProfiles(res.profiles || []);

        if (res.profiles && res.profiles.length > 0) {
          if (!currentProfile || !res.profiles.some(p => p.id === currentProfile.id)) {
            setCurrentProfile(res.profiles[0]);
            localStorage.setItem('tecflix_current_profile', JSON.stringify(res.profiles[0]));
          }
        }

        // Cargar métodos de pago
        try {
          const pmRes = await api.billing.getMethods();
          setPaymentMethods(pmRes.data || []);
        } catch (_) {}
      } catch (err) {
        console.warn('Sesión expirada o inválida');
        logout();
      } finally {
        setLoading(false);
      }
    }

    loadSession();
  }, [token]);

  const login = async (email, password, expectedRole) => {
    const res = await api.auth.login({ email, password, expectedRole });
    localStorage.setItem('tecflix_token', res.token);
    setToken(res.token);
    setUser(res.user);
    setSubscription(res.subscription);
    setProfiles(res.profiles || []);

    if (res.profiles && res.profiles.length > 0) {
      setCurrentProfile(res.profiles[0]);
      localStorage.setItem('tecflix_current_profile', JSON.stringify(res.profiles[0]));
    }

    // Cargar métodos de pago del usuario
    try {
      const pmRes = await api.billing.getMethods();
      setPaymentMethods(pmRes.data || []);
    } catch (_) {}

    return res;
  };

  const register = async (payload) => {
    const res = await api.auth.register(payload);
    localStorage.setItem('tecflix_token', res.token);
    setToken(res.token);
    setUser(res.user);

    // Cargar perfiles y suscripción recién creados
    const meRes = await api.auth.getMe();
    setSubscription(meRes.subscription);
    setProfiles(meRes.profiles || []);
    if (meRes.profiles && meRes.profiles.length > 0) {
      setCurrentProfile(meRes.profiles[0]);
      localStorage.setItem('tecflix_current_profile', JSON.stringify(meRes.profiles[0]));
    }

    return res;
  };

  const logout = () => {
    localStorage.removeItem('tecflix_token');
    localStorage.removeItem('tecflix_current_profile');
    setToken(null);
    setUser(null);
    setCurrentProfile(null);
    setProfiles([]);
    setSubscription(null);
    setPaymentMethods([]);
  };

  const selectProfile = (profile) => {
    setCurrentProfile(profile);
    localStorage.setItem('tecflix_current_profile', JSON.stringify(profile));
  };

  const reloadProfiles = async () => {
    try {
      const res = await api.profiles.getAll();
      setProfiles(res.data || []);
      if (currentProfile) {
        const updated = res.data.find(p => p.id === currentProfile.id);
        if (updated) {
          setCurrentProfile(updated);
          localStorage.setItem('tecflix_current_profile', JSON.stringify(updated));
        }
      }
    } catch (_) {}
  };

  const reloadSubscription = async () => {
    try {
      const res = await api.billing.getSubscription();
      setSubscription(res.data);
    } catch (_) {}
  };

  const reloadPaymentMethods = async () => {
    try {
      const res = await api.billing.getMethods();
      setPaymentMethods(res.data || []);
    } catch (_) {}
  };

  const finishIntro = () => {
    sessionStorage.setItem('tecflix_intro_completed', 'true');
    setIntroCompleted(true);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        currentProfile,
        profiles,
        subscription,
        paymentMethods,
        loading,
        introCompleted,
        finishIntro,
        login,
        register,
        logout,
        selectProfile,
        reloadProfiles,
        reloadSubscription,
        reloadPaymentMethods,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
}
