package main

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jackc/pgx/v5/stdlib"

	"bolao/internal/auth"
	"bolao/internal/config"
	"bolao/internal/database"
	"bolao/internal/handler"
)

func main() {
	cfg := config.Load()

	// Ensure blob storage directory exists
	if err := os.MkdirAll(cfg.BlobStoragePath, 0755); err != nil {
		slog.Error("creating blob storage dir", "err", err)
		os.Exit(1)
	}

	// Connect to database with retry (use pgxpool for migrations)
	ctx := context.Background()
	var pool *pgxpool.Pool
	var err error
	for i := range 6 {
		pool, err = pgxpool.New(ctx, cfg.DatabaseURL)
		if err == nil {
			if err = pool.Ping(ctx); err == nil {
				break
			}
			pool.Close()
		}
		delay := time.Second * (1 << i)
		slog.Warn("database not ready, retrying", "attempt", i+1, "delay", delay, "err", err)
		time.Sleep(delay)
	}
	if err != nil {
		slog.Error("failed to connect to database", "err", err)
		os.Exit(1)
	}
	defer pool.Close()
	slog.Info("connected to database")

	// Run migrations (uses pgxpool directly)
	if err := database.RunMigrations(ctx, pool); err != nil {
		slog.Error("running migrations", "err", err)
		os.Exit(1)
	}

	// Wrap pgxpool as database/sql for sqlc-generated queries
	sqlDB := stdlib.OpenDBFromPool(pool)
	defer sqlDB.Close()

	// Initialize auth and handlers
	a := auth.New(cfg, sqlDB)
	h := handler.New(cfg, sqlDB, a)

	mux := http.NewServeMux()

	// Health check
	mux.HandleFunc("GET /up", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		fmt.Fprint(w, "ok")
	})

	// Auth routes (no /api prefix — needed for cookie redirect after OAuth)
	mux.HandleFunc("GET /auth/magic", h.VerifyMagicLink)
	mux.HandleFunc("GET /auth/google", h.GoogleLogin)
	mux.HandleFunc("GET /auth/google/callback", h.GoogleCallback)

	// API Auth routes
	mux.HandleFunc("POST /api/auth/magic-link", h.SendMagicLink)
	mux.HandleFunc("POST /api/auth/logout", h.Logout)
	mux.HandleFunc("GET /api/auth/me", h.Me)

	// User profile
	mux.HandleFunc("PATCH /api/user/profile", h.UpdateProfile)
	mux.HandleFunc("GET /api/users/{id}", h.GetUser)

	// Blob serving
	mux.HandleFunc("GET /api/blobs/{path...}", h.ServeBlob)

	// Groups
	mux.HandleFunc("POST /api/groups", h.CreateGroup)
	mux.HandleFunc("GET /api/groups", h.ListMyGroups)
	mux.HandleFunc("GET /api/groups/{id}", h.GetGroup)
	mux.HandleFunc("POST /api/groups/{id}/invite", h.GenerateInvite)
	mux.HandleFunc("GET /api/groups/{id}/invite", h.GetCurrentInvite)
	mux.HandleFunc("POST /api/groups/{id}/promote", h.PromoteMember)

	// Invites
	mux.HandleFunc("GET /api/invite/{token}", h.GetInviteInfo)
	mux.HandleFunc("POST /api/invite/{token}/join", h.JoinGroup)

	// Matches
	mux.HandleFunc("GET /api/matches", h.ListMatches)
	mux.HandleFunc("GET /api/matches/open", h.ListOpenMatches)
	mux.HandleFunc("GET /api/matches/{id}", h.GetMatch)

	// Predictions
	mux.HandleFunc("POST /api/predictions", h.UpsertPrediction)
	mux.HandleFunc("GET /api/predictions", h.ListMyPredictions)

	// Rankings
	mux.HandleFunc("GET /api/rankings/global", h.GlobalRanking)
	mux.HandleFunc("GET /api/rankings/group/{id}", h.GroupRanking)

	// Superadmin
	mux.HandleFunc("POST /api/admin/matches/{id}/result", h.SetMatchResult)
	mux.HandleFunc("PATCH /api/admin/matches/{id}/teams", h.UpdateMatchTeams)

	// Dev login (only when DEV_MODE=1)
	if cfg.DevMode {
		mux.Handle("POST /api/dev/login", h.DevLoginHandler())
		slog.Warn("DEV_MODE enabled — dev login endpoint active")
	}

	// SPA: serve frontend static files, catch-all returns index.html.
	// Path is relative to CWD when running (backend/ in dev, /app in production container).
	// FRONTEND_DIST env var overrides if set.
	frontendDist := os.Getenv("FRONTEND_DIST")
	if frontendDist == "" {
		frontendDist = "../frontend/dist" // dev: run from backend/
	}
	mux.Handle("/assets/", http.StripPrefix("/assets/", http.FileServer(http.Dir(frontendDist+"/assets"))))
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// API routes not found → 404
		if strings.HasPrefix(r.URL.Path, "/api/") || strings.HasPrefix(r.URL.Path, "/auth/") {
			http.NotFound(w, r)
			return
		}
		// SPA fallback — serve index.html for all other routes
		http.ServeFile(w, r, frontendDist+"/index.html")
	})

	addr := ":" + cfg.Port
	slog.Info("server starting", "addr", addr, "dev_mode", cfg.DevMode)
	if err := http.ListenAndServe(addr, mux); err != nil {
		slog.Error("server error", "err", err)
		os.Exit(1)
	}
}
