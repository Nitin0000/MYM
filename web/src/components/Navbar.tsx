import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home,
  Receipt,
  Plus,
  User as UserIcon,
  Info,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../constants/theme';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <Home className="w-5 h-5" /> },
    { name: 'History', path: '/transactions', icon: <Receipt className="w-5 h-5" /> },
    { name: 'Profile', path: '/profile', icon: <UserIcon className="w-5 h-5" /> },
    { name: 'About', path: '/about', icon: <Info className="w-5 h-5" /> },
  ];

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const initials = displayName
    .split(' ')
    .map((w: string) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <>
      {/* ─── Desktop Top Navbar ─── */}
      <header className="sticky top-0 z-40 w-full border-b border-white/[0.07] bg-[#0D0D1A]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <NavLink to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl overflow-hidden shadow-md shadow-[#7C6EF8]/30 group-hover:scale-105 transition-transform bg-[#1C1C38] flex items-center justify-center">
              <img src="/logo.png" alt="MYM Logo" className="w-full h-full object-cover" onError={(e) => {
                // fallback icon if logo image fails
                (e.target as HTMLElement).style.display = 'none';
              }} />
              <span className="font-extrabold text-sm text-[#7C6EF8]">MYM</span>
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-wider text-white">MYM</span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold text-[#9898B3] tracking-wide">
                Manage Your Money
              </span>
            </div>
          </NavLink>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-[#7C6EF8]/15 text-[#7C6EF8]'
                      : 'text-[#9898B3] hover:text-white hover:bg-white/5'
                  }`
                }
              >
                {item.icon}
                <span>{item.name}</span>
              </NavLink>
            ))}

            {/* Desktop Add Transaction Button */}
            <NavLink
              to="/add"
              className={({ isActive }) =>
                `ml-2 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shadow-md transition-all ${
                  isActive
                    ? 'bg-[#7C6EF8] text-white shadow-[#7C6EF8]/30'
                    : 'bg-[#7C6EF8] hover:bg-[#6858f6] text-white shadow-[#7C6EF8]/20'
                }`
              }
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Entry</span>
            </NavLink>
          </nav>

          {/* User Profile / Sign Out */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <NavLink
                  to="/profile"
                  className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1.5 rounded-full sm:rounded-xl hover:bg-white/5 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-[#7C6EF8]/20 border border-[#7C6EF8]/40 flex items-center justify-center text-xs font-extrabold text-[#7C6EF8]">
                    {initials}
                  </div>
                  <span className="hidden sm:inline-block text-xs font-semibold text-white max-w-[120px] truncate">
                    {displayName}
                  </span>
                </NavLink>

                <button
                  onClick={signOut}
                  title="Sign Out"
                  className="p-2 rounded-xl text-[#9898B3] hover:text-[#F87171] hover:bg-[#F87171]/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <NavLink
                to="/login"
                className="px-4 py-2 rounded-xl bg-[#7C6EF8] hover:bg-[#6858f6] text-white text-sm font-bold transition-all shadow-md shadow-[#7C6EF8]/20"
              >
                Sign In
              </NavLink>
            )}
          </div>
        </div>
      </header>

      {/* ─── Mobile Bottom Tab Bar ─── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#1C1C38] border-t border-white/[0.07] px-4 py-2 flex items-center justify-around pb-safe">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-1 px-3 text-xs font-semibold transition-colors ${
              isActive ? 'text-[#7C6EF8]' : 'text-[#5C5C78] hover:text-[#9898B3]'
            }`
          }
        >
          <Home className="w-5 h-5" />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/transactions"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-1 px-3 text-xs font-semibold transition-colors ${
              isActive ? 'text-[#7C6EF8]' : 'text-[#5C5C78] hover:text-[#9898B3]'
            }`
          }
        >
          <Receipt className="w-5 h-5" />
          <span>History</span>
        </NavLink>

        {/* Center Circular FAB for Add */}
        <NavLink
          to="/add"
          className="flex items-center justify-center -mt-6 w-13 h-13 rounded-full bg-[#7C6EF8] text-white shadow-xl shadow-[#7C6EF8]/50 hover:scale-105 active:scale-95 transition-transform"
          aria-label="Add Transaction"
        >
          <Plus className="w-7 h-7 stroke-[2.5]" />
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-1 px-3 text-xs font-semibold transition-colors ${
              isActive ? 'text-[#7C6EF8]' : 'text-[#5C5C78] hover:text-[#9898B3]'
            }`
          }
        >
          <UserIcon className="w-5 h-5" />
          <span>Profile</span>
        </NavLink>

        <NavLink
          to="/about"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-1 px-3 text-xs font-semibold transition-colors ${
              isActive ? 'text-[#7C6EF8]' : 'text-[#5C5C78] hover:text-[#9898B3]'
            }`
          }
        >
          <Info className="w-5 h-5" />
          <span>About</span>
        </NavLink>
      </nav>
    </>
  );
}
