import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, TextInput, Alert, Modal } from 'react-native';
import { AppleAlert } from '../../components/AppleAlert';
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
    if (!form.studentId || !form.company || !form.position) { AppleAlert.alert('Error', 'Student ID, company, and position required'); return; }
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

      <FlatList data={referrals} keyExtractor={i => i.id} contentContainerStyle={{ padding: 16, gap: 16 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetch} tintColor={'#057642'} />}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.cardHeader}>
              <View>
                <Text style={s.cardTitle}>{item.position}</Text>
                <Text style={s.company}>{item.company}</Text>
              </View>
              <View style={[s.statusBadge, { backgroundColor: `${STATUS_COLORS[item.status] || '#999999'}20` }]}>
                <View style={[s.statusDot, { backgroundColor: STATUS_COLORS[item.status] || '#999999' }]} />
                <Text style={[s.statusText, { color: STATUS_COLORS[item.status] || '#999999' }]}>{item.status}</Text>
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
        ListEmptyComponent={<View style={s.empty}><Ionicons name="paper-plane-outline" size={48} color={'#999999'} /><Text style={s.emptyText}>No referrals yet</Text><Text style={s.emptySub}>Refer students to companies you trust</Text></View>}
      />

      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={s.overlay}><View style={s.modal}>
          <Text style={s.modalTitle}>Create Referral</Text>
          <TextInput style={s.input} placeholder="Student User ID" placeholderTextColor={'#999999'} value={form.studentId} onChangeText={t => setForm(p => ({ ...p, studentId: t }))} />
          <TextInput style={s.input} placeholder="Company" placeholderTextColor={'#999999'} value={form.company} onChangeText={t => setForm(p => ({ ...p, company: t }))} />
          <TextInput style={s.input} placeholder="Position" placeholderTextColor={'#999999'} value={form.position} onChangeText={t => setForm(p => ({ ...p, position: t }))} />
          <TextInput style={[s.input, { height: 80 }]} placeholder="Note (optional)" placeholderTextColor={'#999999'} value={form.note} onChangeText={t => setForm(p => ({ ...p, note: t }))} multiline />
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
  container: { flex: 1, backgroundColor: '#F3F2EF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: '#191919' },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E040FB', alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  stat: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 4, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#DCE6F1' },
  statNum: { fontSize: 20, fontWeight: '900', color: '#191919' },
  statLabel: { fontSize: 11, color: '#999999' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 8, padding: 16, borderWidth: 1, borderColor: '#DCE6F1', gap: 8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#191919' },
  company: { fontSize: 13, color: '#0A66C2', fontWeight: '600' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  note: { fontSize: 13, color: '#666666', fontStyle: 'italic' },
  cardActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  actionChip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, borderWidth: 1, borderColor: '#DCE6F1' },
  actionChipText: { fontSize: 10, color: '#999999', textTransform: 'capitalize' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyText: { fontSize: 15, color: '#999999' },
  emptySub: { fontSize: 13, color: '#999999' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 12, borderTopRightRadius: 12, padding: 24, gap: 16 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#191919' },
  input: { backgroundColor: '#F3F2EF', borderRadius: 4, padding: 16, color: '#191919', borderWidth: 1, borderColor: '#DCE6F1' },
  actions: { flexDirection: 'row', gap: 16 },
  cancelBtn: { flex: 1, padding: 16, borderRadius: 4, backgroundColor: '#F3F2EF', alignItems: 'center' },
  cancelText: { color: '#666666', fontWeight: '600' },
  createBtn: { flex: 1, padding: 16, borderRadius: 4, backgroundColor: '#E040FB', alignItems: 'center' },
  createText: { color: '#fff', fontWeight: '700' },
});
