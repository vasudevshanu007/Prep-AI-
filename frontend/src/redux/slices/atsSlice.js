import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { atsAPI } from '../../services/api';

export const analyzeATS = createAsyncThunk('ats/analyze', async (formData, { rejectWithValue }) => {
  try {
    const { data } = await atsAPI.analyze(formData);
    return data.analysis;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'ATS analysis failed.');
  }
});

export const fetchATSHistory = createAsyncThunk('ats/fetchHistory', async (_, { rejectWithValue }) => {
  try {
    const { data } = await atsAPI.getHistory();
    return data.analyses;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load history.');
  }
});

const atsSlice = createSlice({
  name: 'ats',
  initialState: {
    currentAnalysis: null,
    history: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearATSAnalysis: (state) => { state.currentAnalysis = null; state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(analyzeATS.pending,   (state) => { state.loading = true; state.error = null; })
      .addCase(analyzeATS.fulfilled, (state, action) => { state.loading = false; state.currentAnalysis = action.payload; })
      .addCase(analyzeATS.rejected,  (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchATSHistory.fulfilled, (state, action) => { state.history = action.payload; });
  },
});

export const { clearATSAnalysis } = atsSlice.actions;
export default atsSlice.reducer;
