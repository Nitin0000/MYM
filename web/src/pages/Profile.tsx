import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  User as UserIcon,
  Calendar,
  Lock,
  LogOut,
  BookOpen,
  ChevronRight,
  Database,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../constants/theme';
import FeatureGuide from '../components/FeatureGuide';
import { isSupabaseConfigured, saveSupabaseConfig } from '../lib/supabase';

export default function Profile() {
  const { user, signOut, isDemo } = useAuth();
  const navigate = useNavigate();
  const [guideOpen, setGuideOpen] = useState(false);
  const [configModalOpen, setConfigModalOpen] = useState(false);

  // Supabase config form
  const [supaUrl, setSupaUrl] = useState(localStorage.getItem('mym_supabase_url') || '');
  const [supaKey, setSupaKey] = useState(localStorage.getItem('mym_supabase_anon_key') || '');

  const displayName: string =
    user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const email: string = user?.email || 'guest@mym.finance';
  const provider: string = user?.app_metadata?.provider || 'email';
  const joinedDate: string = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Recently';

  const initials = displayName
    .split(' ')
    .map((w: string) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleSignOut = () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      signOut();
      navigate('/login');
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supaUrl || !supaKey) {
      alert('Please enter both Supabase URL and Anon Key');
      return;
    }
    saveSupabaseConfig(supaUrl.trim(), supaKey.trim());
  };

  const infoRows = [
    { icon: <Mail className="w-4 h-4" />, label: 'Email', value: email },
    { icon: <UserIcon className="w-4 h-4" />, label: 'Name', value: displayName },
    {
      icon: <Lock className="w-4 h-4" />,
      label: 'Sign-in method',
      value: provider === 'google' ? 'Google' : 'Email & Password',
    },
    { icon: <Calendar className="w-4 h-4" />, label: 'Member since', value: joinedDate },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-28 md:pb-12 animate-fade-in space-y-6">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Profile</h1>

      {/* ─── Avatar Card ─── */}
      <div
        className="rounded-3xl p-8 flex flex-col items-center text-center shadow-2xl relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #2A2060 0%, #7C6EF8 100%)',
        }}
      >
        <div className="w-20 h-20 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-2xl font-black text-white shadow-xl mb-3">
          {initials}
        </div>

        <h2 className="text-xl font-black text-white mb-0.5">{displayName}</h2>
        <p className="text-xs text-white/70 font-semibold mb-3">{email}</p>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold capitalize">
          {isDemo ? 'Local / Demo Mode' : `${provider} Account`}
        </span>
      </div>

      {/* ─── Info Rows ─── */}
      <div className="rounded-3xl bg-[#1C1C38] border border-white/10 overflow-hidden shadow-lg divide-y divide-white/5">
        {infoRows.map((row) => (
          <div key={row.label} className="flex items-center gap-4 p-4 sm:p-5">
            <div className="w-10 h-10 rounded-xl bg-[#7C6EF8]/15 text-[#7C6EF8] flex items-center justify-center flex-shrink-0">
              {row.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-[#5C5C78]">{row.label}</p>
              <p className="text-sm font-bold text-white truncate mt-0.5">{row.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Feature Guide Button ─── */}
      <button
        onClick={() => setGuideOpen(true)}
        className="w-full flex items-center justify-between p-4 sm:p-5 rounded-3xl bg-[#1C1C38] border border-white/10 hover:border-white/20 transition-all text-left shadow-lg group"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#7C6EF8]/15 text-[#7C6EF8] flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white group-hover:text-[#7C6EF8] transition-colors">
              Feature Guide
            </h3>
            <p className="text-xs text-[#9898B3] mt-0.5">Learn shortcuts, gestures & financial tips</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-[#5C5C78] group-hover:text-white transition-colors" />
      </button>

      {/* ─── Supabase Configuration Card (Hidden on hosted production app) ─── */}
      {import.meta.env.DEV && (
        <button
          onClick={() => setConfigModalOpen(true)}
          className="w-full flex items-center justify-between p-4 sm:p-5 rounded-3xl bg-[#1C1C38] border border-white/10 hover:border-white/20 transition-all text-left shadow-lg group"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#34D399]/15 text-[#34D399] flex items-center justify-center flex-shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white group-hover:text-[#34D399] transition-colors">
                  Backend Connection (Dev Only)
                </h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isSupabaseConfigured
                      ? 'bg-[#34D399]/15 text-[#34D399]'
                      : 'bg-[#FBBF24]/15 text-[#FBBF24]'
                  }`}
                >
                  {isSupabaseConfigured ? 'Supabase Connected' : 'Local Storage Mode'}
                </span>
              </div>
              <p className="text-xs text-[#9898B3] mt-0.5">
                Configure Supabase project URL and API keys
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-[#5C5C78] group-hover:text-white transition-colors" />
        </button>
      )}

      {/* ─── Sign Out Button ─── */}
      <button
        onClick={handleSignOut}
        className="w-full py-4 rounded-2xl bg-[#F87171]/10 hover:bg-[#F87171]/20 border border-[#F87171]/20 text-[#F87171] text-sm font-bold transition-all flex items-center justify-center gap-2"
      >
        <LogOut className="w-4 h-4" />
        <span>Sign Out</span>
      </button>

      <p className="text-center text-xs text-[#5C5C78] font-semibold">MYM Web v1.0.0</p>

      {/* Feature Guide Modal */}
      <FeatureGuide isOpen={guideOpen} onClose={() => setGuideOpen(false)} />

      {/* Backend Config Modal (Dev only) */}
      {import.meta.env.DEV && configModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#141428] border border-white/10 p-6 sm:p-7 shadow-2xl">
            <h3 className="text-lg font-extrabold text-white mb-2">Connect to Supabase</h3>
            <p className="text-xs text-[#9898B3] leading-relaxed mb-4">
              Enter your Supabase Project details to sync with the mobile app's database, or leave
              empty to continue using fast local storage.
            </p>

            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#9898B3] uppercase tracking-wider mb-1">
                  Supabase URL
                </label>
                <input
                  type="url"
                  placeholder="https://xyzcompany.supabase.co"
                  value={supaUrl}
                  onChange={(e) => setSupaUrl(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-[#34D399] text-white text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#9898B3] uppercase tracking-wider mb-1">
                  Supabase Anon Key
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                  value={supaKey}
                  onChange={(e) => setSupaKey(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-[#34D399] text-white text-sm focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setConfigModalOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-[#1C1C38] text-sm font-bold text-[#9898B3] hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-[#34D399] text-white text-sm font-bold hover:bg-[#2ebb84] shadow-md shadow-[#34D399]/25 transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>Save & Reload</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
