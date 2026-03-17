package auth

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/smtp"
	"net/url"
	"strings"
	"time"

	"database/sql"

	"github.com/google/uuid"

	"bolao/internal/config"
	db "bolao/internal/database/sqlc"
)

const sessionCookieName = "bolao_session"

type Auth struct {
	cfg     config.Config
	queries *db.Queries
}

func New(cfg config.Config, sqlDB *sql.DB) *Auth {
	return &Auth{
		cfg:     cfg,
		queries: db.New(sqlDB),
	}
}

// GenerateToken creates a cryptographically secure random token.
func GenerateToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(b), nil
}

// --- Session management ---

func (a *Auth) CreateSession(ctx context.Context, userID uuid.UUID) (string, error) {
	token, err := GenerateToken()
	if err != nil {
		return "", err
	}
	_, err = a.queries.CreateSession(ctx, db.CreateSessionParams{
		UserID: userID,
		Token:  token,
	})
	return token, err
}

func (a *Auth) SetSessionCookie(w http.ResponseWriter, token string) {
	http.SetCookie(w, &http.Cookie{
		Name:     sessionCookieName,
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		Secure:   !a.cfg.DevMode,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   int((30 * 24 * time.Hour).Seconds()),
	})
}

func (a *Auth) ClearSessionCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     sessionCookieName,
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   !a.cfg.DevMode,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   -1,
	})
}

type SessionUser struct {
	ID           uuid.UUID `json:"id"`
	Email        string    `json:"email"`
	DisplayName  string    `json:"display_name"`
	PhotoPath    string    `json:"photo_path"`
	IsSuperadmin bool      `json:"is_superadmin"`
}

func (a *Auth) GetSessionUser(r *http.Request) (*SessionUser, error) {
	cookie, err := r.Cookie(sessionCookieName)
	if err != nil {
		return nil, nil // no session
	}

	ctx := r.Context()
	row, err := a.queries.GetSessionByToken(ctx, cookie.Value)
	if err != nil {
		return nil, nil // invalid or expired
	}

	return &SessionUser{
		ID:           row.UserID,
		Email:        row.Email,
		DisplayName:  row.DisplayName,
		PhotoPath:    row.PhotoPath,
		IsSuperadmin: row.IsSuperadmin,
	}, nil
}

func (a *Auth) DeleteSession(ctx context.Context, r *http.Request) {
	cookie, err := r.Cookie(sessionCookieName)
	if err != nil {
		return
	}
	if err := a.queries.DeleteSession(ctx, cookie.Value); err != nil {
		slog.Error("deleting session", "err", err)
	}
}

// --- Magic link ---

func (a *Auth) SendMagicLink(ctx context.Context, email, redirectPath string) error {
	token, err := GenerateToken()
	if err != nil {
		return err
	}

	_, err = a.queries.CreateMagicLink(ctx, db.CreateMagicLinkParams{
		Email:        email,
		Token:        token,
		RedirectPath: redirectPath,
	})
	if err != nil {
		return err
	}

	link := fmt.Sprintf("%s/auth/magic?token=%s", a.cfg.BaseURL, url.QueryEscape(token))
	return a.sendEmail(email, "Seu link de acesso ao Bolão 2026", fmt.Sprintf(`
Olá!

Clique no link abaixo para acessar o Bolão Copa 2026:

%s

O link expira em 15 minutos e pode ser usado apenas uma vez.

Se você não solicitou este link, ignore este e-mail.
`, link))
}

func (a *Auth) VerifyMagicLink(ctx context.Context, token string) (*db.MagicLink, error) {
	ml, err := a.queries.GetMagicLinkByToken(ctx, token)
	if err != nil {
		return nil, fmt.Errorf("link inválido ou expirado")
	}
	if err := a.queries.MarkMagicLinkUsed(ctx, token); err != nil {
		return nil, err
	}
	return &ml, nil
}

// --- Email sending ---

func (a *Auth) sendEmail(to, subject, body string) error {
	if a.cfg.SMTPHost == "" {
		slog.Warn("SMTP not configured, magic link not sent", "to", to, "subject", subject)
		slog.Info("MAGIC LINK BODY", "body", body)
		return nil
	}

	auth := smtp.PlainAuth("", a.cfg.SMTPUser, a.cfg.SMTPPassword, a.cfg.SMTPHost)
	addr := a.cfg.SMTPHost + ":" + a.cfg.SMTPPort

	msg := fmt.Sprintf("From: %s\r\nTo: %s\r\nSubject: %s\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n%s",
		a.cfg.SMTPFrom, to, subject, body)

	return smtp.SendMail(addr, auth, a.cfg.SMTPFrom, []string{to}, []byte(msg))
}

// --- Google OAuth ---

const (
	googleAuthURL  = "https://accounts.google.com/o/oauth2/v2/auth"
	googleTokenURL = "https://oauth2.googleapis.com/token"
	googleUserURL  = "https://www.googleapis.com/oauth2/v2/userinfo"
)

func (a *Auth) GoogleAuthURL(state string) string {
	params := url.Values{
		"client_id":     {a.cfg.GoogleClientID},
		"redirect_uri":  {a.cfg.BaseURL + "/auth/google/callback"},
		"response_type": {"code"},
		"scope":         {"openid email profile"},
		"state":         {state},
		"access_type":   {"online"},
	}
	return googleAuthURL + "?" + params.Encode()
}

type googleUser struct {
	Email string `json:"email"`
	Name  string `json:"name"`
}

func (a *Auth) GoogleCallback(ctx context.Context, code string) (*googleUser, error) {
	// Exchange code for token
	resp, err := http.PostForm(googleTokenURL, url.Values{
		"code":          {code},
		"client_id":     {a.cfg.GoogleClientID},
		"client_secret": {a.cfg.GoogleClientSecret},
		"redirect_uri":  {a.cfg.BaseURL + "/auth/google/callback"},
		"grant_type":    {"authorization_code"},
	})
	if err != nil {
		return nil, fmt.Errorf("exchanging code: %w", err)
	}
	defer resp.Body.Close()

	var tokenResp struct {
		AccessToken string `json:"access_token"`
		Error       string `json:"error"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
		return nil, err
	}
	if tokenResp.Error != "" {
		return nil, fmt.Errorf("google token error: %s", tokenResp.Error)
	}

	// Get user info
	req, _ := http.NewRequestWithContext(ctx, "GET", googleUserURL, nil)
	req.Header.Set("Authorization", "Bearer "+tokenResp.AccessToken)
	userResp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer userResp.Body.Close()

	body, _ := io.ReadAll(userResp.Body)
	var gu googleUser
	if err := json.Unmarshal(body, &gu); err != nil {
		return nil, err
	}
	return &gu, nil
}

// --- User creation / retrieval ---

func (a *Auth) GetOrCreateUser(ctx context.Context, email string) (*db.User, error) {
	email = strings.ToLower(strings.TrimSpace(email))

	user, err := a.queries.GetUserByEmail(ctx, email)
	if err == nil {
		return &user, nil
	}

	// Check if this is the first user ever (will be superadmin)
	count, err := a.queries.CountUsers(ctx)
	if err != nil {
		return nil, err
	}
	isSuperadmin := count == 0

	created, err := a.queries.CreateUser(ctx, db.CreateUserParams{
		Email:        email,
		DisplayName:  "",
		PhotoPath:    "",
		IsSuperadmin: isSuperadmin,
	})
	if err != nil {
		return nil, err
	}

	if isSuperadmin {
		slog.Info("first user registered, promoted to superadmin", "email", email)
	}

	return &created, nil
}
