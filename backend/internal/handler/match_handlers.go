package handler

import (
	"database/sql"
	"encoding/json"
	"log/slog"
	"net/http"
	"time"

	"github.com/google/uuid"

	db "bolao/internal/database/sqlc"
)

// GET /api/matches
func (h *Handler) ListMatches(w http.ResponseWriter, r *http.Request) {
	_ = h.requireAuth(w, r)
	if _, err := h.auth.GetSessionUser(r); err != nil {
		return
	}

	phase := r.URL.Query().Get("phase")
	ctx := r.Context()

	var matches []db.Match
	var err error

	if phase != "" {
		matches, err = h.queries.ListMatchesByPhase(ctx, phase)
	} else {
		matches, err = h.queries.ListAllMatches(ctx)
	}
	if err != nil {
		respondError(w, http.StatusInternalServerError, "erro ao listar partidas")
		return
	}
	if matches == nil {
		matches = []db.Match{}
	}
	respond(w, http.StatusOK, matches)
}

// GET /api/matches/open
func (h *Handler) ListOpenMatches(w http.ResponseWriter, r *http.Request) {
	user := h.requireAuth(w, r)
	if user == nil {
		return
	}

	matches, err := h.queries.ListOpenForPrediction(r.Context())
	if err != nil {
		respondError(w, http.StatusInternalServerError, "erro ao listar partidas")
		return
	}
	if matches == nil {
		matches = []db.Match{}
	}
	respond(w, http.StatusOK, matches)
}

// GET /api/matches/{id}
func (h *Handler) GetMatch(w http.ResponseWriter, r *http.Request) {
	user := h.requireAuth(w, r)
	if user == nil {
		return
	}

	matchID, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "ID inválido")
		return
	}

	ctx := r.Context()
	match, err := h.queries.GetMatchByID(ctx, matchID)
	if err != nil {
		respondError(w, http.StatusNotFound, "partida não encontrada")
		return
	}

	// Get user's prediction
	pred, _ := h.queries.GetPrediction(ctx, db.GetPredictionParams{
		UserID:  user.ID,
		MatchID: matchID,
	})

	respond(w, http.StatusOK, map[string]any{
		"match":      match,
		"prediction": pred,
	})
}

// POST /api/predictions
func (h *Handler) UpsertPrediction(w http.ResponseWriter, r *http.Request) {
	user := h.requireAuth(w, r)
	if user == nil {
		return
	}

	var body struct {
		MatchID   string `json:"match_id"`
		HomeScore int    `json:"home_score"`
		AwayScore int    `json:"away_score"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		respondError(w, http.StatusBadRequest, "JSON inválido")
		return
	}

	matchID, err := uuid.Parse(body.MatchID)
	if err != nil {
		respondError(w, http.StatusBadRequest, "match_id inválido")
		return
	}

	if body.HomeScore < 0 || body.AwayScore < 0 {
		respondError(w, http.StatusBadRequest, "placar não pode ser negativo")
		return
	}

	ctx := r.Context()

	// Check match exists and is open for prediction
	match, err := h.queries.GetMatchByID(ctx, matchID)
	if err != nil {
		respondError(w, http.StatusNotFound, "partida não encontrada")
		return
	}
	if match.IsFinished {
		respondError(w, http.StatusBadRequest, "partida já finalizada")
		return
	}
	// Check deadline — no palpites after kick-off
	if !match.MatchTime.Valid || !match.MatchTime.Time.After(time.Now()) {
		respondError(w, http.StatusBadRequest, "prazo de palpite encerrado para esta partida")
		return
	}

	pred, err := h.queries.UpsertPrediction(ctx, db.UpsertPredictionParams{
		UserID:    user.ID,
		MatchID:   matchID,
		HomeScore: int32(body.HomeScore),
		AwayScore: int32(body.AwayScore),
	})
	if err != nil {
		slog.Error("upserting prediction", "err", err)
		respondError(w, http.StatusInternalServerError, "erro ao salvar palpite")
		return
	}

	respond(w, http.StatusOK, pred)
}

// GET /api/predictions
func (h *Handler) ListMyPredictions(w http.ResponseWriter, r *http.Request) {
	user := h.requireAuth(w, r)
	if user == nil {
		return
	}

	preds, err := h.queries.ListUserPredictions(r.Context(), user.ID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "erro ao listar palpites")
		return
	}
	if preds == nil {
		preds = []db.ListUserPredictionsRow{}
	}
	respond(w, http.StatusOK, preds)
}

// --- Superadmin endpoints ---

// POST /api/admin/matches/{id}/result
func (h *Handler) SetMatchResult(w http.ResponseWriter, r *http.Request) {
	user := h.requireSuperadmin(w, r)
	if user == nil {
		return
	}

	matchID, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "ID inválido")
		return
	}

	var body struct {
		HomeScore    int  `json:"home_score"`
		AwayScore    int  `json:"away_score"`
		HasExtraTime bool `json:"has_extra_time"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		respondError(w, http.StatusBadRequest, "JSON inválido")
		return
	}

	ctx := r.Context()
	match, err := h.queries.SetMatchResult(ctx, db.SetMatchResultParams{
		ID:           matchID,
		HomeScore:    sql.NullInt32{Int32: int32(body.HomeScore), Valid: true},
		AwayScore:    sql.NullInt32{Int32: int32(body.AwayScore), Valid: true},
		HasExtraTime: body.HasExtraTime,
	})
	if err != nil {
		slog.Error("setting match result", "err", err)
		respondError(w, http.StatusInternalServerError, "erro ao registrar resultado")
		return
	}

	// Process scores asynchronously
	go func() {
		if err := h.ProcessMatchScores(ctx, matchID); err != nil {
			slog.Error("processing scores", "match_id", matchID, "err", err)
		}
	}()

	respond(w, http.StatusOK, match)
}

// POST /api/admin/matches/{id}/teams
func (h *Handler) UpdateMatchTeams(w http.ResponseWriter, r *http.Request) {
	user := h.requireSuperadmin(w, r)
	if user == nil {
		return
	}

	matchID, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "ID inválido")
		return
	}

	var body struct {
		HomeTeam string `json:"home_team"`
		AwayTeam string `json:"away_team"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		respondError(w, http.StatusBadRequest, "JSON inválido")
		return
	}

	if err := h.queries.UpdateMatchTeams(r.Context(), db.UpdateMatchTeamsParams{
		ID:       matchID,
		HomeTeam: body.HomeTeam,
		AwayTeam: body.AwayTeam,
	}); err != nil {
		respondError(w, http.StatusInternalServerError, "erro ao atualizar times")
		return
	}

	respond(w, http.StatusOK, map[string]string{"message": "times atualizados"})
}
