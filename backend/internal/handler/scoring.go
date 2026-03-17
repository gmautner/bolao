package handler

import (
	"context"
	"log/slog"

	"github.com/google/uuid"

	db "bolao/internal/database/sqlc"
)


// ScoreResult holds the points breakdown for a single prediction.
type ScoreResult struct {
	RawPoints int
	DayWeight int
	Total     int
	Criterion string
}

// ComputeScore calculates points for a prediction given the actual result.
// Points are non-cumulative — only the highest applicable criterion applies.
// Placar considers final time including extra time (no penalty shootout).
func ComputeScore(predHome, predAway, realHome, realAway int) ScoreResult {
	predWinner := winner(predHome, predAway)
	realWinner := winner(realHome, realAway)

	var raw int
	var criterion string

	switch {
	// Exact score
	case predHome == realHome && predAway == realAway:
		raw = 25
		criterion = "placar_exato"

	// Correct winner + winner's goals
	case predWinner == realWinner && predWinner != 0 &&
		goalsByWinner(predHome, predAway) == goalsByWinner(realHome, realAway):
		raw = 18
		criterion = "vencedor_gols_vencedor"

	// Draw — predicted draw and it was a draw (but not exact)
	case predWinner == 0 && realWinner == 0:
		raw = 15
		criterion = "empate_correto"

	// Correct winner + goal difference
	case predWinner == realWinner && predWinner != 0 &&
		(predHome-predAway) == (realHome-realAway):
		raw = 15
		criterion = "vencedor_diferenca_gols"

	// Correct winner + loser's goals
	case predWinner == realWinner && predWinner != 0 &&
		goalsByLoser(predHome, predAway) == goalsByLoser(realHome, realAway):
		raw = 12
		criterion = "vencedor_gols_perdedor"

	// Only winner correct
	case predWinner == realWinner && predWinner != 0:
		raw = 10
		criterion = "apenas_vencedor"

	// Predicted draw but wasn't
	case predWinner == 0 && realWinner != 0:
		raw = 4
		criterion = "previu_empate_nao_foi"

	default:
		raw = 0
		criterion = "outro"
	}

	return ScoreResult{RawPoints: raw, Criterion: criterion}
}

// winner returns: 1 = home wins, 2 = away wins, 0 = draw
func winner(home, away int) int {
	if home > away {
		return 1
	}
	if away > home {
		return 2
	}
	return 0
}

func goalsByWinner(home, away int) int {
	if home > away {
		return home
	}
	return away
}

func goalsByLoser(home, away int) int {
	if home > away {
		return away
	}
	return home
}

// ProcessMatchScores computes and saves scores for all predictions of a finished match.
func (h *Handler) ProcessMatchScores(ctx context.Context, matchID uuid.UUID) error {
	match, err := h.queries.GetMatchByID(ctx, matchID)
	if err != nil {
		return err
	}
	if !match.IsFinished || !match.HomeScore.Valid || !match.AwayScore.Valid {
		return nil
	}

	// Get day weight
	weight, err := h.queries.GetMatchDayWeight(ctx, int32(match.DayNumber))
	if err != nil {
		slog.Warn("no day weight found, using 10", "day_number", match.DayNumber)
		weight = 10
	}

	// Get all predictions for this match
	preds, err := h.queries.ListPredictionsForMatch(ctx, matchID)
	if err != nil {
		return err
	}

	realHome := int(match.HomeScore.Int32)
	realAway := int(match.AwayScore.Int32)

	for _, pred := range preds {
		score := ComputeScore(int(pred.HomeScore), int(pred.AwayScore), realHome, realAway)
		score.DayWeight = int(weight)
		score.Total = score.RawPoints * score.DayWeight

		err = h.queries.UpsertScore(ctx, db.UpsertScoreParams{
			UserID:      pred.UserID,
			MatchID:     matchID,
			RawPoints:   int32(score.RawPoints),
			DayWeight:   int32(score.DayWeight),
			TotalPoints: int32(score.Total),
			Criterion:   score.Criterion,
		})
		if err != nil {
			slog.Error("upserting score", "user_id", pred.UserID, "err", err)
		}
	}

	slog.Info("processed scores for match", "match_id", matchID, "predictions", len(preds))
	return nil
}
