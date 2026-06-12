import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Alert,
  Animated,
  StatusBar,
  ScrollView,
  Image,
} from 'react-native';
import { AppleAlert } from '../../components/AppleAlert';
import { useAuthStore } from '../../store/authStore';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../types/navigation.types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;



// ─── LinkedIn-Inspired Color Palette (Local) ────────────────────────────────
const LI = {
  blue: '#0A66C2',
  blueDark: '#004182',
  white: '#FFFFFF',
  bgLight: '#F3F2EF',
  border: '#DCE6F1',
  textDark: '#191919',
  textSecondary: '#666666',
  shieldBlue: '#1B3A6B',
  shieldLight: '#2E5DA8',
  gold: '#C9A84C',
};

// ─── College Logo Asset ─────────────────────────────────────────────────────
const collegeLogo = require('../../../assets/college-logo.jpg');

// ─── Main Login Screen ──────────────────────────────────────────────────────
export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuthStore();

  // ── Animation values ────────────────────────────────────────────────────
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(18)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(40)).current;
  const footerOpacity = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.stagger(180, [
      // 1. Logo fades in + scales up
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          tension: 60,
          useNativeDriver: true,
        }),
      ]),
      // 2. Title slides up
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 450,
          useNativeDriver: true,
        }),
      ]),
      // 3. Card slides up
      Animated.parallel([
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(cardTranslateY, {
          toValue: 0,
          friction: 7,
          tension: 50,
          useNativeDriver: true,
        }),
      ]),
      // 4. Footer fades in
      Animated.timing(footerOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ── Button press animation ──────────────────────────────────────────────
  const onPressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.96,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };
  const onPressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      AppleAlert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }
    try {
      await login(email.trim(), password);
    } catch (e: any) {
      const message =
        e?.code === 'auth/invalid-credential'
          ? 'Invalid email or password. Please try again.'
          : e?.code === 'auth/user-not-found'
          ? 'No account found with that email.'
          : e?.code === 'auth/too-many-requests'
          ? 'Too many attempts. Please try again later.'
          : e?.message || 'Login failed. Please try again.';
      AppleAlert.alert('Login Failed', message);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={LI.white} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          {/* ── Logo + Branding ──────────────────────────────────────── */}
          <Animated.View
            style={[
              styles.logoSection,
              {
                opacity: logoOpacity,
                transform: [{ scale: logoScale }],
              },
            ]}
          >
            <Image
              source={collegeLogo}
              style={styles.collegeLogo}
              resizeMode="contain"
            />
          </Animated.View>

          {/* ── Title ────────────────────────────────────────────────── */}
          <Animated.View
            style={[
              styles.titleSection,
              {
                opacity: titleOpacity,
                transform: [{ translateY: titleTranslateY }],
              },
            ]}
          >
            <Text style={styles.title}>Sign in</Text>
            <Text style={styles.subtitle}>
              Stay connected with your college community
            </Text>
          </Animated.View>

          {/* ── Form Card ────────────────────────────────────────────── */}
          <Animated.View
            style={[
              styles.card,
              {
                opacity: cardOpacity,
                transform: [{ translateY: cardTranslateY }],
              },
            ]}
          >
            {/* Email Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.input}
                  placeholder="you@college.edu"
                  placeholderTextColor="#B0B0B0"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#B0B0B0"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={styles.showBtn}
                >
                  <Text style={styles.showBtnText}>
                    {showPassword ? 'Hide' : 'Show'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity activeOpacity={0.7} style={styles.forgotRow}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            {/* Sign In Button */}
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                style={[styles.signInBtn, isLoading && styles.signInBtnDisabled]}
                onPress={handleLogin}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                disabled={isLoading}
                activeOpacity={0.9}
              >
                {isLoading ? (
                  <ActivityIndicator color={LI.white} size="small" />
                ) : (
                  <Text style={styles.signInBtnText}>Sign in</Text>
                )}
              </TouchableOpacity>
            </Animated.View>


          </Animated.View>

          {/* ── Footer ───────────────────────────────────────────────── */}
          <Animated.View style={[styles.footer, { opacity: footerOpacity }]}>
            <Text style={styles.footerText}>
              New to AlumniConnect?{' '}
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Signup')}
              activeOpacity={0.7}
            >
              <Text style={styles.footerLink}>Join now</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* ── College Name ──────────────────────────────────────────── */}
          <Animated.View style={[styles.collegeFooter, { opacity: footerOpacity }]}>
            <Text style={styles.collegeName}>
              Anand International College of Engineering
            </Text>
            <Text style={styles.collegeTagline}>Empowering Futures</Text>
          </Animated.View>
        </ScrollView>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: LI.white,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
    paddingBottom: 40,
  },

  // ── Logo ──────────────────────────────────────────────────────────────────
  logoSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  collegeLogo: {
    width: 110,
    height: 110,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },

  // ── Title ─────────────────────────────────────────────────────────────────
  titleSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: LI.textDark,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: LI.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // ── Card ──────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: LI.white,
    borderRadius: 10,
    padding: 24,
    borderWidth: 1,
    borderColor: LI.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },

  // ── Fields ────────────────────────────────────────────────────────────────
  fieldGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: LI.textDark,
    marginBottom: 6,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#BDBDBD',
    borderRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    backgroundColor: LI.white,
  },
  inputBoxFocused: {
    borderColor: LI.blue,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: LI.textDark,
    padding: 0,
  },
  showBtn: {
    paddingLeft: 10,
  },
  showBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: LI.blue,
  },

  // ── Forgot ────────────────────────────────────────────────────────────────
  forgotRow: {
    marginBottom: 20,
  },
  forgotText: {
    fontSize: 14,
    fontWeight: '600',
    color: LI.blue,
  },

  // ── Sign In Button ────────────────────────────────────────────────────────
  signInBtn: {
    backgroundColor: LI.blue,
    borderRadius: 28,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: LI.blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  signInBtnDisabled: {
    opacity: 0.65,
  },
  signInBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: LI.white,
    letterSpacing: 0.3,
  },



  // ── Footer ────────────────────────────────────────────────────────────────
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
  },
  footerText: {
    fontSize: 15,
    color: LI.textDark,
  },
  footerLink: {
    fontSize: 15,
    fontWeight: '700',
    color: LI.blue,
  },

  // ── College Footer ────────────────────────────────────────────────────────
  collegeFooter: {
    alignItems: 'center',
    marginTop: 32,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: LI.border,
  },
  collegeName: {
    fontSize: 12,
    fontWeight: '600',
    color: LI.textSecondary,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  collegeTagline: {
    fontSize: 11,
    color: '#999999',
    marginTop: 3,
    fontStyle: 'italic',
  },
});
