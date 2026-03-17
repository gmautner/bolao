import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authMagicLink, devLogin } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [magicSent, setMagicSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devEmail, setDevEmail] = useState('');
  const [devLoading, setDevLoading] = useState(false);

  const { authenticated, user, refresh } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/';

  useEffect(() => {
    if (authenticated && user) {
      if (!user.display_name) {
        navigate('/profile/setup', { replace: true });
      } else {
        navigate(redirectPath, { replace: true });
      }
    }
  }, [authenticated, user, navigate, redirectPath]);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await authMagicLink(email.trim(), redirectPath !== '/' ? redirectPath : undefined);
      setMagicSent(true);
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { error?: string } } };
      setError(axErr.response?.data?.error || 'Erro ao enviar link. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDevLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!devEmail.trim()) return;
    setDevLoading(true);
    try {
      await devLogin(devEmail.trim());
      await refresh();
    } catch {
      alert('Dev login falhou');
    } finally {
      setDevLoading(false);
    }
  };

  const isDev = import.meta.env.DEV;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-800 to-green-900 flex flex-col items-center justify-center px-4">
      {/* Hero */}
      <div className="text-center mb-8">
        <div className="text-6xl mb-3">⚽</div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Bolão Copa 2026
        </h1>
        <p className="text-green-300 mt-2 text-sm">
          Faça seus palpites e dispute com os amigos
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6">
        {magicSent ? (
          <div className="text-center py-4">
            <div className="text-5xl mb-4">📧</div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">Link enviado!</h2>
            <p className="text-gray-600 text-sm">
              Verifique seu e-mail <strong>{email}</strong> e clique no link para entrar.
            </p>
            <button
              onClick={() => { setMagicSent(false); setEmail(''); }}
              className="mt-4 text-sm text-orange-500 hover:underline"
            >
              Usar outro e-mail
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-center text-lg font-bold text-gray-800 mb-5">
              Entrar na plataforma
            </h2>

            {/* Google */}
            <a
              href="/auth/google"
              className="flex items-center justify-center gap-3 w-full border border-gray-300 rounded-xl py-3 text-gray-700 font-medium hover:bg-gray-50 transition-colors mb-4"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Entrar com Google
            </a>

            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium">OU</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Magic link */}
            <form onSubmit={handleMagicLink} className="flex flex-col gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              />
              {error && <p className="text-red-500 text-xs text-center">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 text-white rounded-xl py-3 font-semibold hover:bg-orange-600 disabled:opacity-60 transition-colors"
              >
                {loading ? 'Enviando...' : 'Enviar link mágico'}
              </button>
            </form>

            <p className="text-center text-xs text-gray-400 mt-4">
              Enviaremos um link de acesso para seu e-mail
            </p>
          </>
        )}
      </div>

      {/* Dev login */}
      {isDev && (
        <div className="mt-6 w-full max-w-sm bg-yellow-50 border border-yellow-300 rounded-xl p-4">
          <p className="text-xs font-bold text-yellow-700 mb-2">🛠 Dev Mode — Login rápido</p>
          <form onSubmit={handleDevLogin} className="flex gap-2">
            <input
              type="email"
              value={devEmail}
              onChange={(e) => setDevEmail(e.target.value)}
              placeholder="email@dev.com"
              className="flex-1 border border-yellow-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            <button
              type="submit"
              disabled={devLoading}
              className="bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-600 disabled:opacity-60"
            >
              {devLoading ? '...' : 'Login'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
