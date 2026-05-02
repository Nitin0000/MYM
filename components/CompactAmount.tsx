import React, { useState, useRef } from 'react';
import {
  Text, TouchableOpacity, Animated, StyleSheet,
  Modal, View, Dimensions, Pressable,
  type TextStyle, type ViewStyle,
} from 'react-native';
import { formatCompactCurrency } from '@/utils/currency';
import { Colors, Radius, Spacing } from '@/constants/Theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  const [tooltipPos, setTooltipPos] = useState({ top: 0, right: 0 });
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const anchorRef = useRef<View>(null);

  const showTip = () => {
    // Measure the exact position on screen to render the tooltip modal safely above everything
    anchorRef.current?.measureInWindow((x, y, width, height) => {
      setTooltipPos({
        top: y + height + 4,
        right: SCREEN_WIDTH - (x + width),
      });
      setShowTooltip(true);
      
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(hideTip, 2500);
    });
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
    <>
      <TouchableOpacity
        onPress={toggleTip}
        onLongPress={showTip}
        activeOpacity={0.7}
      >
        <View ref={anchorRef} style={tooltipStyles.wrapper} collapsable={false}>
          <Text
            style={[style, color ? { color } : undefined]}
            numberOfLines={numberOfLines}
            adjustsFontSizeToFit={adjustsFontSizeToFit}
          >
            {prefix}{short}
          </Text>
        </View>
      </TouchableOpacity>

      <Modal visible={showTooltip} transparent animationType="none" onRequestClose={hideTip}>
        <Pressable style={StyleSheet.absoluteFill} onPress={hideTip}>
          <Animated.View
            style={[
              tooltipStyles.tooltip,
              { 
                top: tooltipPos.top, 
                right: tooltipPos.right,
                opacity: fadeAnim, 
                borderColor: `${textColor}33` 
              },
            ]}
          >
            <Text 
              style={[tooltipStyles.tooltipText, { color: textColor }]} 
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {prefix}{full}
            </Text>
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  );
}

const tooltipStyles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    alignItems: 'flex-end',
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: '#000000', // Pure black to ensure it is completely opaque
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
    flexShrink: 0, // prevents text wrapping
  },
});
