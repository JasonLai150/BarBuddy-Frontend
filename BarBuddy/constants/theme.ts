/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

// Bar Buddy Color Palette
const barBuddyPrimary = '#7ED9CF';
const barBuddyDark = '#474A4D';
const barBuddyGray = '#787C7F';
const barBuddyLight = '#E5E7EB';

export const Colors = {
  light: {
    text: '#11181C',
    background: barBuddyLight,
    tint: barBuddyPrimary,
    icon: barBuddyGray,
    tabIconDefault: barBuddyGray,
    tabIconSelected: barBuddyPrimary,
  },
  dark: {
    text: '#ECEDEE',
    background: barBuddyDark,
    tint: barBuddyPrimary,
    icon: barBuddyGray,
    tabIconDefault: barBuddyGray,
    tabIconSelected: barBuddyPrimary,
  },
};

export const BarBuddyColors = {
  primary: barBuddyPrimary,
  dark: barBuddyDark,
  gray: barBuddyGray,
  light: barBuddyLight,
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
