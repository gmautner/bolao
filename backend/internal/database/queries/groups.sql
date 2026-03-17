-- name: CreateGroup :one
INSERT INTO groups (name, created_by)
VALUES ($1, $2)
RETURNING *;

-- name: GetGroupByID :one
SELECT * FROM groups WHERE id = $1;

-- name: ListUserGroups :many
SELECT g.*, gm.is_admin
FROM groups g
JOIN group_members gm ON gm.group_id = g.id
WHERE gm.user_id = $1
ORDER BY g.created_at DESC;

-- name: AddGroupMember :one
INSERT INTO group_members (group_id, user_id, is_admin)
VALUES ($1, $2, $3)
ON CONFLICT (group_id, user_id) DO NOTHING
RETURNING *;

-- name: GetGroupMember :one
SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2;

-- name: PromoteMemberToAdmin :exec
UPDATE group_members SET is_admin = TRUE
WHERE group_id = $1 AND user_id = $2;

-- name: ListGroupMembers :many
SELECT gm.*, u.email, u.display_name, u.photo_path
FROM group_members gm
JOIN users u ON u.id = gm.user_id
WHERE gm.group_id = $1
ORDER BY gm.joined_at ASC;

-- name: IsGroupAdmin :one
SELECT is_admin FROM group_members WHERE group_id = $1 AND user_id = $2;

-- name: CreateGroupInvite :one
INSERT INTO group_invites (group_id, token, created_by, expires_at)
VALUES ($1, $2, $3, NOW() + INTERVAL '7 days')
ON CONFLICT (group_id) DO UPDATE
  SET token = EXCLUDED.token,
      created_by = EXCLUDED.created_by,
      created_at = NOW(),
      expires_at = NOW() + INTERVAL '7 days'
RETURNING *;

-- name: GetGroupInviteByToken :one
SELECT gi.*, g.name as group_name
FROM group_invites gi
JOIN groups g ON g.id = gi.group_id
WHERE gi.token = $1 AND gi.expires_at > NOW();

-- name: GetGroupInvite :one
SELECT * FROM group_invites WHERE group_id = $1;
