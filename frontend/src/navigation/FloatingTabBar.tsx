import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TAB_BAR_WIDTH = SCREEN_WIDTH - 32;
const TAB_BAR_HEIGHT = 68;
const INDICATOR_SIZE = 44;

// ─── Apple Music-inspired palette ───────────────────────────────────────────
const AM = {
  // Primary tint — deep LinkedIn blue with Apple Music's vibrancy
  tint: '#0A66C2',
  tintGlow: 'rgba(10, 102, 194, 0.35)',
  tintSoft: 'rgba(10, 102, 194, 0.12)',
  // Glass surface
  glassBg: 'rgba(255, 255, 255, 0.72)',
  glassBorder: 'rgba(255, 255, 255, 0.55)',
  glassHighlight: 'rgba(255, 255, 255, 0.90)',
  // Text
  active: '#0A66C2',
  inactive: '#8E8E93',
  // Shadows
  shadowColor: 'rgba(0, 0, 0, 0.12)',
};

const TAB_CONFIG: Record<string, { icon: string; iconFilled: string; label: string }> = {
  Home: { icon: 'home-outline', iconFilled: 'home', label: 'Home' },
  Explore: { icon: 'compass-outline', iconFilled: 'compass', label: 'Explore' },
  Mentorship: { icon: 'school-outline', iconFilled: 'school', label: 'Mentor' },
  Messages: { icon: 'chatbubbles-outline', iconFilled: 'chatbubbles', label: 'Chat' },
  Profile: { icon: 'person-outline', iconFilled: 'person', label: 'Profile' },
  // Alumni-specific tabs
  Dashboard: { icon: 'stats-chart-outline', iconFilled: 'stats-chart', label: 'Impact' },
  AlumniExplore: { icon: 'ribbon-outline', iconFilled: 'ribbon', label: 'Hub' },
};

// ─── Individual Tab Button with spring animations ────────────────────────────
function TabButton({
  routeName, isFocused, onPress, onLongPress,
}: {
  routeName: string; isFocused: boolean;
  onPress: () => void; onLongPress: () => void;
}) {
  const config = TAB_CONFIG[routeName] || { icon: 'apps-outline', iconFilled: 'apps', label: routeName };
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: isFocused ? 1 : 0.88,
        useNativeDriver: true,
        tension: 300,
        friction: 15,
      }),
      Animated.spring(glowAnim, {
        toValue: isFocused ? 1 : 0,
        useNativeDriver: true,
        tension: 200,
        friction: 18,
      }),
      Animated.spring(translateY, {
        toValue: isFocused ? -2 : 0,
        useNativeDriver: true,
        tension: 300,
        friction: 15,
      }),
    ]).start();
  }, [isFocused]);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const iconName = isFocused ? config.iconFilled : config.icon;

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
      style={styles.tabButton}
    >
      <Animated.View
        style={[
          styles.tabContent,
          { transform: [{ scale: scaleAnim }, { translateY }] },
        ]}
      >
        {/* Glow ring behind active icon */}
        <Animated.View style={[styles.glowRing, { opacity: glowOpacity }]}>
          <LinearGradient
            colors={[AM.tintGlow, 'rgba(10, 102, 194, 0.05)', 'transparent']}
            style={styles.glowGradient}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
        </Animated.View>

        {/* Active indicator pill */}
        <Animated.View
          style={[
            styles.activeIndicator,
            {
              opacity: glowAnim,
              transform: [{ scaleX: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }],
            },
          ]}
        />

        <Ionicons
          name={iconName as any}
          size={isFocused ? 24 : 22}
          color={isFocused ? AM.active : AM.inactive}
        />

        <Animated.Text
          style={[
            styles.tabLabel,
            {
              color: isFocused ? AM.active : AM.inactive,
              fontWeight: isFocused ? '700' : '500',
              opacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }),
            },
          ]}
        >
          {config.label}
        </Animated.Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Floating Tab Bar ─────────────────────────────────────────────────────────
export default function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.floatingContainer}>
      {/* Outer shadow layers for depth */}
      <View style={styles.shadowLayer} />

      {/* Main glass container */}
      <View style={styles.barWrapper}>
        <BlurView intensity={80} tint="light" style={styles.blurView}>
          {/* Glass surface gradient */}
          <LinearGradient
            colors={[AM.glassHighlight, AM.glassBg, 'rgba(245, 245, 250, 0.65)']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.glassGradient}
          />

          {/* Top highlight line (liquid glass reflection) */}
          <LinearGradient
            colors={['rgba(255,255,255,0.8)', 'rgba(255,255,255,0.0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.topHighlight}
          />

          {/* Tab buttons */}
          <View style={styles.tabsContainer}>
            {state.routes.map((route, index) => {
              const { options } = descriptors[route.key];
              const isFocused = state.index === index;

              const onPress = () => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name, route.params);
                }
              };

              const onLongPress = () => {
                navigation.emit({ type: 'tabLongPress', target: route.key });
              };

              return (
                <TabButton
                  key={route.key}
                  routeName={route.name}
                  isFocused={isFocused}
                  onPress={onPress}
                  onLongPress={onLongPress}
                />
              );
            })}
          </View>
        </BlurView>

        {/* Border overlay for glass edge */}
        <View style={styles.borderOverlay} />
      </View>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 28 : 16,
    left: 16,
    right: 16,
    alignItems: 'center',
  },

  shadowLayer: {
    position: 'absolute',
    bottom: -2,
    left: 4,
    right: 4,
    height: TAB_BAR_HEIGHT,
    borderRadius: 28,
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 20,
  },

  barWrapper: {
    width: '100%',
    height: TAB_BAR_HEIGHT,
    borderRadius: 26,
    overflow: 'hidden',
  },

  blurView: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 26,
  },

  glassGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 26,
  },

  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1,
    opacity: 0.8,
  },

  borderOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: AM.glassBorder,
    pointerEvents: 'none',
  },

  tabsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },

  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },

  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  glowRing: {
    position: 'absolute',
    top: -10,
    width: INDICATOR_SIZE + 8,
    height: INDICATOR_SIZE + 8,
    borderRadius: (INDICATOR_SIZE + 8) / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  glowGradient: {
    width: '100%',
    height: '100%',
    borderRadius: (INDICATOR_SIZE + 8) / 2,
  },

  activeIndicator: {
    position: 'absolute',
    top: -6,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: AM.tint,
  },

  tabLabel: {
    fontSize: 10,
    marginTop: 3,
    letterSpacing: 0.2,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : undefined,
  },
});
