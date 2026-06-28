import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { authAPI } from '../../services/api';
import { setAccessToken, clearAccessToken } from '../../utils/tokenManager';
import toast from 'react-hot-toast';

// User profile cached in localStorage for faster UI rendering only.
// NOT used to determine isAuthenticated — that always requires a valid access token.
const storedUser = (() => {
  try { return JSON.parse(localStorage.getItem('prepai_user')); } catch { return null; }
})();

export const registerUser = createAsyncThunk('auth/register', async (data, { rejectWithValue }) => {
  try {
    const res = await authAPI.register(data);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Registration failed');
  }
});

export const loginUser = createAsyncThunk('auth/login', async (data, { rejectWithValue }) => {
  try {
    const res = await authAPI.login(data);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed');
  }
});

export const googleLogin = createAsyncThunk('auth/google', async (credential, { rejectWithValue }) => {
  try {
    const res = await authAPI.googleAuth(credential);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Google login failed');
  }
});

export const fetchMe = createAsyncThunk('auth/me', async (_, { rejectWithValue }) => {
  try {
    const res = await authAPI.getMe();
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch user');
  }
});

export const updateProfile = createAsyncThunk('auth/updateProfile', async (data, { rejectWithValue }) => {
  try {
    const res = await authAPI.updateProfile(data);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Update failed');
  }
});

// Restores session on page load by exchanging the httpOnly refresh cookie for
// a new access token. Dispatched once from App on mount — ProtectedRoute waits
// for this to resolve before deciding to render or redirect.
export const refreshSession = createAsyncThunk('auth/refreshSession', async (_, { rejectWithValue }) => {
  try {
    // Plain axios — must not go through API interceptor (which needs a token we don't have yet)
    const res = await axios.post('/api/auth/refresh', {}, { withCredentials: true });
    return res.data; // { accessToken, user }
  } catch {
    return rejectWithValue(null); // no active session — normal for first visit
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: storedUser,
    isAuthenticated: false,  // always false until refresh resolves — never trust localStorage
    isInitializing: true,    // true until the first refresh attempt completes on page load
    loading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isInitializing = false;
      clearAccessToken();
      localStorage.removeItem('prepai_user');
      toast.success('Logged out successfully');
    },
    clearError: (state) => { state.error = null; },
    updateUserStats: (state, action) => {
      if (state.user) {
        state.user.stats = { ...state.user.stats, ...action.payload };
        localStorage.setItem('prepai_user', JSON.stringify(state.user));
      }
    },
  },
  extraReducers: (builder) => {
    const handlePending = (state) => { state.loading = true; state.error = null; };

    // Shared success handler for login, register, googleLogin, and refresh
    const handleAuthSuccess = (state, action) => {
      state.loading = false;
      if (action.payload?.accessToken) {
        setAccessToken(action.payload.accessToken); // store in memory, never localStorage
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.isInitializing = false;
        localStorage.setItem('prepai_user', JSON.stringify(action.payload.user));
      }
    };

    const handleRejected = (state, action) => {
      state.loading = false;
      state.error = action.payload;
      if (action.payload) toast.error(action.payload);
    };

    builder
      .addCase(registerUser.pending, handlePending)
      .addCase(registerUser.fulfilled, handleAuthSuccess)
      .addCase(registerUser.rejected, handleRejected)
      .addCase(loginUser.pending, handlePending)
      .addCase(loginUser.fulfilled, handleAuthSuccess)
      .addCase(loginUser.rejected, handleRejected)
      .addCase(googleLogin.pending, handlePending)
      .addCase(googleLogin.fulfilled, handleAuthSuccess)
      .addCase(googleLogin.rejected, handleRejected)
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.user = action.payload.user;
        localStorage.setItem('prepai_user', JSON.stringify(action.payload.user));
      })
      .addCase(updateProfile.pending, handlePending)
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        localStorage.setItem('prepai_user', JSON.stringify(action.payload.user));
        toast.success('Profile updated!');
      })
      .addCase(updateProfile.rejected, handleRejected)
      // Page-load session restore
      .addCase(refreshSession.fulfilled, handleAuthSuccess)
      .addCase(refreshSession.rejected, (state) => {
        // Refresh failed = no active session. Silently mark initialization done.
        state.isInitializing = false;
        state.isAuthenticated = false;
      });
  },
});

export const { logout, clearError, updateUserStats } = authSlice.actions;
export default authSlice.reducer;
