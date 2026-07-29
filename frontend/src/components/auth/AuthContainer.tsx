import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { login, googleLogin, register as registerAction, clearError } from '../../store';
import { AppDispatch, RootState } from '../../store';
import { AuthApi } from '../../api/authApi';
import { Mail, Lock, ShieldCheck, ArrowRight, User as UserIcon, UserPlus } from 'lucide-react';

const loginSchema = yup.object().shape({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required')
});

const registerSchema = yup.object().shape({
  fullName: yup.string().max(100, 'Name must be under 100 characters').required('Full Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Confirm Password is required')
});

interface LoginFormData {
  email: string;
  password: string;
}

interface RegisterFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const BubbleBackground: React.FC = () => {
  const bubbles = [
    { size: 'w-16 h-16', left: 'left-[5%]', duration: 12, delay: 0, bg: 'from-cyan-400/20 to-cyan-200/5 border-cyan-300/20' },
    { size: 'w-24 h-24', left: 'left-[15%]', duration: 18, delay: 2, bg: 'from-indigo-400/15 to-indigo-200/5 border-indigo-300/20' },
    { size: 'w-12 h-12', left: 'left-[28%]', duration: 14, delay: 5, bg: 'from-purple-400/20 to-purple-200/5 border-purple-300/20' },
    { size: 'w-32 h-32', left: 'left-[42%]', duration: 22, delay: 1, bg: 'from-pink-400/15 to-pink-200/5 border-pink-300/20' },
    { size: 'w-20 h-20', left: 'left-[58%]', duration: 16, delay: 8, bg: 'from-cyan-400/20 to-cyan-200/5 border-cyan-300/20' },
    { size: 'w-16 h-16', left: 'left-[72%]', duration: 13, delay: 3, bg: 'from-indigo-400/15 to-indigo-200/5 border-indigo-300/20' },
    { size: 'w-28 h-28', left: 'left-[86%]', duration: 20, delay: 6, bg: 'from-purple-400/15 to-purple-200/5 border-purple-300/20' },
    { size: 'w-14 h-14', left: 'left-[95%]', duration: 15, delay: 2, bg: 'from-pink-400/20 to-pink-200/5 border-pink-300/20' },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {bubbles.map((b, i) => (
        <div
          key={i}
          className={`bubble absolute ${b.size} ${b.left} bg-gradient-to-tr ${b.bg} border`}
          style={{
            animationDuration: `${b.duration}s`,
            animationDelay: `${b.delay}s`,
          }}
        />
      ))}
    </div>
  );
};

interface AuthContainerProps {
  mode: 'login' | 'register';
}

