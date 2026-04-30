import React, { useState, useRef } from 'react';
import {
  Text, TouchableOpacity, Animated, StyleSheet,
  type TextStyle, type ViewStyle,
} from 'react-native';
import { formatCompactCurrency } from '@/utils/currency';
import { Colors, Radius, Spacing } from '@/constants/Theme';

interface CompactAmountProps {
  /** The raw numeric amount */
  amount: number;
  /** Optional prefix like '+' or '-' */
  prefix?: string;
  /** Style for the short text */
  style?: TextStyle;
  /** Color override for the text */
  color?: string;
  /** numberOfLines for the main text */
  numberOfLines?: number;
  /** adjustsFontSizeToFit */
  adjustsFontSizeToFit?: boolean;
}

/**
 * Shows a compact formatted currency value (e.g. ₹1.5L, ₹2Cr).
 * On press / long-press, reveals the exact value as a tooltip below.
 */
export default function CompactAmount({
  amount,
  prefix = '',
  style,
  color,
  numberOfLines,
  adjustsFontSizeToFit,
}: CompactAmountProps) {
  const { short, full } = formatCompactCurrency(amount);
  const [showTooltip, setShowTooltip] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Only show tooltip if the compact form is actually different from full
  const isCompact = short !== full.replace('.00', '');

  const showTip = () => {
    if (!isCompact) return;
    setShowTooltip(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    // Auto-hide after 2.5s
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(hideTip, 2500);
  };

  const hideTip = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setShowTooltip(false));
  };

  const toggleTip = () => {
    if (showTooltip) {
      if (timerRef.current) clearTimeout(timerRef.current);
      hideTip();
    } else {
      showTip();
    }
  };

  const textColor = color || (style as any)?.color || Colors.textPrimary;

  return (
    <TouchableOpacity
      onPress={toggleTip}
      onLongPress={showTip}
      activeOpacity={0.7}
      style={tooltipStyles.wrapper}
      disabled={!isCompact}
    >
      <Text
        style={[style, color ? { color } : undefined]}
        numberOfLines={numberOfLines}
        adjustsFontSizeToFit={adjustsFontSizeToFit}
      >
        {prefix}{short}
      </Text>

      {showTooltip && (
        <Animated.View
          style={[
            tooltipStyles.tooltip,
            { opacity: fadeAnim, borderColor: `${textColor}33` },
          ]}
        >
          <Text style={[tooltipStyles.tooltipText, { color: textColor }]}>
            {prefix}{full}
          </Text>
        </Animated.View>
      )}
    </TouchableOpacity>
  );
}

const tooltipStyles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    alignItems: 'flex-end',
  },
  tooltip: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 4,
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.sm,
    borderWidth: 1,
    zIndex: 999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  tooltipText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
