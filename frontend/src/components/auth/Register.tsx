import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { register as registerAction, clearError } from '../../store';
import { AppDispatch, RootState } from '../../store';
import { Mail, Lock, User as UserIcon, UserPlus, ArrowRight } from 'lucide-react';

const registerSchema = yup.object().shape({
  fullName: yup.string().max(100, 'Name must be under 100 characters').required('Full Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Confirm Password is required')
});

interface RegisterFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const Register: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const searchParams = new URLSearchParams(location.search);
  const emailParam = searchParams.get('email') || '';
  const fullNameParam = searchParams.get('fullName') || '';
  
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: yupResolver(registerSchema),
    defaultValues: {
      email: emailParam,
      fullName: fullNameParam,
      password: '',
      confirmPassword: ''
    }
  });

  const onSubmit = async (data: RegisterFormData) => {
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12 relative overflow-hidden font-sans">
      {/* Premium accent glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-400/25 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/25 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full space-y-8 p-10 bg-white border border-slate-200/80 rounded-3xl shadow-xl relative z-10 animate-fade-in">
        <div className="text-center">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-accent items-center justify-center shadow-lg shadow-primary/20 mb-4">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Create Account
          </h2>
          <p className="mt-2 text-sm text-slate-500 font-medium">
            Join the OmniFlow AI automation network
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <UserIcon className="w-5 h-5" />
                </span>
                <input
                  {...register('fullName')}
                  type="text"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-slate-900 placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                  placeholder="John Doe"
                />
              </div>
              {errors.fullName && <p className="text-error text-xs mt-1 font-medium">{errors.fullName.message}</p>}
            </div>

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
                  placeholder="john@example.com"
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

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  {...register('confirmPassword')}
                  type="password"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-slate-900 placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                  placeholder="••••••••"
                />
              </div>
              {errors.confirmPassword && <p className="text-error text-xs mt-1 font-medium">{errors.confirmPassword.message}</p>}
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
              <span>Creating account...</span>
            ) : (
              <>
                <span>Sign Up</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="text-center">
            <span className="text-sm text-slate-500">
              Already have an account?{' '}
              <button 
                type="button" 
                onClick={() => navigate('/login')} 
                className="text-primary hover:text-primary-dark font-semibold transition-colors duration-150 cursor-pointer"
              >
                Sign in
              </button>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
