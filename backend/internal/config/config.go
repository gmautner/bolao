package config

import (
	"log/slog"
	"os"
)

type Config struct {
	DatabaseURL    string
	Port           string
	DevMode        bool
	BlobStoragePath string
	// SMTP
	SMTPHost     string
	SMTPPort     string
	SMTPUser     string
	SMTPPassword string
	SMTPFrom     string
	// Google OAuth
	GoogleClientID     string
	GoogleClientSecret string
	// App
	BaseURL    string
	SessionSecret string
}

func Load() Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	blobPath := os.Getenv("BLOB_STORAGE_PATH")
	if blobPath == "" {
		blobPath = "./blobs"
	}

	baseURL := os.Getenv("BASE_URL")
	if baseURL == "" {
		baseURL = "http://localhost:8080"
	}

	sessionSecret := os.Getenv("SESSION_SECRET")
	if sessionSecret == "" {
		sessionSecret = "dev-secret-change-in-production"
		slog.Warn("SESSION_SECRET not set, using insecure default")
	}

	return Config{
		DatabaseURL:        mustEnv("DATABASE_URL"),
		Port:               port,
		DevMode:            os.Getenv("DEV_MODE") == "1",
		BlobStoragePath:    blobPath,
		SMTPHost:           os.Getenv("SMTP_HOST"),
		SMTPPort:           os.Getenv("SMTP_PORT"),
		SMTPUser:           os.Getenv("SMTP_USER"),
		SMTPPassword:       os.Getenv("SMTP_PASSWORD"),
		SMTPFrom:           os.Getenv("SMTP_FROM"),
		GoogleClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		GoogleClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		BaseURL:            baseURL,
		SessionSecret:      sessionSecret,
	}
}

func mustEnv(key string) string {
	v := os.Getenv(key)
	if v == "" {
		slog.Error("required environment variable not set", "key", key)
		os.Exit(1)
	}
	return v
}
