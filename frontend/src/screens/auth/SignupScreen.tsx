import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert,
  Animated,
  StatusBar,
  Image,
} from 'react-native';
import { AppleAlert } from '../../components/AppleAlert';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { Role } from '../../types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../types/navigation.types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Signup'>;



// ─── LinkedIn-Inspired Color Palette (Local) ────────────────────────────────
const LI = {
  blue: '#0A66C2',
  blueDark: '#004182',
  white: '#FFFFFF',
  bgLight: '#F3F2EF',
  border: '#DCE6F1',
  textDark: '#191919',
  textSecondary: '#666666',
};

// ─── College Logo ───────────────────────────────────────────────────────────
const collegeLogo = require('../../../assets/college-logo.jpg');

// ─── Role Chips ─────────────────────────────────────────────────────────────
const ROLES: { label: string; value: Role; icon: keyof typeof Ionicons.glyphMap; desc: string }[] = [
  { label: 'Student', value: Role.STUDENT, icon: 'school-outline', desc: 'Currently enrolled' },
  { label: 'Alumni', value: Role.ALUMNI, icon: 'ribbon-outline', desc: 'Graduate' },
  { label: 'Faculty', value: Role.FACULTY, icon: 'briefcase-outline', desc: 'Professor / Staff' },
];

// ─── Main Signup Screen ─────────────────────────────────────────────────────
export default function SignupScreen({ navigation }: Props) {
  const { signup, isLoading } = useAuthStore();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<Role>(Role.STUDENT);
  const [domain, setDomain] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Focus states


  // ── Animations ──────────────────────────────────────────────────────────
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(18)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(40)).current;
  const footerOpacity = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.stagger(160, [
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          tension: 60,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(headerOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(headerTranslateY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
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
      Animated.timing(footerOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

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

  const handleRegister = async () => {
    if (!fullName.trim() || !email.trim()) {
      AppleAlert.alert('Missing Fields', 'Name and email are required.');
      return;
    }
    if (password.length < 6) {
      AppleAlert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      AppleAlert.alert('Mismatch', 'Passwords do not match.');
      return;
    }
    try {
      await signup({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        role,
        domain: domain.trim() || undefined,
      });
    } catch (e: any) {
      const message =
        e?.code === 'auth/email-already-in-use'
          ? 'An account with this email already exists.'
          : e?.code === 'auth/invalid-email'
          ? 'Please enter a valid email address.'
          : e?.code === 'auth/weak-password'
          ? 'Password is too weak. Use at least 6 characters.'
          : e?.response?.data?.error || e?.message || 'Registration failed.';
      AppleAlert.alert('Signup Failed', message);
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
          {/* ── Back Button ──────────────────────────────────────────── */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color={LI.textDark} />
          </TouchableOpacity>

          {/* ── Logo ─────────────────────────────────────────────────── */}
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

          {/* ── Header ───────────────────────────────────────────────── */}
          <Animated.View
            style={[
              styles.headerSection,
              {
                opacity: headerOpacity,
                transform: [{ translateY: headerTranslateY }],
              },
            ]}
          >
            <Text style={styles.title}>Join AlumniConnect</Text>
            <Text style={styles.subtitle}>
              Create your account and connect with your college network
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
            {/* Full Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.input}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Your full name"
                  placeholderTextColor="#B0B0B0"
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@college.edu"
                  placeholderTextColor="#B0B0B0"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Min 6 characters"
                  placeholderTextColor="#B0B0B0"
                  secureTextEntry={!showPassword}
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

            {/* Confirm Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter password"
                  placeholderTextColor="#B0B0B0"
                  secureTextEntry={!showConfirm}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirm(!showConfirm)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={styles.showBtn}
                >
                  <Text style={styles.showBtnText}>
                    {showConfirm ? 'Hide' : 'Show'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Role Selection */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>I am a…</Text>
              <View style={styles.roleRow}>
                {ROLES.map((r) => {
                  const isActive = role === r.value;
                  return (
                    <TouchableOpacity
                      key={r.value}
                      style={[
                        styles.roleChip,
                        isActive && styles.roleChipActive,
                      ]}
                      onPress={() => setRole(r.value)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={r.icon}
                        size={22}
                        color={isActive ? LI.blue : LI.textSecondary}
                      />
                      <Text
                        style={[
                          styles.roleChipLabel,
                          isActive && styles.roleChipLabelActive,
                        ]}
                      >
                        {r.label}
                      </Text>
                      <Text
                        style={[
                          styles.roleChipDesc,
                          isActive && { color: LI.blue },
                        ]}
                      >
                        {r.desc}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Domain */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Domain{' '}
                <Text style={styles.labelOptional}>(optional)</Text>
              </Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.input}
                  value={domain}
                  onChangeText={setDomain}
                  placeholder="e.g. Software Engineering"
                  placeholderTextColor="#B0B0B0"
                />
              </View>
            </View>

            {/* Agree & Register Button */}
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                style={[styles.registerBtn, isLoading && styles.registerBtnDisabled]}
                onPress={handleRegister}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                disabled={isLoading}
                activeOpacity={0.9}
              >
                {isLoading ? (
                  <ActivityIndicator color={LI.white} size="small" />
                ) : (
                  <Text style={styles.registerBtnText}>Agree & Join</Text>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Terms text */}
            <Text style={styles.termsText}>
              By clicking Agree & Join, you agree to the AlumniConnect{' '}
              <Text style={styles.termsLink}>User Agreement</Text> and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>.
            </Text>
          </Animated.View>

          {/* ── Footer ───────────────────────────────────────────────── */}
          <Animated.View style={[styles.footer, { opacity: footerOpacity }]}>
            <Text style={styles.footerText}>Already on AlumniConnect? </Text>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Text style={styles.footerLink}>Sign in</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* ── College Footer ────────────────────────────────────────── */}
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
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
  },

  // ── Back Button ───────────────────────────────────────────────────────────
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: LI.bgLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: LI.border,
  },

  // ── Logo ──────────────────────────────────────────────────────────────────
  logoSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  collegeLogo: {
    width: 80,
    height: 80,
    borderRadius: 14,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  headerSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: LI.textDark,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: LI.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
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
  labelOptional: {
    fontWeight: '400',
    color: LI.textSecondary,
    fontSize: 13,
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

  // ── Role Selection ────────────────────────────────────────────────────────
  roleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  roleChip: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 14,
    paddingHorizontal: 6,
    backgroundColor: LI.bgLight,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: LI.border,
  },
  roleChipActive: {
    borderColor: LI.blue,
    backgroundColor: 'rgba(10, 102, 194, 0.06)',
  },
  roleChipLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: LI.textDark,
  },
  roleChipLabelActive: {
    color: LI.blue,
  },
  roleChipDesc: {
    fontSize: 10,
    color: LI.textSecondary,
    textAlign: 'center',
  },

  // ── Register Button ───────────────────────────────────────────────────────
  registerBtn: {
    backgroundColor: LI.blue,
    borderRadius: 28,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: LI.blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  registerBtnDisabled: {
    opacity: 0.65,
  },
  registerBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: LI.white,
    letterSpacing: 0.3,
  },

  // ── Terms ─────────────────────────────────────────────────────────────────
  termsText: {
    fontSize: 12,
    color: LI.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 16,
  },
  termsLink: {
    color: LI.blue,
    fontWeight: '600',
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
