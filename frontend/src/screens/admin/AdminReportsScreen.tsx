import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert } from 'react-native';
import { AppleAlert } from '../../components/AppleAlert';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import api from '../../services/api';

const STATUS_COLORS: Record<string, string> = { pending: '#FF9800', reviewed: '#448AFF', dismissed: '#9E9E9E', actioned: '#00E676' };

export default function AdminReportsScreen() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('pending');

  const fetch = async () => { setLoading(true); try { const r = await api.get(`/admin/reports?status=${filter}`); setReports(r.data.data || []); } catch {} setLoading(false); };
  useEffect(() => { fetch(); }, [filter]);

  const handleAction = (id: string, status: string) => {
    AppleAlert.alert('Confirm', `Mark report as "${status}"?`, [
      { text: 'Cancel' },
      { text: 'Confirm', onPress: async () => { await api.patch(`/admin/reports/${id}`, { status }); fetch(); } },
    ]);
  };

  return (
    <View style={s.container}>
      <View style={s.header}><Text style={s.title}>⚠️ Reports</Text></View>

      {/* Filter tabs */}
      <View style={s.filterRow}>
        {['pending', 'reviewed', 'actioned', 'dismissed'].map(st => (
          <TouchableOpacity key={st} style={[s.filterChip, filter === st && { borderColor: STATUS_COLORS[st], backgroundColor: `${STATUS_COLORS[st]}15` }]}
            onPress={() => setFilter(st)}>
            <Text style={[s.filterText, filter === st && { color: STATUS_COLORS[st] }]}>{st}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList data={reports} keyExtractor={i => i.id} contentContainerStyle={{ padding: Spacing.md, gap: Spacing.md }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetch} tintColor={'#004182'} />}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.cardHeader}>
              <View style={[s.typeBadge, { backgroundColor: '#FF525220' }]}>
                <Ionicons name="flag" size={14} color="#FF5252" />
                <Text style={s.typeText}>{item.targetType}</Text>
              </View>
              <View style={[s.statusBadge, { backgroundColor: `${STATUS_COLORS[item.status]}20` }]}>
                <Text style={[s.statusText, { color: STATUS_COLORS[item.status] }]}>{item.status}</Text>
              </View>
            </View>
            <Text style={s.reason}>{item.reason}</Text>
            <Text style={s.meta}>Target: {item.targetId?.substring(0, 16)}... • Reporter: {item.reporterId?.substring(0, 12)}...</Text>
            <Text style={s.date}>{new Date(item.createdAt).toLocaleString()}</Text>
            {item.status === 'pending' && (
              <View style={s.actions}>
                <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#00E67620' }]} onPress={() => handleAction(item.id, 'actioned')}>
                  <Text style={[s.actionBtnText, { color: '#00E676' }]}>Take Action</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#9E9E9E20' }]} onPress={() => handleAction(item.id, 'dismissed')}>
                  <Text style={[s.actionBtnText, { color: '#9E9E9E' }]}>Dismiss</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={<View style={s.empty}><Ionicons name="checkmark-circle-outline" size={48} color={'#999999'} /><Text style={s.emptyText}>No {filter} reports</Text></View>}
      />
    </View>
  );
}
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F2EF' },
  header: { paddingHorizontal: Spacing.md, paddingTop: 56, paddingBottom: Spacing.sm },
  title: { fontSize: FontSize.xxl, fontWeight: '800', color: '#191919' },
  filterRow: { flexDirection: 'row', paddingHorizontal: Spacing.md, gap: Spacing.xs, marginBottom: Spacing.sm },
  filterChip: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: '#DCE6F1' },
  filterText: { fontSize: FontSize.xs, color: '#999999', textTransform: 'capitalize', fontWeight: '600' },
  card: { backgroundColor: '#FFFFFF', borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1, borderColor: '#DCE6F1', gap: Spacing.xs },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full },
  typeText: { fontSize: FontSize.xs, color: '#FF5252', fontWeight: '700', textTransform: 'uppercase' },
  statusBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full },
  statusText: { fontSize: FontSize.xs, fontWeight: '700', textTransform: 'capitalize' },
  reason: { fontSize: FontSize.md, color: '#191919', fontWeight: '600' },
  meta: { fontSize: FontSize.xs, color: '#999999' },
  date: { fontSize: FontSize.xs, color: '#999999' },
  actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs },
  actionBtn: { flex: 1, paddingVertical: Spacing.sm, borderRadius: BorderRadius.sm, alignItems: 'center' },
  actionBtnText: { fontWeight: '700', fontSize: FontSize.sm },
  empty: { alignItems: 'center', paddingTop: 80, gap: Spacing.sm },
  emptyText: { fontSize: FontSize.md, color: '#999999' },
});
