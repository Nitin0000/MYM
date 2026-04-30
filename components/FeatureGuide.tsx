import React, { useState, useRef } from 'react';
import {
  Modal, View, Text, StyleSheet,
  TouchableOpacity, Pressable, Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '@/constants/Theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type GuideStep = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  tip?: string;
};

const GUIDE_STEPS: GuideStep[] = [
  {
    icon: 'hand-left',
    iconBg: `${Colors.primary}22`,
    iconColor: Colors.primary,
    title: 'Long Press for Actions',
    description:
      'Press and hold any transaction card in the History tab to open an action menu with options to Delete or End the entry.',
    tip: 'Hold for about half a second',
  },
  {
    icon: 'text',
    iconBg: `${Colors.danger}18`,
    iconColor: Colors.danger,
    title: 'Type "delete" to Confirm',
    description:
      'To prevent accidental deletions, you\'ll need to type the word "delete" in the confirmation popup before the entry is removed.',
    tip: 'This keeps your data safe',
  },
  {
    icon: 'shield-checkmark',
    iconBg: `${Colors.success}22`,
    iconColor: Colors.success,
    title: 'Soft Delete — Nothing Lost',
    description:
      'Deleted entries are safely archived and hidden from your records. Your data is never permanently lost.',
    tip: 'Recovery coming soon',
  },
  {
    icon: 'stop-circle',
    iconBg: `${Colors.warning}22`,
    iconColor: Colors.warning,
    title: 'End Recurring Entries',
    description:
      'For monthly, quarterly, or yearly entries, choose "End Recurring" from the long-press menu. Pick an end date (must be after the start date) to stop future recurrences.',
    tip: 'Only available for recurring entries',
  },
  {
    icon: 'funnel',
    iconBg: `${Colors.primary}18`,
    iconColor: Colors.primary,
    title: 'Filter Your Transactions',
    description:
      'Use the dropdown filters at the top to switch between Monthly, Yearly, and All Time views. Tap the category pill to filter by Income or Expense.',
  },
  {
    icon: 'finger-print',
    iconBg: `${Colors.primary}22`,
    iconColor: Colors.primary,
    title: 'Compact Amounts',
    description:
      'Large numbers are shortened (e.g. ₹1.5 Lac). Long-press or tap on any amount to see the full value.',
    tip: 'Works everywhere in the app',
  },
];

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function FeatureGuide({ visible, onClose }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const step = GUIDE_STEPS[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === GUIDE_STEPS.length - 1;

  const animateTransition = (next: number) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start(() => {
      setCurrentStep(next);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  const goNext = () => {
    if (isLast) {
      handleClose();
    } else {
      animateTransition(currentStep + 1);
    }
  };

  const goPrev = () => {
    if (!isFirst) animateTransition(currentStep - 1);
  };

  const handleClose = () => {
    setCurrentStep(0);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          {/* Close button */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={handleClose}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={20} color={Colors.textMuted} />
          </TouchableOpacity>

          {/* Header badge */}
          <View style={styles.headerBadge}>
            <Ionicons name="book-outline" size={12} color={Colors.primary} />
            <Text style={styles.headerBadgeText}>Feature Guide</Text>
          </View>

          {/* Step content */}
          <Animated.View
            style={[styles.stepContent, { opacity: fadeAnim }]}
          >
            {/* Icon */}
            <View style={[styles.iconCircle, { backgroundColor: step.iconBg }]}>
              <Ionicons name={step.icon} size={36} color={step.iconColor} />
            </View>

            {/* Title */}
            <Text style={styles.stepTitle}>{step.title}</Text>

            {/* Description */}
            <Text style={styles.stepDesc}>{step.description}</Text>

            {/* Tip */}
            {step.tip && (
              <View style={styles.tipBox}>
                <Ionicons name="bulb" size={14} color={Colors.warning} />
                <Text style={styles.tipText}>{step.tip}</Text>
              </View>
            )}
          </Animated.View>

          {/* Pagination dots */}
          <View style={styles.dots}>
            {GUIDE_STEPS.map((_, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => animateTransition(i)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.dot,
                    i === currentStep && styles.dotActive,
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Step counter */}
          <Text style={styles.stepCounter}>
            {currentStep + 1} of {GUIDE_STEPS.length}
          </Text>

          {/* Navigation buttons */}
          <View style={styles.navRow}>
            <TouchableOpacity
              style={[styles.navBtn, styles.navBtnSecondary, isFirst && { opacity: 0.3 }]}
              onPress={goPrev}
              activeOpacity={0.7}
              disabled={isFirst}
            >
              <Ionicons name="chevron-back" size={18} color={Colors.textSecondary} />
              <Text style={styles.navBtnSecondaryText}>Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navBtn, styles.navBtnPrimary]}
              onPress={goNext}
              activeOpacity={0.7}
            >
              <Text style={styles.navBtnPrimaryText}>
                {isLast ? 'Got it!' : 'Next'}
              </Text>
              {!isLast && (
                <Ionicons name="chevron-forward" size={18} color="#fff" />
              )}
              {isLast && (
                <Ionicons name="checkmark" size={18} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 32,
    elevation: 20,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: `${Colors.primary}18`,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: Spacing.lg,
  },
  headerBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  stepContent: {
    alignItems: 'center',
    width: '100%',
    marginBottom: Spacing.lg,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  stepDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing.sm,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: `${Colors.warning}12`,
    borderWidth: 1,
    borderColor: `${Colors.warning}30`,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: Spacing.md,
    width: '100%',
  },
  tipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.warning,
    flex: 1,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.cardBorder,
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  stepCounter: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: Spacing.lg,
  },
  navRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  navBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: Radius.md,
  },
  navBtnSecondary: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  navBtnSecondaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  navBtnPrimary: {
    backgroundColor: Colors.primary,
  },
  navBtnPrimaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});
