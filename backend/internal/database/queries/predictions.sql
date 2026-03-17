-- name: UpsertPrediction :one
INSERT INTO predictions (user_id, match_id, home_score, away_score)
VALUES ($1, $2, $3, $4)
ON CONFLICT (user_id, match_id) DO UPDATE
  SET home_score = EXCLUDED.home_score,
      away_score = EXCLUDED.away_score,
      updated_at = NOW()
RETURNING *;

-- name: GetPrediction :one
SELECT * FROM predictions WHERE user_id = $1 AND match_id = $2;

-- name: ListUserPredictions :many
SELECT p.*, m.phase, m.home_team, m.away_team, m.match_time,
       m.home_score as result_home, m.away_score as result_away,
       m.is_finished
FROM predictions p
JOIN matches m ON m.id = p.match_id
WHERE p.user_id = $1
ORDER BY m.match_time ASC;

-- name: ListPredictionsForMatch :many
SELECT p.*, u.display_name, u.photo_path
FROM predictions p
JOIN users u ON u.id = p.user_id
WHERE p.match_id = $1;
