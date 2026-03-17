-- name: CreateMatch :one
INSERT INTO matches (phase, match_number, group_name, home_team, away_team, match_time, stadium, city, day_number)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
RETURNING *;

-- name: ListMatchesByPhase :many
SELECT * FROM matches WHERE phase = $1 ORDER BY match_time ASC, match_number ASC;

-- name: ListAllMatches :many
SELECT * FROM matches ORDER BY match_time ASC, match_number ASC;

-- name: ListUpcomingMatches :many
SELECT * FROM matches
WHERE match_time > NOW() AND home_team != '' AND away_team != ''
ORDER BY match_time ASC
LIMIT $1;

-- name: ListOpenForPrediction :many
SELECT * FROM matches
WHERE match_time > NOW() AND is_finished = FALSE
  AND home_team != '' AND away_team != ''
ORDER BY match_time ASC;

-- name: GetMatchByID :one
SELECT * FROM matches WHERE id = $1;

-- name: SetMatchResult :one
UPDATE matches
SET home_score = $2, away_score = $3, is_finished = TRUE, has_extra_time = $4
WHERE id = $1
RETURNING *;

-- name: UpdateMatchTeams :exec
UPDATE matches SET home_team = $2, away_team = $3 WHERE id = $1;

-- name: GetMatchDayWeight :one
SELECT weight FROM match_day_weights WHERE day_number = $1;

-- name: UpsertMatchDayWeight :exec
INSERT INTO match_day_weights (day_number, match_date, weight)
VALUES ($1, $2, $3)
ON CONFLICT (day_number) DO UPDATE SET match_date = EXCLUDED.match_date, weight = EXCLUDED.weight;

-- name: ListFinishedUnscored :many
SELECT m.* FROM matches m
WHERE m.is_finished = TRUE
  AND m.id NOT IN (SELECT DISTINCT match_id FROM scores)
ORDER BY m.match_time ASC;
