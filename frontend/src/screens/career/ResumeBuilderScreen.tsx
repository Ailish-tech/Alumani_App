import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';

export default function ResumeBuilderScreen() {
  const { user } = useAuthStore();

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={{ padding: Spacing.md, gap: Spacing.lg }}>
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
              <View style={s.stat}><Ionicons name="star" size={16} color={Colors.warning} /><Text style={s.statText}>{user?.reputationScore || 0} reputation</Text></View>
            </View>
          </View>
        </View>

        {/* Actions */}
        <TouchableOpacity style={s.downloadBtn}>
          <Ionicons name="download-outline" size={20} color="#fff" />
          <Text style={s.downloadText}>Download PDF</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.shareBtn}>
          <Ionicons name="share-outline" size={20} color={Colors.primary} />
          <Text style={s.shareText}>Share Resume</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDark },
  heroTitle: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary, marginTop: 40 },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary },
  resumeCard: { backgroundColor: '#fff', borderRadius: BorderRadius.md, padding: Spacing.lg, gap: Spacing.md },
  resumeHeader: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: Spacing.md },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: FontSize.xl, fontWeight: '700', color: '#fff' },
  name: { fontSize: FontSize.xl, fontWeight: '800', color: '#111' },
  role: { fontSize: FontSize.sm, color: '#666', textTransform: 'capitalize' },
  email: { fontSize: FontSize.xs, color: '#999' },
  section: { gap: Spacing.xs },
  sectionTitle: { fontSize: FontSize.xs, fontWeight: '700', color: '#999', letterSpacing: 1 },
  sectionContent: { fontSize: FontSize.md, color: '#333' },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  skillChip: { backgroundColor: '#f0f0f0', paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full },
  skillText: { fontSize: FontSize.sm, color: '#333' },
  statsRow: { flexDirection: 'row', gap: Spacing.md },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: FontSize.sm, color: '#555' },
  downloadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, borderRadius: BorderRadius.sm, padding: Spacing.md },
  downloadText: { fontSize: FontSize.md, fontWeight: '700', color: '#fff' },
  shareBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.bgCard, borderRadius: BorderRadius.sm, padding: Spacing.md, borderWidth: 1, borderColor: Colors.primary },
  shareText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.primary },
});
