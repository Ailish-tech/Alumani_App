import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { Role } from '../../types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../types/navigation.types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Signup'>;

const { width } = Dimensions.get('window');

const ROLES: { label: string; value: Role; icon: string; color: string }[] = [
  { label: 'Student', value: Role.STUDENT, icon: 'school', color: Colors.roleStudent },
  { label: 'Alumni', value: Role.ALUMNI, icon: 'ribbon', color: Colors.roleAlumni },
  { label: 'Faculty', value: Role.FACULTY, icon: 'briefcase', color: Colors.roleFaculty },
];

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

  const handleRegister = async () => {
    if (!fullName.trim() || !email.trim()) {
      Alert.alert('Missing Fields', 'Name and email are required.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Mismatch', 'Passwords do not match.');
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
      Alert.alert('Signup Failed', message);
    }
  };

  return (
    <View style={styles.container}>
      {/* Decorative glow */}
      <View style={styles.glowCircle} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Back ── */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>

          {/* ── Header ── */}
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join your college network</Text>

          {/* ── Full Name ── */}
          <Text style={styles.label}>Full Name</Text>
          <View style={styles.inputBox}>
            <Ionicons name="person-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Your full name"
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          {/* ── Email ── */}
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputBox}>
            <Ionicons name="mail-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@college.edu"
              placeholderTextColor={Colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          {/* ── Password ── */}
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputBox}>
            <Ionicons name="lock-closed-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Min 6 characters"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* ── Confirm Password ── */}
          <Text style={styles.label}>Confirm Password</Text>
          <View style={styles.inputBox}>
            <Ionicons name="shield-checkmark-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter password"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry={!showConfirm}
            />
            <TouchableOpacity
              onPress={() => setShowConfirm(!showConfirm)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* ── Role Selection ── */}
          <Text style={styles.label}>I am a…</Text>
          <View style={styles.roleRow}>
            {ROLES.map((r) => {
              const isActive = role === r.value;
              return (
                <TouchableOpacity
                  key={r.value}
                  style={[
                    styles.roleChip,
                    isActive && { borderColor: r.color, backgroundColor: `${r.color}12` },
                  ]}
                  onPress={() => setRole(r.value)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={r.icon as any}
                    size={22}
                    color={isActive ? r.color : Colors.textMuted}
                  />
                  <Text style={[styles.roleChipText, isActive && { color: r.color }]}>
                    {r.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Domain ── */}
          <Text style={styles.label}>Domain (optional)</Text>
          <View style={styles.inputBox}>
            <Ionicons name="briefcase-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={domain}
              onChangeText={setDomain}
              placeholder="e.g. Software Engineering"
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          {/* ── Register Button ── */}
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="person-add-outline" size={20} color="#fff" />
                <Text style={styles.buttonText}>Create Account</Text>
              </>
            )}
          </TouchableOpacity>

          {/* ── Login Link ── */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.linkRow}
            activeOpacity={0.7}
          >
            <Text style={styles.linkText}>
              Already have an account?{' '}
              <Text style={styles.linkHighlight}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
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
    padding: Spacing.lg,
    paddingTop: 56,
    paddingBottom: Spacing.xxl,
  },
  glowCircle: {
    position: 'absolute',
    top: -140,
    right: -60,
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    backgroundColor: Colors.primaryGlow,
    opacity: 0.4,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
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
    marginBottom: Spacing.lg,
    marginTop: Spacing.xs,
  },
  label: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '600',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs + 2,
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
  roleRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  roleChip: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.sm + 2,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  roleChipText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    marginTop: Spacing.xl,
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
  linkRow: {
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  linkText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  linkHighlight: {
    color: Colors.primary,
    fontWeight: '700',
  },
});
