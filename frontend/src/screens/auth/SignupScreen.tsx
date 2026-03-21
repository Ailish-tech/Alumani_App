import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { Role } from '../../types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../types/navigation.types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Signup'>;

const ROLES: { label: string; value: Role; icon: string; color: string }[] = [
  { label: 'Student', value: Role.STUDENT, icon: 'school', color: Colors.roleStudent },
  { label: 'Alumni', value: Role.ALUMNI, icon: 'ribbon', color: Colors.roleAlumni },
  { label: 'Faculty', value: Role.FACULTY, icon: 'briefcase', color: Colors.roleFaculty },
];

export default function SignupScreen({ navigation }: Props) {
  const { register, devLogin, isLoading } = useAuthStore();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>(Role.STUDENT);
  const [domain, setDomain] = useState('');

  const handleRegister = async () => {
    if (!fullName.trim() || !email.trim()) {
      Alert.alert('Validation', 'Name and email are required.');
      return;
    }
    try {
      // Dev mode: first devLogin to get a token, then register
      const devId = `user-${Date.now()}`;
      await devLogin(devId, role);
      await register({ fullName: fullName.trim(), email: email.trim(), role, domain: domain.trim() });
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error || 'Registration failed.');
    }
  };

  return (
    <View style={styles.container}>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          {/* Header */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join your college network</Text>

          {/* Full Name */}
          <Text style={styles.label}>Full Name</Text>
          <View style={styles.inputBox}>
            <Ionicons name="person-outline" size={20} color={Colors.textMuted} />
            <TextInput style={styles.input} value={fullName} onChangeText={setFullName}
              placeholder="Your full name" placeholderTextColor={Colors.textMuted} />
          </View>

          {/* Email */}
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputBox}>
            <Ionicons name="mail-outline" size={20} color={Colors.textMuted} />
            <TextInput style={styles.input} value={email} onChangeText={setEmail}
              placeholder="you@college.edu" placeholderTextColor={Colors.textMuted}
              keyboardType="email-address" autoCapitalize="none" />
          </View>

          {/* Role */}
          <Text style={styles.label}>Role</Text>
          <View style={styles.roleRow}>
            {ROLES.map((r) => (
              <TouchableOpacity key={r.value}
                style={[styles.roleChip, role === r.value && { borderColor: r.color, backgroundColor: `${r.color}15` }]}
                onPress={() => setRole(r.value)}>
                <Ionicons name={r.icon as any} size={20} color={role === r.value ? r.color : Colors.textMuted} />
                <Text style={[styles.roleChipText, role === r.value && { color: r.color }]}>{r.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Domain */}
          <Text style={styles.label}>Domain (optional)</Text>
          <View style={styles.inputBox}>
            <Ionicons name="briefcase-outline" size={20} color={Colors.textMuted} />
            <TextInput style={styles.input} value={domain} onChangeText={setDomain}
              placeholder="e.g. Software Engineering" placeholderTextColor={Colors.textMuted} />
          </View>

          {/* Register Button */}
          <TouchableOpacity style={styles.registerBtn} onPress={handleRegister} disabled={isLoading} activeOpacity={0.8}>
            <View style={styles.registerGradient}>
              {isLoading ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Ionicons name="person-add-outline" size={20} color="#fff" />
                  <Text style={styles.registerText}>Create Account</Text>
                </>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()} style={{ alignItems: 'center', marginTop: Spacing.md }}>
            <Text style={styles.linkText}>Already have an account? <Text style={{ color: Colors.primary }}>Sign In</Text></Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDark },
  content: { padding: Spacing.lg, paddingTop: 60 },
  backBtn: { marginBottom: Spacing.md },
  title: { fontSize: FontSize.hero, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -1 },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, marginBottom: Spacing.lg },
  label: { fontSize: FontSize.sm, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginTop: Spacing.md, marginBottom: Spacing.xs },
  inputBox: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.bgInput, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  input: { flex: 1, color: Colors.textPrimary, fontSize: FontSize.md },
  roleRow: { flexDirection: 'row', gap: Spacing.sm },
  roleChip: {
    flex: 1, alignItems: 'center', gap: 4, padding: Spacing.sm,
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  roleChipText: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textMuted },
  registerBtn: { marginTop: Spacing.xl, borderRadius: BorderRadius.md, overflow: 'hidden' },
  registerGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: Spacing.md, backgroundColor: Colors.primary },
  registerText: { fontSize: FontSize.lg, fontWeight: '700', color: '#fff' },
  linkText: { fontSize: FontSize.sm, color: Colors.textMuted },
});
