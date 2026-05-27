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
  Alert,
  Dimensions,
} from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../types/navigation.types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const { width } = Dimensions.get('window');

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuthStore();

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
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
      Alert.alert('Login Failed', message);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        {/* ── Decorative Glow ── */}
        <View style={styles.glowCircle} />

        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="people" size={36} color={Colors.primary} />
            </View>
          </View>
          <Text style={styles.title}>AlumniConnect</Text>
          <Text style={styles.subtitle}>Your College Network</Text>
        </View>

        {/* ── Email Field ── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputBox}>
            <Ionicons name="mail-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="you@college.edu"
              placeholderTextColor={Colors.textMuted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </View>
        </View>

        {/* ── Password Field ── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputBox}>
            <Ionicons name="lock-closed-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={Colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoComplete="password"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={Colors.textMuted}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Login Button ── */}
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="log-in-outline" size={22} color="#fff" />
              <Text style={styles.buttonText}>Sign In</Text>
            </>
          )}
        </TouchableOpacity>

        {/* ── Divider ── */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* ── Sign Up Link ── */}
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Signup')}
          activeOpacity={0.7}
        >
          <Ionicons name="person-add-outline" size={20} color={Colors.primary} />
          <Text style={styles.secondaryButtonText}>Create Account</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDark,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },

  // Decorative
  glowCircle: {
    position: 'absolute',
    top: -120,
    alignSelf: 'center',
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: width * 0.45,
    backgroundColor: Colors.primaryGlow,
    opacity: 0.5,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl + 8,
  },
  logoContainer: {
    marginBottom: Spacing.md,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  title: {
    fontSize: FontSize.hero,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },

  // Fields
  fieldGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: Spacing.xs + 2,
    fontWeight: '600',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgInput,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? Spacing.md : Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
  },

  // Primary button
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    marginTop: Spacing.lg,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: '#fff',
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '600',
    letterSpacing: 1.5,
    paddingHorizontal: Spacing.md,
  },

  // Secondary button
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryGlow,
  },
  secondaryButtonText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.primary,
  },
});
