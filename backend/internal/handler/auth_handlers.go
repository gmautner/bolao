package handler

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"strings"

	"bolao/internal/auth"
)

// POST /api/auth/magic-link
// Body: {"email": "...", "redirect_path": "..."}
func (h *Handler) SendMagicLink(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Email        string `json:"email"`
		RedirectPath string `json:"redirect_path"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		respondError(w, http.StatusBadRequest, "JSON inválido")
		return
	}
	body.Email = strings.TrimSpace(strings.ToLower(body.Email))
	if body.Email == "" || !strings.Contains(body.Email, "@") {
		respondError(w, http.StatusBadRequest, "e-mail inválido")
		return
	}

	if err := h.auth.SendMagicLink(r.Context(), body.Email, body.RedirectPath); err != nil {
		slog.Error("sending magic link", "err", err)
		respondError(w, http.StatusInternalServerError, "erro ao enviar e-mail")
		return
	}

	respond(w, http.StatusOK, map[string]string{"message": "link enviado"})
}

// GET /auth/magic?token=...
func (h *Handler) VerifyMagicLink(w http.ResponseWriter, r *http.Request) {
	token := r.URL.Query().Get("token")
	if token == "" {
		http.Redirect(w, r, "/?error=token_missing", http.StatusSeeOther)
		return
	}

	ctx := r.Context()
	ml, err := h.auth.VerifyMagicLink(ctx, token)
	if err != nil {
		http.Redirect(w, r, "/?error=link_invalido", http.StatusSeeOther)
		return
	}

	user, err := h.auth.GetOrCreateUser(ctx, ml.Email)
	if err != nil {
		slog.Error("get/create user", "err", err)
		http.Redirect(w, r, "/?error=server_error", http.StatusSeeOther)
		return
	}

	sessionToken, err := h.auth.CreateSession(ctx, user.ID)
	if err != nil {
		http.Redirect(w, r, "/?error=server_error", http.StatusSeeOther)
		return
	}

	h.auth.SetSessionCookie(w, sessionToken)

	redirect := ml.RedirectPath
	if redirect == "" {
		redirect = "/"
	}
	http.Redirect(w, r, redirect, http.StatusSeeOther)
}

// GET /auth/google
func (h *Handler) GoogleLogin(w http.ResponseWriter, r *http.Request) {
	if h.cfg.GoogleClientID == "" {
		respondError(w, http.StatusNotImplemented, "Google Auth não configurado")
		return
	}
	redirectPath := r.URL.Query().Get("redirect_path")
	state := redirectPath // encode redirect in state for simplicity
	http.Redirect(w, r, h.auth.GoogleAuthURL(state), http.StatusFound)
}

// GET /auth/google/callback
func (h *Handler) GoogleCallback(w http.ResponseWriter, r *http.Request) {
	code := r.URL.Query().Get("code")
	state := r.URL.Query().Get("state") // redirect path

	if code == "" {
		http.Redirect(w, r, "/?error=google_error", http.StatusSeeOther)
		return
	}

	ctx := r.Context()
	gu, err := h.auth.GoogleCallback(ctx, code)
	if err != nil {
		slog.Error("google callback", "err", err)
		http.Redirect(w, r, "/?error=google_error", http.StatusSeeOther)
		return
	}

	user, err := h.auth.GetOrCreateUser(ctx, gu.Email)
	if err != nil {
		http.Redirect(w, r, "/?error=server_error", http.StatusSeeOther)
		return
	}

	sessionToken, err := h.auth.CreateSession(ctx, user.ID)
	if err != nil {
		http.Redirect(w, r, "/?error=server_error", http.StatusSeeOther)
		return
	}

	h.auth.SetSessionCookie(w, sessionToken)

	redirect := state
	if redirect == "" {
		redirect = "/"
	}
	http.Redirect(w, r, redirect, http.StatusSeeOther)
}

// POST /api/auth/logout
func (h *Handler) Logout(w http.ResponseWriter, r *http.Request) {
	h.auth.DeleteSession(r.Context(), r)
	h.auth.ClearSessionCookie(w)
	respond(w, http.StatusOK, map[string]string{"message": "deslogado"})
}

// GET /api/auth/me
func (h *Handler) Me(w http.ResponseWriter, r *http.Request) {
	user, err := h.auth.GetSessionUser(r)
	if err != nil || user == nil {
		respond(w, http.StatusOK, map[string]any{"authenticated": false})
		return
	}
	respond(w, http.StatusOK, map[string]any{
		"authenticated": true,
		"user":          user,
	})
}

// Dev login (only when DEV_MODE=1)
type devLoginHandler struct {
	h *Handler
}

func (d *devLoginHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Email string `json:"email"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.Email == "" {
		respondError(w, http.StatusBadRequest, "email required")
		return
	}

	ctx := r.Context()
	user, err := d.h.auth.GetOrCreateUser(ctx, body.Email)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	token, err := d.h.auth.CreateSession(ctx, user.ID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	d.h.auth.SetSessionCookie(w, token)

	authUser := &auth.SessionUser{
		ID:           user.ID,
		Email:        user.Email,
		DisplayName:  user.DisplayName,
		PhotoPath:    user.PhotoPath,
		IsSuperadmin: user.IsSuperadmin,
	}
	respond(w, http.StatusOK, map[string]any{"user": authUser})
}

func (h *Handler) DevLoginHandler() http.Handler {
	return &devLoginHandler{h: h}
}
