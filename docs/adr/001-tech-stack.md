# 001 - Stack Técnica

**Status:** Accepted

## Context
Precisamos de uma stack para construir um web app de bolão da Copa 2026 com autenticação, grupos, palpites e rankings. O app precisa ser mobile-first e fácil de fazer deploy como container único.

## Decision
Go (stdlib `net/http`) no backend + React/Vite/TypeScript no frontend, servidos como um único binário Go. Postgres via `supabase/postgres` como banco principal. sqlc para geração de queries type-safe.

## Rationale
- Go compila um binário estático que serve tanto a API quanto os assets — um só container no deploy
- sqlc elimina SQL dinâmico em Go, gerando código type-safe a partir das queries SQL
- React/Vite/TypeScript com Tailwind CSS — produtivo, mobile-first sem overhead de CSS pré-processado
- supabase/postgres oferece 60+ extensões incluindo pgvector, pgroonga, pg_cron etc. — headroom para features futuras

## Trade-offs
**Pros:**
- Bundle simples — 1 container, sem orquestração complexa
- Type safety fim-a-fim (Go + TypeScript)
- Queries SQL explícitas e legíveis via sqlc

**Cons:**
- Build em duas etapas (frontend + Go) exige configuração de Dockerfile multi-stage
- sqlc requer `sqlc generate` após cada mudança de query — passo extra no workflow

## Alternatives Considered
- **Node.js/Next.js:** mais familiar para devs frontend mas runtime mais pesado e deploy mais complexo
- **ORM (GORM):** mais fácil de começar mas perde performance e visibilidade das queries em produção
