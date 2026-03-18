package handler

import (
	"context"
	"database/sql"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jackc/pgx/v5/stdlib"

	"bolao/internal/auth"
	"bolao/internal/config"
	"bolao/internal/database"
)

type testApp struct {
	handler *Handler
	auth    *auth.Auth
	pool    *pgxpool.Pool
	sqlDB   *sql.DB
	server  *httptest.Server
}

func newTestApp(t *testing.T) *testApp {
	t.Helper()

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://postgres:postgres@localhost:5432/postgres?sslmode=disable"
	}

	ctx := context.Background()
	pool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		t.Skipf("skipping integration test (no DB): %v", err)
	}
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		t.Skipf("skipping integration test (DB not reachable): %v", err)
	}

	// Run migrations
	if err := database.RunMigrations(ctx, pool); err != nil {
		pool.Close()
		t.Fatalf("migrations failed: %v", err)
	}

	sqlDB := stdlib.OpenDBFromPool(pool)

	cfg := config.Config{
		Port:            "8080",
		DevMode:         true,
		BlobStoragePath: t.TempDir(),
		BaseURL:         "http://localhost:8080",
		SessionSecret:   "test-secret",
	}

	a := auth.New(cfg, sqlDB)
	h := New(cfg, sqlDB, a)

	mux := http.NewServeMux()
	mux.HandleFunc("GET /up", func(w http.ResponseWriter, r *http.Request) { w.WriteHeader(200) })
	mux.HandleFunc("POST /api/auth/magic-link", h.SendMagicLink)
	mux.HandleFunc("POST /api/auth/logout", h.Logout)
	mux.HandleFunc("GET /api/auth/me", h.Me)
	mux.Handle("POST /api/dev/login", h.DevLoginHandler())
	mux.HandleFunc("PATCH /api/user/profile", h.UpdateProfile)
	mux.HandleFunc("POST /api/groups", h.CreateGroup)
	mux.HandleFunc("GET /api/groups", h.ListMyGroups)
	mux.HandleFunc("GET /api/groups/{id}", h.GetGroup)
	mux.HandleFunc("POST /api/groups/{id}/invite", h.GenerateInvite)
	mux.HandleFunc("POST /api/groups/{id}/promote", h.PromoteMember)
	mux.HandleFunc("GET /api/invite/{token}", h.GetInviteInfo)
	mux.HandleFunc("POST /api/invite/{token}/join", h.JoinGroup)
	mux.HandleFunc("GET /api/matches", h.ListMatches)
	mux.HandleFunc("GET /api/matches/open", h.ListOpenMatches)
	mux.HandleFunc("GET /api/matches/{id}", h.GetMatch)
	mux.HandleFunc("POST /api/predictions", h.UpsertPrediction)
	mux.HandleFunc("GET /api/predictions", h.ListMyPredictions)
	mux.HandleFunc("GET /api/rankings/global", h.GlobalRanking)
	mux.HandleFunc("GET /api/rankings/group/{id}", h.GroupRanking)
	mux.HandleFunc("POST /api/admin/matches/{id}/result", h.SetMatchResult)
	mux.HandleFunc("PATCH /api/admin/matches/{id}/teams", h.UpdateMatchTeams)

	srv := httptest.NewServer(mux)

	t.Cleanup(func() {
		srv.Close()
		sqlDB.Close()
		pool.Close()
	})

	return &testApp{
		handler: h,
		auth:    a,
		pool:    pool,
		sqlDB:   sqlDB,
		server:  srv,
	}
}

// newTestAppProd creates a test app with DevMode=false and no SMTP configured,
// simulating a production environment missing email configuration.
func newTestAppProd(t *testing.T) *testApp {
	t.Helper()

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://postgres:postgres@localhost:5432/postgres?sslmode=disable"
	}

	ctx := context.Background()
	pool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		t.Skipf("skipping integration test (no DB): %v", err)
	}
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		t.Skipf("skipping integration test (DB not reachable): %v", err)
	}

	if err := database.RunMigrations(ctx, pool); err != nil {
		pool.Close()
		t.Fatalf("migrations failed: %v", err)
	}

	sqlDB := stdlib.OpenDBFromPool(pool)

	cfg := config.Config{
		Port:            "8080",
		DevMode:         false, // production mode — no SMTP configured
		BlobStoragePath: t.TempDir(),
		BaseURL:         "http://localhost:8080",
		SessionSecret:   "test-secret",
		// SMTPHost intentionally empty to simulate misconfiguration
	}

	a := auth.New(cfg, sqlDB)
	h := New(cfg, sqlDB, a)

	mux := http.NewServeMux()
	mux.HandleFunc("POST /api/auth/magic-link", h.SendMagicLink)

	srv := httptest.NewServer(mux)

	t.Cleanup(func() {
		srv.Close()
		sqlDB.Close()
		pool.Close()
	})

	return &testApp{handler: h, auth: a, pool: pool, sqlDB: sqlDB, server: srv}
}

// cleanupTestUsers removes test users created during a test by email prefix.
func cleanupTestUsers(t *testing.T, pool *pgxpool.Pool, emails ...string) {
	t.Helper()
	ctx := context.Background()
	for _, email := range emails {
		pool.Exec(ctx, "DELETE FROM users WHERE email = $1", email)
	}
}

// newTestClient returns an http.Client that stores cookies (for session).
func newTestClient() *http.Client {
	jar := newCookieJar()
	return &http.Client{Jar: jar}
}

// cookieJar is a simple in-memory cookie jar.
type cookieJar struct {
	cookies map[string][]*http.Cookie
}

func newCookieJar() *cookieJar {
	return &cookieJar{cookies: make(map[string][]*http.Cookie)}
}

func (j *cookieJar) SetCookies(u *url.URL, cookies []*http.Cookie) {
	j.cookies[u.Host] = append(j.cookies[u.Host], cookies...)
}

func (j *cookieJar) Cookies(u *url.URL) []*http.Cookie {
	return j.cookies[u.Host]
}
