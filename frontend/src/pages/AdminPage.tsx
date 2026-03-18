import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMatches, adminSetResult, adminSetTeams, type Match } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { getFlag } from './DashboardPage';

const PHASE_LABELS: Record<string, string> = {
  group: 'Fase de Grupos',
  round_of_32: 'Round de 32',
  round_of_16: 'Oitavas de Final',
  quarter: 'Quartas de Final',
  semi: 'Semifinal',
  third_place: 'Disputa de 3º Lugar',
  final: 'Final',
};

interface MatchRowState {
  homeScore: string;
  awayScore: string;
  hasExtraTime: boolean;
  homeTeam: string;
  awayTeam: string;
  saving: boolean;
  saved: boolean;
  teamSaving: boolean;
  teamSaved: boolean;
  error: string | null;
}

const AdminPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [rowState, setRowState] = useState<Map<string, MatchRowState>>(new Map());
  const [filter, setFilter] = useState<'all' | 'open' | 'scheduled' | 'finished'>('all');

  useEffect(() => {
    if (!authLoading && !user?.is_superadmin) {
      navigate('/', { replace: true });
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    getMatches()
      .then((m) => {
        setMatches(m);
        const stateMap = new Map<string, MatchRowState>();
        for (const match of m) {
          stateMap.set(match.id, {
            homeScore: match.home_score?.toString() ?? '',
            awayScore: match.away_score?.toString() ?? '',
            hasExtraTime: match.has_extra_time ?? false,
            homeTeam: match.home_team ?? '',
            awayTeam: match.away_team ?? '',
            saving: false,
            saved: false,
            teamSaving: false,
            teamSaved: false,
            error: null,
          });
        }
        setRowState(stateMap);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateRow = (id: string, patch: Partial<MatchRowState>) => {
    setRowState((prev) => {
      const next = new Map(prev);
      const cur = next.get(id);
      if (cur) next.set(id, { ...cur, ...patch });
      return next;
    });
  };

  const handleSaveResult = async (matchId: string) => {
    const state = rowState.get(matchId);
    if (!state) return;
    const h = parseInt(state.homeScore);
    const a = parseInt(state.awayScore);
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) {
      updateRow(matchId, { error: 'Placar inválido' });
      return;
    }
    updateRow(matchId, { saving: true, error: null });
    try {
      await adminSetResult(matchId, h, a, state.hasExtraTime);
      updateRow(matchId, { saving: false, saved: true });
      setTimeout(() => updateRow(matchId, { saved: false }), 2000);
      // Refresh matches
      const updated = await getMatches();
      setMatches(updated);
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { error?: string } } };
      updateRow(matchId, { saving: false, error: axErr.response?.data?.error || 'Erro ao salvar' });
    }
  };

  const handleSaveTeams = async (matchId: string) => {
    const state = rowState.get(matchId);
    if (!state) return;
    if (!state.homeTeam.trim() || !state.awayTeam.trim()) {
      updateRow(matchId, { error: 'Preencha os dois times' });
      return;
    }
    updateRow(matchId, { teamSaving: true, error: null });
    try {
      await adminSetTeams(matchId, state.homeTeam.trim(), state.awayTeam.trim());
      updateRow(matchId, { teamSaving: false, teamSaved: true });
      setTimeout(() => updateRow(matchId, { teamSaved: false }), 2000);
      const updated = await getMatches();
      setMatches(updated);
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { error?: string } } };
      updateRow(matchId, { teamSaving: false, error: axErr.response?.data?.error || 'Erro ao salvar times' });
    }
  };

  const filteredMatches = matches.filter((m) => {
    if (filter === 'all') return true;
    return m.status === filter;
  });

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user?.is_superadmin) return null;

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3">
        <span className="text-2xl">🛡️</span>
        <div>
          <h1 className="text-lg font-bold text-red-700">Painel Administrativo</h1>
          <p className="text-xs text-red-500">Acesso restrito a superadministradores</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'scheduled', 'open', 'finished'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filter === f
                ? 'bg-orange-500 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-orange-300'
            }`}
          >
            {f === 'all' ? 'Todas' : f === 'scheduled' ? 'Agendadas' : f === 'open' ? 'Abertas' : 'Finalizadas'}
          </button>
        ))}
        <span className="text-xs text-gray-400 self-center ml-1">
          {filteredMatches.length} partidas
        </span>
      </div>

      {/* Matches */}
      {loading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl p-4 animate-pulse border border-gray-100 h-28" />
          ))}
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="text-center py-10 text-gray-400">Nenhuma partida encontrada</div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredMatches.map((match) => {
            const state = rowState.get(match.id);
            if (!state) return null;
            const needsTeams = !match.home_team || !match.away_team;
            const kickoff = match.match_time ? new Date(match.match_time) : null;

            return (
              <div
                key={match.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col gap-3"
              >
                {/* Match header */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-gray-500 uppercase">
                      {PHASE_LABELS[match.phase] || match.phase} · #{match.match_number}
                    </span>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {kickoff?.toLocaleString('pt-BR', {
                        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                      })} · {match.stadium}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      match.status === 'finished'
                        ? 'bg-gray-100 text-gray-600'
                        : match.status === 'open'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-600'
                    }`}
                  >
                    {match.status === 'finished' ? 'Finalizada' : match.status === 'open' ? 'Aberta' : 'Agendada'}
                  </span>
                </div>

                {/* Teams row */}
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <span>{getFlag(match.home_team)}</span>
                  <span>{match.home_team || '?'}</span>
                  <span className="text-gray-400">×</span>
                  <span>{match.away_team || '?'}</span>
                  <span>{getFlag(match.away_team)}</span>
                  {match.home_score != null && (
                    <span className="ml-2 text-gray-400">
                      ({match.home_score} × {match.away_score}
                      {match.has_extra_time ? ' – prorrogação' : ''})
                    </span>
                  )}
                </div>

                {state.error && (
                  <p className="text-red-500 text-xs">{state.error}</p>
                )}

                {/* Set teams (knockout without teams) */}
                {needsTeams && match.phase !== 'group' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex flex-col gap-2">
                    <p className="text-xs font-bold text-yellow-700">Definir times</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={state.homeTeam}
                        onChange={(e) => updateRow(match.id, { homeTeam: e.target.value })}
                        placeholder="Time da casa"
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      />
                      <input
                        type="text"
                        value={state.awayTeam}
                        onChange={(e) => updateRow(match.id, { awayTeam: e.target.value })}
                        placeholder="Time visitante"
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      />
                      <button
                        onClick={() => handleSaveTeams(match.id)}
                        disabled={state.teamSaving || state.teamSaved}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                          state.teamSaved
                            ? 'bg-green-500 text-white'
                            : 'bg-yellow-500 text-white hover:bg-yellow-600 disabled:opacity-60'
                        }`}
                      >
                        {state.teamSaved ? '✓' : state.teamSaving ? '...' : 'Salvar'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Set result */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={99}
                      value={state.homeScore}
                      onChange={(e) => updateRow(match.id, { homeScore: e.target.value })}
                      placeholder="—"
                      className="w-14 h-10 text-center text-lg font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:border-orange-400"
                    />
                    <span className="font-bold text-gray-400">×</span>
                    <input
                      type="number"
                      min={0}
                      max={99}
                      value={state.awayScore}
                      onChange={(e) => updateRow(match.id, { awayScore: e.target.value })}
                      placeholder="—"
                      className="w-14 h-10 text-center text-lg font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:border-orange-400"
                    />
                  </div>

                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={state.hasExtraTime}
                      onChange={(e) => updateRow(match.id, { hasExtraTime: e.target.checked })}
                      className="w-4 h-4 accent-orange-500"
                    />
                    Prorrogação / Pênaltis
                  </label>

                  <button
                    onClick={() => handleSaveResult(match.id)}
                    disabled={state.saving || state.saved}
                    className={`ml-auto px-5 py-2 rounded-lg text-sm font-bold transition-colors ${
                      state.saved
                        ? 'bg-green-500 text-white'
                        : 'bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-60'
                    }`}
                  >
                    {state.saved ? '✓ Salvo!' : state.saving ? 'Salvando...' : 'Salvar resultado'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminPage;