const AuthContainer: React.FC<AuthContainerProps> = ({ mode }) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const [isSignUp, setIsSignUp] = useState(mode === 'register');

  // Handle URL changes to trigger sliding transition
  useEffect(() => {
    setIsSignUp(mode === 'register');
    dispatch(clearError());
  }, [mode, dispatch]);

  const searchParams = new URLSearchParams(location.search);
  const emailParam = searchParams.get('email') || '';
  const fullNameParam = searchParams.get('fullName') || '';

  // Form Hooks
  const loginForm = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema)
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: yupResolver(registerSchema),
    defaultValues: {
      email: emailParam,
      fullName: fullNameParam,
      password: '',
      confirmPassword: ''
    }
  });

  // Prefill register form if parameters arrive after load
  useEffect(() => {
    if (emailParam || fullNameParam) {
      registerForm.setValue('email', emailParam);
      registerForm.setValue('fullName', fullNameParam);
    }
  }, [emailParam, fullNameParam, registerForm]);

  const onLoginSubmit = async (data: LoginFormData) => {
    dispatch(clearError());
    const result = await dispatch(login({ email: data.email, password: data.password }));
    if (login.fulfilled.match(result)) {
      toast.success('Welcome back to OmniFlow AI!');
      navigate('/dashboard');
    } else {
      toast.error(result.payload as string || 'Login failed');
    }
  };

  const onRegisterSubmit = async (data: RegisterFormData) => {
    dispatch(clearError());
    const result = await dispatch(registerAction({
      email: data.email,
      password: data.password,
      fullName: data.fullName
    }));
    
    if (registerAction.fulfilled.match(result)) {
      toast.success('Registration successful! Please log in.');
      navigate('/login');
    } else {
      toast.error(result.payload as string || 'Registration failed');
    }
  };

  // Google OAuth Listener
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
            }, 1000);
            return;
          }

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-indigo-50/70 via-purple-50/50 to-cyan-50/60 px-4 py-12 relative overflow-hidden font-sans">
      {/* Dynamic Bubble Flow background */}
      <BubbleBackground />

      {/* Brand accent glows with floating animations */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-cyan-400/15 rounded-full blur-[120px] pointer-events-none animate-blob"></div>
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-indigo-500/15 rounded-full blur-[120px] pointer-events-none animate-blob-reverse"></div>
      <div className="absolute top-[25%] left-[30%] w-[380px] h-[380px] bg-purple-500/10 rounded-full blur-[110px] pointer-events-none animate-blob"></div>

      <div className={`auth-container ${isSignUp ? 'sign-up-active' : ''} border border-slate-200/60 shadow-2xl`}>
        
        {/* SIGN UP FORM (Left in CSS grid view) */}
        <div className="auth-form-container sign-up-container flex items-center justify-center p-10 bg-white">
          <div className="w-full max-w-sm">
            <div className="text-center">
              <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-accent items-center justify-center shadow-md shadow-primary/25 mb-4 hover:scale-105 transition duration-200">
                <UserPlus className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-extrabold bg-gradient-to-r from-slate-900 via-primary to-indigo-950 bg-clip-text text-transparent tracking-tight">
                OmniFlow AI
              </h2>
              <p className="mt-1.5 text-xs text-slate-450 font-semibold mb-6">Join the OmniFlow AI automation network</p>
            </div>

            <form className="space-y-4" onSubmit={registerForm.handleSubmit(onRegisterSubmit)}>
              <div className="space-y-3.5 text-left">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Full Name</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <UserIcon className="w-4 h-4" />
                    </span>
                    <input
                      {...registerForm.register('fullName')}
                      type="text"
                      className="block w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                      placeholder="John Doe"
                    />
                  </div>
                  {registerForm.formState.errors.fullName && <p className="text-error text-xs mt-1 font-medium">{registerForm.formState.errors.fullName.message}</p>}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      {...registerForm.register('email')}
                      type="email"
                      className="block w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                      placeholder="john@example.com"
                    />
                  </div>
                  {registerForm.formState.errors.email && <p className="text-error text-xs mt-1 font-medium">{registerForm.formState.errors.email.message}</p>}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      {...registerForm.register('password')}
                      type="password"
                      className="block w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                      placeholder="••••••••"
                    />
                  </div>
                  {registerForm.formState.errors.password && <p className="text-error text-xs mt-1 font-medium">{registerForm.formState.errors.password.message}</p>}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      {...registerForm.register('confirmPassword')}
                      type="password"
                      className="block w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                      placeholder="••••••••"
                    />
                  </div>
                  {registerForm.formState.errors.confirmPassword && <p className="text-error text-xs mt-1 font-medium">{registerForm.formState.errors.confirmPassword.message}</p>}
                </div>
              </div>

              {error && isSignUp && (
                <div className="p-2.5 rounded-xl bg-error/10 border border-error/20 text-error text-xs text-center font-medium">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-btn-gradient hover:opacity-90 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-primary/20 cursor-pointer"
              >
                {isLoading ? <span>Creating account...</span> : (
                  <>
                    <span>Sign Up</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Mobile View Toggle Link */}
            <div className="text-center mt-6 md:hidden">
              <span className="text-xs text-slate-500">
                Already have an account?{' '}
                <button 
                  type="button" 
                  onClick={() => navigate('/login')} 
                  className="text-primary font-semibold hover:underline cursor-pointer"
                >
                  Sign in
                </button>
              </span>
            </div>
          </div>
        </div>

        {/* SIGN IN FORM (Right in CSS grid view) */}
        <div className="auth-form-container sign-in-container flex items-center justify-center p-10 bg-white">
          <div className="w-full max-w-sm">
            <div className="text-center">
              <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-accent items-center justify-center shadow-md shadow-primary/25 mb-4 hover:scale-105 transition duration-200">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-extrabold bg-gradient-to-r from-slate-900 via-primary to-indigo-950 bg-clip-text text-transparent tracking-tight">
                OmniFlow AI
              </h2>
              <p className="mt-1.5 text-xs text-slate-450 font-semibold mb-6">Sign in to access your AI workflow orchestrator</p>
            </div>

            <form className="space-y-4" onSubmit={loginForm.handleSubmit(onLoginSubmit)}>
              <div className="space-y-3.5 text-left">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      {...loginForm.register('email')}
                      type="email"
                      className="block w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                      placeholder="admin@omniflow.com"
                    />
                  </div>
                  {loginForm.formState.errors.email && <p className="text-error text-xs mt-1 font-medium">{loginForm.formState.errors.email.message}</p>}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      {...loginForm.register('password')}
                      type="password"
                      className="block w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                      placeholder="••••••••"
                    />
                  </div>
                  {loginForm.formState.errors.password && <p className="text-error text-xs mt-1 font-medium">{loginForm.formState.errors.password.message}</p>}
                </div>
              </div>

              {error && !isSignUp && (
                <div className="p-2.5 rounded-xl bg-error/10 border border-error/20 text-error text-xs text-center font-medium">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-btn-gradient hover:opacity-90 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-primary/20 cursor-pointer"
              >
                {isLoading ? <span>Signing in...</span> : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-3 text-slate-400 text-[10px] font-bold uppercase tracking-wider">Or</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <button
                type="button"
                onClick={openGooglePopup}
                className="w-full flex items-center justify-center space-x-2.5 py-2.5 px-4 rounded-xl text-sm font-semibold text-slate-650 bg-slate-50/50 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 active:scale-[0.97] transition-all duration-200 cursor-pointer shadow-sm"
              >
                <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                </svg>
                <span>Continue with Google</span>
              </button>
            </form>

            {/* Mobile View Toggle Link */}
            <div className="text-center mt-6 md:hidden">
              <span className="text-xs text-slate-500">
                Don't have an account?{' '}
                <button 
                  type="button" 
                  onClick={() => navigate('/register')} 
                  className="text-primary font-semibold hover:underline cursor-pointer"
                >
                  Sign up
                </button>
              </span>
            </div>
          </div>
        </div>

        {/* OVERLAY PANEL (DESKTOP SLIDING COVER) */}
        <div className="overlay-container hidden md:block">
          <div className="overlay">
            
            {/* Left Overlay - displayed when Sign Up is active */}
            <div className="overlay-panel overlay-left">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-3xl shadow-xl max-w-[280px] flex flex-col items-center">
                <h2 className="text-2xl font-extrabold text-white tracking-tight mb-2.5">Welcome Back!</h2>
                <p className="text-xs text-indigo-100 font-medium leading-relaxed mb-6">
                  To keep connected with your orchestrators please login with your personal credentials.
                </p>
                <button
                  onClick={() => navigate('/login')}
                  className="px-8 py-2.5 border border-white hover:bg-white/20 active:scale-95 transition rounded-xl text-xs font-bold tracking-wider uppercase cursor-pointer"
                >
                  Sign In
                </button>
              </div>
            </div>

            {/* Right Overlay - displayed when Sign In is active */}
            <div className="overlay-panel overlay-right">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-3xl shadow-xl max-w-[280px] flex flex-col items-center">
                <h2 className="text-2xl font-extrabold text-white tracking-tight mb-2.5">Hello, Friend!</h2>
                <p className="text-xs text-indigo-100 font-medium leading-relaxed mb-6">
                  Enter your details and start your automation journey with OmniFlow AI.
                </p>
                <button
                  onClick={() => navigate('/register')}
                  className="px-8 py-2.5 border border-white hover:bg-white/20 active:scale-95 transition rounded-xl text-xs font-bold tracking-wider uppercase cursor-pointer"
                >
                  Sign Up
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default AuthContainer;
