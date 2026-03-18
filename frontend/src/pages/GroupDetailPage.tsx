import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getGroup,
  getGroupRanking,
  generateInvite,
  getInvite,
  promoteMember,
  type GroupDetail,
  type GroupMember,
  type RankingEntry,
  type InviteInfo,
} from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

const Avatar: React.FC<{ member: GroupMember; size?: 'sm' | 'md' }> = ({ member, size = 'md' }) => {
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  return member.photo_path ? (
    <img
      src={member.photo_path}
      alt={member.display_name}
      className={`${sz} rounded-full object-cover border-2 border-orange-100`}
    />
  ) : (
    <div
      className={`${sz} rounded-full bg-orange-100 border-2 border-orange-200 flex items-center justify-center font-bold text-orange-600`}
    >
      {member.display_name?.[0]?.toUpperCase() || '?'}
    </div>
  );
};

const GroupDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [detail, setDetail] = useState<GroupDetail | null>(null);
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [rankingLoading, setRankingLoading] = useState(true);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'members' | 'ranking'>('members');
  const [promotingId, setPromotingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getGroup(id)
      .then((d) => {
        setDetail(d);
        // Load existing invite silently
        getInvite(id).then(setInvite).catch(() => {});
      })
      .catch(() => setError('Grupo não encontrado'))
      .finally(() => setLoading(false));

    setRankingLoading(true);
    getGroupRanking(id)
      .then(setRanking)
      .catch(() => {})
      .finally(() => setRankingLoading(false));
  }, [id]);

  // Compare user_id (the actual user UUID), not id (the group_member row UUID)
  const isAdmin = detail?.members.find((m) => m.user_id === user?.id)?.is_admin ?? false;

  // Constrói o link de convite usando a origem do próprio navegador.
  // Assim funciona corretamente em dev (Vite) e em produção (Go) sem configuração.
  const inviteUrl = invite
    ? `${window.location.origin}/join/${invite.token}`
    : null;

  const handleGenerateInvite = async () => {
    if (!id) return;
    setInviteLoading(true);
    try {
      const inv = await generateInvite(id);
      setInvite(inv);
    } catch {
      alert('Erro ao gerar convite');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleCopyInvite = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handlePromote = async (memberId: string) => {
    if (!id) return;
    if (!confirm('Promover este membro a administrador?')) return;
    setPromotingId(memberId);
    try {
      await promoteMember(id, memberId);
      const updated = await getGroup(id);
      setDetail(updated);
    } catch {
      alert('Erro ao promover membro');
    } finally {
      setPromotingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p className="text-4xl mb-3">😕</p>
        <p>{error || 'Grupo não encontrado'}</p>
        <Link to="/grupos" className="text-orange-500 hover:underline mt-2 block">
          Voltar aos grupos
        </Link>
      </div>
    );
  }

  const { group, members } = detail;
  const inviteExpiry = invite ? new Date(invite.expires_at).toLocaleDateString('pt-BR') : '';

  return (
    <div className="flex flex-col gap-5 max-w-2xl mx-auto">
      <div className="flex items-center gap-2">
        <Link to="/grupos" className="text-gray-400 hover:text-gray-600 text-sm">← Grupos</Link>
      </div>

      {/* Group header */}
      <div className="bg-gradient-to-r from-green-800 to-green-900 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
            {group.name[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-extrabold">{group.name}</h1>
            <p className="text-green-300 text-sm mt-0.5">
              {members.length} {members.length === 1 ? 'membro' : 'membros'}
            </p>
          </div>
        </div>
      </div>

      {/* Invite section (admin only) */}
      {isAdmin && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h3 className="text-sm font-bold text-gray-800 mb-3">Convidar pessoas</h3>
          {invite ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={inviteUrl || ''}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 truncate focus:outline-none"
                />
                <button
                  onClick={handleCopyInvite}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex-shrink-0 ${
                    copied
                      ? 'bg-green-500 text-white'
                      : 'bg-orange-500 text-white hover:bg-orange-600'
                  }`}
                >
                  {copied ? '✓ Copiado!' : 'Copiar'}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">Válido até {inviteExpiry}</p>
                <button
                  onClick={handleGenerateInvite}
                  disabled={inviteLoading}
                  className="text-xs text-orange-500 hover:underline disabled:opacity-50"
                >
                  {inviteLoading ? 'Gerando...' : 'Gerar novo link'}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleGenerateInvite}
              disabled={inviteLoading}
              className="w-full bg-orange-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-orange-600 disabled:opacity-60 transition-colors"
            >
              {inviteLoading ? 'Gerando...' : '🔗 Gerar link de convite'}
            </button>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab('members')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
            activeTab === 'members'
              ? 'bg-white text-gray-800 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Membros ({members.length})
        </button>
        <button
          onClick={() => setActiveTab('ranking')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
            activeTab === 'ranking'
              ? 'bg-white text-gray-800 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Ranking
        </button>
      </div>

      {/* Members tab */}
      {activeTab === 'members' && (
        <div className="flex flex-col gap-2">
          {members.map((member) => (
            <div
              key={member.id}
              className="bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100 flex items-center gap-3"
            >
              <Avatar member={member} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-gray-800 truncate">
                    {member.display_name}
                    {member.id === user?.id && (
                      <span className="ml-1 text-xs text-orange-500">(você)</span>
                    )}
                  </span>
                  {member.is_admin && (
                    <span className="bg-orange-100 text-orange-600 text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0">
                      Admin
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 truncate">{member.email}</p>
              </div>

              {/* Promote button */}
              {isAdmin && !member.is_admin && member.id !== user?.id && (
                <button
                  onClick={() => handlePromote(member.id)}
                  disabled={promotingId === member.id}
                  className="text-xs text-gray-400 hover:text-orange-500 transition-colors disabled:opacity-50 flex-shrink-0"
                  title="Promover a admin"
                >
                  {promotingId === member.id ? '...' : '⬆ Admin'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Ranking tab */}
      {activeTab === 'ranking' && (
        <div>
          {rankingLoading ? (
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl p-4 animate-pulse border border-gray-100 h-14" />
              ))}
            </div>
          ) : ranking.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <p className="text-3xl mb-2">📊</p>
              <p>Ranking ainda não disponível</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {ranking.map((entry, idx) => (
                <div
                  key={entry.id}
                  className={`flex items-center gap-3 px-4 py-3 ${
                    idx < ranking.length - 1 ? 'border-b border-gray-50' : ''
                  } ${entry.id === user?.id ? 'bg-orange-50' : ''}`}
                >
                  <span
                    className={`text-sm font-black w-6 text-center ${
                      entry.rank === 1
                        ? 'text-yellow-500'
                        : entry.rank === 2
                        ? 'text-gray-400'
                        : entry.rank === 3
                        ? 'text-amber-600'
                        : 'text-gray-500'
                    }`}
                  >
                    {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {entry.display_name}
                      {entry.id === user?.id && (
                        <span className="ml-1 text-xs text-orange-500">(você)</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400">
                      {entry.predictions_scored || 0} palpites pontuados
                    </p>
                  </div>

                  <span className="text-sm font-black text-orange-500">
                    {entry.total_points} pts
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GroupDetailPage;
