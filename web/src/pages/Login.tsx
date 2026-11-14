import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2, Sparkles, UserCheck, AlertCircle, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../constants/theme';

type Mode = 'signin' | 'signup';

export default function Login() {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);

  const { signInWithEmail, signUpWithEmail, signInWithGoogle, signInAsDemoUser } = useAuth();
  const navigate = useNavigate();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setEmailNotConfirmed(false);

    if (!email || !password) {
      setErrorMsg('Please enter your email and password.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        const { error } = await signInWithEmail(email, password);
        if (error) {
          if (error.message.toLowerCase().includes('email not confirmed')) {
            setEmailNotConfirmed(true);
            throw new Error('Supabase has email confirmation enabled. Please check your inbox or use the quick login buttons below.');
          }
          throw error;
        }
        navigate('/');
      } else {
        const { error } = await signUpWithEmail(email, password);
        if (error) throw error;
        // Try to automatically sign in right away
        const signinRes = await signInWithEmail(email, password);
        if (signinRes.error) {
          setEmailNotConfirmed(true);
          setErrorMsg('Account created in Supabase! If you have not verified your email yet, you can also continue via Demo or turn off "Confirm email" in Supabase.');
        } else {
          navigate('/');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      navigate('/');
    } catch (err: any) {
      setErrorMsg(err.message || 'Google Sign-In failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (fillEmail: string, fillPass: string) => {
    setEmail(fillEmail);
    setPassword(fillPass);
    setLoading(true);
    setErrorMsg('');
    try {
      const { error } = await signInWithEmail(fillEmail, fillPass);
      if (error) throw error;
      navigate('/');
    } catch (err: any) {
      setErrorMsg(err.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = () => {
    signInAsDemoUser();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0D0D1A] relative overflow-hidden">
      {/* Decorative ambient gradients */}
      <div className="absolute top-[-100px] right-[-100px] w-96 h-96 rounded-full bg-[#7C6EF8]/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-100px] left-[-100px] w-96 h-96 rounded-full bg-[#34D399]/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Logo Section */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-20 h-20 rounded-3xl bg-[#1C1C38] border border-white/10 p-2 shadow-2xl shadow-[#7C6EF8]/30 flex items-center justify-center mb-3">
            <img
              src="/logo.png"
              alt="MYM Logo"
              className="w-full h-full object-cover rounded-2xl"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <span className="font-black text-2xl text-[#7C6EF8]">MYM</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-widest">MYM</h1>
          <p className="text-xs font-semibold text-[#9898B3] tracking-widest uppercase mt-1">
            Manage Your Money
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl bg-[#1C1C38] border border-white/[0.08] p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Mode Tabs */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-black/30 border border-white/5">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMsg('');
                setEmailNotConfirmed(false);
              }}
              className={`py-2 rounded-xl text-xs font-bold transition-all ${
                mode === 'signin' ? 'bg-[#7C6EF8] text-white shadow-md' : 'text-[#9898B3] hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMsg('');
                setEmailNotConfirmed(false);
              }}
              className={`py-2 rounded-xl text-xs font-bold transition-all ${
                mode === 'signup' ? 'bg-[#7C6EF8] text-white shadow-md' : 'text-[#9898B3] hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-[#F87171]/15 border border-[#F87171]/30 text-[#F87171] text-xs font-semibold space-y-1.5">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
              {emailNotConfirmed && (
                <div className="pt-1.5 border-t border-[#F87171]/20">
                  <button
                    type="button"
                    onClick={handleDemoSignIn}
                    className="underline text-white font-bold hover:text-white/80"
                  >
                    👉 Click here to bypass and enter as Demo User
                  </button>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-4">
            {/* Email Field */}
            <div>
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 focus-within:border-[#7C6EF8] transition-colors">
                <Mail className="w-5 h-5 text-[#9898B3]" />
                <input
                  type="email"
                  required
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent text-sm text-white placeholder-[#5C5C78] focus:outline-none"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 focus-within:border-[#7C6EF8] transition-colors">
                <Lock className="w-5 h-5 text-[#9898B3]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent text-sm text-white placeholder-[#5C5C78] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[#9898B3] hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#9D8FF9] to-[#7C6EF8] hover:opacity-90 active:scale-[0.99] text-white text-sm font-extrabold shadow-lg shadow-[#7C6EF8]/30 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
              )}
            </button>
          </form>

          {/* Quick Verified Accounts Helper (Only visible during local development) */}
          {import.meta.env.DEV && (
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
              <p className="text-[11px] font-bold text-[#9898B3] uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-[#34D399]" />
                <span>1-Click Verified Logins (Dev Only)</span>
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('nitinmittal778@gmail.com', 'Password@123')}
                  className="p-2.5 rounded-xl bg-[#7C6EF8]/10 hover:bg-[#7C6EF8]/20 border border-[#7C6EF8]/30 text-left transition-colors"
                >
                  <p className="text-xs font-bold text-white truncate">Nitin Mittal</p>
                  <p className="text-[10px] text-[#9D8FF9] truncate">nitinmittal778</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('nm9812546243@gmail.com', 'Password@123')}
                  className="p-2.5 rounded-xl bg-[#7C6EF8]/10 hover:bg-[#7C6EF8]/20 border border-[#7C6EF8]/30 text-left transition-colors"
                >
                  <p className="text-xs font-bold text-white truncate">Nitin (nm981)</p>
                  <p className="text-[10px] text-[#9D8FF9] truncate">nm9812546243</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('harmansingh.bt21ece@pec.edu.in', 'Password@123')}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-left transition-colors"
                >
                  <p className="text-xs font-bold text-white truncate">Harman Singh</p>
                  <p className="text-[10px] text-[#34D399]">Live Supabase User</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('testuser998877@gmail.com', 'testpassword123')}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-left transition-colors"
                >
                  <p className="text-xs font-bold text-white truncate">Test Account</p>
                  <p className="text-[10px] text-[#34D399]">Live Supabase User</p>
                </button>
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="h-px bg-white/10 flex-1" />
            <span className="text-xs text-[#5C5C78] font-bold uppercase tracking-wider">or</span>
            <div className="h-px bg-white/10 flex-1" />
          </div>

          <div className="space-y-3">
            {/* Google Sign In */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl bg-white text-gray-900 text-sm font-bold shadow-md hover:bg-gray-100 transition-colors"
            >
              <img
                src="https://developers.google.com/identity/images/g-logo.png"
                alt="Google"
                className="w-5 h-5"
              />
              <span>Continue with Google</span>
            </button>

            {/* Instant Demo Button */}
            <button
              type="button"
              onClick={handleDemoSignIn}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-bold text-[#9898B3] hover:text-white transition-all"
            >
              <Sparkles className="w-4 h-4 text-[#FBBF24]" />
              <span>Explore Instant Demo (No signup needed)</span>
            </button>
          </div>

          {/* Toggle Mode Footer */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setErrorMsg('');
                setEmailNotConfirmed(false);
              }}
              className="text-xs text-[#9898B3] hover:text-white transition-colors"
            >
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <span className="font-bold text-[#7C6EF8]">
                {mode === 'signin' ? 'Sign Up' : 'Sign In'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
