import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { dsaAPI } from '../../services/api';

export const fetchSheets       = createAsyncThunk('dsa/fetchSheets',       (_, { rejectWithValue }) => dsaAPI.getSheets().then(r => r.data).catch(e => rejectWithValue(e.response?.data?.message || 'Failed')));
export const fetchSheetBySlug  = createAsyncThunk('dsa/fetchSheetBySlug',  (slug, { rejectWithValue }) => dsaAPI.getSheetBySlug(slug).then(r => r.data).catch(e => rejectWithValue(e.response?.data?.message || 'Failed')));
export const fetchProgress     = createAsyncThunk('dsa/fetchProgress',     (_, { rejectWithValue }) => dsaAPI.getProgress().then(r => r.data).catch(e => rejectWithValue(e.response?.data?.message || 'Failed')));
export const fetchProblems     = createAsyncThunk('dsa/fetchProblems',     (params, { rejectWithValue }) => dsaAPI.searchProblems(params).then(r => r.data).catch(e => rejectWithValue(e.response?.data?.message || 'Failed')));
export const fetchRoadmaps     = createAsyncThunk('dsa/fetchRoadmaps',     (_, { rejectWithValue }) => dsaAPI.getRoadmaps().then(r => r.data).catch(e => rejectWithValue(e.response?.data?.message || 'Failed')));
export const fetchRecommendations = createAsyncThunk('dsa/fetchRecommendations', (params, { rejectWithValue }) => dsaAPI.getRecommendations(params).then(r => r.data).catch(e => rejectWithValue(e.response?.data?.message || 'Failed')));
export const toggleBookmark    = createAsyncThunk('dsa/toggleBookmark',    (problemId, { rejectWithValue }) => dsaAPI.toggleBookmark(problemId).then(r => r.data).catch(e => rejectWithValue(e.response?.data?.message || 'Failed')));

const dsaSlice = createSlice({
  name: 'dsa',
  initialState: {
    sheets:          [],
    currentSheet:    null,
    problems:        [],
    problemsTotal:   0,
    progress:        null,
    roadmaps:        [],
    recommendations: null,
    loading:         false,
    sheetLoading:    false,
    progressLoading: false,
    error:           null,
  },
  reducers: {
    clearCurrentSheet: (state) => { state.currentSheet = null; },
    clearError:        (state) => { state.error = null; },
    updateProblemStatus: (state, action) => {
      const { problemId, status } = action.payload;
      state.problems = state.problems.map(p =>
        p._id === problemId ? { ...p, status } : p
      );
      if (state.currentSheet) {
        state.currentSheet.categories = state.currentSheet.categories.map(cat => ({
          ...cat,
          problems: cat.problems.map(p => p._id === problemId ? { ...p, status } : p),
        }));
      }
    },
    updateBookmark: (state, action) => {
      const { problemId, bookmarked } = action.payload;
      state.problems = state.problems.map(p =>
        p._id === problemId ? { ...p, bookmarked } : p
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSheets.pending,  (s) => { s.loading = true; s.error = null; })
      .addCase(fetchSheets.fulfilled,(s, a) => { s.loading = false; s.sheets = a.payload.sheets; })
      .addCase(fetchSheets.rejected, (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(fetchSheetBySlug.pending,  (s) => { s.sheetLoading = true; s.error = null; })
      .addCase(fetchSheetBySlug.fulfilled,(s, a) => { s.sheetLoading = false; s.currentSheet = a.payload.sheet; })
      .addCase(fetchSheetBySlug.rejected, (s, a) => { s.sheetLoading = false; s.error = a.payload; })

      .addCase(fetchProgress.pending,  (s) => { s.progressLoading = true; })
      .addCase(fetchProgress.fulfilled,(s, a) => { s.progressLoading = false; s.progress = a.payload.progress; })
      .addCase(fetchProgress.rejected, (s, a) => { s.progressLoading = false; s.error = a.payload; })

      .addCase(fetchProblems.pending,  (s) => { s.loading = true; })
      .addCase(fetchProblems.fulfilled,(s, a) => { s.loading = false; s.problems = a.payload.problems; s.problemsTotal = a.payload.pagination?.total || a.payload.problems.length; })
      .addCase(fetchProblems.rejected, (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(fetchRoadmaps.fulfilled,(s, a) => { s.roadmaps = a.payload.roadmaps; })
      .addCase(fetchRecommendations.fulfilled,(s, a) => { s.recommendations = a.payload.recommendations; })

      .addCase(toggleBookmark.fulfilled, (s, a) => {
        const { bookmarked } = a.payload;
        const problemId = a.meta.arg;
        s.problems = s.problems.map(p => p._id === problemId ? { ...p, bookmarked } : p);
      });
  },
});

export const { clearCurrentSheet, clearError, updateProblemStatus, updateBookmark } = dsaSlice.actions;
export default dsaSlice.reducer;
