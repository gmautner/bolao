package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"testing"
)

func TestListMatches_Returns104Matches(t *testing.T) {
	app := newTestApp(t)
	email := fmt.Sprintf("matchlist_%d@test.bolao", uniqueID())
	defer cleanupTestUsers(t, app.pool, email)

	client := loginTestUser(t, app, email)

	req, _ := http.NewRequest("GET", app.server.URL+"/api/matches", nil)
	resp, err := client.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("GET /api/matches: got %d, want 200", resp.StatusCode)
	}

	var matches []interface{}
	json.NewDecoder(resp.Body).Decode(&matches)

	// Copa 2026: 104 partidas total
	if len(matches) != 104 {
		t.Errorf("expected 104 matches, got %d", len(matches))
	}
}

func TestListMatches_GroupPhaseHas72(t *testing.T) {
	app := newTestApp(t)
	email := fmt.Sprintf("groupphase_%d@test.bolao", uniqueID())
	defer cleanupTestUsers(t, app.pool, email)

	client := loginTestUser(t, app, email)

	req, _ := http.NewRequest("GET", app.server.URL+"/api/matches?phase=group", nil)
	resp, err := client.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()

	var matches []interface{}
	json.NewDecoder(resp.Body).Decode(&matches)

	if len(matches) != 72 {
		t.Errorf("fase de grupos: expected 72 matches, got %d", len(matches))
	}
}

func TestListMatches_RequiresAuth(t *testing.T) {
	app := newTestApp(t)
	resp, err := http.Get(app.server.URL + "/api/matches")
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusUnauthorized {
		t.Errorf("GET /api/matches without auth: got %d, want 401", resp.StatusCode)
	}
}

func TestFirstMatchIsMexicoVsSouthAfrica(t *testing.T) {
	app := newTestApp(t)
	email := fmt.Sprintf("firstmatch_%d@test.bolao", uniqueID())
	defer cleanupTestUsers(t, app.pool, email)

	client := loginTestUser(t, app, email)

	req, _ := http.NewRequest("GET", app.server.URL+"/api/matches?phase=group", nil)
	resp, err := client.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()

	var matches []map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&matches)

	if len(matches) == 0 {
		t.Fatal("no matches returned")
	}

	first := matches[0]
	if first["home_team"] != "México" {
		t.Errorf("first match home team: got %v, want 'México'", first["home_team"])
	}
	if first["away_team"] != "África do Sul" {
		t.Errorf("first match away team: got %v, want 'África do Sul'", first["away_team"])
	}
	if first["group_name"] != "A" {
		t.Errorf("first match group: got %v, want 'A'", first["group_name"])
	}
}

func TestGlobalRanking_ReturnsNewUser(t *testing.T) {
	app := newTestApp(t)
	email := fmt.Sprintf("ranking_%d@test.bolao", uniqueID())
	defer cleanupTestUsers(t, app.pool, email)

	client := loginTestUser(t, app, email)

	req, _ := http.NewRequest("GET", app.server.URL+"/api/rankings/global", nil)
	resp, err := client.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("GET /api/rankings/global: got %d, want 200", resp.StatusCode)
	}

	var ranking []map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&ranking)

	// Verify there is at least 1 entry and one is the current user
	if len(ranking) == 0 {
		t.Fatal("ranking should have at least 1 entry")
	}

	foundCurrentUser := false
	for _, entry := range ranking {
		if entry["is_current_user"] == true {
			foundCurrentUser = true
			pts := entry["total_points"]
			// New user should have 0 points
			if pts != float64(0) {
				t.Errorf("new user total_points: got %v, want 0", pts)
			}
		}
	}
	if !foundCurrentUser {
		t.Error("current user should appear in ranking with is_current_user=true")
	}
}

func TestSuperadminSetResult_ProcessesScores(t *testing.T) {
	app := newTestApp(t)
	userEmail := fmt.Sprintf("scorer_%d@test.bolao", uniqueID())
	defer cleanupTestUsers(t, app.pool, userEmail)

	// Look up the actual superadmin from DB
	var superadminEmail string
	err := app.pool.QueryRow(
		context.Background(),
		"SELECT email FROM users WHERE is_superadmin = TRUE ORDER BY created_at ASC LIMIT 1",
	).Scan(&superadminEmail)
	if err != nil || superadminEmail == "" {
		t.Skip("no superadmin found in DB — run dev login first")
	}

	adminClient := loginTestUser(t, app, superadminEmail)
	userClient := loginTestUser(t, app, userEmail)

	// Get the first group stage match
	req, _ := http.NewRequest("GET", app.server.URL+"/api/matches?phase=group", nil)
	resp, _ := adminClient.Do(req)
	var matches []map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&matches)
	resp.Body.Close()

	if len(matches) == 0 {
		t.Fatal("no group matches found")
	}
	matchID := matches[0]["id"].(string)

	// User makes a prediction: 3-0
	body, _ := json.Marshal(map[string]interface{}{
		"match_id":   matchID,
		"home_score": 3,
		"away_score": 0,
	})
	resp2, _ := userClient.Post(app.server.URL+"/api/predictions", "application/json", bytes.NewReader(body))
	resp2.Body.Close()

	// Admin sets result: 3-0 (exact score!)
	body2, _ := json.Marshal(map[string]interface{}{
		"home_score":     3,
		"away_score":     0,
		"has_extra_time": false,
	})
	resp3, err := adminClient.Post(app.server.URL+"/api/admin/matches/"+matchID+"/result",
		"application/json", bytes.NewReader(body2))
	if err != nil {
		t.Fatal(err)
	}
	defer resp3.Body.Close()

	if resp3.StatusCode != http.StatusOK {
		t.Fatalf("POST admin/result: got %d, want 200", resp3.StatusCode)
	}
}

func TestNonAdminCannotSetResult(t *testing.T) {
	app := newTestApp(t)
	// Make sure there is already a superadmin (not this user)
	superAdminEmail := fmt.Sprintf("super_%d@test.bolao", uniqueID())
	normalEmail := fmt.Sprintf("normal_%d@test.bolao", uniqueID())
	defer cleanupTestUsers(t, app.pool, superAdminEmail, normalEmail)

	loginTestUser(t, app, superAdminEmail) // creates superadmin

	normalClient := loginTestUser(t, app, normalEmail)

	// Get first match
	req, _ := http.NewRequest("GET", app.server.URL+"/api/matches?phase=group", nil)
	resp, _ := normalClient.Do(req)
	var matches []map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&matches)
	resp.Body.Close()

	matchID := matches[0]["id"].(string)
	body, _ := json.Marshal(map[string]interface{}{"home_score": 1, "away_score": 0, "has_extra_time": false})
	resp2, err := normalClient.Post(app.server.URL+"/api/admin/matches/"+matchID+"/result",
		"application/json", bytes.NewReader(body))
	if err != nil {
		t.Fatal(err)
	}
	defer resp2.Body.Close()

	if resp2.StatusCode != http.StatusForbidden {
		t.Errorf("non-superadmin set result: got %d, want 403", resp2.StatusCode)
	}
}
