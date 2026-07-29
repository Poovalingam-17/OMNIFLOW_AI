import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import agentReducer from './agentSlice';
import chatReducer from './chatSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    agents: agentReducer,
    chat: chatReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
