-- name: UpsertScore :exec
INSERT INTO scores (user_id, match_id, raw_points, day_weight, total_points, criterion)
VALUES ($1, $2, $3, $4, $5, $6)
ON CONFLICT (user_id, match_id) DO UPDATE
  SET raw_points = EXCLUDED.raw_points,
      day_weight = EXCLUDED.day_weight,
      total_points = EXCLUDED.total_points,
      criterion = EXCLUDED.criterion,
      computed_at = NOW();

-- name: GlobalRanking :many
SELECT u.id, u.display_name, u.photo_path,
       COALESCE(SUM(s.total_points), 0) as total_points,
       COUNT(s.id) as predictions_scored,
       RANK() OVER (ORDER BY COALESCE(SUM(s.total_points), 0) DESC) as rank
FROM users u
LEFT JOIN scores s ON s.user_id = u.id
GROUP BY u.id, u.display_name, u.photo_path
ORDER BY total_points DESC, u.display_name ASC;

-- name: GroupRanking :many
SELECT u.id, u.display_name, u.photo_path, gm.is_admin,
       COALESCE(SUM(s.total_points), 0) as total_points,
       RANK() OVER (ORDER BY COALESCE(SUM(s.total_points), 0) DESC) as rank
FROM group_members gm
JOIN users u ON u.id = gm.user_id
LEFT JOIN scores s ON s.user_id = gm.user_id
WHERE gm.group_id = $1
GROUP BY u.id, u.display_name, u.photo_path, gm.is_admin
ORDER BY total_points DESC, u.display_name ASC;

-- name: UserTotalScore :one
SELECT COALESCE(SUM(s.total_points), 0) as total_points
FROM scores s
WHERE s.user_id = $1;
