import React, { useState } from 'react';

const GoogleOAuthPage: React.FC = () => {
  const [loadingEmail, setLoadingEmail] = useState<string | null>(null);
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');

  const [googleAccounts, setGoogleAccounts] = useState([
    { name: 'Poovalingam', email: 'poovalingam24102005@gmail.com', avatar: 'P' },
    { name: 'Admin OmniFlow', email: 'admin@omniflow.com', avatar: 'A' }
  ]);

  const selectAccount = (account: typeof googleAccounts[0]) => {
    setLoadingEmail(account.email);
    setTimeout(() => {
      if (window.opener) {
        window.opener.postMessage({
          type: 'GOOGLE_OAUTH_SUCCESS',
          email: account.email,
          name: account.name
        }, window.location.origin);
      }
      window.close();
    }, 1000);
  };

  const handleAddAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName || !customEmail) return;

    const newAccount = {
      name: customName,
      email: customEmail,
      avatar: customName.charAt(0).toUpperCase()
    };
    
    // Add to list and select it
    setGoogleAccounts(prev => [...prev, newAccount]);
    setIsAddingAccount(false);
    selectAccount(newAccount);
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col justify-between p-8 font-sans selection:bg-[#c2e7ff]">
      <div className="max-w-md w-full mx-auto my-auto space-y-8">
        <div className="text-center">
          {/* Official Google Logo */}
          <svg className="w-20 h-10 mx-auto mb-4" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
          </svg>
          <h1 className="text-2xl font-normal text-[#1f1f1f] tracking-tight">Choose an account</h1>
          <p className="text-sm text-[#444746] mt-2">
            to continue to <span className="font-semibold text-cyan-650">OmniFlow AI</span>
          </p>
        </div>

        {!isAddingAccount ? (
          <div className="border border-[#e0e0e0] rounded-lg overflow-hidden bg-white shadow-sm">
            {googleAccounts.map((account) => {
              const isLoading = loadingEmail === account.email;
              return (
                <button
                  key={account.email}
                  onClick={() => !loadingEmail && selectAccount(account)}
                  disabled={!!loadingEmail}
                  className="w-full flex items-center space-x-3 p-4 hover:bg-[#f8fafd] border-b border-[#f1f3f4] text-left transition duration-150 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-[#1a73e8] border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#1a73e8] text-white flex items-center justify-center font-semibold text-sm uppercase">
                      {account.avatar}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#3c4043] truncate">{account.name}</p>
                    <p className="text-xs text-[#5f6368] truncate">{account.email}</p>
                  </div>
                </button>
              );
            })}

            <button
              onClick={() => !loadingEmail && setIsAddingAccount(true)}
              disabled={!!loadingEmail}
              className="w-full flex items-center space-x-3 p-4 hover:bg-[#f8fafd] text-left transition duration-150 cursor-pointer disabled:opacity-50 text-[#1a73e8]"
            >
              <div className="w-8 h-8 rounded-full border border-dashed border-[#1a73e8] flex items-center justify-center font-semibold text-lg">
                +
              </div>
              <span className="text-sm font-semibold">Use another account</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleAddAccountSubmit} className="space-y-4 p-6 border border-[#e0e0e0] rounded-lg bg-white shadow-sm">
            <h3 className="text-sm font-semibold text-[#1f1f1f]">Add your device / browser account</h3>
            
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                placeholder="e.g. Poovalingam Dev"
                className="w-full p-2.5 border border-[#ccc] rounded focus:outline-none focus:border-[#1a73e8] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={customEmail}
                onChange={e => setCustomEmail(e.target.value)}
                placeholder="e.g. system.account@gmail.com"
                className="w-full p-2.5 border border-[#ccc] rounded focus:outline-none focus:border-[#1a73e8] text-sm"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingAccount(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-650 hover:bg-slate-100 rounded transition duration-150 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-[#1a73e8] hover:bg-[#1557b0] rounded transition duration-150 cursor-pointer"
              >
                Continue
              </button>
            </div>
          </form>
        )}

        <div className="text-center text-xs text-[#5f6368] mt-6">
          <p>
            To continue, Google will share your name, email address, language preference, and profile picture with OmniFlow AI.
          </p>
        </div>
      </div>

      <div className="text-center text-[11px] text-[#70757a] flex justify-center space-x-4 mt-8">
        <a href="#" className="hover:underline">Privacy Policy</a>
        <a href="#" className="hover:underline">Terms of Service</a>
      </div>
    </div>
  );
};

export default GoogleOAuthPage;
