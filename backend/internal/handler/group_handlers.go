package handler

import (
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/google/uuid"

	"bolao/internal/auth"
	db "bolao/internal/database/sqlc"
)

// POST /api/groups
func (h *Handler) CreateGroup(w http.ResponseWriter, r *http.Request) {
	user := h.requireAuth(w, r)
	if user == nil {
		return
	}

	var body struct {
		Name string `json:"name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.Name == "" {
		respondError(w, http.StatusBadRequest, "nome do grupo é obrigatório")
		return
	}

	ctx := r.Context()
	group, err := h.queries.CreateGroup(ctx, db.CreateGroupParams{
		Name:      body.Name,
		CreatedBy: user.ID,
	})
	if err != nil {
		slog.Error("creating group", "err", err)
		respondError(w, http.StatusInternalServerError, "erro ao criar grupo")
		return
	}

	// Add creator as admin member
	_, err = h.queries.AddGroupMember(ctx, db.AddGroupMemberParams{
		GroupID: group.ID,
		UserID:  user.ID,
		IsAdmin: true,
	})
	if err != nil {
		slog.Error("adding admin member", "err", err)
	}

	respond(w, http.StatusCreated, group)
}

// GET /api/groups
func (h *Handler) ListMyGroups(w http.ResponseWriter, r *http.Request) {
	user := h.requireAuth(w, r)
	if user == nil {
		return
	}

	groups, err := h.queries.ListUserGroups(r.Context(), user.ID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "erro ao listar grupos")
		return
	}
	if groups == nil {
		groups = []db.ListUserGroupsRow{}
	}
	respond(w, http.StatusOK, groups)
}

// GET /api/groups/{id}
func (h *Handler) GetGroup(w http.ResponseWriter, r *http.Request) {
	user := h.requireAuth(w, r)
	if user == nil {
		return
	}

	groupID, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "ID inválido")
		return
	}

	ctx := r.Context()

	// Must be a member
	_, err = h.queries.GetGroupMember(ctx, db.GetGroupMemberParams{
		GroupID: groupID,
		UserID:  user.ID,
	})
	if err != nil {
		respondError(w, http.StatusForbidden, "você não é membro deste grupo")
		return
	}

	group, err := h.queries.GetGroupByID(ctx, groupID)
	if err != nil {
		respondError(w, http.StatusNotFound, "grupo não encontrado")
		return
	}

	members, err := h.queries.ListGroupMembers(ctx, groupID)
	if err != nil {
		members = []db.ListGroupMembersRow{}
	}

	respond(w, http.StatusOK, map[string]any{
		"group":   group,
		"members": members,
	})
}

// POST /api/groups/{id}/invite
func (h *Handler) GenerateInvite(w http.ResponseWriter, r *http.Request) {
	user := h.requireAuth(w, r)
	if user == nil {
		return
	}

	groupID, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "ID inválido")
		return
	}

	ctx := r.Context()

	// Must be admin
	isAdmin, err := h.queries.IsGroupAdmin(ctx, db.IsGroupAdminParams{
		GroupID: groupID,
		UserID:  user.ID,
	})
	if err != nil || !isAdmin {
		respondError(w, http.StatusForbidden, "apenas administradores podem gerar convites")
		return
	}

	token, err := generateToken()
	if err != nil {
		respondError(w, http.StatusInternalServerError, "erro ao gerar token")
		return
	}

	invite, err := h.queries.CreateGroupInvite(ctx, db.CreateGroupInviteParams{
		GroupID:   groupID,
		Token:     token,
		CreatedBy: user.ID,
	})
	if err != nil {
		slog.Error("creating invite", "err", err)
		respondError(w, http.StatusInternalServerError, "erro ao criar convite")
		return
	}

	inviteURL := h.cfg.BaseURL + "/join/" + invite.Token
	respond(w, http.StatusOK, map[string]any{
		"token":      invite.Token,
		"invite_url": inviteURL,
		"expires_at": invite.ExpiresAt,
	})
}

// GET /api/groups/{id}/invite
func (h *Handler) GetCurrentInvite(w http.ResponseWriter, r *http.Request) {
	user := h.requireAuth(w, r)
	if user == nil {
		return
	}

	groupID, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "ID inválido")
		return
	}

	ctx := r.Context()

	isAdmin, err := h.queries.IsGroupAdmin(ctx, db.IsGroupAdminParams{
		GroupID: groupID,
		UserID:  user.ID,
	})
	if err != nil || !isAdmin {
		respondError(w, http.StatusForbidden, "apenas administradores")
		return
	}

	invite, err := h.queries.GetGroupInvite(ctx, groupID)
	if err != nil {
		respond(w, http.StatusOK, map[string]any{"invite": nil})
		return
	}

	inviteURL := h.cfg.BaseURL + "/join/" + invite.Token
	respond(w, http.StatusOK, map[string]any{
		"token":      invite.Token,
		"invite_url": inviteURL,
		"expires_at": invite.ExpiresAt,
	})
}

// GET /api/invite/{token}  — validate invite and return group info
func (h *Handler) GetInviteInfo(w http.ResponseWriter, r *http.Request) {
	token := r.PathValue("token")
	invite, err := h.queries.GetGroupInviteByToken(r.Context(), token)
	if err != nil {
		respondError(w, http.StatusNotFound, "convite inválido ou expirado")
		return
	}
	respond(w, http.StatusOK, map[string]any{
		"group_id":   invite.GroupID,
		"group_name": invite.GroupName,
		"expires_at": invite.ExpiresAt,
	})
}

// POST /api/invite/{token}/join  — join group via invite token
func (h *Handler) JoinGroup(w http.ResponseWriter, r *http.Request) {
	user := h.requireAuth(w, r)
	if user == nil {
		return
	}

	token := r.PathValue("token")
	ctx := r.Context()

	invite, err := h.queries.GetGroupInviteByToken(ctx, token)
	if err != nil {
		respondError(w, http.StatusNotFound, "convite inválido ou expirado")
		return
	}

	_, err = h.queries.AddGroupMember(ctx, db.AddGroupMemberParams{
		GroupID: invite.GroupID,
		UserID:  user.ID,
		IsAdmin: false,
	})
	if err != nil {
		respondError(w, http.StatusInternalServerError, "erro ao entrar no grupo")
		return
	}

	respond(w, http.StatusOK, map[string]any{
		"group_id":   invite.GroupID,
		"group_name": invite.GroupName,
	})
}

// POST /api/groups/{id}/promote
func (h *Handler) PromoteMember(w http.ResponseWriter, r *http.Request) {
	user := h.requireAuth(w, r)
	if user == nil {
		return
	}

	groupID, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		respondError(w, http.StatusBadRequest, "ID inválido")
		return
	}

	var body struct {
		UserID string `json:"user_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		respondError(w, http.StatusBadRequest, "JSON inválido")
		return
	}
	targetID, err := uuid.Parse(body.UserID)
	if err != nil {
		respondError(w, http.StatusBadRequest, "user_id inválido")
		return
	}

	ctx := r.Context()
	isAdmin, err := h.queries.IsGroupAdmin(ctx, db.IsGroupAdminParams{
		GroupID: groupID,
		UserID:  user.ID,
	})
	if err != nil || !isAdmin {
		respondError(w, http.StatusForbidden, "apenas administradores")
		return
	}

	if err := h.queries.PromoteMemberToAdmin(ctx, db.PromoteMemberToAdminParams{
		GroupID: groupID,
		UserID:  targetID,
	}); err != nil {
		respondError(w, http.StatusInternalServerError, "erro ao promover membro")
		return
	}

	respond(w, http.StatusOK, map[string]string{"message": "membro promovido a administrador"})
}

func generateToken() (string, error) {
	return auth.GenerateToken()
}
