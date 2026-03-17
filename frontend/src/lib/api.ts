import axios from 'axios';

const api = axios.create({
  baseURL: '/',
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Will be handled by AuthContext
    }
    return Promise.reject(error);
  }
);

// --- Types ---

export interface User {
  id: string;
  email: string;
  display_name: string;
  photo_path: string;
  is_superadmin: boolean;
}

export interface AuthMeResponse {
  authenticated: boolean;
  user: User | null;
}

export interface Group {
  id: string;
  name: string;
  member_count?: number;
}

export interface GroupMember {
  id: string;
  email: string;
  display_name: string;
  photo_path: string;
  is_admin: boolean;
}

export interface GroupDetail {
  group: Group;
  members: GroupMember[];
}

export interface InviteInfo {
  token: string;
  invite_url: string;
  expires_at: string;
}

export interface InviteLookup {
  group_id: string;
  group_name: string;
  expires_at: string;
}

export interface Match {
  id: string;
  phase: string;
  match_number: number;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  has_extra_time: boolean;
  kickoff_time: string;
  stadium: string;
  city: string;
  status: 'scheduled' | 'open' | 'finished';
}

export interface Prediction {
  id: string;
  match_id: string;
  home_score: number;
  away_score: number;
  points: number | null;
}

export interface MatchWithPrediction {
  match: Match;
  prediction: Prediction | null;
}

export interface RankingEntry {
  rank: number;
  user_id: string;
  display_name: string;
  photo_path: string;
  total_points: number;
  exact_scores: number;
  correct_results: number;
}

// --- Auth ---

export const authMe = () =>
  api.get<AuthMeResponse>('/api/auth/me').then((r) => r.data);

export const authMagicLink = (email: string, redirect_path?: string) =>
  api.post('/api/auth/magic-link', { email, redirect_path }).then((r) => r.data);

export const authLogout = () =>
  api.post('/api/auth/logout').then((r) => r.data);

export const devLogin = (email: string) =>
  api.post('/api/dev/login', { email }).then((r) => r.data);

// --- User ---

export const updateProfile = (display_name: string, photo?: File) => {
  const form = new FormData();
  form.append('display_name', display_name);
  if (photo) form.append('photo', photo);
  return api.patch('/api/user/profile', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);
};

// --- Groups ---

export const createGroup = (name: string) =>
  api.post<Group>('/api/groups', { name }).then((r) => r.data);

export const getGroups = () =>
  api.get<Group[]>('/api/groups').then((r) => r.data);

export const getGroup = (id: string) =>
  api.get<GroupDetail>(`/api/groups/${id}`).then((r) => r.data);

export const generateInvite = (id: string) =>
  api.post<InviteInfo>(`/api/groups/${id}/invite`).then((r) => r.data);

export const getInvite = (id: string) =>
  api.get<InviteInfo>(`/api/groups/${id}/invite`).then((r) => r.data);

export const promoteMember = (groupId: string, userId: string) =>
  api.post(`/api/groups/${groupId}/promote`, { user_id: userId }).then((r) => r.data);

// --- Invites ---

export const lookupInvite = (token: string) =>
  api.get<InviteLookup>(`/api/invite/${token}`).then((r) => r.data);

export const joinGroup = (token: string) =>
  api.post(`/api/invite/${token}/join`).then((r) => r.data);

// --- Matches ---

export const getMatches = (phase?: string) =>
  api.get<Match[]>('/api/matches', { params: phase ? { phase } : {} }).then((r) => r.data);

export const getOpenMatches = () =>
  api.get<Match[]>('/api/matches/open').then((r) => r.data);

export const getMatch = (id: string) =>
  api.get<MatchWithPrediction>(`/api/matches/${id}`).then((r) => r.data);

// --- Predictions ---

export const submitPrediction = (match_id: string, home_score: number, away_score: number) =>
  api.post('/api/predictions', { match_id, home_score, away_score }).then((r) => r.data);

export const getMyPredictions = () =>
  api.get<Prediction[]>('/api/predictions').then((r) => r.data);

// --- Rankings ---

export const getGlobalRanking = () =>
  api.get<RankingEntry[]>('/api/rankings/global').then((r) => r.data);

export const getGroupRanking = (id: string) =>
  api.get<RankingEntry[]>(`/api/rankings/group/${id}`).then((r) => r.data);

// --- Admin ---

export const adminSetResult = (matchId: string, home_score: number, away_score: number, has_extra_time: boolean) =>
  api.post(`/api/admin/matches/${matchId}/result`, { home_score, away_score, has_extra_time }).then((r) => r.data);

export const adminSetTeams = (matchId: string, home_team: string, away_team: string) =>
  api.patch(`/api/admin/matches/${matchId}/teams`, { home_team, away_team }).then((r) => r.data);

export default api;
