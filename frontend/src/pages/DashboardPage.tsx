import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMatches, getGroups, getGlobalRanking, type Match, type Group, type RankingEntry } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

// Bandeiras de todos os 48 times da Copa 2026 (nomes em português do seed)
const TEAM_FLAGS: Record<string, string> = {
  // Grupo A
  'México': '🇲🇽',
  'Coreia do Sul': '🇰🇷',
  'África do Sul': '🇿🇦',
  // Grupo B
  'Canadá': '🇨🇦',
  'Catar': '🇶🇦',
  'Suíça': '🇨🇭',
  // Grupo C
  'Brasil': '🇧🇷',
  'Marrocos': '🇲🇦',
  'Haiti': '🇭🇹',
  'Escócia': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  // Grupo D
  'Estados Unidos': '🇺🇸',
  'Paraguai': '🇵🇾',
  'Austrália': '🇦🇺',
  // Grupo E
  'Alemanha': '🇩🇪',
  'Costa do Marfim': '🇨🇮',
  'Equador': '🇪🇨',
  'Curaçao': '🇨🇼',
  // Grupo F
  'Holanda': '🇳🇱',
  'Japão': '🇯🇵',
  'Tunísia': '🇹🇳',
  // Grupo G
  'Bélgica': '🇧🇪',
  'Egito': '🇪🇬',
  'Irã': '🇮🇷',
  'Nova Zelândia': '🇳🇿',
  // Grupo H
  'Espanha': '🇪🇸',
  'Arábia Saudita': '🇸🇦',
  'Cabo Verde': '🇨🇻',
  'Uruguai': '🇺🇾',
  // Grupo I
  'França': '🇫🇷',
  'Senegal': '🇸🇳',
  'Noruega': '🇳🇴',
  // Grupo J
  'Argentina': '🇦🇷',
  'Argélia': '🇩🇿',
  'Áustria': '🇦🇹',
  'Jordânia': '🇯🇴',
  // Grupo K
  'Portugal': '🇵🇹',
  'Colômbia': '🇨🇴',
  'Uzbequistão': '🇺🇿',
  // Grupo L
  'Inglaterra': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'Croácia': '🇭🇷',
  'Gana': '🇬🇭',
  'Panamá': '🇵🇦',
};

export const getFlag = (team: string): string => {
  if (!team || team.startsWith('TBD')) return '🏳️';
  return TEAM_FLAGS[team] || '⚽';
};

const formatDate = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' });
};

const formatTime = (iso: string | null | undefined): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
};

