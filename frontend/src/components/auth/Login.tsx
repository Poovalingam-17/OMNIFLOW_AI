import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { login, googleLogin, clearError } from '../../store';
import { AppDispatch, RootState } from '../../store';
import { AuthApi } from '../../api/authApi';
import { Mail, Lock, ShieldCheck, ArrowRight } from 'lucide-react';

const loginSchema = yup.object().shape({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required')
});

interface LoginFormData {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema)
  });

  const onSubmit = async (data: LoginFormData) => {
    dispatch(clearError());
    const result = await dispatch(login({ email: data.email, password: data.password }));
    if (login.fulfilled.match(result)) {
      toast.success('Welcome back to OmniFlow AI!');
      navigate('/dashboard');
    } else {
      toast.error(result.payload as string || 'Login failed');
    }
  };

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'GOOGLE_OAUTH_SUCCESS') {
        const { email, name } = event.data;
        const toastId = toast.loading(`Verifying account ${email}...`);
        
        try {
          const checkRes = await AuthApi.checkEmail(email);
          if (!checkRes.exists) {
            toast.dismiss(toastId);
            toast.error('Account not registered. Redirecting to registration...', { duration: 4000 });
            setTimeout(() => {
              navigate(`/register?email=${encodeURIComponent(email)}&fullName=${encodeURIComponent(name)}`);
            }, 1500);
            return;
          }

          // Account exists, log them in!
          toast.loading(`Signing in as ${name}...`, { id: toastId });
          const result = await dispatch(googleLogin(email));
          toast.dismiss(toastId);
          if (googleLogin.fulfilled.match(result)) {
            toast.success(`Welcome back, ${name}!`);
            navigate('/dashboard');
          } else {
            toast.error(result.payload as string || 'Google sign in failed');
          }
        } catch (error) {
          toast.dismiss(toastId);
          toast.error('Google verification failed');
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [dispatch, navigate]);

  const openGooglePopup = () => {
    const width = 450;
    const height = 550;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    window.open(
      '/google-oauth-select',
      'Google Sign In',
      `width=${width},height=${height},left=${left},top=${top},status=no,resizable=no`
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12 relative overflow-hidden font-sans">
      {/* Premium accent glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-400/25 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/25 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full space-y-8 p-10 bg-white border border-slate-200/80 rounded-3xl shadow-xl relative z-10 animate-fade-in">
        <div className="text-center">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-accent items-center justify-center shadow-lg shadow-primary/20 mb-4">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            OmniFlow AI
          </h2>
          <p className="mt-2 text-sm text-slate-500 font-medium">
            Sign in to access your AI workflow orchestrator
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Mail className="w-5 h-5" />
                </span>
                <input
                  {...register('email')}
                  type="email"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-slate-900 placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                  placeholder="admin@omniflow.com"
                />
              </div>
              {errors.email && <p className="text-error text-xs mt-1 font-medium">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  {...register('password')}
                  type="password"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-slate-900 placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                  placeholder="••••••••"
                />
              </div>
              {errors.password && <p className="text-error text-xs mt-1 font-medium">{errors.password.message}</p>}
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-error text-sm text-center font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-btn-gradient hover:opacity-90 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-primary/20 cursor-pointer"
          >
            {isLoading ? (
              <span>Signing in...</span>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-slate-400 text-xs font-bold uppercase tracking-wider">Or</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <button
            type="button"
            onClick={openGooglePopup}
            className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 active:scale-[0.98] transition-all duration-200 cursor-pointer shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="text-center">
            <span className="text-sm text-slate-500">
              Don't have an account?{' '}
              <button 
                type="button" 
                onClick={() => navigate('/register')} 
                className="text-primary hover:text-primary-dark font-semibold transition-colors duration-150 cursor-pointer"
              >
                Sign up
              </button>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
