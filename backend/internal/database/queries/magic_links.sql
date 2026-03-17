-- name: CreateMagicLink :one
INSERT INTO magic_links (email, token, redirect_path)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetMagicLinkByToken :one
SELECT * FROM magic_links
WHERE token = $1 AND expires_at > NOW() AND used_at IS NULL;

-- name: MarkMagicLinkUsed :exec
UPDATE magic_links SET used_at = NOW() WHERE token = $1;
