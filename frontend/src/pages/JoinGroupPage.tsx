import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { lookupInvite, joinGroup, authMagicLink, type InviteLookup } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

const JoinGroupPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { authenticated, user } = useAuth();

  const [invite, setInvite] = useState<InviteLookup | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Magic link login
  const [email, setEmail] = useState('');
  const [magicSent, setMagicSent] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [magicError, setMagicError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    lookupInvite(token)
      .then(setInvite)
      .catch(() => setInviteError('Este convite é inválido ou expirou.'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleJoin = async () => {
    if (!token) return;
    setJoining(true);
    setJoinError(null);
    try {
      await joinGroup(token);
      if (invite) {
        navigate(`/grupos/${invite.group_id}`, { replace: true });
      } else {
        navigate('/grupos', { replace: true });
      }
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { error?: string } } };
      setJoinError(axErr.response?.data?.error || 'Erro ao entrar no grupo');
    } finally {
      setJoining(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setMagicLoading(true);
    setMagicError(null);
    try {
      await authMagicLink(email.trim(), `/join/${token}`);
      setMagicSent(true);
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { error?: string } } };
      setMagicError(axErr.response?.data?.error || 'Erro ao enviar link');
    } finally {
      setMagicLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-800 to-green-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">⚽</div>
          <h1 className="text-2xl font-extrabold text-white">Bolão Copa 2026</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6">
          {inviteError ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-3">❌</div>
              <h2 className="text-lg font-bold text-gray-800 mb-2">Convite inválido</h2>
              <p className="text-gray-500 text-sm">{inviteError}</p>
              <Link to="/" className="mt-4 inline-block text-orange-500 hover:underline text-sm">
                Ir para o início
              </Link>
            </div>
          ) : (
            <>
              {/* Invite info */}
              <div className="text-center mb-6">
                <div className="text-4xl mb-2">👥</div>
                <p className="text-gray-500 text-sm">Você foi convidado para o grupo</p>
                <h2 className="text-xl font-extrabold text-gray-800 mt-1">
                  {invite?.group_name}
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Válido até {new Date(invite?.expires_at || '').toLocaleDateString('pt-BR')}
                </p>
              </div>

              {authenticated && user ? (
                <>
                  {/* Logged in — show join button */}
                  <div className="text-center mb-4">
                    <p className="text-sm text-gray-600">
                      Entrando como <strong>{user.display_name}</strong>
                    </p>
                  </div>

                  {joinError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-600 text-sm mb-3">
                      {joinError}
                    </div>
                  )}

                  <button
                    onClick={handleJoin}
                    disabled={joining}
                    className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold text-base hover:bg-orange-600 disabled:opacity-60 transition-colors"
                  >
                    {joining ? 'Entrando...' : 'Entrar no grupo'}
                  </button>

                  <p className="text-center text-xs text-gray-400 mt-3">
                    Não é você?{' '}
                    <Link to="/login" className="text-orange-500 hover:underline">
                      Trocar conta
                    </Link>
                  </p>
                </>
              ) : (
                <>
                  {/* Not logged in — show login options */}
                  <p className="text-sm text-gray-600 text-center mb-4">
                    Entre na plataforma para aceitar o convite
                  </p>

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

                  <div className="flex items-center gap-3 my-3">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs text-gray-400">OU</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>

                  {magicSent ? (
                    <div className="text-center py-2">
                      <div className="text-3xl mb-2">📧</div>
                      <p className="text-sm text-gray-700 font-semibold">Link enviado!</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Verifique seu e-mail e clique no link. Após entrar, você voltará para esta página.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleMagicLink} className="flex flex-col gap-2">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        required
                        className="border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                      {magicError && (
                        <p className="text-red-500 text-xs">{magicError}</p>
                      )}
                      <button
                        type="submit"
                        disabled={magicLoading}
                        className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold text-sm hover:bg-orange-600 disabled:opacity-60 transition-colors"
                      >
                        {magicLoading ? 'Enviando...' : 'Enviar link mágico'}
                      </button>
                    </form>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default JoinGroupPage;
