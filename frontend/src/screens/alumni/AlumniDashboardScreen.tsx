import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';

const IMPACT_CARDS = [
  { key: 'jobsPosted', label: 'Jobs Posted', icon: 'briefcase', color: '#00E676' },
  { key: 'eventsCreated', label: 'Events Created', icon: 'calendar', color: '#6C63FF' },
  { key: 'resourcesShared', label: 'Resources Shared', icon: 'document-text', color: '#448AFF' },
  { key: 'questionsAnswered', label: 'Q&A Answered', icon: 'chatbubble-ellipses', color: '#FF5252' },
];

export default function AlumniDashboardScreen() {
  const { user } = useAuthStore();
  const navigation = useNavigation();
  const [impact, setImpact] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { const r = await api.get('/alumni/impact'); setImpact(r.data.data); } catch {}
      setLoading(false);
    })();
  }, []);

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={{ padding: Spacing.md, gap: Spacing.md, paddingBottom: 100 }}>
        {/* Hero */}
        <View style={s.hero}>
          <View style={s.avatarCircle}><Text style={s.avatarText}>{user?.fullName?.charAt(0) || '?'}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.heroTitle}>Welcome back, {user?.fullName?.split(' ')[0] || 'Alumni'}!</Text>
            <Text style={s.heroSub}>Your impact as an Alumni</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Notifications' as any)}>
            <Ionicons name="notifications-outline" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Impact Grid */}
        {loading ? <ActivityIndicator size="large" color={Colors.roleAlumni} /> : (
          <View style={s.impactGrid}>
            {IMPACT_CARDS.map(c => (
              <View key={c.key} style={s.impactCard}>
                <View style={[s.impactIcon, { backgroundColor: `${c.color}20` }]}>
                  <Ionicons name={c.icon as any} size={22} color={c.color} />
                </View>
                <Text style={s.impactNum}>{impact?.[c.key] || 0}</Text>
                <Text style={s.impactLabel}>{c.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Quick Actions */}
        <Text style={s.sectionTitle}>Quick Actions</Text>
        <View style={s.actionsRow}>
          <TouchableOpacity style={s.actionCard} onPress={() => navigation.navigate('Referrals' as any)}>
            <Ionicons name="paper-plane" size={24} color="#E040FB" />
            <Text style={s.actionText}>Referrals</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionCard} onPress={() => navigation.navigate('Stories' as any)}>
            <Ionicons name="book" size={24} color="#FF9800" />
            <Text style={s.actionText}>Stories</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionCard} onPress={() => navigation.navigate('CompanyDirectory' as any)}>
            <Ionicons name="business" size={24} color="#00BCD4" />
            <Text style={s.actionText}>Companies</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionCard} onPress={() => navigation.navigate('JobBoard' as any)}>
            <Ionicons name="add-circle" size={24} color="#00E676" />
            <Text style={s.actionText}>Post Job</Text>
          </TouchableOpacity>
        </View>

        {/* Mentorship CTA */}
        <TouchableOpacity style={s.ctaCard} onPress={() => navigation.navigate('Booking' as any)}>
          <View style={s.ctaContent}>
            <Ionicons name="time" size={28} color={Colors.roleAlumni} />
            <View style={{ flex: 1 }}>
              <Text style={s.ctaTitle}>Set Up Office Hours</Text>
              <Text style={s.ctaSub}>Students are waiting to connect with you</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.roleAlumni} />
          </View>
        </TouchableOpacity>

        {/* Q&A CTA */}
        <TouchableOpacity style={s.ctaCard2} onPress={() => navigation.navigate('QA' as any)}>
          <Ionicons name="help-circle" size={28} color="#FF5252" />
          <View style={{ flex: 1 }}>
            <Text style={s.ctaTitle}>Answer Student Questions</Text>
            <Text style={s.ctaSub}>Share your experience with the next generation</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDark },
  hero: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingTop: 40 },
  avatarCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.roleAlumni, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: FontSize.xl, fontWeight: '800', color: '#111' },
  heroTitle: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textPrimary },
  heroSub: { fontSize: FontSize.sm, color: Colors.textMuted },
  impactGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  impactCard: { width: '48%' as any, backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: 'center', gap: Spacing.xs, borderWidth: 1, borderColor: Colors.border },
  impactIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  impactNum: { fontSize: FontSize.xxl, fontWeight: '900', color: Colors.textPrimary },
  impactLabel: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center' },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textSecondary },
  actionsRow: { flexDirection: 'row', gap: Spacing.sm },
  actionCard: { flex: 1, backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: 'center', gap: Spacing.xs, borderWidth: 1, borderColor: Colors.border },
  actionText: { fontSize: FontSize.xs, color: Colors.textPrimary, fontWeight: '600' },
  ctaCard: { backgroundColor: `${Colors.roleAlumni}15`, borderRadius: BorderRadius.md, padding: Spacing.lg, borderWidth: 1, borderColor: `${Colors.roleAlumni}30` },
  ctaContent: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  ctaCard2: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  ctaTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  ctaSub: { fontSize: FontSize.xs, color: Colors.textMuted },
});
