import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { analyticsAPI } from '../../services/api';

export const fetchDashboardStats = createAsyncThunk('analytics/dashboard', async (_, { rejectWithValue }) => {
  try {
    const res = await analyticsAPI.getDashboard();
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load stats');
  }
});

export const fetchInterviewAnalysis = createAsyncThunk('analytics/interviewAnalysis', async (_, { rejectWithValue }) => {
  try {
    const res = await analyticsAPI.getInterviewAnalysis();
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load analysis');
  }
});

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState: {
    stats: null,
    scoreTrend: [],
    skillData: [],
    languageData: [],
    difficultyDist: {},
    recentActivity: [],
    interviewAnalysis: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => { state.loading = true; })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload.stats;
        state.scoreTrend = action.payload.scoreTrend;
        state.skillData = action.payload.skillData;
        state.languageData = action.payload.languageData;
        state.difficultyDist = action.payload.difficultyDist;
        state.recentActivity = action.payload.recentActivity;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchInterviewAnalysis.fulfilled, (state, action) => {
        state.interviewAnalysis = action.payload;
      });
  },
});

export default analyticsSlice.reducer;
