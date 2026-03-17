package handler

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"testing"
)

func TestHealthCheck(t *testing.T) {
	app := newTestApp(t)
	resp, err := http.Get(app.server.URL + "/up")
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		t.Errorf("GET /up: got %d, want 200", resp.StatusCode)
	}
}

func TestDevLogin_CreatesFirstUserAsSuperadmin(t *testing.T) {
	app := newTestApp(t)
	email := fmt.Sprintf("superadmin_test_%d@test.bolao", uniqueID())
	defer cleanupTestUsers(t, app.pool, email)

	client := newTestClient()
	body, _ := json.Marshal(map[string]string{"email": email})
	resp, err := client.Post(app.server.URL+"/api/dev/login", "application/json", bytes.NewReader(body))
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("dev login: got %d, want 200", resp.StatusCode)
	}

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)
	user, ok := result["user"].(map[string]interface{})
	if !ok {
		t.Fatal("response missing 'user' field")
	}
	if user["email"] != email {
		t.Errorf("email: got %v, want %v", user["email"], email)
	}
}

func TestMe_ReturnsAuthenticatedUser(t *testing.T) {
	app := newTestApp(t)
	email := fmt.Sprintf("metest_%d@test.bolao", uniqueID())
	defer cleanupTestUsers(t, app.pool, email)

	client := newTestClient()

	// Login first
	body, _ := json.Marshal(map[string]string{"email": email})
	resp, err := client.Post(app.server.URL+"/api/dev/login", "application/json", bytes.NewReader(body))
	if err != nil {
		t.Fatal(err)
	}
	resp.Body.Close()

	// Check /api/auth/me
	req, _ := http.NewRequest("GET", app.server.URL+"/api/auth/me", nil)
	resp2, err := client.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer resp2.Body.Close()

	if resp2.StatusCode != http.StatusOK {
		t.Fatalf("GET /api/auth/me: got %d, want 200", resp2.StatusCode)
	}

	var result map[string]interface{}
	json.NewDecoder(resp2.Body).Decode(&result)

	if result["authenticated"] != true {
		t.Errorf("expected authenticated=true, got %v", result["authenticated"])
	}
	user, _ := result["user"].(map[string]interface{})
	if user == nil || user["email"] != email {
		t.Errorf("expected user email %q, got %v", email, user)
	}
}

func TestMe_UnauthorizedWithoutSession(t *testing.T) {
	app := newTestApp(t)
	resp, err := http.Get(app.server.URL + "/api/auth/me")
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)
	if result["authenticated"] != false {
		t.Errorf("expected authenticated=false for unauthenticated request, got %v", result["authenticated"])
	}
}

func TestLogout_ClearsSession(t *testing.T) {
	app := newTestApp(t)
	email := fmt.Sprintf("logout_test_%d@test.bolao", uniqueID())
	defer cleanupTestUsers(t, app.pool, email)

	client := newTestClient()

	// Login
	body, _ := json.Marshal(map[string]string{"email": email})
	resp, _ := client.Post(app.server.URL+"/api/dev/login", "application/json", bytes.NewReader(body))
	resp.Body.Close()

	// Logout
	resp2, err := client.Post(app.server.URL+"/api/auth/logout", "application/json", nil)
	if err != nil {
		t.Fatal(err)
	}
	resp2.Body.Close()

	// Check /api/auth/me — should be unauthenticated now
	req, _ := http.NewRequest("GET", app.server.URL+"/api/auth/me", nil)
	resp3, err := client.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer resp3.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(resp3.Body).Decode(&result)
	if result["authenticated"] != false {
		t.Errorf("after logout, expected authenticated=false, got %v", result["authenticated"])
	}
}
