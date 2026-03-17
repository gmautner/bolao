# Bolão Copa do Mundo 2026 — PRD

## Overview

Web app de bolão para a Copa do Mundo FIFA 2026. Usuários fazem palpites em partidas, acumulam pontos com base em critérios de precisão multiplicados pelo peso do dia de jogo, e competem em rankings globais e em grupos privados.

A Copa do Mundo 2026 é realizada nos EUA, Canadá e México, de 11 de junho a 19 de julho de 2026, com 48 seleções e 104 partidas.

---

## Target Users

- Grupos de amigos, família ou colegas de trabalho que queiram organizar seu próprio bolão
- Fãs de futebol que queiram acompanhar a Copa do Mundo 2026 com uma camada extra de competição

---

## Core Features

### 1. Autenticação

Dois métodos disponíveis, à escolha do usuário:

- **Magic link por e-mail:** usuário digita e-mail → recebe link mágico → clica → está autenticado
- **Login com Google (OAuth):** clica em "Entrar com Google" → autoriza → está autenticado

O link de convite de grupo pode ser embutido como parâmetro na URL de redirecionamento pós-login (funciona para ambos os métodos), para auto-ingresso automático no grupo convidado.

### 2. Perfil do Usuário

- **Foto de perfil:** captura via webcam (no navegador) ou upload de arquivo (JPG/PNG/WebP, limite de 5 MB)
- **Nome preferencial** definido pelo próprio usuário
- **Privacidade:** usuário pode desabilitar a exibição da sua foto em cada grupo do qual participa

### 3. Super-Administrador do Sistema

- O **primeiro usuário a se cadastrar** em toda a história do sistema torna-se automaticamente o super-administrador (superadmin)
- Existe exatamente um superadmin
- O superadmin é o único que pode **registrar os resultados** das partidas
- Ao registrar um resultado, o sistema recalcula automaticamente as pontuações e atualiza todos os rankings
- O superadmin também pode **abrir as fases eliminatórias** (cadastrar as partidas) assim que os times classificados forem definidos

### 4. Grupos de Bolão

- Qualquer usuário pode criar **um ou mais grupos** independentes
- Ao criar um grupo, o criador torna-se automaticamente **administrador do grupo**
- **Convite reutilizável:** administrador gera um link de convite válido por 7 dias, não vinculado a e-mail específico — pode ser compartilhado com múltiplas pessoas (ex: grupo de WhatsApp)
- Quem acessa o link de convite passa pelo fluxo normal de login e, ao final, é automaticamente adicionado ao grupo
- Administrador pode gerar um novo link de convite a qualquer momento — o anterior torna-se inválido imediatamente (apenas um convite ativo por grupo por vez)
- Usuário convidado pode também criar seus próprios grupos independentes
- Administrador pode **promover membros** do grupo a administradores; administradores adicionais também podem gerar convites

### 5. Partidas e Fases

- **Fase de Grupos:** 72 partidas (12 grupos × 6 jogos por grupo) — tabela completa cadastrada na inicialização do sistema
- **Fase Eliminatória (mata-mata):** Round of 32, Oitavas, Quartas, Semifinal, 3º lugar e Final — partidas abertas para palpite somente após a definição dos times classificados
- Palpites têm **prazo até o horário de início** de cada partida (palpites não são aceitos após o kick-off)
- Palpites são **opcionais** — jogos sem palpite não contam para a pontuação

### 6. Sistema de Pontuação

Os pontos são atribuídos pelo critério de **maior valor aplicável** (não-cumulativos por partida — máximo de 25 pontos base por jogo):

| Critério | Pontos |
|---|---|
| Placar exato | 25 |
| Vencedor + número de gols do time vencedor | 18 |
| Vencedor + diferença de gols entre os times | 15 |
| Empate correto (independente do placar) | 15 |
| Vencedor + número de gols do time perdedor | 12 |
| Apenas vencedor (sem acertar nenhum gol) | 10 |
| Previu empate, mas o jogo não terminou empatado | 4 |
| Nenhum critério acima | 0 |
| Não palpitou | 0 |

**Multiplicador por dia de jogo:** cada dia em que há partidas recebe um peso crescente. O primeiro dia de jogos começa com peso 10, e a cada novo dia de jogos aumenta 1. A pontuação final de um palpite = pontos × peso do dia.

*Exemplo: placar exato (25 pts) no primeiro dia (peso 10) = 250 pontos. Placar exato na final (último dia) = 25 × peso_do_último_dia.*

### 7. Rankings

- **Ranking global:** todos os participantes cadastrados no sistema
- **Ranking de grupo:** apenas membros de cada grupo privado
- **Exibição de privacidade:** primeiro nome + primeira letra do sobrenome + pontuação total (ex: "Carolina S — 7.595 pts")
- Top 3 do ranking global ficam visíveis para todos os usuários

---

## User Flows

### Primeiro Acesso
1. Usuário acessa o app → digita e-mail → clica em "Enviar link"
2. Abre o e-mail → clica no magic link → é redirecionado ao app autenticado
3. Completa o perfil: foto + nome preferencial
4. Pode criar um grupo, explorar o ranking global ou aguardar palpitar nos jogos disponíveis

### Entrar via Convite de Grupo
1. Usuário recebe link de convite (ex: via WhatsApp)
2. Clica no link → app solicita e-mail → magic link enviado
3. Clica no magic link → é redirecionado ao app **e automaticamente adicionado ao grupo**
4. Completa perfil (se for o primeiro acesso)

### Fazer Palpite
1. Usuário acessa lista de jogos com palpite ainda aberto (antes do kick-off)
2. Seleciona o jogo → insere o placar previsto (gols do time A × gols do time B)
3. Confirma o palpite — pode editar até o kick-off

### Registrar Resultado (Superadmin)
1. Superadmin acessa painel de administração
2. Seleciona partida finalizada → insere o placar final
3. Sistema calcula pontuações de todos os palpites e atualiza rankings

### Abrir Nova Fase Eliminatória (Superadmin)
1. Superadmin acessa painel de administração
2. Após conclusão da fase anterior, cadastra os times classificados em cada confronto
3. Partidas da nova fase ficam disponíveis para palpite

---

## Non-Functional Requirements

- **Mobile-first:** layout responsivo, uso principal em smartphones
- **Idioma:** português brasileiro
- **Upload de foto:** máximo 5 MB, formatos JPG/PNG/WebP
- **Validade de convites:** 7 dias a partir da geração
- **Placar considerado:** resultado ao final do jogo, **incluindo prorrogação** quando houver. O resultado de pênaltis **não é considerado** — o placar após os pênaltis permanece como estava ao final da prorrogação

---

## Out of Scope

- Pagamento de cotas ou premiação financeira (sistema de pontuação apenas)
- Placar de pênaltis (prorrogação é considerada, pênaltis não)
- Notificações push
- App nativo iOS/Android (web app responsivo apenas)
- Integração automática com APIs de resultados (resultado inserido manualmente pelo superadmin)
