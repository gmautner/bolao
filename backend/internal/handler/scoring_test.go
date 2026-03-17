package handler

import (
	"testing"
)

func TestComputeScore(t *testing.T) {
	tests := []struct {
		name      string
		predHome  int
		predAway  int
		realHome  int
		realAway  int
		wantPts   int
		wantCrit  string
	}{
		{
			name:     "placar exato home vence",
			predHome: 3, predAway: 0,
			realHome: 3, realAway: 0,
			wantPts: 25, wantCrit: "placar_exato",
		},
		{
			name:     "placar exato empate",
			predHome: 1, predAway: 1,
			realHome: 1, realAway: 1,
			wantPts: 25, wantCrit: "placar_exato",
		},
		{
			name:     "placar exato visitante vence",
			predHome: 0, predAway: 2,
			realHome: 0, realAway: 2,
			wantPts: 25, wantCrit: "placar_exato",
		},
		{
			name:     "vencedor + gols vencedor",
			predHome: 3, predAway: 1,
			realHome: 3, realAway: 0,
			wantPts: 18, wantCrit: "vencedor_gols_vencedor",
		},
		{
			name:     "vencedor + gols vencedor visitante",
			predHome: 0, predAway: 2,
			realHome: 1, realAway: 2,
			wantPts: 18, wantCrit: "vencedor_gols_vencedor",
		},
		{
			name:     "empate correto",
			predHome: 0, predAway: 0,
			realHome: 1, realAway: 1,
			wantPts: 15, wantCrit: "empate_correto",
		},
		{
			name:     "empate correto diferente placar",
			predHome: 2, predAway: 2,
			realHome: 3, realAway: 3,
			wantPts: 15, wantCrit: "empate_correto",
		},
		{
			name:     "vencedor + diferença de gols",
			predHome: 3, predAway: 1,
			realHome: 2, realAway: 0,
			wantPts: 15, wantCrit: "vencedor_diferenca_gols",
		},
		{
			name:     "vencedor + gols perdedor",
			predHome: 3, predAway: 1,
			realHome: 2, realAway: 1,
			wantPts: 12, wantCrit: "vencedor_gols_perdedor",
		},
		{
			name:     "apenas vencedor",
			predHome: 3, predAway: 1,
			realHome: 4, realAway: 0,
			wantPts: 10, wantCrit: "apenas_vencedor",
		},
		{
			name:     "previu empate nao foi",
			predHome: 1, predAway: 1,
			realHome: 2, realAway: 1,
			wantPts: 4, wantCrit: "previu_empate_nao_foi",
		},
		{
			name:     "previu empate nao foi visitante ganhou",
			predHome: 0, predAway: 0,
			realHome: 0, realAway: 1,
			wantPts: 4, wantCrit: "previu_empate_nao_foi",
		},
		{
			name:     "errou tudo — vencedor errado",
			predHome: 0, predAway: 1,
			realHome: 2, realAway: 0,
			wantPts: 0, wantCrit: "outro",
		},
		{
			name:     "errou — previu visitante vencer mas empatou",
			predHome: 0, predAway: 2,
			realHome: 1, realAway: 1,
			wantPts: 0, wantCrit: "outro",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := ComputeScore(tt.predHome, tt.predAway, tt.realHome, tt.realAway)
			if got.RawPoints != tt.wantPts {
				t.Errorf("ComputeScore(%d×%d, real %d×%d): got %d pts, want %d pts",
					tt.predHome, tt.predAway, tt.realHome, tt.realAway,
					got.RawPoints, tt.wantPts)
			}
			if got.Criterion != tt.wantCrit {
				t.Errorf("ComputeScore(%d×%d, real %d×%d): got criterion %q, want %q",
					tt.predHome, tt.predAway, tt.realHome, tt.realAway,
					got.Criterion, tt.wantCrit)
			}
		})
	}
}

func TestComputeScoreNonCumulative(t *testing.T) {
	// A pontuação MAIS ALTA deve ser aplicada — não cumulativa
	// Placar exato deve ser 25, não 25+18+15 etc.
	result := ComputeScore(3, 0, 3, 0)
	if result.RawPoints != 25 {
		t.Errorf("placar exato deve valer 25, não %d", result.RawPoints)
	}
}

func TestMaskName(t *testing.T) {
	tests := []struct {
		name string
		want string
	}{
		{"Carolina Silva", "Carolina S."},
		{"Guilherme Gomes", "Guilherme G."},
		{"João", "João"},
		{"", ""},
		{"Ana Paula Costa", "Ana C."},
	}
	for _, tt := range tests {
		got := maskName(tt.name)
		if got != tt.want {
			t.Errorf("maskName(%q) = %q, want %q", tt.name, got, tt.want)
		}
	}
}
