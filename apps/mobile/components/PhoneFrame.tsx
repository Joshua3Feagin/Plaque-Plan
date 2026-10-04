// PhoneFrame: wraps the app in an iPhone-shaped shell **on web only**, so the
// browser demo on a Mac reads as an iPhone (the demo goal) without a phone,
// Xcode, or any networking. On native (iOS/Android, incl. the Simulator) it is a
// transparent passthrough and changes nothing.
//
// The frame is a fixed 390×844 pt viewport (iPhone 14/15 logical size) with
// rounded corners, a notch, and a soft drop shadow, centered on a muted page
// background. The real app renders inside a clipped area, so every screen
// behaves exactly as it would on device.

import { Platform, View, StyleSheet, type ViewStyle } from 'react-native';

// Logical iPhone dimensions (points). Matches a modern iPhone's CSS viewport.
const PHONE_WIDTH = 390;
const PHONE_HEIGHT = 844;
const RADIUS = 48;

export function PhoneFrame({ children }: { children: React.ReactNode }) {
  // Native (device or Simulator): render the app as-is.
  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  // Web: paint a centered phone shell with the app clipped inside it.
  return (
    <View style={styles.page}>
      <View style={styles.phone}>
        {/* Notch */}
        <View style={styles.notch} pointerEvents="none" />
        {/* App viewport (clipped to the rounded screen) */}
        <View style={styles.screen}>{children}</View>
      </View>
    </View>
  );
}

const webShadow: ViewStyle =
  Platform.OS === 'web'
    ? // Use a real CSS box-shadow on web for a crisp device shadow.
      ({ boxShadow: '0 24px 60px rgba(0,0,0,0.35)' } as unknown as ViewStyle)
    : {};

const styles = StyleSheet.create({
  page: {
    flex: 1,
    // Muted page backdrop so the phone pops. Not a brand surface on purpose —
    // this is the "desk" the phone sits on, only visible on web.
    backgroundColor: '#E7E1DA',
    alignItems: 'center',
    justifyContent: 'center',
    // Give a little breathing room on short windows.
    paddingVertical: 24,
  },
  phone: {
    width: PHONE_WIDTH,
    height: PHONE_HEIGHT,
    maxHeight: '100%',
    borderRadius: RADIUS,
    backgroundColor: '#000',
    // Bezel thickness around the screen.
    padding: 6,
    ...webShadow,
  },
  screen: {
    flex: 1,
    borderRadius: RADIUS - 6,
    overflow: 'hidden',
    backgroundColor: '#FBF8F4',
  },
  notch: {
    position: 'absolute',
    top: 6,
    alignSelf: 'center',
    zIndex: 10,
    width: 150,
    height: 28,
    backgroundColor: '#000',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
});
