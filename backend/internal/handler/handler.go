package handler

import (
	"database/sql"
	"encoding/json"
	"log/slog"
	"net/http"

	"bolao/internal/auth"
	"bolao/internal/config"
	db "bolao/internal/database/sqlc"
)

type Handler struct {
	cfg     config.Config
	queries *db.Queries
	auth    *auth.Auth
}

func New(cfg config.Config, sqlDB *sql.DB, a *auth.Auth) *Handler {
	return &Handler{
		cfg:     cfg,
		queries: db.New(sqlDB),
		auth:    a,
	}
}

// respond writes a JSON response.
func respond(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		slog.Error("encoding response", "err", err)
	}
}

func respondError(w http.ResponseWriter, status int, msg string) {
	respond(w, status, map[string]string{"error": msg})
}

// requireAuth returns the session user or writes 401 and returns nil.
func (h *Handler) requireAuth(w http.ResponseWriter, r *http.Request) *auth.SessionUser {
	user, err := h.auth.GetSessionUser(r)
	if err != nil || user == nil {
		respondError(w, http.StatusUnauthorized, "não autenticado")
		return nil
	}
	return user
}

// requireSuperadmin returns the session user if superadmin, else 403.
func (h *Handler) requireSuperadmin(w http.ResponseWriter, r *http.Request) *auth.SessionUser {
	user := h.requireAuth(w, r)
	if user == nil {
		return nil
	}
	if !user.IsSuperadmin {
		respondError(w, http.StatusForbidden, "acesso restrito ao superadmin")
		return nil
	}
	return user
}
