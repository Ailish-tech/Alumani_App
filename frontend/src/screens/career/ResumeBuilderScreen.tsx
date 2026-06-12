import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAuthStore } from '../../store/authStore';


// LinkedIn-Inspired Colors
const LI = {
  blue: '#0A66C2', white: '#FFF', bgLight: '#F2F2F7',
  border: '#E5E5EA', textDark: '#1C1C1E', textSecondary: '#8E8E93',
  green: '#057642',
};export default function ResumeBuilderScreen() {
  const { user } = useAuthStore();

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 24 }}>
        <Text style={s.heroTitle}>Resume Builder</Text>
        <Text style={s.subtitle}>Auto-generated from your profile</Text>

        {/* Resume Preview Card */}
        <View style={s.resumeCard}>
          {/* Header */}
          <View style={s.resumeHeader}>
            <View style={s.avatar}><Text style={s.avatarText}>{user?.fullName?.charAt(0) || '?'}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{user?.fullName || 'Your Name'}</Text>
              <Text style={s.role}>{user?.role || 'Student'}</Text>
              <Text style={s.email}>{user?.email || 'email@college.edu'}</Text>
            </View>
          </View>

          {/* Domain */}
          {user?.domain && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>DOMAIN</Text>
              <Text style={s.sectionContent}>{user.domain}</Text>
            </View>
          )}

          {/* Skills */}
          {user?.skills && user.skills.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>SKILLS</Text>
              <View style={s.skillsRow}>
                {user.skills.map((skill, i) => (
                  <View key={i} style={s.skillChip}><Text style={s.skillText}>{skill}</Text></View>
                ))}
              </View>
            </View>
          )}

          {/* Stats */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>PROFILE STATS</Text>
            <View style={s.statsRow}>
              <View style={s.stat}><Ionicons name="star" size={16} color={'#E16745'} /><Text style={s.statText}>{user?.reputationScore || 0} reputation</Text></View>
            </View>
          </View>
        </View>

        {/* Actions */}
        <TouchableOpacity style={s.downloadBtn}>
          <Ionicons name="download-outline" size={20} color="#fff" />
          <Text style={s.downloadText}>Download PDF</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.shareBtn}>
          <Ionicons name="share-outline" size={20} color={'#0A66C2'} />
          <Text style={s.shareText}>Share Resume</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  heroTitle: { fontSize: 24, fontWeight: '800', color: '#1C1C1E', marginTop: 40 },
  subtitle: { fontSize: 15, color: '#8E8E93' },
  resumeCard: { backgroundColor: '#fff', borderRadius: 16, padding: 24, gap: 16 },
  resumeHeader: { flexDirection: 'row', gap: 16, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 16 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#0A66C2', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, fontWeight: '700', color: '#fff' },
  name: { fontSize: 20, fontWeight: '800', color: '#111' },
  role: { fontSize: 13, color: '#666', textTransform: 'capitalize' },
  email: { fontSize: 11, color: '#999' },
  section: { gap: 4 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: '#999', letterSpacing: 1 },
  sectionContent: { fontSize: 15, color: '#333' },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  skillChip: { backgroundColor: '#f0f0f0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  skillText: { fontSize: 13, color: '#333' },
  statsRow: { flexDirection: 'row', gap: 16 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 13, color: '#555' },
  downloadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#0A66C2', borderRadius: 16, padding: 16 },
  downloadText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  shareBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#0A66C2' },
  shareText: { fontSize: 15, fontWeight: '700', color: '#0A66C2' },
});
