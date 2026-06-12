import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Image, Alert, ActivityIndicator, Platform,
} from 'react-native';
import { AppleAlert } from '../../components/AppleAlert';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

// ─── LinkedIn-Inspired Colors ───────────────────────────────────────────────
const LI = {
  blue: '#0A66C2',
  blueDark: '#004182',
  white: '#FFFFFF',
  bgLight: '#F3F2EF',
  border: '#DCE6F1',
  textDark: '#191919',
  textSecondary: '#666666',
};

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

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      AppleAlert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.85,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;

    setIsUploadingPhoto(true);
    try {
      const ext = result.assets[0].uri.split('.').pop() || 'jpg';
      const key = `profiles/${user?.id}/avatar.${ext}`;
      const uploadRes = await api.get('/auth/upload-url', {
        params: { key, contentType: `image/${ext}` },
      });
      const { uploadUrl, publicUrl } = uploadRes.data.data;
      await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': `image/${ext}` },
        body: { uri: result.assets[0].uri } as any,
      });
      setProfilePicUri(publicUrl);
    } catch {
      setProfilePicUri(result.assets[0].uri);
    }
    setIsUploadingPhoto(false);
  };

  const toggleSkill = (skill: string) => {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const addCustomSkill = () => {
    const trimmed = customSkill.trim();
    if (trimmed && !skills.includes(trimmed)) setSkills((prev) => [...prev, trimmed]);
    setCustomSkill('');
  };

  const removeSkill = (skill: string) => setSkills((prev) => prev.filter((s) => s !== skill));

  const handleSave = async () => {
    if (!fullName.trim()) {
      AppleAlert.alert('Validation', 'Full name cannot be empty.');
      return;
    }
    setIsSaving(true);
    try {
      await api.patch('/auth/me', {
        fullName: fullName.trim(), domain: domain.trim(), skills,
        profilePicUrl: profilePicUri, bio: bio.trim(), workplace: workplace.trim(),
      });
      fetchProfile().catch(() => {});
      AppleAlert.alert('Saved! ✅', 'Your profile has been updated.');
      navigation.goBack();
    } catch (e: any) {
      AppleAlert.alert('Error', e.response?.data?.error || e.message || 'Failed to save profile.');
    }
    setIsSaving(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }} bounces={false}>
      {/* ── Profile Photo ── */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Profile Photo</Text>
        <View style={styles.photoSection}>
          <TouchableOpacity style={styles.photoWrapper} onPress={pickImage} activeOpacity={0.8}>
            {profilePicUri ? (
              <Image source={{ uri: profilePicUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={36} color={LI.white} />
              </View>
            )}
            <View style={styles.photoEditBadge}>
              {isUploadingPhoto
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="camera" size={14} color="#fff" />}
            </View>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.photoHint}>Tap to change photo</Text>
            <Text style={styles.photoSubhint}>JPG or PNG, square works best</Text>
          </View>
        </View>
      </View>

      {/* ── Basic Info ── */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Basic Information</Text>

        <Text style={styles.fieldLabel}>Full Name *</Text>
        <View style={styles.inputWrapper}>
          <TextInput style={styles.input} value={fullName} onChangeText={setFullName}
            placeholder="Your full name" placeholderTextColor="#999" />
        </View>

        <Text style={styles.fieldLabel}>Domain / Specialisation</Text>
        <View style={styles.inputWrapper}>
          <TextInput style={styles.input} value={domain} onChangeText={setDomain}
            placeholder="e.g. Software Engineering" placeholderTextColor="#999" />
        </View>

        <Text style={styles.fieldLabel}>Where I Work / Study</Text>
        <View style={styles.inputWrapper}>
          <TextInput style={styles.input} value={workplace} onChangeText={setWorkplace}
            placeholder="e.g. Google, MIT" placeholderTextColor="#999" />
        </View>
      </View>

      {/* ── About Me ── */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={[styles.inputWrapper, { alignItems: 'flex-start' }]}>
          <TextInput
            style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
            value={bio} onChangeText={setBio}
            placeholder="Tell others about yourself, your interests, and goals..."
            placeholderTextColor="#999"
            multiline numberOfLines={4}
          />
        </View>
      </View>

      {/* ── Skills ── */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Skills</Text>

        {skills.length > 0 && (
          <View style={styles.chipsRow}>
            {skills.map((skill) => (
              <TouchableOpacity key={skill} style={styles.selectedChip} onPress={() => removeSkill(skill)}>
                <Text style={styles.selectedChipText}>{skill}</Text>
                <Ionicons name="close" size={14} color={LI.blue} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={styles.subLabel}>Quick Add</Text>
        <View style={styles.chipsRow}>
          {COMMON_SKILLS.filter((s) => !skills.includes(s)).map((skill) => (
            <TouchableOpacity key={skill} style={styles.chip} onPress={() => toggleSkill(skill)}>
              <Ionicons name="add" size={14} color={LI.textSecondary} />
              <Text style={styles.chipText}>{skill}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.subLabel}>Add Custom Skill</Text>
        <View style={styles.inputWrapper}>
          <TextInput style={styles.input} value={customSkill} onChangeText={setCustomSkill}
            placeholder="e.g. Kubernetes, Figma..." placeholderTextColor="#999"
            onSubmitEditing={addCustomSkill} returnKeyType="done" />
          {customSkill.trim().length > 0 && (
            <TouchableOpacity onPress={addCustomSkill}>
              <Ionicons name="checkmark-circle" size={22} color={LI.blue} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Save Button ── */}
      <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={isSaving} activeOpacity={0.8}>
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveText}>Save Profile</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: LI.bgLight },

  sectionCard: {
    backgroundColor: LI.white, padding: 16, marginBottom: 8,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: LI.border,
  },
  sectionTitle: {
    fontSize: 16, fontWeight: '700', color: LI.textDark, marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 13, fontWeight: '600', color: LI.textSecondary, marginBottom: 6, marginTop: 12,
  },
  subLabel: { fontSize: 12, color: LI.textSecondary, marginBottom: 8, marginTop: 14 },

  // Photo
  photoSection: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  photoWrapper: { position: 'relative' },
  avatar: { width: 72, height: 72, borderRadius: 36, borderWidth: 2, borderColor: LI.blue },
  avatarPlaceholder: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: LI.blue, alignItems: 'center', justifyContent: 'center',
  },
  photoEditBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: LI.blueDark,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: LI.white,
  },
  photoHint: { fontSize: 14, fontWeight: '600', color: LI.textDark },
  photoSubhint: { fontSize: 12, color: LI.textSecondary, marginTop: 2 },

  // Inputs
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: LI.bgLight, borderRadius: 8,
    borderWidth: 1, borderColor: LI.border,
    paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 12 : 8,
  },
  input: { flex: 1, fontSize: 15, color: LI.textDark },

  // Skills chips
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: LI.bgLight, borderRadius: 16,
    borderWidth: 1, borderColor: LI.border,
  },
  chipText: { fontSize: 13, color: LI.textSecondary },
  selectedChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    backgroundColor: '#E8F1FA', borderRadius: 16,
    borderWidth: 1, borderColor: LI.blue,
  },
  selectedChipText: { fontSize: 13, color: LI.blue, fontWeight: '600' },

  // Save
  saveButton: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: LI.blue, borderRadius: 24,
    paddingVertical: 14,
  },
  saveText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
