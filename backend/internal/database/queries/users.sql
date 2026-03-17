-- name: CreateUser :one
INSERT INTO users (email, display_name, photo_path, is_superadmin)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetUserByID :one
SELECT * FROM users WHERE id = $1;

-- name: GetUserByEmail :one
SELECT * FROM users WHERE email = $1;

-- name: UpdateUser :one
UPDATE users SET display_name = $2, photo_path = $3, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: CountUsers :one
SELECT COUNT(*) FROM users;

-- name: GetFirstUser :one
SELECT * FROM users ORDER BY created_at ASC LIMIT 1;
