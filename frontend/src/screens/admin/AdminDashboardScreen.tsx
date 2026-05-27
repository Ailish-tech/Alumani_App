import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';

const STAT_CARDS = [
  { key: 'USER', label: 'Users', icon: 'people', color: '#6C63FF' },
  { key: 'POST', label: 'Posts', icon: 'document-text', color: '#00E676' },
  { key: 'EVENT', label: 'Events', icon: 'calendar', color: '#FF9800' },
  { key: 'JOB', label: 'Jobs', icon: 'briefcase', color: '#448AFF' },
  { key: 'GROUP', label: 'Groups', icon: 'people-circle', color: '#FFD600' },
  { key: 'RESOURCE', label: 'Resources', icon: 'library', color: '#00BCD4' },
];

export default function AdminDashboardScreen() {
  const navigation = useNavigation();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    setLoading(true);
    try { const r = await api.get('/admin/stats'); setStats(r.data.data); } catch {}
    setLoading(false);
  };
  useEffect(() => { fetch(); }, []);

  if (loading) return <View style={s.container}><ActivityIndicator size="large" color={Colors.roleAdmin} /></View>;

  return (
    <ScrollView style={s.container} refreshControl={<RefreshControl refreshing={loading} onRefresh={fetch} tintColor={Colors.roleAdmin} />}>
      <View style={{ padding: Spacing.md, gap: Spacing.md, paddingBottom: 100 }}>
        {/* Hero */}
        <View style={s.hero}>
          <Ionicons name="shield-checkmark" size={32} color={Colors.roleAdmin} />
          <View style={{ flex: 1 }}>
            <Text style={s.heroTitle}>Admin Dashboard</Text>
            <Text style={s.heroSub}>Platform Overview</Text>
          </View>
        </View>

        {/* Entity Counts Grid */}
        <View style={s.grid}>
          {STAT_CARDS.map(c => (
            <View key={c.key} style={s.statCard}>
              <View style={[s.statIcon, { backgroundColor: `${c.color}20` }]}>
                <Ionicons name={c.icon as any} size={20} color={c.color} />
              </View>
              <Text style={s.statNum}>{stats?.counts?.[c.key] || 0}</Text>
              <Text style={s.statLabel}>{c.label}</Text>
            </View>
          ))}
        </View>

        {/* User Breakdown */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>👥 User Breakdown</Text>
          <View style={s.breakdownRow}>
            {Object.entries(stats?.roleBreakdown || {}).map(([role, count]) => (
              <View key={role} style={s.breakdownChip}>
                <Text style={s.breakdownRole}>{role}</Text>
                <Text style={s.breakdownCount}>{count as number}</Text>
              </View>
            ))}
            <View style={[s.breakdownChip, { borderColor: '#FF5252' }]}>
              <Text style={[s.breakdownRole, { color: '#FF5252' }]}>Banned</Text>
              <Text style={[s.breakdownCount, { color: '#FF5252' }]}>{stats?.bannedUsers || 0}</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={s.sectionTitle}>⚡ Quick Actions</Text>
        <View style={s.actionsGrid}>
          <TouchableOpacity style={[s.actionCard, { borderColor: '#4CAF50', borderWidth: 1.5 }]} onPress={() => navigation.navigate('AdminMasterList' as any)}>
            <Ionicons name="cloud-upload" size={24} color="#4CAF50" />
            <Text style={s.actionText}>Master List</Text>
            <Text style={s.actionSub}>Upload student CSV</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionCard} onPress={() => navigation.navigate('AdminReports' as any)}>
            <Ionicons name="flag" size={24} color="#FF5252" />
            <Text style={s.actionText}>Reports</Text>
            <Text style={s.actionSub}>Review flagged content</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionCard} onPress={() => navigation.navigate('AdminAnnouncements' as any)}>
            <Ionicons name="megaphone" size={24} color="#FF9800" />
            <Text style={s.actionText}>Announce</Text>
            <Text style={s.actionSub}>Broadcast messages</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionCard} onPress={() => navigation.navigate('AdminAuditLog' as any)}>
            <Ionicons name="time" size={24} color="#6C63FF" />
            <Text style={s.actionText}>Audit Log</Text>
            <Text style={s.actionSub}>Track admin actions</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionCard} onPress={() => navigation.navigate('AdminContentModeration' as any)}>
            <Ionicons name="trash" size={24} color="#E040FB" />
            <Text style={s.actionText}>Moderate</Text>
            <Text style={s.actionSub}>Delete content</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDark },
  hero: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingTop: 32, marginBottom: Spacing.sm },
  heroTitle: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  heroSub: { fontSize: FontSize.sm, color: Colors.textMuted },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  statCard: { width: '31%' as any, backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md, padding: Spacing.sm, alignItems: 'center', gap: 2, borderWidth: 1, borderColor: Colors.border },
  statIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  statNum: { fontSize: FontSize.lg, fontWeight: '900', color: Colors.textPrimary },
  statLabel: { fontSize: 10, color: Colors.textMuted },
  section: { gap: Spacing.sm },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textSecondary },
  breakdownRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  breakdownChip: { backgroundColor: Colors.bgCard, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  breakdownRole: { fontSize: FontSize.xs, color: Colors.textMuted, textTransform: 'capitalize' },
  breakdownCount: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textPrimary },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  actionCard: { width: '48%' as any, backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md, padding: Spacing.md, gap: 4, borderWidth: 1, borderColor: Colors.border },
  actionText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  actionSub: { fontSize: FontSize.xs, color: Colors.textMuted },
});
