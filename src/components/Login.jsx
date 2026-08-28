import React, { useState } from 'react';
import { LogIn, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';

// Přihlašovací obrazovka — stejný vizuální jazyk a velké dotykové plochy jako zbytek appky
// (viz UX audit pro digitálně méně zkušené uživatele): velký kontrastní vstup, jasná chybová
// hláška, žádné drobné nebo hover-only ovládání. Účty zakládá admin ručně v databázi (v1).
const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError('');
    setSubmitting(true);
    try {
      await onLogin(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Přihlášení se nezdařilo');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <img
            src="https://4ct.eu/themes/4ct/assets/img/logo%20web%20color.svg"
            alt="4ct Logo"
            className="h-12 w-auto"
          />
        </div>

        <form onSubmit={handleSubmit} className="card-active bg-white space-y-5" noValidate>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Přihlášení do Archi Evaluator</h1>
            <p className="text-base text-text-light mt-1">Zadejte e-mail a heslo, které jste dostali od organizátora.</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-error/10 border-2 border-error/30 text-error text-base font-medium">
              <AlertCircle size={20} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="login-email" className="block text-base font-semibold text-slate-800 mb-2">
              E-mail
            </label>
            <div className="relative">
              <Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="login-email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 text-lg border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                placeholder="jmeno@priklad.cz"
              />
            </div>
          </div>

          <div>
            <label htmlFor="login-password" className="block text-base font-semibold text-slate-800 mb-2">
              Heslo
            </label>
            <div className="relative">
              <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 text-lg border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !email || !password}
            className="btn-primary w-full flex items-center justify-center gap-2 text-lg py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? <Loader2 size={20} className="animate-spin" /> : <LogIn size={20} />}
            {submitting ? 'Přihlašuji…' : 'Přihlásit se'}
          </button>

          <p className="text-sm text-text-muted text-center">
            Nemáte přístupové údaje? Kontaktujte organizátora soutěže.
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