const Countdown: React.FC<{ kickoff: string | null | undefined }> = ({ kickoff }) => {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const id = setInterval(() => forceUpdate((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  if (!kickoff) return <span className="text-gray-400 text-xs">—</span>;
  const diff = new Date(kickoff).getTime() - Date.now();
  if (diff <= 0) return <span className="text-green-600 font-semibold text-xs">Em andamento</span>;

  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);

  if (h > 48) {
    const days = Math.floor(h / 24);
    return <span className="text-gray-500 text-xs">em {days} dias</span>;
  }
  if (h > 0) return <span className="text-orange-500 font-mono text-xs">{h}h {m}m</span>;
  return <span className="text-orange-600 font-mono text-xs font-bold">{m}m {s}s</span>;
};

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [rankingEntry, setRankingEntry] = useState<RankingEntry | null>(null);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingRanking, setLoadingRanking] = useState(true);

  useEffect(() => {
    getMatches()
      .then((all) => {
        const now = new Date();
        const upcoming = all
          .filter((m) => m.match_time && new Date(m.match_time) > now || m.status === 'open')
          .slice(0, 5);
        setUpcomingMatches(upcoming);
      })
      .catch(() => {})
      .finally(() => setLoadingMatches(false));

    getGroups()
      .then(setGroups)
      .catch(() => {})
      .finally(() => setLoadingGroups(false));

    getGlobalRanking()
      .then((ranking) => {
        const entry = ranking.find((r) => r.is_current_user) || null;
        setRankingEntry(entry);
      })
      .catch(() => {})
      .finally(() => setLoadingRanking(false));
  }, [user]);

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-5 text-white shadow">
        <p className="text-orange-100 text-sm">Bem-vindo,</p>
        <h1 className="text-2xl font-extrabold mt-1">{user?.display_name || 'Participante'} 👋</h1>
        <p className="text-orange-100 text-sm mt-1">Copa do Mundo 2026 · EUA, México & Canadá</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col items-center">
          {loadingRanking ? (
            <div className="w-8 h-8 bg-gray-100 rounded animate-pulse" />
          ) : rankingEntry ? (
            <>
              <span className="text-3xl font-black text-orange-500">#{rankingEntry.rank}</span>
              <span className="text-xs text-gray-500 mt-1">Ranking global</span>
              <span className="text-sm font-bold text-gray-700 mt-1">{rankingEntry.total_points} pts</span>
            </>
          ) : (
            <>
              <span className="text-2xl font-black text-gray-300">—</span>
              <span className="text-xs text-gray-500 mt-1">Sem ranking ainda</span>
            </>
          )}
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col items-center">
          {loadingGroups ? (
            <div className="w-8 h-8 bg-gray-100 rounded animate-pulse" />
          ) : (
            <>
              <span className="text-3xl font-black text-green-700">{groups.length}</span>
              <span className="text-xs text-gray-500 mt-1">
                {groups.length === 1 ? 'Grupo' : 'Grupos'}
              </span>
              <Link to="/grupos" className="text-xs text-orange-500 hover:underline mt-1 font-medium">
                ver grupos →
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Upcoming matches */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-800">Próximas partidas</h2>
          <Link to="/partidas" className="text-sm text-orange-500 hover:underline font-medium">
            Ver todas →
          </Link>
        </div>

        {loadingMatches ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl p-4 animate-pulse border border-gray-100">
                <div className="h-4 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2 mt-2" />
              </div>
            ))}
          </div>
        ) : upcomingMatches.length === 0 ? (
          <div className="bg-white rounded-xl p-6 text-center text-gray-400 border border-gray-100">
            <p className="text-3xl mb-2">📅</p>
            <p>Nenhuma partida próxima</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {upcomingMatches.map((match) => (
              <Link
                key={match.id}
                to={`/partidas/${match.id}`}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:border-orange-200 hover:shadow transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                      <span>{getFlag(match.home_team)}</span>
                      <span className="truncate">{match.home_team || '?'}</span>
                      <span className="text-gray-400 font-normal">×</span>
                      <span className="truncate">{match.away_team || '?'}</span>
                      <span>{getFlag(match.away_team)}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>{formatDate(match.match_time)} {formatTime(match.match_time)}</span>
                      {match.city && <span>· {match.city}</span>}
                    </div>
                  </div>
                  <div className="ml-3 text-right">
                    <Countdown kickoff={match.match_time} />
                    {match.status === 'open' && (
                      <span className="block text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium mt-1">
                        Aberto
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* My groups */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-800">Meus grupos</h2>
          <Link to="/grupos" className="text-sm text-orange-500 hover:underline font-medium">
            Gerenciar →
          </Link>
        </div>

        {loadingGroups ? (
          <div className="flex flex-col gap-2">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-xl p-4 animate-pulse border border-gray-100">
                <div className="h-4 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="bg-white rounded-xl p-6 text-center border border-gray-100 border-dashed">
            <p className="text-3xl mb-2">👥</p>
            <p className="text-gray-500 text-sm">Você ainda não está em nenhum grupo</p>
            <Link
              to="/grupos"
              className="mt-3 inline-block bg-orange-500 text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors"
            >
              Criar ou entrar em um grupo
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {groups.slice(0, 4).map((group) => (
              <Link
                key={group.id}
                to={`/grupos/${group.id}`}
                className="bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100 hover:border-orange-200 hover:shadow transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm">
                    {group.name[0]?.toUpperCase()}
                  </div>
                  <span className="font-semibold text-gray-800 text-sm">{group.name}</span>
                </div>
                <span className="text-gray-400 text-xs">
                  {group.member_count != null ? `${group.member_count} membros` : ''}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
