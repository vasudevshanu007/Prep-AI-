import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { interviewAPI } from '../../services/api';
import toast from 'react-hot-toast';

export const generateQuestions = createAsyncThunk('interview/generate', async (data, { rejectWithValue }) => {
  try {
    const res = await interviewAPI.generateQuestions(data);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to generate questions');
  }
});

export const submitAnswer = createAsyncThunk('interview/submitAnswer', async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await interviewAPI.submitAnswer(id, data);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to submit answer');
  }
});

export const completeInterview = createAsyncThunk('interview/complete', async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await interviewAPI.completeInterview(id, data);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to complete interview');
  }
});

export const fetchInterviewHistory = createAsyncThunk('interview/history', async (params, { rejectWithValue }) => {
  try {
    const res = await interviewAPI.getHistory(params);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch history');
  }
});

export const sendChatMessage = createAsyncThunk('interview/chat', async (data, { rejectWithValue }) => {
  try {
    const res = await interviewAPI.chat(data);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Chat failed');
  }
});

const interviewSlice = createSlice({
  name: 'interview',
  initialState: {
    currentInterview: null,
    currentQuestionIndex: 0,
    history: [],
    pagination: null,
    loading: false,
    generatingQuestions: false,
    submittingAnswer: false,
    chatLoading: false,
    error: null,
  },
  reducers: {
    setCurrentQuestion: (state, action) => { state.currentQuestionIndex = action.payload; },
    clearCurrentInterview: (state) => {
      state.currentInterview = null;
      state.currentQuestionIndex = 0;
    },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(generateQuestions.pending, (state) => { state.generatingQuestions = true; state.error = null; })
      .addCase(generateQuestions.fulfilled, (state, action) => {
        state.generatingQuestions = false;
        state.currentInterview = action.payload.interview;
        state.currentQuestionIndex = 0;
      })
      .addCase(generateQuestions.rejected, (state, action) => {
        state.generatingQuestions = false;
        state.error = action.payload;
        toast.error(action.payload);
      })
      .addCase(submitAnswer.pending, (state) => { state.submittingAnswer = true; })
      .addCase(submitAnswer.fulfilled, (state, action) => {
        state.submittingAnswer = false;
        if (state.currentInterview) {
          const idx = state.currentInterview.questions.findIndex(
            (_, i) => i === state.currentQuestionIndex
          );
          if (idx !== -1) {
            state.currentInterview.questions[idx] = action.payload.question;
          }
        }
      })
      .addCase(submitAnswer.rejected, (state, action) => {
        state.submittingAnswer = false;
        toast.error(action.payload);
      })
      .addCase(completeInterview.pending, (state) => { state.loading = true; })
      .addCase(completeInterview.fulfilled, (state, action) => {
        state.loading = false;
        state.currentInterview = action.payload.interview;
      })
      .addCase(completeInterview.rejected, (state, action) => {
        state.loading = false;
        toast.error(action.payload);
      })
      .addCase(fetchInterviewHistory.pending, (state) => { state.loading = true; })
      .addCase(fetchInterviewHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.history = action.payload.interviews;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchInterviewHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(sendChatMessage.pending, (state) => { state.chatLoading = true; })
      .addCase(sendChatMessage.fulfilled, (state) => { state.chatLoading = false; })
      .addCase(sendChatMessage.rejected, (state, action) => {
        state.chatLoading = false;
        toast.error(action.payload);
      });
  },
});

export const { setCurrentQuestion, clearCurrentInterview, clearError } = interviewSlice.actions;
export default interviewSlice.reducer;
