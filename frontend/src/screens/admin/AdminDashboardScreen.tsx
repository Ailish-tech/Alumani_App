import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';

const mm = Colors.mm;
const GLASS_BG = mm.glassBackground;
const CARD_BORDER = `${mm.outlineVariant}1A`;

const STAT_CARDS = [
  { key: 'USER', label: 'Users', icon: 'people', color: '#6C63FF' },
  { key: 'POST', label: 'Posts', icon: 'document-text', color: '#22c55e' },
  { key: 'EVENT', label: 'Events', icon: 'calendar', color: '#f59e0b' },
  { key: 'JOB', label: 'Jobs', icon: 'briefcase', color: mm.secondary },
  { key: 'GROUP', label: 'Groups', icon: 'people-circle', color: '#eab308' },
  { key: 'RESOURCE', label: 'Resources', icon: 'library', color: '#06b6d4' },
];

const QUICK_ACTIONS = [
  { route: 'AdminMasterList', icon: 'cloud-upload', color: '#22c55e', label: 'Master List', sub: 'Upload student CSV' },
  { route: 'AdminReports', icon: 'flag', color: '#ef4444', label: 'Reports', sub: 'Review flagged content' },
  { route: 'AdminAnnouncements', icon: 'megaphone', color: '#f59e0b', label: 'Announce', sub: 'Broadcast messages' },
  { route: 'AdminAuditLog', icon: 'time', color: '#6C63FF', label: 'Audit Log', sub: 'Track admin actions' },
  { route: 'AdminContentModeration', icon: 'trash', color: '#a855f7', label: 'Moderate', sub: 'Delete content' },
];

export default function AdminDashboardScreen() {
  const navigation = useNavigation();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try { const r = await api.get('/admin/stats'); setStats(r.data.data); } catch {}
    setLoading(false);
  };
  useEffect(() => { fetchStats(); }, []);

  if (loading) return (
    <View style={s.loadingContainer}>
      <ActivityIndicator size="large" color={mm.primary} />
    </View>
  );

  return (
    <ScrollView style={s.container} refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchStats} tintColor={mm.primary} />}>
      <View style={{ paddingHorizontal: 16, paddingBottom: 100 }}>
        {/* Hero */}
        <View style={s.hero}>
          <LinearGradient
            colors={[mm.gradientStart, mm.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.heroIcon}
          >
            <Ionicons name="shield-checkmark" size={24} color="#fff" />
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={s.heroTitle}>Admin Dashboard</Text>
            <Text style={s.heroSub}>Platform Overview</Text>
          </View>
        </View>

        {/* Entity Counts Grid */}
        <View style={s.grid}>
          {STAT_CARDS.map(c => (
            <View key={c.key} style={s.statCard}>
              <View style={[s.statIcon, { backgroundColor: `${c.color}1A` }]}>
                <Ionicons name={c.icon as any} size={20} color={c.color} />
              </View>
              <Text style={s.statNum}>{stats?.counts?.[c.key] || 0}</Text>
              <Text style={s.statLabel}>{c.label}</Text>
            </View>
          ))}
        </View>

        {/* User Breakdown */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>User Breakdown</Text>
          <View style={s.breakdownRow}>
            {Object.entries(stats?.roleBreakdown || {}).map(([role, count]) => (
              <View key={role} style={s.breakdownChip}>
                <Text style={s.breakdownRole}>{role}</Text>
                <Text style={s.breakdownCount}>{count as number}</Text>
              </View>
            ))}
            <View style={[s.breakdownChip, { borderColor: 'rgba(239,68,68,0.3)' }]}>
              <Text style={[s.breakdownRole, { color: '#ef4444' }]}>Banned</Text>
              <Text style={[s.breakdownCount, { color: '#ef4444' }]}>{stats?.bannedUsers || 0}</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={s.sectionTitle}>Quick Actions</Text>
        <View style={s.actionsGrid}>
          {QUICK_ACTIONS.map(a => (
            <TouchableOpacity key={a.route} style={s.actionCard} onPress={() => navigation.navigate(a.route as any)} activeOpacity={0.8}>
              <View style={[s.actionIcon, { backgroundColor: `${a.color}1A` }]}>
                <Ionicons name={a.icon as any} size={22} color={a.color} />
              </View>
              <Text style={s.actionText}>{a.label}</Text>
              <Text style={s.actionSub}>{a.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: mm.surfaceDim },
  loadingContainer: { flex: 1, backgroundColor: mm.surfaceDim, alignItems: 'center', justifyContent: 'center' },

  // Hero
  hero: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingTop: 12, marginBottom: 24,
  },
  heroIcon: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: mm.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  heroTitle: { fontSize: 22, fontWeight: '800', color: mm.onSurface, letterSpacing: -0.5 },
  heroSub: { fontSize: 13, color: mm.outline, marginTop: 2 },

  // Stats Grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  statCard: {
    width: '31%' as any, backgroundColor: GLASS_BG,
    borderRadius: 16, padding: 14, alignItems: 'center', gap: 4,
    borderWidth: 0.5, borderColor: CARD_BORDER,
  },
  statIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  statNum: { fontSize: 22, fontWeight: '900', color: mm.onSurface },
  statLabel: { fontSize: 10, color: mm.outline, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },

  // Section
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: mm.onSurfaceVariant, marginBottom: 12 },

  // Breakdown
  breakdownRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  breakdownChip: {
    backgroundColor: GLASS_BG, paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 12, borderWidth: 0.5, borderColor: CARD_BORDER, alignItems: 'center',
  },
  breakdownRole: { fontSize: 10, color: mm.outline, textTransform: 'capitalize', fontWeight: '600' },
  breakdownCount: { fontSize: 18, fontWeight: '800', color: mm.onSurface, marginTop: 2 },

  // Quick Actions
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionCard: {
    width: '48%' as any, backgroundColor: GLASS_BG,
    borderRadius: 16, padding: 16, gap: 6,
    borderWidth: 0.5, borderColor: CARD_BORDER,
  },
  actionIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  actionText: { fontSize: 15, fontWeight: '700', color: mm.onSurface },
  actionSub: { fontSize: 11, color: mm.outline },
});
