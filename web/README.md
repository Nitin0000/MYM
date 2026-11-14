# MYM Web — Manage Your Money (React Web Application)

A modern, fast React web application implementing the exact financial management features, algorithms, and design system of the MYM mobile app.

## ✨ Features

- **Dashboard**:
  - Filter by Monthly, Yearly, and All Time.
  - Interactive period navigator (month/year arrows).
  - Gradient Balance Card showing total balance, income, and expense breakdown.
  - Compact Indian currency format (`₹1.5 L`, `₹50k`) with hover/click tooltip revealing the exact amount.
  - Future Projections & Recurring Logic (`calculations.ts`): expands recurring entries, calculates historical average for variable spending, and projects future entries with sparkle badges.
  - Recent entries overview.

- **Transactions History**:
  - Filter by type: All, Income, or Expense.
  - Filter by period: Monthly, Yearly, All Time.
  - Soft Delete with confirmation modal requiring the user to type `"delete"`.
  - End Recurring entries with start-date validation.
  - Status badges: frequency, fixed/variable, essential, predicted, and ended.

- **Add Transaction**:
  - Toggle between Expense and Income.
  - Large amount input with dynamic `-₹` / `+₹` gradient card.
  - Category pills and custom category input.
  - Type selection (Fixed / Variable) and Frequency selection (One-time, Monthly, Quarterly, Yearly).
  - Essential expense toggle.
  - Income type & frequency options.

- **Profile & Guide**:
  - User details & provider badge.
  - 6-step interactive Feature Guide walkthrough modal.
  - Supabase backend connection configuration modal.

- **About**:
  - Vision card for AI-powered expense management.
  - Financial consultation card with direct Call and WhatsApp links.

- **Authentication & Backend**:
  - Email/Password sign in and sign up.
  - Google OAuth sign-in.
  - Instant Demo mode (works with full features out of the box using local storage).
  - Direct Supabase sync when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are provided.

---

## 🚀 Getting Started

### 1. Install dependencies:
```bash
cd web
npm install
```

### 2. Start development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Build for production:
```bash
npm run build
```
