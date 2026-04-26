/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/Theme';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: string
) {
  return props.dark ?? props.light ?? Colors.textPrimary;
}
