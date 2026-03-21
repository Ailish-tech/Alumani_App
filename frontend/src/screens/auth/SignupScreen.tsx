import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../types/navigation.types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Signup'>;

export default function SignupScreen({ navigation }: Props) {
  const { claimAccount, isLoading } = useAuthStore();
  const [collegeId, setCollegeId] = useState('');

  const handleClaim = async () => {
    const id = collegeId.trim();
    if (!id) {
      Alert.alert('Missing ID', 'Please enter your College ID / Roll Number.');
      return;
    }
    try {
      await claimAccount(id);
      // Navigation is handled by the auth state change in RootNavigator
    } catch (e: any) {
      Alert.alert('Claim Failed', e?.message || 'Could not claim this account.');
    }
  };

  return (
    <View style={s.container}>
      {/* Ambient Glow */}
      <View style={s.glowTop} />
      <View style={s.glowBottom} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">

          {/* Back Button */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>

          {/* Hero */}
          <View style={s.heroIcon}>
            <Ionicons name="id-card" size={40} color="#a476ff" />
          </View>
          <Text style={s.title}>Claim Your Account</Text>
          <Text style={s.subtitle}>
            Enter the College ID / Roll Number provided by your institution to activate your account.
          </Text>

          {/* How it works */}
          <View style={s.infoCard}>
            <Text style={s.infoTitle}>📋 How it works</Text>
            <View style={s.step}>
              <View style={s.stepDot}><Text style={s.stepNum}>1</Text></View>
              <Text style={s.stepText}>Admin uploads a master list of students, alumni & faculty</Text>
            </View>
            <View style={s.step}>
              <View style={s.stepDot}><Text style={s.stepNum}>2</Text></View>
              <Text style={s.stepText}>You enter your College ID below to verify your identity</Text>
            </View>
            <View style={s.step}>
              <View style={[s.stepDot, { backgroundColor: '#4CAF5030' }]}><Text style={[s.stepNum, { color: '#4CAF50' }]}>3</Text></View>
              <Text style={s.stepText}>Your role (Student / Alumni / Faculty) is assigned automatically</Text>
            </View>
          </View>

          {/* College ID Input */}
          <Text style={s.label}>COLLEGE ID / ROLL NUMBER</Text>
          <View style={s.inputBox}>
            <Ionicons name="school-outline" size={20} color={Colors.textMuted} />
            <TextInput
              style={s.input}
              value={collegeId}
              onChangeText={setCollegeId}
              placeholder="e.g. CS001, FAC01, 2022EE042"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            {collegeId.length > 0 && (
              <TouchableOpacity onPress={() => setCollegeId('')}>
                <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Claim Button */}
          <TouchableOpacity
            style={[s.claimBtn, (!collegeId.trim() || isLoading) && s.claimBtnDisabled]}
            onPress={handleClaim}
            disabled={!collegeId.trim() || isLoading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#a476ff', '#7c4dff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.claimGradient}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={22} color="#fff" />
                  <Text style={s.claimText}>Verify & Activate</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Back to Login */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.linkRow}>
            <Text style={s.linkText}>
              Already claimed? <Text style={{ color: '#a476ff', fontWeight: '700' }}>Sign In</Text>
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#12121d' },

  glowTop: {
    position: 'absolute', top: -80, left: -80,
    width: 250, height: 250, borderRadius: 125,
    backgroundColor: '#a476ff', opacity: 0.06,
  },
  glowBottom: {
    position: 'absolute', bottom: -60, right: -60,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: '#7c4dff', opacity: 0.05,
  },

  content: { padding: Spacing.lg, paddingTop: 60, paddingBottom: 100 },

  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.lg,
  },

  heroIcon: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: 'rgba(164, 118, 255, 0.12)',
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: Spacing.md,
  },

  title: {
    fontSize: 28, fontWeight: '800', color: '#e6e1e6',
    textAlign: 'center', letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14, color: '#9e9e9e', textAlign: 'center',
    lineHeight: 20, marginTop: 8, marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },

  infoCard: {
    backgroundColor: 'rgba(31, 31, 41, 0.6)',
    borderRadius: 16, padding: Spacing.md,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: Spacing.lg,
  },
  infoTitle: {
    fontSize: 15, fontWeight: '700', color: '#e6e1e6',
    marginBottom: Spacing.sm,
  },
  step: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 6,
  },
  stepDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(164, 118, 255, 0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  stepNum: { fontSize: 13, fontWeight: '800', color: '#a476ff' },
  stepText: { flex: 1, fontSize: 13, color: '#b0b0b0', lineHeight: 18 },

  label: {
    fontSize: 11, color: '#9e9e9e', letterSpacing: 1.5,
    fontWeight: '700', marginBottom: 8,
  },
  inputBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(31, 31, 41, 0.8)',
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1.5, borderColor: 'rgba(164, 118, 255, 0.25)',
    marginBottom: Spacing.lg,
  },
  input: {
    flex: 1, color: '#e6e1e6', fontSize: 16,
    fontWeight: '600', letterSpacing: 1,
  },

  claimBtn: { borderRadius: 14, overflow: 'hidden', marginBottom: Spacing.md },
  claimBtnDisabled: { opacity: 0.4 },
  claimGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 16,
  },
  claimText: { fontSize: 17, fontWeight: '800', color: '#fff' },

  linkRow: { alignItems: 'center', marginTop: Spacing.sm },
  linkText: { fontSize: 14, color: '#9e9e9e' },
});
