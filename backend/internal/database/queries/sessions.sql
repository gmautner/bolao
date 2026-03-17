-- name: CreateSession :one
INSERT INTO sessions (user_id, token, expires_at)
VALUES ($1, $2, NOW() + INTERVAL '30 days')
RETURNING *;

-- name: GetSessionByToken :one
SELECT s.*, u.email, u.display_name, u.photo_path, u.is_superadmin
FROM sessions s
JOIN users u ON u.id = s.user_id
WHERE s.token = $1 AND s.expires_at > NOW();

-- name: DeleteSession :exec
DELETE FROM sessions WHERE token = $1;

-- name: DeleteUserSessions :exec
DELETE FROM sessions WHERE user_id = $1;
