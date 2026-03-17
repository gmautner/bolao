package handler

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/google/uuid"

	db "bolao/internal/database/sqlc"
)

// GET /api/rankings/global
func (h *Handler) GlobalRanking(w http.ResponseWriter, r *http.Request) {
	user := h.requireAuth(w, r)
	if user == nil {
		return
	}

	rows, err := h.queries.GlobalRanking(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, "erro ao carregar ranking")
		return
	}

	type entry struct {
		ID                string `json:"id"`
		DisplayName       string `json:"display_name"`
		PhotoPath         string `json:"photo_path"`
		TotalPoints       int64  `json:"total_points"`
		PredictionsScored int64  `json:"predictions_scored"`
		Rank              int64  `json:"rank"`
		IsCurrentUser     bool   `json:"is_current_user"`
	}

	result := make([]entry, 0, len(rows))
	for _, row := range rows {
		// For global ranking, mask name for privacy (first name + first letter of last)
		displayName := maskName(row.DisplayName)
		// For current user, show full name
		if row.ID == user.ID {
			displayName = row.DisplayName
		}
		result = append(result, entry{
			ID:                row.ID.String(),
			DisplayName:       displayName,
			PhotoPath:         row.PhotoPath,
			TotalPoints:       toInt64(row.TotalPoints),
			PredictionsScored: row.PredictionsScored,
			Rank:              row.Rank,
			IsCurrentUser:     row.ID == user.ID,
		})
	}

	respond(w, http.StatusOK, result)
}

// GET /api/rankings/group/{id}
func (h *Handler) GroupRanking(w http.ResponseWriter, r *http.Request) {
	user := h.requireAuth(w, r)
	if user == nil {
		return
	}

	groupID, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "ID inválido")
		return
	}

	ctx := r.Context()

	// Must be a member
	_, err = h.queries.GetGroupMember(ctx, db.GetGroupMemberParams{
		GroupID: groupID,
		UserID:  user.ID,
	})
	if err != nil {
		respondError(w, http.StatusForbidden, "você não é membro deste grupo")
		return
	}

	rows, err := h.queries.GroupRanking(ctx, groupID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "erro ao carregar ranking")
		return
	}

	type entry struct {
		ID            string `json:"id"`
		DisplayName   string `json:"display_name"`
		PhotoPath     string `json:"photo_path"`
		IsAdmin       bool   `json:"is_admin"`
		TotalPoints   int64  `json:"total_points"`
		Rank          int64  `json:"rank"`
		IsCurrentUser bool   `json:"is_current_user"`
	}

	result := make([]entry, 0, len(rows))
	for _, row := range rows {
		result = append(result, entry{
			ID:            row.ID.String(),
			DisplayName:   row.DisplayName, // in groups, show full name
			PhotoPath:     row.PhotoPath,
			IsAdmin:       row.IsAdmin,
			TotalPoints:   toInt64(row.TotalPoints),
			Rank:          row.Rank,
			IsCurrentUser: row.ID == user.ID,
		})
	}

	respond(w, http.StatusOK, result)
}

// toInt64 safely converts interface{} from COALESCE(SUM(...), 0) to int64.
func toInt64(v interface{}) int64 {
	if v == nil {
		return 0
	}
	switch x := v.(type) {
	case int64:
		return x
	case int32:
		return int64(x)
	case float64:
		return int64(x)
	case []byte:
		var n int64
		fmt.Sscanf(string(x), "%d", &n)
		return n
	case string:
		var n int64
		fmt.Sscanf(x, "%d", &n)
		return n
	}
	return 0
}

// maskName returns "Nome S." format for privacy.
func maskName(name string) string {
	if name == "" {
		return name
	}
	parts := splitWords(name)
	if len(parts) == 1 {
		return parts[0]
	}
	last := parts[len(parts)-1]
	if len(last) == 0 {
		return parts[0]
	}
	return parts[0] + " " + string([]rune(last)[:1]) + "."
}

func splitWords(s string) []string {
	return strings.Fields(s)
}
