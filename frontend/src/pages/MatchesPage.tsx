import React, { useEffect, useState, useCallback } from 'react';
import { getMatches, getMyPredictions, submitPrediction, type Match, type Prediction } from '../lib/api';
import { getFlag } from './DashboardPage';

const PHASES: { key: string; label: string }[] = [
  { key: '', label: 'Todas' },
  { key: 'group', label: 'Fase de Grupos' },
  { key: 'round_of_32', label: 'Round de 32' },
  { key: 'round_of_16', label: 'Oitavas de Final' },
  { key: 'quarter', label: 'Quartas de Final' },
  { key: 'semi', label: 'Semifinal' },
  { key: 'third_place', label: 'Disputa de 3º Lugar' },
  { key: 'final', label: 'Final' },
];

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const phaseLabel = (phase: string) => {
  return PHASES.find((p) => p.key === phase)?.label || phase;
};

interface PredictionInput {
  home: string;
  away: string;
}

const MatchCard: React.FC<{
  match: Match;
  prediction: Prediction | undefined;
  onPredictionSaved: () => void;
}> = ({ match, prediction, onPredictionSaved }) => {
  const [inputs, setInputs] = useState<PredictionInput>({
    home: prediction?.home_score?.toString() ?? '',
    away: prediction?.away_score?.toString() ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOpen = match.status === 'open';
  const isFinished = match.status === 'finished';

  const handleSave = async () => {
    const h = parseInt(inputs.home);
    const a = parseInt(inputs.away);
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) {
      setError('Placar inválido');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await submitPrediction(match.id, h, a);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onPredictionSaved();
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { error?: string } } };
      setError(axErr.response?.data?.error || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const hasPrediction = prediction != null;
  const predChanged =
    inputs.home !== (prediction?.home_score?.toString() ?? '') ||
    inputs.away !== (prediction?.away_score?.toString() ?? '');

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border transition-all ${
        isOpen ? 'border-orange-200 hover:shadow-md' : 'border-gray-100'
      }`}
    >
      <div className="p-4">
        {/* Phase / time row */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-400 font-medium">
            {phaseLabel(match.phase)}
          </span>
          <span className="text-xs text-gray-400">
            {formatDateTime(match.kickoff_time)}
          </span>
        </div>

        {/* Teams & scores */}
        <div className="flex items-center justify-between gap-2">
          {/* Home */}
          <div className="flex-1 flex flex-col items-center gap-1">
            <span className="text-2xl">{getFlag(match.home_team)}</span>
            <span className="text-xs font-semibold text-gray-700 text-center leading-tight">
              {match.home_team || '?'}
            </span>
          </div>

          {/* Score area */}
          <div className="flex items-center gap-2">
            {isOpen ? (
              <>
                <input
                  type="number"
                  min={0}
                  max={99}
                  value={inputs.home}
                  onChange={(e) => setInputs({ ...inputs, home: e.target.value })}
                  className="w-12 h-12 text-center text-xl font-bold border-2 border-orange-300 rounded-lg focus:outline-none focus:border-orange-500"
                />
                <span className="text-xl font-bold text-gray-400">×</span>
                <input
                  type="number"
                  min={0}
                  max={99}
                  value={inputs.away}
                  onChange={(e) => setInputs({ ...inputs, away: e.target.value })}
                  className="w-12 h-12 text-center text-xl font-bold border-2 border-orange-300 rounded-lg focus:outline-none focus:border-orange-500"
                />
              </>
            ) : isFinished ? (
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-gray-800">
                  {match.home_score}
                </span>
                <span className="text-xl font-bold text-gray-400">×</span>
                <span className="text-2xl font-black text-gray-800">
                  {match.away_score}
                </span>
              </div>
            ) : (
              <span className="text-base font-bold text-gray-400 px-2">×</span>
            )}
          </div>

          {/* Away */}
          <div className="flex-1 flex flex-col items-center gap-1">
            <span className="text-2xl">{getFlag(match.away_team)}</span>
            <span className="text-xs font-semibold text-gray-700 text-center leading-tight">
              {match.away_team || '?'}
            </span>
          </div>
        </div>

        {/* Stadium */}
        {match.stadium && (
          <p className="text-xs text-gray-400 text-center mt-2">
            {match.stadium}{match.city ? `, ${match.city}` : ''}
          </p>
        )}

        {/* Prediction status row */}
        <div className="mt-3">
          {isOpen && (
            <>
              {error && <p className="text-xs text-red-500 text-center mb-1">{error}</p>}
              <div className="flex items-center justify-between gap-2">
                {hasPrediction && !predChanged && (
                  <span className="text-xs text-green-600 font-medium">
                    ✓ Palpite: {prediction.home_score} × {prediction.away_score}
                  </span>
                )}
                {(!hasPrediction || predChanged) && (
                  <span className="text-xs text-gray-400">
                    {hasPrediction ? 'Atualizar palpite' : 'Sem palpite ainda'}
                  </span>
                )}
                <button
                  onClick={handleSave}
                  disabled={saving || (!hasPrediction && inputs.home === '' && inputs.away === '') || saved}
                  className={`ml-auto px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    saved
                      ? 'bg-green-500 text-white'
                      : 'bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50'
                  }`}
                >
                  {saved ? '✓ Salvo!' : saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </>
          )}

          {isFinished && hasPrediction && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Seu palpite: {prediction.home_score} × {prediction.away_score}
              </span>
              {prediction.points != null && (
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    prediction.points >= 3
                      ? 'bg-green-100 text-green-700'
                      : prediction.points > 0
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  +{prediction.points} pts
                </span>
              )}
            </div>
          )}

          {isFinished && !hasPrediction && (
            <p className="text-xs text-gray-400 text-center">Sem palpite</p>
          )}

          {match.has_extra_time && (
            <p className="text-xs text-blue-400 text-center mt-1">Prorrogação / Pênaltis</p>
          )}
        </div>
      </div>
    </div>
  );
};

const MatchesPage: React.FC = () => {
  const [activePhase, setActivePhase] = useState('');
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [m, p] = await Promise.all([
        getMatches(activePhase || undefined),
        getMyPredictions(),
      ]);
      setMatches(m);
      setPredictions(p);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [activePhase]);

  useEffect(() => {
    load();
  }, [load]);

  const predMap = new Map(predictions.map((p) => [p.match_id, p]));

  // Group matches by phase for display
  const groupedMatches: { phase: string; label: string; matches: Match[] }[] = [];
  if (!activePhase) {
    const seenPhases = new Set<string>();
    for (const m of matches) {
      if (!seenPhases.has(m.phase)) {
        seenPhases.add(m.phase);
        groupedMatches.push({ phase: m.phase, label: phaseLabel(m.phase), matches: [] });
      }
      groupedMatches.find((g) => g.phase === m.phase)!.matches.push(m);
    }
  } else {
    groupedMatches.push({ phase: activePhase, label: phaseLabel(activePhase), matches });
  }

  // Phase filter tabs — only show phases that actually exist in data
  const existingPhases = [...new Set(matches.map((m) => m.phase))];
  const visibleTabs = PHASES.filter((p) => p.key === '' || existingPhases.includes(p.key));

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-gray-800">Partidas</h1>

      {/* Phase tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
        {visibleTabs.map((phase) => (
          <button
            key={phase.key}
            onClick={() => setActivePhase(phase.key)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              activePhase === phase.key
                ? 'bg-orange-500 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-orange-300'
            }`}
          >
            {phase.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl p-4 animate-pulse border border-gray-100 h-24" />
          ))}
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">📅</p>
          <p>Nenhuma partida encontrada</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {groupedMatches.map((group) => (
            <div key={group.phase}>
              {!activePhase && (
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">
                  {group.label}
                </h2>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {group.matches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    prediction={predMap.get(match.id)}
                    onPredictionSaved={load}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MatchesPage;
