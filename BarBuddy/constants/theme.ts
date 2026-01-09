/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

// Bar Buddy Color Palette - Primary Colors
const barBuddyPrimary = '#7ED9CF';
const barBuddyDark = '#474A4D';
const barBuddyGray = '#787C7F';
const barBuddyLight = '#E5E7EB';

// Bar Buddy Color Palette - UI Component Colors
const barBuddyCardBackground = '#2A2D30';
const barBuddyInnerBackground = '#1F2224';
const barBuddyDeepBackground = '#0F1114';
const barBuddyBorder = '#444751';
const barBuddyInnerBorder = '#3A3D41';
const barBuddyWhiteText = '#E5E7EB';

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
  cardBackground: barBuddyCardBackground,
  innerBackground: barBuddyInnerBackground,
  deepBackground: barBuddyDeepBackground,
  border: barBuddyBorder,
  innerBorder: barBuddyInnerBorder,
  whiteText: barBuddyWhiteText,
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
