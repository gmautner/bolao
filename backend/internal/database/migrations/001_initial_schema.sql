-- 001_initial_schema.sql

-- Users
CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL DEFAULT '',
    photo_path  TEXT NOT NULL DEFAULT '',
    is_superadmin BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sessions (auth tokens stored in cookies)
CREATE TABLE IF NOT EXISTS sessions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token       TEXT NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at  TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '30 days'
);

CREATE INDEX IF NOT EXISTS sessions_token_idx ON sessions(token);
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);

-- Magic links (one-time login tokens)
CREATE TABLE IF NOT EXISTS magic_links (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       TEXT NOT NULL,
    token       TEXT NOT NULL UNIQUE,
    redirect_path TEXT NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at  TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '15 minutes',
    used_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS magic_links_token_idx ON magic_links(token);

-- Groups
CREATE TABLE IF NOT EXISTS groups (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    created_by  UUID NOT NULL REFERENCES users(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Group members
CREATE TABLE IF NOT EXISTS group_members (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id    UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_admin    BOOLEAN NOT NULL DEFAULT FALSE,
    joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

CREATE INDEX IF NOT EXISTS group_members_group_idx ON group_members(group_id);
CREATE INDEX IF NOT EXISTS group_members_user_idx ON group_members(user_id);

-- Group invites (one active per group at a time)
CREATE TABLE IF NOT EXISTS group_invites (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id    UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    token       TEXT NOT NULL UNIQUE,
    created_by  UUID NOT NULL REFERENCES users(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at  TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
    UNIQUE(group_id)  -- only one active invite per group
);

CREATE INDEX IF NOT EXISTS group_invites_token_idx ON group_invites(token);

-- Matches
CREATE TABLE IF NOT EXISTS matches (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phase           TEXT NOT NULL, -- 'group', 'round_of_32', 'round_of_16', 'quarterfinal', 'semifinal', 'third_place', 'final'
    match_number    INT NOT NULL,
    group_name      TEXT NOT NULL DEFAULT '', -- 'A'..'L' for group stage, '' for knockout
    home_team       TEXT NOT NULL DEFAULT '', -- team name or placeholder like 'Winner Group A'
    away_team       TEXT NOT NULL DEFAULT '',
    match_time      TIMESTAMPTZ,
    stadium         TEXT NOT NULL DEFAULT '',
    city            TEXT NOT NULL DEFAULT '',
    day_number      INT NOT NULL DEFAULT 1, -- which match day (1 = first day, determines weight)
    home_score      INT,
    away_score      INT,
    is_finished     BOOLEAN NOT NULL DEFAULT FALSE,
    has_extra_time  BOOLEAN NOT NULL DEFAULT FALSE, -- whether the match went to extra time
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS matches_phase_idx ON matches(phase);
CREATE INDEX IF NOT EXISTS matches_match_time_idx ON matches(match_time);

-- Predictions
CREATE TABLE IF NOT EXISTS predictions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    match_id    UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    home_score  INT NOT NULL,
    away_score  INT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, match_id)
);

CREATE INDEX IF NOT EXISTS predictions_user_idx ON predictions(user_id);
CREATE INDEX IF NOT EXISTS predictions_match_idx ON predictions(match_id);

-- Scores (computed after match result)
CREATE TABLE IF NOT EXISTS scores (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    match_id        UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    raw_points      INT NOT NULL DEFAULT 0,  -- base points before multiplier
    day_weight      INT NOT NULL DEFAULT 10, -- multiplier for that day
    total_points    INT NOT NULL DEFAULT 0,  -- raw_points * day_weight
    criterion       TEXT NOT NULL DEFAULT '', -- which criterion was matched
    computed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, match_id)
);

CREATE INDEX IF NOT EXISTS scores_user_idx ON scores(user_id);
CREATE INDEX IF NOT EXISTS scores_match_idx ON scores(match_id);

-- Day weights (match day number -> weight)
CREATE TABLE IF NOT EXISTS match_day_weights (
    day_number  INT PRIMARY KEY,
    match_date  DATE NOT NULL,
    weight      INT NOT NULL
);
