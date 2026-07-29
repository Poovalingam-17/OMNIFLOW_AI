import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch, login, register, logout, clearError } from '../store';
import { LoginCredentials, RegisterData } from '../types/auth';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const authState = useSelector((state: RootState) => state.auth);

  const handleLogin = (credentials: LoginCredentials) => dispatch(login(credentials));
  const handleRegister = (data: RegisterData) => dispatch(register(data));
  const handleLogout = () => dispatch(logout());
  const handleClearError = () => dispatch(clearError());

  return {
    ...authState,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    clearError: handleClearError,
  };
};
