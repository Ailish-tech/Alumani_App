import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { Role } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../types/navigation.types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const mm = Colors.mm;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { devLogin, isLoading } = useAuthStore();

  const handleLogin = async () => {
    const id = email.trim().toLowerCase();
    if (!id) {
      Alert.alert('Missing', 'Please enter your User ID or College ID.');
      return;
    }

    // Determine role from the ID for the dev token header
    let role = Role.STUDENT;
    if (id.includes('admin')) {
      role = Role.ADMIN;
    } else if (id.includes('alumni')) {
      role = Role.ALUMNI;
    } else if (id.includes('faculty')) {
      role = Role.FACULTY;
    }

    try {
      await devLogin(id, role);
    } catch (err: any) {
      Alert.alert('Login Failed', err?.message || 'Could not connect to the server. Make sure the backend is running.');
    }
  };

  return (
    <View style={styles.container}>
      {/* ── Ambient Glow Effects ─────────────────────────────────── */}
      <View style={styles.glowTopLeft} />
      <View style={styles.glowBottomRight} />
      <View style={styles.decorBlobRight} />
      <View style={styles.decorBlobLeft} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── App Logo & Branding ───────────────────────────────── */}
          <View style={styles.brandSection}>
            <LinearGradient
              colors={[mm.gradientStart, mm.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoBox}
            >
              <Ionicons name="people" size={32} color="#FFFFFF" />
            </LinearGradient>

            <Text style={styles.brandName}>AlumniConnect</Text>
            <Text style={styles.brandTagline}>Reconnect with your legacy</Text>
          </View>

          {/* ── Glassmorphism Login Card ──────────────────────────── */}
          <View style={styles.glassCard}>
            {/* Email Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
              <View style={styles.inputRow}>
                <Ionicons
                  name="at-outline"
                  size={20}
                  color={mm.outline}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="name@university.edu"
                  placeholderTextColor={`${mm.outline}66`}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.fieldGroup}>
              <View style={styles.passwordHeader}>
                <Text style={styles.fieldLabel}>PASSWORD</Text>
                <TouchableOpacity activeOpacity={0.7}>
                  <Text style={styles.forgotLink}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.inputRow}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={mm.outline}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={`${mm.outline}66`}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={mm.outline}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Sign In Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.85}
              style={styles.signInWrapper}
            >
              <LinearGradient
                colors={[mm.gradientStart, mm.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.signInButton}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text style={styles.signInText}>Sign In</Text>
                    <Ionicons name="arrow-forward" size={18} color={mm.onPrimaryContainer} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* ── Divider ─────────────────────────────────────────── */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* ── Google Button ────────────────────────────────────── */}
            <TouchableOpacity
              style={styles.googleButton}
              activeOpacity={0.8}
              onPress={handleLogin}
            >
              <Image
                source={{ uri: 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg' }}
                style={styles.googleIcon}
                resizeMode="contain"
              />
              <Ionicons name="logo-google" size={18} color={mm.onSurface} />
              <Text style={styles.googleText}>Google</Text>
            </TouchableOpacity>
          </View>

          {/* ── Footer ─────────────────────────────────────────────── */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Signup')}
              activeOpacity={0.7}
            >
              <Text style={styles.signUpLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          {/* ── Copyright ──────────────────────────────────────────── */}
          <Text style={styles.copyright}>
            © 2024 AlumniConnect • Global Network Division
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const INPUT_BG = mm.surfaceContainerLow;
const INPUT_BORDER = `${mm.outline}26`; // 15% opacity
const CARD_BORDER = `${mm.outlineVariant}33`; // 20% opacity

const styles = StyleSheet.create({
  // ── Layout ───────────────────────────────────────────────
  container: {
    flex: 1,
    backgroundColor: mm.surfaceDim,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },

  // ── Ambient Glows ────────────────────────────────────────
  glowTopLeft: {
    position: 'absolute',
    top: '-10%',
    left: '-10%',
    width: '50%',
    height: '50%',
    borderRadius: 999,
    backgroundColor: mm.glowPurple,
  },
  glowBottomRight: {
    position: 'absolute',
    bottom: '-10%',
    right: '-10%',
    width: '50%',
    height: '50%',
    borderRadius: 999,
    backgroundColor: mm.glowPurple,
  },
  decorBlobRight: {
    position: 'absolute',
    top: 80,
    right: -100,
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: mm.primaryContainer,
    opacity: 0.06,
  },
  decorBlobLeft: {
    position: 'absolute',
    bottom: -200,
    left: -100,
    width: 600,
    height: 600,
    borderRadius: 300,
    backgroundColor: mm.secondaryContainer,
    opacity: 0.06,
  },

  // ── Branding ─────────────────────────────────────────────
  brandSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: mm.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 32,
    elevation: 12,
  },
  brandName: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -1.2,
    color: mm.primary,
  },
  brandTagline: {
    fontSize: 14,
    color: mm.onSurfaceVariant,
    marginTop: 8,
    fontWeight: '500',
    letterSpacing: 0.5,
  },

  // ── Glass Card ───────────────────────────────────────────
  glassCard: {
    backgroundColor: mm.glassBackground,
    borderRadius: 32,
    padding: 32,
    borderWidth: 0.5,
    borderColor: CARD_BORDER,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.5,
    shadowRadius: 48,
    elevation: 16,
  },

  // ── Input Fields ─────────────────────────────────────────
  fieldGroup: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: mm.outline,
    marginBottom: 6,
    marginLeft: 4,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  forgotLink: {
    fontSize: 12,
    fontWeight: '600',
    color: mm.secondary,
    letterSpacing: -0.2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: INPUT_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: INPUT_BORDER,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: mm.onSurface,
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 14,
  },
  eyeButton: {
    padding: 4,
    marginLeft: 8,
  },

  // ── Sign In Button ───────────────────────────────────────
  signInWrapper: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: mm.primaryContainer,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  signInText: {
    fontSize: 15,
    fontWeight: '700',
    color: mm.onPrimaryContainer,
  },

  // ── Divider ──────────────────────────────────────────────
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 28,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: `${mm.outline}1A`, // 10% opacity
  },
  dividerText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
    color: `${mm.outline}99`,
    marginHorizontal: 16,
  },

  // ── Google Button ────────────────────────────────────────
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: mm.surfaceContainerHighest,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${mm.outline}0D`, // 5% opacity
  },
  googleIcon: {
    width: 20,
    height: 20,
  },
  googleText: {
    fontSize: 14,
    fontWeight: '600',
    color: mm.onSurface,
  },

  // ── Footer ───────────────────────────────────────────────
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 14,
    color: mm.onSurfaceVariant,
    fontWeight: '500',
  },
  signUpLink: {
    fontSize: 14,
    fontWeight: '700',
    color: mm.primary,
  },

  // ── Copyright ────────────────────────────────────────────
  copyright: {
    textAlign: 'center',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: `${mm.outline}66`,
    marginTop: 32,
  },
});
