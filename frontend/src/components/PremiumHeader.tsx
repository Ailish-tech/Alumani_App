import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Platform, Animated,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';

// ─── Apple-Inspired Header System ───────────────────────────────────────────

interface PremiumHeaderProps {
  title: string;
  subtitle?: string;
  variant?: 'home' | 'standard' | 'search' | 'profile';
  showNotifications?: boolean;
  showSearch?: boolean;
  rightAction?: () => void;
  rightIcon?: string;
  gradient?: [string, string];
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function PremiumHeader({
  title,
  subtitle,
  variant = 'standard',
  showNotifications = true,
  showSearch = false,
  rightAction,
  rightIcon,
  gradient,
}: PremiumHeaderProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 120, friction: 14 }),
    ]).start();
  }, []);

  const topPad = insets.top || (Platform.OS === 'android' ? StatusBar.currentHeight || 32 : 44);
  const firstName = user?.fullName?.split(' ')[0] || 'there';
  const initials = (user?.fullName?.charAt(0) || '?').toUpperCase();

  // ─── HOME variant: greeting + avatar + notifications ──
  if (variant === 'home') {
    return (
      <View style={[styles.headerContainer, { paddingTop: topPad + 8 }]}>
        <LinearGradient
          colors={['#FFFFFF', '#F8F9FA']}
          style={StyleSheet.absoluteFillObject}
        />
        <Animated.View style={[styles.homeRow, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.homeLeft}>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.homeName}>{firstName} 👋</Text>
          </View>
          <View style={styles.homeActions}>
            {showSearch && (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => navigation.navigate('AlumniSearch' as any)}
              >
                <Ionicons name="search" size={20} color="#3C3C43" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('Notifications' as any)}
            >
              <Ionicons name="notifications-outline" size={20} color="#3C3C43" />
              <View style={styles.notifDot} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.avatarBtn}
              onPress={() => navigation.navigate('Profile' as any)}
            >
              <LinearGradient
                colors={['#667EEA', '#764BA2']}
                style={styles.avatarGradient}
              >
                <Text style={styles.avatarText}>{initials}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
        <View style={styles.bottomBorder} />
      </View>
    );
  }

  // ─── PROFILE variant: no header (handled by screen) ──
  if (variant === 'profile') {
    return null;
  }

  // ─── STANDARD / SEARCH variant ──
  const colors = gradient || ['#FFFFFF', '#F8F9FA'];

  return (
    <View style={[styles.headerContainer, { paddingTop: topPad + 8 }]}>
      <LinearGradient colors={colors} style={StyleSheet.absoluteFillObject} />
      <Animated.View style={[styles.standardRow, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.titleWrap}>
          <Text style={styles.standardTitle}>{title}</Text>
          {subtitle && <Text style={styles.standardSubtitle}>{subtitle}</Text>}
        </View>
        <View style={styles.homeActions}>
          {showSearch && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('AlumniSearch' as any)}
            >
              <Ionicons name="search" size={20} color="#3C3C43" />
            </TouchableOpacity>
          )}
          {showNotifications && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('Notifications' as any)}
            >
              <Ionicons name="notifications-outline" size={20} color="#3C3C43" />
            </TouchableOpacity>
          )}
          {rightIcon && rightAction && (
            <TouchableOpacity style={styles.actionBtn} onPress={rightAction}>
              <Ionicons name={rightIcon as any} size={20} color="#3C3C43" />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
      <View style={styles.bottomBorder} />
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingBottom: 14,
    position: 'relative',
    backgroundColor: '#FFFFFF',
  },
  bottomBorder: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },

  // ── Home ──
  homeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  homeLeft: { flex: 1 },
  greeting: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : undefined,
  },
  homeName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1C1C1E',
    letterSpacing: -0.5,
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : undefined,
  },
  homeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    width: 38, height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(120,120,128,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifDot: {
    position: 'absolute',
    top: 8, right: 9,
    width: 7, height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FF3B30',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  avatarBtn: {
    marginLeft: 4,
  },
  avatarGradient: {
    width: 36, height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ── Standard ──
  standardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  titleWrap: { flex: 1 },
  standardTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1C1C1E',
    letterSpacing: -0.5,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : undefined,
  },
  standardSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
    fontWeight: '500',
  },
});
