import React from 'react';
import { Headphones, Phone, MessageSquare, Sparkles } from 'lucide-react';
import { Colors } from '../constants/theme';

export default function About() {
  const phoneNumber = '9350130449';

  const handleCall = () => {
    window.location.href = `tel:${phoneNumber}`;
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/91${phoneNumber}`, '_blank');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-28 md:pb-12 animate-fade-in space-y-6">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">About MYM</h1>

      {/* ─── Vision Card ─── */}
      <div
        className="rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #2A2060 0%, #7C6EF8 100%)',
        }}
      >
        <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center mb-4 overflow-hidden">
          <img
            src="/logo.png"
            alt="MYM"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <Sparkles className="w-7 h-7 text-white" />
        </div>

        <h2 className="text-xl font-black text-white mb-2">AI-Powered Expense Manager</h2>
        <p className="text-sm text-white/85 leading-relaxed">
          We are building a smart product that not only tracks your expenses but actively helps you
          optimize them. Our upcoming AI features will analyze your spending habits and provide
          personalized financial insights.
        </p>
      </div>

      <h2 className="text-lg font-bold text-white tracking-tight pt-2">
        Get Expert Recommendations
      </h2>

      {/* ─── Manager Contact Card ─── */}
      <div className="rounded-3xl bg-[#1C1C38] border border-white/10 p-6 sm:p-7 shadow-lg">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-[#7C6EF8]/15 text-[#7C6EF8] flex items-center justify-center flex-shrink-0">
            <Headphones className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Finance Manager</h3>
            <p className="text-xs text-[#34D399] font-semibold">Available for consultation</p>
          </div>
        </div>

        <p className="text-sm text-[#9898B3] leading-relaxed mb-6">
          For now, you can connect directly with our expert finance managers to get personalized
          investment and savings recommendations.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handleCall}
            className="flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl bg-[#7C6EF8] hover:bg-[#6858f6] text-white text-sm font-bold shadow-lg shadow-[#7C6EF8]/25 transition-all"
          >
            <Phone className="w-4 h-4" />
            <span>Call: {phoneNumber}</span>
          </button>

          <button
            onClick={handleWhatsApp}
            className="flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white text-sm font-bold shadow-lg shadow-[#25D366]/25 transition-all"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Chat on WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
}
