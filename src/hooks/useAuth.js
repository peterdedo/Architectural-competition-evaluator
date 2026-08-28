import { useState, useEffect, useCallback } from 'react';

// Session přihlášeného porotce – httpOnly cookie nastavuje/maže server (api/auth/*),
// tady se jen zjišťuje aktuální stav a volají login/logout.
export function useAuth() {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading'); // 'loading' | 'authenticated' | 'anonymous'

  const checkSession = useCallback(async () => {
    try {
      const r = await fetch('/api/auth/me', { credentials: 'include' });
      if (!r.ok) throw new Error('unauthenticated');
      const data = await r.json();
      setUser(data);
      setStatus('authenticated');
      return data;
    } catch {
      setUser(null);
      setStatus('anonymous');
      return null;
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = useCallback(async (email, password) => {
    const r = await fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      throw new Error(data?.error === 'Nesprávný e-mail nebo heslo' ? data.error : data?.error || 'Přihlášení se nezdařilo');
    }
    setUser(data);
    setStatus('authenticated');
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } finally {
      setUser(null);
      setStatus('anonymous');
    }
  }, []);

  return { user, status, login, logout };
}
