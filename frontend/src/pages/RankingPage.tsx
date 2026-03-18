import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getGlobalRanking, getGroups, getGroupRanking, type RankingEntry, type Group } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

const RankingTable: React.FC<{ entries: RankingEntry[]; myUserId?: string }> = ({
  entries,
  myUserId,
}) => {
  if (entries.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400">
        <p className="text-3xl mb-2">📊</p>
        <p>Ranking ainda não disponível. Os palpites serão contabilizados após as partidas.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[2rem_1fr_3.5rem_3.5rem_3.5rem] gap-2 px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wide">
        <span>#</span>
        <span>Participante</span>
        <span className="text-center">Exatos</span>
        <span className="text-center">Result.</span>
        <span className="text-center">Pts</span>
      </div>

      {entries.map((entry, idx) => (
        <div
          key={entry.id}
          className={`grid grid-cols-[2rem_1fr_3.5rem_3.5rem_3.5rem] gap-2 items-center px-4 py-3 ${
            idx < entries.length - 1 ? 'border-b border-gray-50' : ''
          } ${entry.id === myUserId ? 'bg-orange-50' : 'hover:bg-gray-50'} transition-colors`}
        >
          {/* Rank */}
          <span
            className={`text-sm font-black text-center ${
              entry.rank === 1
                ? 'text-yellow-500 text-base'
                : entry.rank === 2
                ? 'text-gray-400'
                : entry.rank === 3
                ? 'text-amber-600'
                : 'text-gray-400'
            }`}
          >
            {entry.rank === 1
              ? '🥇'
              : entry.rank === 2
              ? '🥈'
              : entry.rank === 3
              ? '🥉'
              : `${entry.rank}`}
          </span>

          {/* Name + avatar */}
          <div className="flex items-center gap-2 min-w-0">
            {entry.photo_path ? (
              <img
                src={entry.photo_path}
                alt={entry.display_name}
                className="w-7 h-7 rounded-full object-cover border border-orange-100 flex-shrink-0"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs flex-shrink-0">
                {entry.display_name?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            <span
              className={`text-sm font-semibold truncate ${
                entry.id === myUserId ? 'text-orange-600' : 'text-gray-800'
              }`}
            >
              {entry.display_name}
              {entry.id === myUserId && (
                <span className="ml-1 text-xs text-orange-400 font-normal">você</span>
              )}
            </span>
          </div>

          {/* Exact */}
          <span className="text-center text-sm font-semibold text-gray-700">
            {entry.predictions_scored || 0}
          </span>

          {/* Correct results */}
          <span className="text-center text-sm font-semibold text-gray-700">
            
          </span>

          {/* Points */}
          <span className="text-center text-sm font-black text-orange-500">
            {entry.total_points}
          </span>
        </div>
      ))}
    </div>
  );
};

const RankingPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'global' | string>('global');
  const [globalRanking, setGlobalRanking] = useState<RankingEntry[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupRankings, setGroupRankings] = useState<Map<string, RankingEntry[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [groupLoading, setGroupLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([getGlobalRanking(), getGroups()])
      .then(([ranking, grps]) => {
        setGlobalRanking(ranking);
        setGroups(grps);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleTabChange = async (tab: string) => {
    setActiveTab(tab);
    if (tab !== 'global' && !groupRankings.has(tab)) {
      setGroupLoading(true);
      try {
        const ranking = await getGroupRanking(tab);
        setGroupRankings((prev) => new Map(prev).set(tab, ranking));
      } catch {
        // ignore
      } finally {
        setGroupLoading(false);
      }
    }
  };

  const currentEntries =
    activeTab === 'global'
      ? globalRanking
      : groupRankings.get(activeTab) || [];

  const myEntry = currentEntries.find((e) => e.id === user?.id);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-bold text-gray-800">Ranking</h1>

      {/* My position card */}
      {myEntry && (
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-4 text-white flex items-center gap-4">
          <div className="text-center">
            <span className="text-3xl font-black">#{myEntry.rank}</span>
            <p className="text-orange-100 text-xs">sua posição</p>
          </div>
          <div className="w-px h-12 bg-white/30" />
          <div className="flex-1">
            <p className="font-bold">{user?.display_name}</p>
            <p className="text-orange-100 text-sm">
              {myEntry.total_points} pts · {myEntry.predictions_scored || 0} palpites pontuados
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      {groups.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
          <button
            onClick={() => handleTabChange('global')}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              activeTab === 'global'
                ? 'bg-orange-500 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-orange-300'
            }`}
          >
            🌍 Global
          </button>
          {groups.map((g) => (
            <button
              key={g.id}
              onClick={() => handleTabChange(g.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                activeTab === g.id
                  ? 'bg-orange-500 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-orange-300'
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="flex gap-4 text-xs text-gray-500">
        <span><strong>#</strong> Posição</span>
        <span><strong>Exatos</strong> Placar certo</span>
        <span><strong>Result.</strong> Vencedor certo</span>
        <span><strong>Pts</strong> Pontos totais</span>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white rounded-xl p-4 animate-pulse border border-gray-100 h-14" />
          ))}
        </div>
      ) : groupLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <RankingTable entries={currentEntries} myUserId={user?.id} />
      )}

      {activeTab !== 'global' && (
        <p className="text-xs text-gray-400 text-center">
          Ranking do grupo ·{' '}
          <Link to={`/grupos/${activeTab}`} className="text-orange-500 hover:underline">
            ver detalhes do grupo
          </Link>
        </p>
      )}
    </div>
  );
};

export default RankingPage;
