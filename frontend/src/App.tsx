import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider, useDispatch } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { store } from './store';
import AppRoutes from './AppRoutes';
import { getCurrentUser } from './store/authSlice';
import { AppDispatch } from './store';

const AppContent: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      dispatch(getCurrentUser());
    }
  }, [dispatch]);

  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#0f172a',
            color: '#cbd5e1',
            border: '1px solid #334155',
            borderRadius: '12px'
          }
        }}
      />
      <AppRoutes />
    </>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </Provider>
  );
};

export default App;
