import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, TextInput, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import api from '../../services/api';

const STATUS_COLORS: Record<string, string> = {
  pending: '#FF9800', accepted: '#448AFF', interviewing: '#E040FB', hired: '#00E676', rejected: '#FF5252',
};

export default function ReferralsScreen() {
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ studentId: '', company: '', position: '', note: '' });

  const fetch = async () => { setLoading(true); try { const r = await api.get('/alumni/referrals'); setReferrals(r.data.data || []); } catch {} setLoading(false); };
  useEffect(() => { fetch(); }, []);

  const handleCreate = async () => {
    if (!form.studentId || !form.company || !form.position) { Alert.alert('Error', 'Student ID, company, and position required'); return; }
    await api.post('/alumni/referrals', form); setShowCreate(false); setForm({ studentId: '', company: '', position: '', note: '' }); fetch();
  };

  const updateStatus = async (id: string, status: string) => { await api.patch(`/alumni/referrals/${id}`, { status }); fetch(); };

  return (
    <View style={s.container}>
      <View style={s.header}><Text style={s.title}>My Referrals</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowCreate(true)}><Ionicons name="add" size={24} color="#fff" /></TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={s.statsRow}>
        <View style={s.stat}><Text style={s.statNum}>{referrals.length}</Text><Text style={s.statLabel}>Total</Text></View>
        <View style={s.stat}><Text style={[s.statNum, { color: '#00E676' }]}>{referrals.filter(r => r.status === 'hired').length}</Text><Text style={s.statLabel}>Hired</Text></View>
        <View style={s.stat}><Text style={[s.statNum, { color: '#E040FB' }]}>{referrals.filter(r => r.status === 'interviewing').length}</Text><Text style={s.statLabel}>In Process</Text></View>
      </View>

      <FlatList data={referrals} keyExtractor={i => i.id} contentContainerStyle={{ padding: Spacing.md, gap: Spacing.md }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetch} tintColor={Colors.roleAlumni} />}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.cardHeader}>
              <View>
                <Text style={s.cardTitle}>{item.position}</Text>
                <Text style={s.company}>{item.company}</Text>
              </View>
              <View style={[s.statusBadge, { backgroundColor: `${STATUS_COLORS[item.status] || Colors.textMuted}20` }]}>
                <View style={[s.statusDot, { backgroundColor: STATUS_COLORS[item.status] || Colors.textMuted }]} />
                <Text style={[s.statusText, { color: STATUS_COLORS[item.status] || Colors.textMuted }]}>{item.status}</Text>
              </View>
            </View>
            {item.note ? <Text style={s.note}>{item.note}</Text> : null}
            <View style={s.cardActions}>
              {['pending', 'accepted', 'interviewing', 'hired', 'rejected'].map(st => (
                <TouchableOpacity key={st} style={[s.actionChip, item.status === st && { backgroundColor: `${STATUS_COLORS[st]}20`, borderColor: STATUS_COLORS[st] }]}
                  onPress={() => updateStatus(item.id, st)}>
                  <Text style={[s.actionChipText, item.status === st && { color: STATUS_COLORS[st] }]}>{st}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
        ListEmptyComponent={<View style={s.empty}><Ionicons name="paper-plane-outline" size={48} color={Colors.textMuted} /><Text style={s.emptyText}>No referrals yet</Text><Text style={s.emptySub}>Refer students to companies you trust</Text></View>}
      />

      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={s.overlay}><View style={s.modal}>
          <Text style={s.modalTitle}>Create Referral</Text>
          <TextInput style={s.input} placeholder="Student User ID" placeholderTextColor={Colors.textMuted} value={form.studentId} onChangeText={t => setForm(p => ({ ...p, studentId: t }))} />
          <TextInput style={s.input} placeholder="Company" placeholderTextColor={Colors.textMuted} value={form.company} onChangeText={t => setForm(p => ({ ...p, company: t }))} />
          <TextInput style={s.input} placeholder="Position" placeholderTextColor={Colors.textMuted} value={form.position} onChangeText={t => setForm(p => ({ ...p, position: t }))} />
          <TextInput style={[s.input, { height: 80 }]} placeholder="Note (optional)" placeholderTextColor={Colors.textMuted} value={form.note} onChangeText={t => setForm(p => ({ ...p, note: t }))} multiline />
          <View style={s.actions}>
            <TouchableOpacity style={s.cancelBtn} onPress={() => setShowCreate(false)}><Text style={s.cancelText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={s.createBtn} onPress={handleCreate}><Text style={s.createText}>Refer</Text></TouchableOpacity>
          </View>
        </View></View>
      </Modal>
    </View>
  );
}
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDark },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, paddingTop: 56, paddingBottom: Spacing.sm },
  title: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E040FB', alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', paddingHorizontal: Spacing.md, gap: Spacing.sm, marginBottom: Spacing.sm },
  stat: { flex: 1, backgroundColor: Colors.bgCard, borderRadius: BorderRadius.sm, padding: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  statNum: { fontSize: FontSize.xl, fontWeight: '900', color: Colors.textPrimary },
  statLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  card: { backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  company: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: FontSize.xs, fontWeight: '700', textTransform: 'capitalize' },
  note: { fontSize: FontSize.sm, color: Colors.textSecondary, fontStyle: 'italic' },
  cardActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  actionChip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border },
  actionChipText: { fontSize: 10, color: Colors.textMuted, textTransform: 'capitalize' },
  empty: { alignItems: 'center', paddingTop: 80, gap: Spacing.sm },
  emptyText: { fontSize: FontSize.md, color: Colors.textMuted },
  emptySub: { fontSize: FontSize.sm, color: Colors.textMuted },
  overlay: { flex: 1, backgroundColor: Colors.bgOverlay, justifyContent: 'flex-end' },
  modal: { backgroundColor: Colors.bgCard, borderTopLeftRadius: BorderRadius.lg, borderTopRightRadius: BorderRadius.lg, padding: Spacing.lg, gap: Spacing.md },
  modalTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary },
  input: { backgroundColor: Colors.bgInput, borderRadius: BorderRadius.sm, padding: Spacing.md, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border },
  actions: { flexDirection: 'row', gap: Spacing.md },
  cancelBtn: { flex: 1, padding: Spacing.md, borderRadius: BorderRadius.sm, backgroundColor: Colors.bgDark, alignItems: 'center' },
  cancelText: { color: Colors.textSecondary, fontWeight: '600' },
  createBtn: { flex: 1, padding: Spacing.md, borderRadius: BorderRadius.sm, backgroundColor: '#E040FB', alignItems: 'center' },
  createText: { color: '#fff', fontWeight: '700' },
});
