import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Image, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

const COMMON_SKILLS = [
  'JavaScript', 'TypeScript', 'React Native', 'Node.js', 'Python', 'Java',
  'AWS', 'Machine Learning', 'Data Science', 'System Design', 'SQL', 'MongoDB',
  'Cloud Computing', 'DevOps', 'UI/UX Design', 'Product Management',
];


export default function EditProfileScreen({ navigation }: any) {
  const { user, fetchProfile } = useAuthStore();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [domain, setDomain] = useState(user?.domain || '');
  const [skills, setSkills] = useState<string[]>(user?.skills || []);
  const [customSkill, setCustomSkill] = useState('');
  const [profilePicUri, setProfilePicUri] = useState(user?.profilePicUrl || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [workplace, setWorkplace] = useState(user?.workplace || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // ── Photo Picker ────────────────────────────────────────────────────
  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;

    setIsUploadingPhoto(true);
    try {
      // 1. Get pre-signed URL from backend
      const ext = result.assets[0].uri.split('.').pop() || 'jpg';
      const key = `profiles/${user?.id}/avatar.${ext}`;
      const uploadRes = await api.get('/auth/upload-url', {
        params: { key, contentType: `image/${ext}` },
      });
      const { uploadUrl, publicUrl } = uploadRes.data.data;

      // 2. Upload directly to S3
      await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': `image/${ext}` },
        body: { uri: result.assets[0].uri } as any,
      });

      setProfilePicUri(publicUrl);
    } catch {
      // If S3 not configured locally, just use the local URI as preview
      setProfilePicUri(result.assets[0].uri);
    }
    setIsUploadingPhoto(false);
  };

  // ── Skills Management ───────────────────────────────────────────────
  const toggleSkill = (skill: string) => {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const addCustomSkill = () => {
    const trimmed = customSkill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills((prev) => [...prev, trimmed]);
    }
    setCustomSkill('');
  };

  const removeSkill = (skill: string) => {
    setSkills((prev) => prev.filter((s) => s !== skill));
  };

  // ── Save ────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Validation', 'Full name cannot be empty.');
      return;
    }
    setIsSaving(true);
    try {
      if (user?.email?.endsWith('@dev.local')) {
        // Dev mode bypass for mock users
        const updatedUser = {
          ...user,
          fullName: fullName.trim(),
          domain: domain.trim(),
          skills,
          profilePicUrl: profilePicUri,
          bio: bio.trim(),
          workplace: workplace.trim(),
        };
        useAuthStore.setState({ user: updatedUser });
        Alert.alert('Saved! ✅', 'Your profile has been updated locally.');
        navigation.goBack();
        setIsSaving(false);
        return;
      }

      await api.patch('/auth/me', {
        fullName: fullName.trim(),
        domain: domain.trim(),
        skills,
        profilePicUrl: profilePicUri,
        bio: bio.trim(),
        workplace: workplace.trim(),
      });
      // Refresh profile in background — don't block the success flow
      fetchProfile().catch(() => {});
      Alert.alert('Saved! ✅', 'Your profile has been updated.');
      navigation.goBack();
    } catch (e: any) {
      const errMsg =
        e.response?.data?.error ||
        e.response?.data?.message ||
        e.message ||
        'Failed to save profile.';
      console.error('[EditProfile] Save failed:', e.response?.status, errMsg);
      Alert.alert('Error', errMsg);
    }
    setIsSaving(false);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={{ padding: Spacing.md, paddingBottom: 100 }}>

        {/* ── Profile Photo ── */}
        <Text style={styles.sectionTitle}>Profile Photo</Text>
        <View style={styles.photoSection}>
          <TouchableOpacity style={styles.photoWrapper} onPress={pickImage} activeOpacity={0.8}>
            {profilePicUri ? (
              <Image source={{ uri: profilePicUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={40} color={Colors.primary} />
              </View>
            )}
            <View style={styles.photoEditBadge}>
              {isUploadingPhoto
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="camera" size={16} color="#fff" />}
            </View>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.photoHint}>Tap to change photo</Text>
            <Text style={styles.photoSubhint}>JPG or PNG, square works best</Text>
          </View>
        </View>

        {/* ── Full Name ── */}
        <Text style={styles.sectionTitle}>Full Name</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="person-outline" size={20} color={Colors.textMuted} />
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Your full name"
            placeholderTextColor={Colors.textMuted}
          />
        </View>

        {/* ── Domain ── */}
        <Text style={styles.sectionTitle}>Domain / Specialisation</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="briefcase-outline" size={20} color={Colors.textMuted} />
          <TextInput
            style={styles.input}
            value={domain}
            onChangeText={setDomain}
            placeholder="e.g. Software Engineering, Data Science..."
            placeholderTextColor={Colors.textMuted}
          />
        </View>

        {/* ── Bio & Workplace ── */}
        <Text style={styles.sectionTitle}>About Me</Text>
        <View style={[styles.inputWrapper, { alignItems: 'flex-start' }]}>
          <Ionicons name="document-text-outline" size={20} color={Colors.textMuted} style={{ marginTop: 4 }} />
          <TextInput
            style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell others about yourself, your interests, and goals..."
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={4}
          />
        </View>

        <Text style={styles.sectionTitle}>Where I Work / Study</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="business-outline" size={20} color={Colors.textMuted} />
          <TextInput
            style={styles.input}
            value={workplace}
            onChangeText={setWorkplace}
            placeholder="e.g. Google, MIT, Stanford University..."
            placeholderTextColor={Colors.textMuted}
          />
        </View>

        {/* ── Skills ── */}
        <Text style={styles.sectionTitle}>Skills</Text>

        {/* Selected skills (removable chips) */}
        {skills.length > 0 && (
          <View style={styles.chipsRow}>
            {skills.map((skill) => (
              <TouchableOpacity key={skill} style={styles.selectedChip} onPress={() => removeSkill(skill)}>
                <Text style={styles.selectedChipText}>{skill}</Text>
                <Ionicons name="close" size={14} color={Colors.primary} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Quick-add preset skills */}
        <Text style={styles.subLabel}>Quick Add</Text>
        <View style={styles.chipsRow}>
          {COMMON_SKILLS.filter((s) => !skills.includes(s)).map((skill) => (
            <TouchableOpacity key={skill} style={styles.chip} onPress={() => toggleSkill(skill)}>
              <Text style={styles.chipText}>{skill}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Custom skill input */}
        <Text style={styles.subLabel}>Add Custom Skill</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="add-circle-outline" size={20} color={Colors.textMuted} />
          <TextInput
            style={styles.input}
            value={customSkill}
            onChangeText={setCustomSkill}
            placeholder="e.g. Kubernetes, Figma..."
            placeholderTextColor={Colors.textMuted}
            onSubmitEditing={addCustomSkill}
            returnKeyType="done"
          />
          {customSkill.trim().length > 0 && (
            <TouchableOpacity onPress={addCustomSkill}>
              <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* ── Save Button ── */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.8}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-done" size={20} color="#fff" />
              <Text style={styles.saveText}>Save Profile</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDark },
  sectionTitle: {
    fontSize: FontSize.sm, fontWeight: '700', color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 1,
    marginTop: Spacing.lg, marginBottom: Spacing.sm,
  },
  subLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: Spacing.xs, marginTop: Spacing.sm },

  // Photo
  photoSection: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  photoWrapper: { position: 'relative' },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: Colors.primary },
  avatarPlaceholder: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.primaryGlow,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.primary,
  },
  photoEditBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.bgDark,
  },
  photoHint: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
  photoSubhint: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },

  // Inputs
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  input: { flex: 1, fontSize: FontSize.md, color: Colors.textPrimary },


  // Skills chips
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  chip: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.full,
    borderWidth: 1, borderColor: Colors.border,
  },
  chipText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  selectedChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs,
    backgroundColor: Colors.primaryGlow, borderRadius: BorderRadius.full,
    borderWidth: 1, borderColor: Colors.primary,
  },
  selectedChipText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600' },

  // Save
  saveButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md, marginTop: Spacing.xl,
  },
  saveText: { fontSize: FontSize.lg, fontWeight: '700', color: '#fff' },
});
