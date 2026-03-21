import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { useNavigation } from '@react-navigation/native';

const EXPLORE_ITEMS = [
  { title: '🧠 AI Insights', subtitle: 'Mentor match, skill gap, career path', icon: 'sparkles', color: '#A855F7', screen: 'SmartInsights' },
  { title: 'Events', subtitle: 'Meetups, webinars & workshops', icon: 'calendar', color: '#6C63FF', screen: 'Events' },
  { title: 'Jobs & Internships', subtitle: 'Career opportunities', icon: 'briefcase', color: '#00E676', screen: 'JobBoard' },
  { title: 'Alumni Search', subtitle: 'Find alumni by company, batch', icon: 'search', color: '#00D9FF', screen: 'AlumniSearch' },
  { title: 'Groups', subtitle: 'Join interest-based clubs', icon: 'people', color: '#FFD600', screen: 'Groups' },
  { title: 'Polls', subtitle: 'Vote on community questions', icon: 'bar-chart', color: '#FF6E40', screen: 'Polls' },
  { title: 'Ask Alumni', subtitle: 'Anonymous Q&A', icon: 'help-circle', color: '#FF5252', screen: 'QA' },
  { title: 'Resources', subtitle: 'Study materials & notes', icon: 'document-text', color: '#448AFF', screen: 'Resources' },
  { title: 'Career Explorer', subtitle: 'Where alumni work', icon: 'trending-up', color: '#E040FB', screen: 'CareerExplorer' },
  { title: 'Goals', subtitle: 'Track your career goals', icon: 'flag', color: '#00BCD4', screen: 'Goals' },
  { title: 'Book a Slot', subtitle: 'Office hours with mentors', icon: 'time', color: '#FF9800', screen: 'Booking' },
  { title: 'Resume Builder', subtitle: 'Generate your resume', icon: 'document', color: '#8BC34A', screen: 'ResumeBuilder' },
];

export default function ExploreScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.grid}>
        {EXPLORE_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.screen}
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => navigation.navigate(item.screen as any)}
          >
            <View style={[styles.iconCircle, { backgroundColor: `${item.color}20` }]}>
              <Ionicons name={item.icon as any} size={24} color={item.color} />
            </View>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDark },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    padding: Spacing.md, gap: Spacing.md,
    paddingBottom: 100,
  },
  card: {
    width: '47%' as any,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
    gap: Spacing.xs,
  },
  iconCircle: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  cardTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  cardSubtitle: { fontSize: FontSize.xs, color: Colors.textMuted, lineHeight: 16 },
});
