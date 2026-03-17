# Tarefas — Bolão Copa do Mundo 2026

## Fase 1 — Fundação

| Tarefa | Status | Notas |
|--------|--------|-------|
| Scaffold do projeto (Go + React + Postgres) | Done | Go stdlib + pgx + sqlc; React + Vite + Tailwind |
| Schema do banco de dados (migrations) | Done | 001_initial_schema.sql — todas as tabelas |
| Autenticação por magic link (e-mail) | Done | Backend completo; SMTP configurável via .env |
| Autenticação via Google OAuth | Done | Handler completo; requer GOOGLE_CLIENT_ID/SECRET |
| Perfil de usuário (foto via webcam/upload + nome) | Done | Multipart upload, até 5MB, servido em /api/blobs/ |
| Lógica de superadmin (primeiro usuário cadastrado) | Done | Flag is_superadmin no banco |

## Fase 2 — Grupos

| Tarefa | Status | Notas |
|--------|--------|-------|
| Criar grupo (criador vira admin automaticamente) | Done | |
| Geração de link de convite reutilizável (7 dias) | Done | ON CONFLICT substitui convite anterior |
| Fluxo de ingresso via link de convite pós-login | Done | Token no redirect_path do magic link |
| Promover membro a administrador do grupo | Done | |
| Listagem de membros do grupo | Done | |

## Fase 3 — Partidas e Palpites

| Tarefa | Status | Notas |
|--------|--------|-------|
| Seed da fase de grupos (72 partidas) | Done | 002_seed_copa2026.sql — dados oficiais FIFA 2026 |
| Seed fases eliminatórias (32 partidas esqueleto) | Done | Times TBD — superadmin preenche conforme avança |
| Calendário de pesos por dia de jogo | Done | Dia 1=10 (+1/dia), Final=peso 43 |
| Tela de palpites (antes do kick-off) | Done | Bloqueio automático no backend |
| Bloqueio de palpite após kick-off | Done | Verificação de match_time no handler |
| Painel superadmin: registrar resultado de partida | Done | POST /api/admin/matches/{id}/result |
| Painel superadmin: atualizar times (eliminatórias) | Done | PATCH /api/admin/matches/{id}/teams |
| Cálculo de pontuação pós-resultado | Done | 8 critérios, não-cumulativo, × peso do dia |

## Fase 4 — Rankings

| Tarefa | Status | Notas |
|--------|--------|-------|
| Ranking global (todos os usuários) | Done | "Nome S. — X pts", privacidade aplicada |
| Ranking de grupo | Done | Nome completo visível dentro do grupo |

## Fase 5 — Polimento e Testes

| Tarefa | Status | Notas |
|--------|--------|-------|
| Design mobile-first (React + Tailwind) | Done | 10 páginas completas |
| Testes backend (Go) — scoring, auth, grupos, partidas | Done | 19 testes passando |
| Testes frontend (Vitest) — LoginPage, GroupsPage | Done | 12 testes passando |
| Configurar SMTP (Magic Link em produção) | Pendente | Criar App Password no Gmail |
| Configurar Google OAuth (produção) | Pendente | Google Cloud Console |
| Deploy (Preview environment) | Pendente | |
