import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import interviewReducer from './slices/interviewSlice';
import analyticsReducer from './slices/analyticsSlice';
import atsReducer from './slices/atsSlice';
import dsaReducer from './slices/dsaSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    interview: interviewReducer,
    analytics: analyticsReducer,
    ats: atsReducer,
    dsa: dsaReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});
