import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { Flame, Mail, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react';

export const AuthView: React.FC = () => {
  const { signIn, signUp, signInWithGoogle, resetPassword } = useChat();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isForgot) {
        const { error } = await resetPassword(email);
        if (error) throw error;
        setSuccessMsg('Password reset instructions sent to your email.');
      } else if (isSignUp) {
        if (!displayName.trim()) {
          setError('Please enter your display name.');
          setLoading(false);
          return;
        }
        const { error } = await signUp(email, password, displayName);
        if (error) throw error;
        setSuccessMsg('Registration successful! Please check your email for verification if needed.');
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#050505] text-white p-4 relative overflow-hidden">
      {/* Ambient Red Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#E50914]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#E50914]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md liquid-glass rounded-3xl p-8 shadow-2xl border border-white/10 relative z-10">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#E50914] to-[#FF303B] flex items-center justify-center text-white shadow-xl shadow-[#E50914]/30 mb-4">
            <Flame className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">vonChat</h1>
          <p className="text-sm text-[#A1A1AA] mt-1">
            {isForgot ? 'Reset your password' : isSignUp ? 'Create your vonChat account' : 'Welcome back to secure messaging'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-950/60 border border-red-800 text-red-200 text-sm rounded-xl">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-sm rounded-xl">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && !isForgot && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] mb-1.5">
                Display Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-[#71717A]" />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Elena Vance"
                  className="w-full pl-10 pr-4 py-2.5 liquid-glass-input rounded-xl text-sm text-white placeholder-[#71717A] focus:outline-none focus:ring-2 focus:ring-[#E50914]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-[#71717A]" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 liquid-glass-input rounded-xl text-sm text-white placeholder-[#71717A] focus:outline-none focus:ring-2 focus:ring-[#E50914]"
              />
            </div>
          </div>

          {!isForgot && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA]">
                  Password
                </label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => setIsForgot(true)}
                    className="text-xs text-[#E50914] hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-[#71717A]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 liquid-glass-input rounded-xl text-sm text-white placeholder-[#71717A] focus:outline-none focus:ring-2 focus:ring-[#E50914]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-[#71717A] hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#E50914] text-white py-3 rounded-xl font-medium hover:bg-[#FF303B] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#E50914]/35 disabled:opacity-50"
          >
            <span>{loading ? 'Processing...' : isForgot ? 'Send Reset Instructions' : isSignUp ? 'Create Account' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {!isForgot && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#0B0B0D] px-2 text-[#71717A] font-medium">Or continue with</span></div>
            </div>

            <button
              onClick={signInWithGoogle}
              className="w-full liquid-glass-card text-white py-2.5 rounded-xl font-medium hover:bg-white/10 transition-colors flex items-center justify-center gap-3 cursor-pointer shadow-sm text-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Continue with Google</span>
            </button>
          </>
        )}

        <div className="mt-6 text-center text-sm text-[#A1A1AA]">
          {isForgot ? (
            <button
              onClick={() => setIsForgot(false)}
              className="font-semibold text-[#E50914] hover:underline cursor-pointer"
            >
              Back to Sign In
            </button>
          ) : isSignUp ? (
            <span>Already have an account?{' '}
              <button
                onClick={() => setIsSignUp(false)}
                className="font-semibold text-[#E50914] hover:underline cursor-pointer"
              >
                Sign In
              </button>
            </span>
          ) : (
            <span>Don't have an account?{' '}
              <button
                onClick={() => setIsSignUp(true)}
                className="font-semibold text-[#E50914] hover:underline cursor-pointer"
              >
                Create Account
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
