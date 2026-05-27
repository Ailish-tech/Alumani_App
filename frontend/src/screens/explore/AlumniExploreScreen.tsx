import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { useNavigation } from '@react-navigation/native';

const ALUMNI_ITEMS = [
  // Alumni-specific actions (they CREATE content for students)
  { title: 'Post a Job', subtitle: 'Help students find opportunities', icon: 'briefcase', color: '#00E676', screen: 'JobBoard' },
  { title: 'Create Event', subtitle: 'Organize meetups & webinars', icon: 'calendar', color: '#6C63FF', screen: 'Events' },
  { title: 'Set Office Hours', subtitle: 'Offer 1-on-1 mentoring slots', icon: 'time', color: '#FF9800', screen: 'Booking' },
  { title: 'Answer Questions', subtitle: 'Help students via Q&A', icon: 'help-circle', color: '#FF5252', screen: 'QA' },
  { title: 'Share Resources', subtitle: 'Upload study materials', icon: 'document-text', color: '#448AFF', screen: 'Resources' },
  // Professional features
  { title: 'Referrals', subtitle: 'Refer students to companies', icon: 'paper-plane', color: '#E040FB', screen: 'Referrals' },
  { title: 'Success Stories', subtitle: 'Share your career journey', icon: 'book', color: '#FF9800', screen: 'Stories' },
  { title: 'Company Directory', subtitle: 'Register your company', icon: 'business', color: '#00BCD4', screen: 'CompanyDirectory' },
  // Shared features
  { title: '🧠 AI Insights', subtitle: 'Smart job match, similar profiles', icon: 'sparkles', color: '#A855F7', screen: 'SmartInsights' },
  { title: 'Groups', subtitle: 'Join interest-based clubs', icon: 'people', color: '#FFD600', screen: 'Groups' },
  { title: 'Polls', subtitle: 'Create & vote on polls', icon: 'bar-chart', color: '#FF6E40', screen: 'Polls' },
  { title: 'Alumni Network', subtitle: 'Find fellow alumni', icon: 'search', color: '#00D9FF', screen: 'AlumniSearch' },
  { title: 'Career Explorer', subtitle: 'Alumni career statistics', icon: 'trending-up', color: '#E040FB', screen: 'CareerExplorer' },
  { title: 'My Goals', subtitle: 'Track your career goals', icon: 'flag', color: '#00BCD4', screen: 'Goals' },
  { title: 'Resume Builder', subtitle: 'Generate your resume', icon: 'document', color: '#8BC34A', screen: 'ResumeBuilder' },
];

export default function AlumniExploreScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.grid}>
        {/* Alumni Impact Stats Banner */}
        <View style={styles.banner}>
          <Ionicons name="ribbon" size={28} color={Colors.roleAlumni} />
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Alumni Dashboard</Text>
            <Text style={styles.bannerSubtitle}>Give back to your college community</Text>
          </View>
        </View>

        {/* Section: Give Back */}
        <Text style={styles.sectionTitle}>🎓 Give Back</Text>
        {ALUMNI_ITEMS.slice(0, 8).map((item) => (
          <TouchableOpacity
            key={item.screen}
            style={styles.wideCard}
            activeOpacity={0.7}
            onPress={() => navigation.navigate(item.screen as any)}
          >
            <View style={[styles.iconCircle, { backgroundColor: `${item.color}20` }]}>
              <Ionicons name={item.icon as any} size={24} color={item.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        ))}

        {/* Section: Community */}
        <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>🤝 Community & Career</Text>
        <View style={styles.gridRow}>
          {ALUMNI_ITEMS.slice(8).map((item) => (
            <TouchableOpacity
              key={item.screen}
              style={styles.gridCard}
              activeOpacity={0.7}
              onPress={() => navigation.navigate(item.screen as any)}
            >
              <View style={[styles.iconCircle, { backgroundColor: `${item.color}20` }]}>
                <Ionicons name={item.icon as any} size={24} color={item.color} />
              </View>
              <Text style={styles.gridCardTitle}>{item.title}</Text>
              <Text style={styles.gridCardSub}>{item.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDark },
  grid: { padding: Spacing.md, gap: Spacing.sm, paddingBottom: 100 },
  banner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: `${Colors.roleAlumni}15`, borderRadius: BorderRadius.md,
    padding: Spacing.lg, borderWidth: 1, borderColor: `${Colors.roleAlumni}30`,
    marginBottom: Spacing.sm,
  },
  bannerTitle: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.roleAlumni },
  bannerSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textSecondary, marginTop: Spacing.sm, marginBottom: Spacing.xs },
  wideCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  iconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  cardSubtitle: { fontSize: FontSize.xs, color: Colors.textMuted },
  gridRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  gridCard: {
    width: '48%' as any, backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.md, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.border, gap: Spacing.xs,
  },
  gridCardTitle: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary },
  gridCardSub: { fontSize: FontSize.xs, color: Colors.textMuted, lineHeight: 16 },
});
