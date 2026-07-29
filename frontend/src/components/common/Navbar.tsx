import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { logout } from '../../store';
import { AppDispatch, RootState } from '../../store';
import { LogOut, User as UserIcon, ShieldAlert, BarChart2, LayoutDashboard, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

const Navbar: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleLogout = async () => {
    await dispatch(logout());
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { path: '/chat', label: 'Chat', icon: <MessageSquare className="w-4 h-4" /> },
    { path: '/analytics', label: 'Analytics', icon: <BarChart2 className="w-4 h-4" /> },
  ];

  return (
    <nav className="border-b border-slate-200/60 bg-white/75 backdrop-blur-lg sticky top-0 z-50 shadow-sm transition-all duration-200 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => navigate('/dashboard')}>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-md shadow-primary/20 group-hover:scale-105 group-hover:shadow-primary/30 transition-all duration-200">
                <span className="text-white font-black text-lg tracking-wider">Ω</span>
              </div>
              <span className="text-lg font-bold text-slate-850 tracking-tight group-hover:text-slate-900 transition duration-200">
                OmniFlow <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">AI</span>
              </span>
            </div>

            {user && (
              <div className="hidden sm:flex items-center space-x-2">
                {navLinks.map(link => {
                  const isActive = location.pathname === link.path;
                  return (
                    <button
                      key={link.path}
                      onClick={() => navigate(link.path)}
                      className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer border ${
                        isActive
                          ? 'text-primary bg-primary/5 border-primary/10 shadow-sm shadow-primary/5'
                          : 'text-slate-500 border-transparent hover:text-slate-800 hover:bg-slate-100/70'
                      }`}
                    >
                      {link.icon}
                      <span>{link.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {user && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 bg-slate-50 border border-slate-200/80 px-4 py-1.5 rounded-xl shadow-sm hover:border-slate-300 transition duration-150">
                <div className="relative">
                  <div className="w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                    {user.role === 'ADMIN' ? (
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                    ) : (
                      <UserIcon className="w-3.5 h-3.5 text-primary" />
                    )}
                  </div>
                  <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full border border-white animate-pulse" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-800 leading-none">
                    {user.fullName}
                  </span>
                  <span className="text-[8px] text-primary/95 font-bold uppercase tracking-widest mt-1">
                    {user.role}
                  </span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center space-x-1.5 text-slate-400 hover:text-error transition-all duration-200 px-3.5 py-2 rounded-xl hover:bg-error/5 hover:border hover:border-error/10 border border-transparent cursor-pointer text-xs font-bold uppercase tracking-wider"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
