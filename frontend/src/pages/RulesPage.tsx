import React from 'react';

const ScoringExample: React.FC<{
  pred: string;
  result: string;
  criterion: string;
  points: number;
  color: string;
}> = ({ pred, result, criterion, points, color }) => (
  <div className="flex items-center gap-3 py-2">
    <div className="flex items-center gap-1.5 min-w-[120px]">
      <span className="text-xs text-gray-500">Palpite</span>
      <span className="font-bold text-sm text-gray-800">{pred}</span>
      <span className="text-xs text-gray-400">→</span>
      <span className="text-xs text-gray-500">Real</span>
      <span className="font-bold text-sm text-gray-800">{result}</span>
    </div>
    <div className="flex-1 text-xs text-gray-500">{criterion}</div>
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>
      {points} pts
    </span>
  </div>
);

const RulesPage: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-800">Regulamento</h1>

      {/* Intro */}
      <section className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="text-lg font-bold text-gray-800 mb-2">Como funciona?</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          Você faz <strong>palpites</strong> nos jogos da Copa do Mundo 2026.
          Quanto mais preciso o palpite, mais pontos você ganha. Os pontos
          acumulados definem sua posição no <strong>ranking</strong> — tanto
          no geral quanto dentro de cada grupo privado.
        </p>
      </section>

      {/* Predictions */}
      <section className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="text-lg font-bold text-gray-800 mb-2">
          ⚽ Palpites
        </h2>
        <ul className="text-sm text-gray-600 space-y-2 leading-relaxed">
          <li>
            <strong>Prazo:</strong> até o horário de início da partida.
            Após o apito inicial, o palpite é bloqueado.
          </li>
          <li>
            <strong>Edição:</strong> você pode alterar seu palpite quantas
            vezes quiser enquanto a partida estiver aberta.
          </li>
          <li>
            <strong>Opcional:</strong> não é obrigatório palpitar em todos os
            jogos. Partidas sem palpite não dão nem tiram pontos.
          </li>
          <li>
            <strong>Prorrogação conta:</strong> o placar considerado é o
            resultado ao final do jogo, incluindo prorrogação quando houver.
            Pênaltis <em>não</em> alteram o placar.
          </li>
        </ul>
      </section>

      {/* Scoring */}
      <section className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="text-lg font-bold text-gray-800 mb-3">
          🏆 Pontuação
        </h2>
        <p className="text-sm text-gray-600 mb-4 leading-relaxed">
          Cada palpite recebe pontos pelo <strong>melhor critério</strong> que
          se aplicar — não é cumulativo. Só conta o mais alto:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs text-gray-400 font-medium pb-2">
                  Critério
                </th>
                <th className="text-right text-xs text-gray-400 font-medium pb-2 w-20">
                  Pontos
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <tr>
                <td className="py-2 text-gray-700">
                  🎯 Placar exato
                </td>
                <td className="py-2 text-right font-bold text-green-600">25</td>
              </tr>
              <tr>
                <td className="py-2 text-gray-700">
                  Vencedor correto + gols do vencedor
                </td>
                <td className="py-2 text-right font-bold text-green-600">18</td>
              </tr>
              <tr>
                <td className="py-2 text-gray-700">
                  Vencedor correto + diferença de gols
                </td>
                <td className="py-2 text-right font-bold text-emerald-500">15</td>
              </tr>
              <tr>
                <td className="py-2 text-gray-700">
                  Empate correto (qualquer placar)
                </td>
                <td className="py-2 text-right font-bold text-emerald-500">15</td>
              </tr>
              <tr>
                <td className="py-2 text-gray-700">
                  Vencedor correto + gols do perdedor
                </td>
                <td className="py-2 text-right font-bold text-yellow-600">12</td>
              </tr>
              <tr>
                <td className="py-2 text-gray-700">
                  Apenas o vencedor correto
                </td>
                <td className="py-2 text-right font-bold text-yellow-600">10</td>
              </tr>
              <tr>
                <td className="py-2 text-gray-700">
                  Palpitou empate, mas não empatou
                </td>
                <td className="py-2 text-right font-bold text-orange-500">4</td>
              </tr>
              <tr>
                <td className="py-2 text-gray-700">
                  Errou tudo
                </td>
                <td className="py-2 text-right font-bold text-gray-400">0</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Examples */}
      <section className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="text-lg font-bold text-gray-800 mb-3">
          💡 Exemplos
        </h2>
        <p className="text-sm text-gray-500 mb-3">
          Supondo Brasil × México com resultado real <strong>3 × 1</strong>:
        </p>
        <div className="divide-y divide-gray-50">
          <ScoringExample
            pred="3 × 1"
            result="3 × 1"
            criterion="Placar exato"
            points={25}
            color="bg-green-100 text-green-700"
          />
          <ScoringExample
            pred="3 × 0"
            result="3 × 1"
            criterion="Vencedor + gols do vencedor (3)"
            points={18}
            color="bg-green-100 text-green-700"
          />
          <ScoringExample
            pred="4 × 2"
            result="3 × 1"
            criterion="Vencedor + diferença de gols (2)"
            points={15}
            color="bg-emerald-100 text-emerald-700"
          />
          <ScoringExample
            pred="2 × 1"
            result="3 × 1"
            criterion="Vencedor + gols do perdedor (1)"
            points={12}
            color="bg-yellow-100 text-yellow-700"
          />
          <ScoringExample
            pred="4 × 0"
            result="3 × 1"
            criterion="Apenas vencedor"
            points={10}
            color="bg-yellow-100 text-yellow-700"
          />
          <ScoringExample
            pred="1 × 1"
            result="3 × 1"
            criterion="Palpitou empate, não foi"
            points={4}
            color="bg-orange-100 text-orange-700"
          />
          <ScoringExample
            pred="0 × 2"
            result="3 × 1"
            criterion="Errou tudo"
            points={0}
            color="bg-gray-100 text-gray-500"
          />
        </div>
      </section>

      {/* Day weight */}
      <section className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="text-lg font-bold text-gray-800 mb-2">
          📈 Multiplicador por dia
        </h2>
        <p className="text-sm text-gray-600 leading-relaxed mb-3">
          A pontuação base é multiplicada pelo <strong>peso do dia de jogo</strong>.
          Quanto mais avançado o torneio, mais valem os palpites:
        </p>
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Primeiro dia (11/jun)</span>
            <span className="font-bold text-gray-800">peso × 10</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Segundo dia (12/jun)</span>
            <span className="font-bold text-gray-800">peso × 11</span>
          </div>
          <div className="flex justify-between text-sm text-gray-400">
            <span>⋮ (+1 por dia de jogos)</span>
            <span>⋮</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Final (19/jul)</span>
            <span className="font-bold text-orange-600">peso × 43</span>
          </div>
        </div>
        <div className="mt-3 bg-orange-50 border border-orange-200 rounded-lg p-3">
          <p className="text-xs text-orange-700">
            <strong>Exemplo:</strong> placar exato (25 pts) no primeiro dia = <strong>250 pontos</strong>.
            {' '}Placar exato na final = <strong>1.075 pontos</strong>!
          </p>
        </div>
      </section>

      {/* Groups */}
      <section className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="text-lg font-bold text-gray-800 mb-2">
          👥 Grupos
        </h2>
        <ul className="text-sm text-gray-600 space-y-2 leading-relaxed">
          <li>
            Crie quantos grupos quiser — para amigos, família ou trabalho.
          </li>
          <li>
            Convide membros compartilhando um <strong>link de convite</strong>.
            É válido por 7 dias e pode ser enviado para várias pessoas.
          </li>
          <li>
            Cada grupo tem seu próprio <strong>ranking</strong>,
            onde aparecem os nomes completos dos participantes.
          </li>
          <li>
            No <strong>ranking global</strong>, a privacidade é respeitada:
            aparece apenas o primeiro nome + inicial do sobrenome.
          </li>
        </ul>
      </section>

      {/* Copa 2026 */}
      <section className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="text-lg font-bold text-gray-800 mb-2">
          🌎 A Copa 2026
        </h2>
        <ul className="text-sm text-gray-600 space-y-2 leading-relaxed">
          <li>
            <strong>48 seleções</strong> em <strong>12 grupos</strong> (A a L)
            com 4 times cada.
          </li>
          <li>
            <strong>104 partidas</strong> no total — 72 na fase de grupos +
            32 no mata-mata.
          </li>
          <li>
            <strong>Sedes:</strong> Estados Unidos, Canadá e México.
          </li>
          <li>
            <strong>Período:</strong> 11 de junho a 19 de julho de 2026.
          </li>
        </ul>
      </section>
    </div>
  );
};

export default RulesPage;
