import React, { useState } from 'react';
import {
  X,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Check,
  MousePointerClick,
  FileText,
  ShieldCheck,
  StopCircle,
  Filter,
  Fingerprint,
  Lightbulb,
} from 'lucide-react';
import { Colors } from '../constants/theme';

interface GuideStep {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  tip?: string;
}

const GUIDE_STEPS: GuideStep[] = [
  {
    icon: <MousePointerClick className="w-9 h-9" />,
    iconBg: 'rgba(124, 110, 248, 0.15)',
    iconColor: Colors.primary,
    title: 'Actions for Entries',
    description:
      'Click on any transaction card or use the action menu in the History tab to open options for Deleting or Ending recurring entries.',
    tip: 'Quickly manage any transaction',
  },
  {
    icon: <FileText className="w-9 h-9" />,
    iconBg: 'rgba(248, 113, 113, 0.15)',
    iconColor: Colors.danger,
    title: 'Type "delete" to Confirm',
    description:
      'To prevent accidental deletions, you will need to type the word "delete" in the confirmation popup before the entry is removed.',
    tip: 'Keeps your finances protected',
  },
  {
    icon: <ShieldCheck className="w-9 h-9" />,
    iconBg: 'rgba(52, 211, 153, 0.15)',
    iconColor: Colors.success,
    title: 'Soft Delete — Nothing Lost',
    description:
      'Deleted entries are safely archived and hidden from your active records. Your data is never permanently destroyed.',
    tip: 'Safe and reversible',
  },
  {
    icon: <StopCircle className="w-9 h-9" />,
    iconBg: 'rgba(251, 191, 36, 0.15)',
    iconColor: Colors.warning,
    title: 'End Recurring Entries',
    description:
      'For monthly, quarterly, or yearly entries, choose "End Recurring" to pick an end date (on or after the start date) to stop future occurrences.',
    tip: 'Available for recurring entries only',
  },
  {
    icon: <Filter className="w-9 h-9" />,
    iconBg: 'rgba(124, 110, 248, 0.15)',
    iconColor: Colors.primary,
    title: 'Filter Your Transactions',
    description:
      'Use the dropdown filters at the top to switch between Monthly, Yearly, and All Time views. Filter further by Income or Expense.',
  },
  {
    icon: <Fingerprint className="w-9 h-9" />,
    iconBg: 'rgba(124, 110, 248, 0.15)',
    iconColor: Colors.primary,
    title: 'Compact Amounts',
    description:
      'Large numbers are shortened for clean viewing (e.g. ₹1.5 L, ₹50k). Hover or click on any compact amount to see the exact full value.',
    tip: 'Works everywhere across the app',
  },
];

interface FeatureGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeatureGuide({ isOpen, onClose }: FeatureGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const step = GUIDE_STEPS[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === GUIDE_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      setCurrentStep(0);
      onClose();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) setCurrentStep((prev) => prev - 1);
  };

  const handleClose = () => {
    setCurrentStep(0);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-[#141428] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#1C1C38] flex items-center justify-center text-[#9898B3] hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7C6EF8]/15 text-[#7C6EF8] text-xs font-bold tracking-wide uppercase mb-6">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Feature Guide</span>
        </div>

        {/* Content */}
        <div className="flex flex-col items-center text-center mb-6">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-4 transition-transform duration-300"
            style={{ backgroundColor: step.iconBg, color: step.iconColor }}
          >
            {step.icon}
          </div>

          <h3 className="text-xl font-extrabold text-white mb-2">{step.title}</h3>
          <p className="text-sm text-[#9898B3] leading-relaxed mb-4">{step.description}</p>

          {step.tip && (
            <div className="w-full flex items-center gap-2 p-3 rounded-xl bg-[#FBBF24]/10 border border-[#FBBF24]/20 text-[#FBBF24] text-xs font-semibold text-left">
              <Lightbulb className="w-4 h-4 flex-shrink-0" />
              <span>{step.tip}</span>
            </div>
          )}
        </div>

        {/* Dots */}
        <div className="flex justify-center items-center gap-2 mb-2">
          {GUIDE_STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentStep(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === currentStep ? 'w-6 bg-[#7C6EF8]' : 'w-2 bg-white/20 hover:bg-white/40'
              }`}
            />
          ))}
        </div>

        {/* Step indicator */}
        <p className="text-center text-xs text-[#5C5C78] font-semibold mb-6">
          {currentStep + 1} of {GUIDE_STEPS.length}
        </p>

        {/* Navigation Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handlePrev}
            disabled={isFirst}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl border border-white/10 bg-[#1C1C38] text-sm font-bold text-[#9898B3] transition-colors ${
              isFirst ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[#1C1C38]/80 hover:text-white'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <button
            onClick={handleNext}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-[#7C6EF8] hover:bg-[#6858f6] text-white text-sm font-bold shadow-lg shadow-[#7C6EF8]/25 transition-all"
          >
            <span>{isLast ? 'Got it!' : 'Next'}</span>
            {isLast ? <Check className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
