package handler

import (
	"time"

	db "bolao/internal/database/sqlc"
)

// MatchResponse is the JSON-friendly version of a match.
// Replaces sql.NullTime/NullInt32 with plain Go types for the frontend.
type MatchResponse struct {
	ID           string  `json:"id"`
	Phase        string  `json:"phase"`
	PhaseLabel   string  `json:"phase_label"`
	MatchNumber  int32   `json:"match_number"`
	GroupName    string  `json:"group_name"`
	HomeTeam     string  `json:"home_team"`
	AwayTeam     string  `json:"away_team"`
	MatchTime    *string `json:"match_time"` // RFC3339 string or null
	Stadium      string  `json:"stadium"`
	City         string  `json:"city"`
	DayNumber    int32   `json:"day_number"`
	HomeScore    *int32  `json:"home_score"`
	AwayScore    *int32  `json:"away_score"`
	IsFinished   bool    `json:"is_finished"`
	HasExtraTime bool    `json:"has_extra_time"`
	Status       string  `json:"status"` // "scheduled" | "open" | "finished"
}

var phaseLabels = map[string]string{
	"group":       "Fase de Grupos",
	"round_of_32": "Round de 32",
	"round_of_16": "Oitavas de Final",
	"quarterfinal": "Quartas de Final",
	"semifinal":   "Semifinal",
	"third_place": "Disputa de 3º Lugar",
	"final":       "Final",
}

func matchToResponse(m db.Match) MatchResponse {
	r := MatchResponse{
		ID:           m.ID.String(),
		Phase:        m.Phase,
		PhaseLabel:   phaseLabels[m.Phase],
		MatchNumber:  m.MatchNumber,
		GroupName:    m.GroupName,
		HomeTeam:     m.HomeTeam,
		AwayTeam:     m.AwayTeam,
		Stadium:      m.Stadium,
		City:         m.City,
		DayNumber:    m.DayNumber,
		IsFinished:   m.IsFinished,
		HasExtraTime: m.HasExtraTime,
	}

	if m.MatchTime.Valid {
		s := m.MatchTime.Time.Format(time.RFC3339)
		r.MatchTime = &s
		// Compute status
		if m.IsFinished {
			r.Status = "finished"
		} else if m.MatchTime.Time.After(time.Now()) {
			r.Status = "open"
		} else {
			r.Status = "started" // kick-off passed but not yet finished
		}
	} else {
		r.Status = "scheduled"
	}

	if m.HomeScore.Valid {
		v := m.HomeScore.Int32
		r.HomeScore = &v
	}
	if m.AwayScore.Valid {
		v := m.AwayScore.Int32
		r.AwayScore = &v
	}

	return r
}

func matchesToResponse(matches []db.Match) []MatchResponse {
	result := make([]MatchResponse, len(matches))
	for i, m := range matches {
		result[i] = matchToResponse(m)
	}
	return result
}
