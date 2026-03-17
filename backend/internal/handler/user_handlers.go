package handler

import (
	"fmt"
	"image"
	_ "image/jpeg"
	_ "image/png"
	"io"
	"log/slog"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/google/uuid"

	db "bolao/internal/database/sqlc"
)

const maxUploadSize = 5 << 20 // 5 MB

// PATCH /api/user/profile
func (h *Handler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	user := h.requireAuth(w, r)
	if user == nil {
		return
	}

	if err := r.ParseMultipartForm(maxUploadSize); err != nil {
		respondError(w, http.StatusBadRequest, "formulário inválido")
		return
	}

	displayName := strings.TrimSpace(r.FormValue("display_name"))
	if displayName == "" {
		respondError(w, http.StatusBadRequest, "nome é obrigatório")
		return
	}

	photoPath := user.PhotoPath

	// Handle photo upload
	file, header, err := r.FormFile("photo")
	if err == nil && file != nil {
		defer file.Close()

		if header.Size > maxUploadSize {
			respondError(w, http.StatusBadRequest, "foto muito grande (máx 5MB)")
			return
		}

		// Validate image type
		buf := make([]byte, 512)
		n, _ := file.Read(buf)
		contentType := http.DetectContentType(buf[:n])
		if !strings.HasPrefix(contentType, "image/") {
			respondError(w, http.StatusBadRequest, "arquivo deve ser uma imagem")
			return
		}
		file.Seek(0, io.SeekStart)

		// Validate it's a real image
		_, _, err = image.Decode(file)
		if err != nil {
			respondError(w, http.StatusBadRequest, "imagem inválida")
			return
		}
		file.Seek(0, io.SeekStart)

		// Save to blob storage
		ext := ".jpg"
		if strings.Contains(contentType, "png") {
			ext = ".png"
		} else if strings.Contains(contentType, "webp") {
			ext = ".webp"
		}

		filename := fmt.Sprintf("photos/%s%s", user.ID.String(), ext)
		fullPath := filepath.Join(h.cfg.BlobStoragePath, filename)

		if err := os.MkdirAll(filepath.Dir(fullPath), 0755); err != nil {
			slog.Error("creating blob dir", "err", err)
			respondError(w, http.StatusInternalServerError, "erro ao salvar foto")
			return
		}

		dst, err := os.Create(fullPath)
		if err != nil {
			respondError(w, http.StatusInternalServerError, "erro ao salvar foto")
			return
		}
		defer dst.Close()

		if _, err := io.Copy(dst, file); err != nil {
			respondError(w, http.StatusInternalServerError, "erro ao salvar foto")
			return
		}

		photoPath = "/api/blobs/" + filename
	}

	updated, err := h.queries.UpdateUser(r.Context(), db.UpdateUserParams{
		ID:          user.ID,
		DisplayName: displayName,
		PhotoPath:   photoPath,
	})
	if err != nil {
		slog.Error("updating user", "err", err)
		respondError(w, http.StatusInternalServerError, "erro ao salvar perfil")
		return
	}

	respond(w, http.StatusOK, map[string]any{
		"id":           updated.ID,
		"email":        updated.Email,
		"display_name": updated.DisplayName,
		"photo_path":   updated.PhotoPath,
		"is_superadmin": updated.IsSuperadmin,
	})
}

// GET /api/blobs/{path...}
func (h *Handler) ServeBlob(w http.ResponseWriter, r *http.Request) {
	// Strip /api/blobs/ prefix
	path := strings.TrimPrefix(r.URL.Path, "/api/blobs/")
	if path == "" || strings.Contains(path, "..") {
		http.NotFound(w, r)
		return
	}

	fullPath := filepath.Join(h.cfg.BlobStoragePath, path)
	http.ServeFile(w, r, fullPath)
}

// GET /api/users/{id}
func (h *Handler) GetUser(w http.ResponseWriter, r *http.Request) {
	_ = h.requireAuth(w, r)
	if _, err := h.auth.GetSessionUser(r); err != nil {
		return
	}

	idStr := r.PathValue("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "ID inválido")
		return
	}

	u, err := h.queries.GetUserByID(r.Context(), id)
	if err != nil {
		respondError(w, http.StatusNotFound, "usuário não encontrado")
		return
	}

	respond(w, http.StatusOK, map[string]any{
		"id":           u.ID,
		"display_name": u.DisplayName,
		"photo_path":   u.PhotoPath,
	})
}
