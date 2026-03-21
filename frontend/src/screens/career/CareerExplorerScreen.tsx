import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import api from '../../services/api';

export default function CareerExplorerScreen() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => { try { const r = await api.get('/features/career/stats'); setStats(r.data.data); } catch {} setLoading(false); })();
  }, []);

  if (loading) return <View style={s.container}><ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 100 }} /></View>;

  const domains = stats?.domains ? Object.entries(stats.domains).sort((a: any, b: any) => b[1] - a[1]).slice(0, 10) : [];
  const maxCount = domains.length ? Math.max(...domains.map((d: any) => d[1])) : 1;

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={{ padding: Spacing.md, gap: Spacing.lg }}>
        <Text style={s.heroTitle}>Career Explorer</Text>
        <Text style={s.subtitle}>See where our alumni are today</Text>

        {/* Stats row */}
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Ionicons name="people" size={28} color={Colors.primary} />
            <Text style={s.statNumber}>{stats?.totalAlumni || 0}</Text>
            <Text style={s.statLabel}>Alumni</Text>
          </View>
          <View style={s.statCard}>
            <Ionicons name="briefcase" size={28} color={Colors.accent} />
            <Text style={s.statNumber}>{domains.length}</Text>
            <Text style={s.statLabel}>Domains</Text>
          </View>
        </View>

        {/* Domain breakdown */}
        <Text style={s.sectionTitle}>Top Domains</Text>
        {domains.map(([domain, count]: any) => (
          <View key={domain} style={s.barRow}>
            <Text style={s.barLabel}>{domain}</Text>
            <View style={s.barTrack}>
              <View style={[s.barFill, { width: `${(count / maxCount) * 100}%` }]} />
            </View>
            <Text style={s.barCount}>{count}</Text>
          </View>
        ))}
        {domains.length === 0 && <Text style={s.emptyText}>No data yet</Text>}
      </ScrollView>
    </View>
  );
}
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDark },
  heroTitle: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary, marginTop: 40 },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary },
  statsRow: { flexDirection: 'row', gap: Spacing.md },
  statCard: { flex: 1, backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md, padding: Spacing.lg, alignItems: 'center', gap: Spacing.xs, borderWidth: 1, borderColor: Colors.border },
  statNumber: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary },
  statLabel: { fontSize: FontSize.sm, color: Colors.textMuted },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  barLabel: { width: 100, fontSize: FontSize.sm, color: Colors.textSecondary },
  barTrack: { flex: 1, height: 8, backgroundColor: Colors.bgCard, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 4 },
  barCount: { width: 30, fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'right' },
  emptyText: { fontSize: FontSize.md, color: Colors.textMuted, textAlign: 'center' },
});
