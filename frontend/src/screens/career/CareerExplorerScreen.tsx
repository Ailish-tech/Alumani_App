import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import api from '../../services/api';


// LinkedIn-Inspired Colors
const LI = {
  blue: '#0A66C2', white: '#FFF', bgLight: '#F2F2F7',
  border: '#E5E5EA', textDark: '#1C1C1E', textSecondary: '#8E8E93',
  green: '#057642',
};export default function CareerExplorerScreen() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => { try { const r = await api.get('/features/career/stats'); setStats(r.data.data); } catch {} setLoading(false); })();
  }, []);

  if (loading) return <View style={s.container}><ActivityIndicator size="large" color={'#0A66C2'} style={{ marginTop: 100 }} /></View>;

  const domains = stats?.domains ? Object.entries(stats.domains).sort((a: any, b: any) => b[1] - a[1]).slice(0, 10) : [];
  const maxCount = domains.length ? Math.max(...domains.map((d: any) => d[1])) : 1;

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 24 }}>
        <Text style={s.heroTitle}>Career Explorer</Text>
        <Text style={s.subtitle}>See where our alumni are today</Text>

        {/* Stats row */}
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Ionicons name="people" size={28} color={'#0A66C2'} />
            <Text style={s.statNumber}>{stats?.totalAlumni || 0}</Text>
            <Text style={s.statLabel}>Alumni</Text>
          </View>
          <View style={s.statCard}>
            <Ionicons name="briefcase" size={28} color={'#0A66C2'} />
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
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  heroTitle: { fontSize: 24, fontWeight: '800', color: '#1C1C1E', marginTop: 40 },
  subtitle: { fontSize: 15, color: '#8E8E93' },
  statsRow: { flexDirection: 'row', gap: 16 },
  statCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 16, padding: 24, alignItems: 'center', gap: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  statNumber: { fontSize: 24, fontWeight: '800', color: '#1C1C1E' },
  statLabel: { fontSize: 13, color: '#C7C7CC' },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1C1C1E' },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barLabel: { width: 100, fontSize: 13, color: '#8E8E93' },
  barTrack: { flex: 1, height: 8, backgroundColor: '#FFF', borderRadius: 16, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#0A66C2', borderRadius: 16 },
  barCount: { width: 30, fontSize: 13, color: '#C7C7CC', textAlign: 'right' },
  emptyText: { fontSize: 15, color: '#C7C7CC', textAlign: 'center' },
});
