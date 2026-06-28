import axios from 'axios';
import { getAccessToken, setAccessToken, clearAccessToken } from '../utils/tokenManager';

const API = axios.create({
  baseURL: '/api',
  timeout: 30000,
  withCredentials: true, // sends httpOnly refresh cookie automatically
});

// ── Request: attach in-memory access token (never localStorage) ───────────────
API.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response: transparent token refresh on 401 ────────────────────────────────
let _isRefreshing = false;
let _refreshQueue = [];

const processQueue = (err, token = null) => {
  _refreshQueue.forEach(({ resolve, reject }) => (err ? reject(err) : resolve(token)));
  _refreshQueue = [];
};

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // Skip refresh for: non-401, already-retried, or the refresh/logout endpoints themselves
    if (
      error.response?.status !== 401 ||
      original._retried ||
      original.url === '/auth/refresh' ||
      original.url === '/auth/logout'
    ) {
      return Promise.reject(error);
    }

    // If a refresh is already in-flight, queue this request
    if (_isRefreshing) {
      return new Promise((resolve, reject) => {
        _refreshQueue.push({ resolve, reject });
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`;
        return API(original);
      });
    }

    original._retried = true;
    _isRefreshing = true;

    try {
      // Use plain axios (not API) so this call bypasses the interceptor above
      const { data } = await axios.post('/api/auth/refresh', {}, { withCredentials: true });
      setAccessToken(data.accessToken);
      processQueue(null, data.accessToken);
      original.headers.Authorization = `Bearer ${data.accessToken}`;
      return API(original);
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      clearAccessToken();
      window.location.href = '/login';
      return Promise.reject(refreshErr);
    } finally {
      _isRefreshing = false;
    }
  }
);

// Auth
export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  googleAuth: (credential) => API.post('/auth/google', { credential }),
  verifyEmail: (token) => API.get(`/auth/verify-email/${token}`),
  forgotPassword: (email) => API.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => API.post(`/auth/reset-password/${token}`, { password }),
  getMe: () => API.get('/auth/me'),
  updateProfile: (data) => API.put('/auth/update-profile', data),
  // Use plain axios — must not go through the interceptor that reads access token
  refresh: () => axios.post('/api/auth/refresh', {}, { withCredentials: true }),
  logout: () => API.post('/auth/logout'),
};

// Interview
export const interviewAPI = {
  generateQuestions: (data) => API.post('/interview/generate', data),
  submitAnswer: (id, data) => API.post(`/interview/${id}/submit-answer`, data),
  completeInterview: (id, data) => API.post(`/interview/${id}/complete`, data),
  getHistory: (params) => API.get('/interview/history', { params }),
  getById: (id) => API.get(`/interview/${id}`),
  chat: (data) => API.post('/interview/chat', data),
};

// Resume
export const resumeAPI = {
  upload: (formData) => API.post('/resume/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  analyze: (formData) => API.post('/resume/analyze', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: () => API.delete('/resume'),
};

// Coding
export const codingAPI = {
  getProblems: (params) => API.get('/coding/problems', { params }),
  getProblemById: (id) => API.get(`/coding/problems/${id}`),
  runCode: (data) => API.post('/coding/run', data),
  submitCode: (data) => API.post('/coding/submit', data),
  getHistory: (params) => API.get('/coding/history', { params }),
  getMentorFeedback: (testId) => API.post(`/coding/mentor/${testId}`),
};

// DSA Platform
export const dsaAPI = {
  getSheets:         ()       => API.get('/dsa/sheets'),
  getSheetBySlug:    (slug)   => API.get(`/dsa/sheets/${slug}`),
  searchProblems:    (params) => API.get('/dsa/search', { params }),
  getProgress:       ()       => API.get('/dsa/progress'),
  getTopics:         ()       => API.get('/dsa/topics'),
  getCompanies:      ()       => API.get('/dsa/companies'),
  getRoadmaps:       ()       => API.get('/dsa/roadmaps'),
  toggleBookmark:    (id)     => API.post(`/dsa/bookmark/${id}`),
  getBookmarks:      ()       => API.get('/dsa/bookmarks'),
  getRecommendations:(params) => API.get('/dsa/recommendations', { params }),
  getContests:       (params) => API.get('/dsa/contests', { params }),
  getContestDetail:  (slug)   => API.get(`/dsa/contests/${slug}`),
  getContestLeaderboard: (slug) => API.get(`/dsa/contests/${slug}/leaderboard`),
};

// ATS Resume Matcher
export const atsAPI = {
  analyze: (formData) => API.post('/ats/analyze', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getHistory: (params) => API.get('/ats/history', { params }),
  getById: (id) => API.get(`/ats/${id}`),
};

// Company Interviews
export const companyAPI = {
  getAll: () => API.get('/companies'),
  getById: (id) => API.get(`/companies/${id}`),
  generateInterview: (id, data) => API.post(`/companies/${id}/generate`, data),
  getReadiness: (id) => API.get(`/companies/${id}/readiness`),
};

// PDF Reports
export const reportAPI = {
  download: (interviewId) => API.get(`/reports/${interviewId}`, { responseType: 'blob' }),
};

// Analytics
export const analyticsAPI = {
  getDashboard: () => API.get('/analytics/dashboard'),
  getInterviewAnalysis: () => API.get('/analytics/interview-analysis'),
};

// Admin
export const adminAPI = {
  getStats:           ()         => API.get('/admin/stats'),
  getAnalytics:       (params)   => API.get('/admin/analytics', { params }),
  getUsers:           (params)   => API.get('/admin/users', { params }),
  toggleUserActive:   (id)       => API.patch(`/admin/users/${id}/toggle-active`),
  deleteUser:         (id)       => API.delete(`/admin/users/${id}`),
  changeUserRole:     (id, role) => API.patch(`/admin/users/${id}/role`, { role }),
  changeUserPlan:     (id, plan) => API.patch(`/admin/users/${id}/plan`, { plan }),
  getInterviews:      (params)   => API.get('/admin/interviews', { params }),
  deleteInterview:    (id)       => API.delete(`/admin/interviews/${id}`),
  getAuditLogs:       (params)   => API.get('/admin/audit-logs', { params }),
  getCodingProblems:  ()         => API.get('/admin/coding-problems'),
  createCodingProblem:(data)     => API.post('/admin/coding-problems', data),
  updateCodingProblem:(id, data) => API.put(`/admin/coding-problems/${id}`, data),
  deleteCodingProblem:(id)       => API.delete(`/admin/coding-problems/${id}`),
};

export default API;
