# 002 - Autenticação

**Status:** Accepted

## Context
O bolão precisa de autenticação simples e segura, sem exigir que os usuários criem senhas.

## Decision
Dois métodos: Magic Link por e-mail (SMTP) e Google OAuth. Sessões armazenadas no banco (`sessions` table) com token aleatório em cookie HttpOnly. O primeiro usuário cadastrado vira superadmin automaticamente.

## Rationale
- Magic link: sem senha, seguro, funciona para qualquer e-mail
- Google OAuth: alternativa conveniente para usuários com conta Google
- Sessão no banco: simples, sem dependência de Redis ou JWT; permite invalidação explícita via logout
- Cookie HttpOnly: protege contra XSS; SameSite=Lax protege contra CSRF básico

## Trade-offs
**Pros:**
- Sem senhas = sem password resets, hashing, breach exposure
- Magic link funciona offline (sem Google)
- Sessão no banco = revogação instantânea

**Cons:**
- Magic link depende de SMTP configurado — sem e-mail configurado, funciona só em DEV_MODE
- Google OAuth requer configuração no Google Cloud Console
- Sessões no banco crescem com o tempo — há limpeza periódica necessária (futura melhoria)

## Alternatives Considered
- **JWT sem banco:** mais simples de escalar mas sem revogação imediata
- **Senha + hash:** mais complexo, mais vetores de ataque (senhas fracas, breach)
