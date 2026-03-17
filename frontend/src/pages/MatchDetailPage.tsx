import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMatch, submitPrediction, type MatchWithPrediction } from '../lib/api';
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

const MatchDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<MatchWithPrediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [homeInput, setHomeInput] = useState('');
  const [awayInput, setAwayInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getMatch(id)
      .then((d) => {
        setData(d);
        if (d.prediction) {
          setHomeInput(d.prediction.home_score.toString());
          setAwayInput(d.prediction.away_score.toString());
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    if (!data) return;
    const h = parseInt(homeInput);
    const a = parseInt(awayInput);
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) {
      setError('Placar inválido');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await submitPrediction(data.match.id, h, a);
      const refreshed = await getMatch(data.match.id);
      setData(refreshed);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { error?: string } } };
      setError(axErr.response?.data?.error || 'Erro ao salvar palpite');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p className="text-4xl mb-3">😕</p>
        <p>Partida não encontrada</p>
        <Link to="/partidas" className="text-orange-500 hover:underline mt-2 block">
          Voltar às partidas
        </Link>
      </div>
    );
  }

  const { match, prediction } = data;
  const isOpen = match.status === 'open';
  const isFinished = match.status === 'finished';
  const kickoff = new Date(match.kickoff_time);

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <Link to="/partidas" className="text-gray-400 hover:text-gray-600 text-sm">
          ← Partidas
        </Link>
      </div>

      {/* Match card */}
      <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-800 to-green-900 px-5 py-3 text-center">
          <p className="text-green-300 text-xs font-semibold uppercase tracking-wider">
            {PHASE_LABELS[match.phase] || match.phase}
          </p>
          <p className="text-white text-sm mt-0.5">
            {kickoff.toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: '2-digit',
              month: 'long',
            })}{' '}
            às{' '}
            {kickoff.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </p>
          {match.stadium && (
            <p className="text-green-300 text-xs mt-1">
              {match.stadium} · {match.city}
            </p>
          )}
        </div>

        {/* Teams and score */}
        <div className="px-5 py-6">
          <div className="flex items-center justify-between gap-4">
            {/* Home */}
            <div className="flex-1 flex flex-col items-center gap-2">
              <span className="text-5xl">{getFlag(match.home_team)}</span>
              <span className="text-sm font-bold text-gray-800 text-center">
                {match.home_team || '?'}
              </span>
            </div>

            {/* Score */}
            <div className="flex items-center gap-3">
              {isFinished ? (
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-black text-gray-900">{match.home_score}</span>
                  <span className="text-2xl font-bold text-gray-400">×</span>
                  <span className="text-4xl font-black text-gray-900">{match.away_score}</span>
                </div>
              ) : (
                <span className="text-2xl font-bold text-gray-300 px-4">×</span>
              )}
            </div>

            {/* Away */}
            <div className="flex-1 flex flex-col items-center gap-2">
              <span className="text-5xl">{getFlag(match.away_team)}</span>
              <span className="text-sm font-bold text-gray-800 text-center">
                {match.away_team || '?'}
              </span>
            </div>
          </div>

          {isFinished && match.has_extra_time && (
            <p className="text-center text-xs text-blue-500 mt-2 font-medium">
              Prorrogação / Pênaltis
            </p>
          )}
        </div>

        {/* Status badge */}
        <div className="px-5 pb-2 text-center">
          {isOpen && (
            <span className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
              Aberto para palpites
            </span>
          )}
          {isFinished && (
            <span className="inline-block bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-1 rounded-full">
              Encerrado
            </span>
          )}
          {match.status === 'scheduled' && (
            <span className="inline-block bg-blue-100 text-blue-600 text-xs font-semibold px-3 py-1 rounded-full">
              Agendado
            </span>
          )}
        </div>

        {/* Prediction section */}
        <div className="border-t border-gray-100 px-5 py-4">
          <h3 className="text-sm font-bold text-gray-700 mb-3">Meu palpite</h3>

          {isOpen ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-center gap-4">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs text-gray-500">{match.home_team}</span>
                  <input
                    type="number"
                    min={0}
                    max={99}
                    value={homeInput}
                    onChange={(e) => setHomeInput(e.target.value)}
                    placeholder="0"
                    className="w-16 h-14 text-center text-2xl font-bold border-2 border-orange-300 rounded-xl focus:outline-none focus:border-orange-500"
                  />
                </div>
                <span className="text-2xl font-bold text-gray-400 mt-4">×</span>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs text-gray-500">{match.away_team}</span>
                  <input
                    type="number"
                    min={0}
                    max={99}
                    value={awayInput}
                    onChange={(e) => setAwayInput(e.target.value)}
                    placeholder="0"
                    className="w-16 h-14 text-center text-2xl font-bold border-2 border-orange-300 rounded-xl focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {error && <p className="text-red-500 text-xs text-center">{error}</p>}

              <button
                onClick={handleSave}
                disabled={saving || saved}
                className={`w-full py-3 rounded-xl font-bold transition-colors ${
                  saved
                    ? 'bg-green-500 text-white'
                    : 'bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-60'
                }`}
              >
                {saved ? '✓ Palpite salvo!' : saving ? 'Salvando...' : 'Salvar palpite'}
              </button>
            </div>
          ) : prediction ? (
            <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  {prediction.home_score} × {prediction.away_score}
                </p>
                <p className="text-xs text-gray-500">Seu palpite</p>
              </div>
              {isFinished && prediction.points != null && (
                <div className="text-right">
                  <span
                    className={`text-lg font-black ${
                      prediction.points >= 3
                        ? 'text-green-600'
                        : prediction.points > 0
                        ? 'text-yellow-600'
                        : 'text-gray-400'
                    }`}
                  >
                    +{prediction.points}
                  </span>
                  <p className="text-xs text-gray-500">pontos</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-2">
              {isFinished ? 'Você não fez palpite nesta partida' : 'Palpites serão abertos em breve'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchDetailPage;
