package handler

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"sync/atomic"
	"testing"
)

var idCounter int64

func uniqueID() int64 {
	return atomic.AddInt64(&idCounter, 1)
}

func loginTestUser(t *testing.T, app *testApp, email string) *http.Client {
	t.Helper()
	client := newTestClient()
	body, _ := json.Marshal(map[string]string{"email": email})
	resp, err := client.Post(app.server.URL+"/api/dev/login", "application/json", bytes.NewReader(body))
	if err != nil {
		t.Fatalf("dev login failed: %v", err)
	}
	resp.Body.Close()
	return client
}

func TestCreateGroup_HappyPath(t *testing.T) {
	app := newTestApp(t)
	email := fmt.Sprintf("grouptest_%d@test.bolao", uniqueID())
	defer cleanupTestUsers(t, app.pool, email)

	client := loginTestUser(t, app, email)

	body, _ := json.Marshal(map[string]string{"name": "Turma da Copa"})
	resp, err := client.Post(app.server.URL+"/api/groups", "application/json", bytes.NewReader(body))
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated {
		t.Fatalf("POST /api/groups: got %d, want 201", resp.StatusCode)
	}

	var group map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&group)
	if group["name"] != "Turma da Copa" {
		t.Errorf("group name: got %v, want 'Turma da Copa'", group["name"])
	}
}

func TestCreateGroup_RequiresAuth(t *testing.T) {
	app := newTestApp(t)
	body, _ := json.Marshal(map[string]string{"name": "Grupo sem auth"})
	resp, err := http.Post(app.server.URL+"/api/groups", "application/json", bytes.NewReader(body))
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusUnauthorized {
		t.Errorf("POST /api/groups without auth: got %d, want 401", resp.StatusCode)
	}
}

func TestListMyGroups_EmptyForNewUser(t *testing.T) {
	app := newTestApp(t)
	email := fmt.Sprintf("listgroups_%d@test.bolao", uniqueID())
	defer cleanupTestUsers(t, app.pool, email)

	client := loginTestUser(t, app, email)

	req, _ := http.NewRequest("GET", app.server.URL+"/api/groups", nil)
	resp, err := client.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("GET /api/groups: got %d, want 200", resp.StatusCode)
	}

	var groups []interface{}
	json.NewDecoder(resp.Body).Decode(&groups)
	if len(groups) != 0 {
		t.Errorf("new user should have 0 groups, got %d", len(groups))
	}
}

func TestGenerateInvite_AdminCanGenerate(t *testing.T) {
	app := newTestApp(t)
	email := fmt.Sprintf("invitetest_%d@test.bolao", uniqueID())
	defer cleanupTestUsers(t, app.pool, email)

	client := loginTestUser(t, app, email)

	// Create group
	body, _ := json.Marshal(map[string]string{"name": "Grupo Convite"})
	resp, _ := client.Post(app.server.URL+"/api/groups", "application/json", bytes.NewReader(body))
	var group map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&group)
	resp.Body.Close()

	groupID := group["id"].(string)

	// Generate invite
	resp2, err := client.Post(app.server.URL+"/api/groups/"+groupID+"/invite", "application/json", nil)
	if err != nil {
		t.Fatal(err)
	}
	defer resp2.Body.Close()

	if resp2.StatusCode != http.StatusOK {
		t.Fatalf("POST /api/groups/{id}/invite: got %d, want 200", resp2.StatusCode)
	}

	var invite map[string]interface{}
	json.NewDecoder(resp2.Body).Decode(&invite)
	if invite["token"] == "" || invite["token"] == nil {
		t.Errorf("invite token should not be empty, got %v", invite["token"])
	}
	if invite["invite_url"] == "" || invite["invite_url"] == nil {
		t.Errorf("invite_url should not be empty, got %v", invite["invite_url"])
	}
}

func TestJoinGroup_ViaInviteToken(t *testing.T) {
	app := newTestApp(t)
	adminEmail := fmt.Sprintf("admin_%d@test.bolao", uniqueID())
	memberEmail := fmt.Sprintf("member_%d@test.bolao", uniqueID())
	defer cleanupTestUsers(t, app.pool, adminEmail, memberEmail)

	adminClient := loginTestUser(t, app, adminEmail)
	memberClient := loginTestUser(t, app, memberEmail)

	// Admin creates group
	body, _ := json.Marshal(map[string]string{"name": "Grupo Join Test"})
	resp, _ := adminClient.Post(app.server.URL+"/api/groups", "application/json", bytes.NewReader(body))
	var group map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&group)
	resp.Body.Close()
	groupID := group["id"].(string)

	// Admin generates invite
	resp2, _ := adminClient.Post(app.server.URL+"/api/groups/"+groupID+"/invite", "application/json", nil)
	var invite map[string]interface{}
	json.NewDecoder(resp2.Body).Decode(&invite)
	resp2.Body.Close()
	token := invite["token"].(string)

	// Member gets invite info
	req, _ := http.NewRequest("GET", app.server.URL+"/api/invite/"+token, nil)
	resp3, err := memberClient.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer resp3.Body.Close()
	if resp3.StatusCode != http.StatusOK {
		t.Fatalf("GET /api/invite/{token}: got %d, want 200", resp3.StatusCode)
	}

	// Member joins
	resp4, err := memberClient.Post(app.server.URL+"/api/invite/"+token+"/join", "application/json", nil)
	if err != nil {
		t.Fatal(err)
	}
	defer resp4.Body.Close()
	if resp4.StatusCode != http.StatusOK {
		t.Fatalf("POST /api/invite/{token}/join: got %d, want 200", resp4.StatusCode)
	}

	// Verify member appears in group
	req2, _ := http.NewRequest("GET", app.server.URL+"/api/groups/"+groupID, nil)
	resp5, err := adminClient.Do(req2)
	if err != nil {
		t.Fatal(err)
	}
	defer resp5.Body.Close()

	var detail map[string]interface{}
	json.NewDecoder(resp5.Body).Decode(&detail)
	members, _ := detail["members"].([]interface{})
	if len(members) < 2 {
		t.Errorf("expected at least 2 members (admin + new member), got %d", len(members))
	}
}
