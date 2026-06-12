import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, TextInput, Alert, Modal } from 'react-native';
import { AppleAlert } from '../../components/AppleAlert';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import api from '../../services/api';

const PRIORITY_COLORS: Record<string, string> = { urgent: '#FF5252', high: '#FF9800', normal: '#448AFF', low: '#9E9E9E' };

export default function AdminAnnouncementsScreen() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', priority: 'normal', targetRole: '' });

  const fetch = async () => { setLoading(true); try { const r = await api.get('/admin/announcements'); setAnnouncements(r.data.data || []); } catch {} setLoading(false); };
  useEffect(() => { fetch(); }, []);

  const handleCreate = async () => {
    if (!form.title || !form.message) { AppleAlert.alert('Error', 'Title and message required'); return; }
    await api.post('/admin/announcements', { ...form, targetRole: form.targetRole || undefined });
    setShowCreate(false); setForm({ title: '', message: '', priority: 'normal', targetRole: '' }); fetch();
  };

  const handleDelete = (id: string) => {
    AppleAlert.alert('Delete?', 'Remove this announcement?', [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await api.delete(`/admin/announcements/${id}`); fetch(); } },
    ]);
  };

  return (
    <View style={s.container}>
      <View style={s.header}><Text style={s.title}>📢 Announcements</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowCreate(true)}><Ionicons name="add" size={24} color="#fff" /></TouchableOpacity>
      </View>

      <FlatList data={announcements} keyExtractor={i => i.id} contentContainerStyle={{ padding: 16, gap: 16 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetch} tintColor={'#004182'} />}
        renderItem={({ item }) => (
          <View style={[s.card, { borderLeftWidth: 3, borderLeftColor: PRIORITY_COLORS[item.priority] || '#DCE6F1' }]}>
            <View style={s.cardHeader}>
              <View style={[s.priorityBadge, { backgroundColor: `${PRIORITY_COLORS[item.priority]}20` }]}>
                <Text style={[s.priorityText, { color: PRIORITY_COLORS[item.priority] }]}>{item.priority}</Text>
              </View>
              <TouchableOpacity onPress={() => handleDelete(item.id)}><Ionicons name="trash-outline" size={18} color="#FF5252" /></TouchableOpacity>
            </View>
            <Text style={s.annTitle}>{item.title}</Text>
            <Text style={s.annMessage}>{item.message}</Text>
            {item.targetRole && <Text style={s.targetRole}>Target: {item.targetRole}</Text>}
            <Text style={s.date}>{new Date(item.createdAt).toLocaleString()}</Text>
          </View>
        )}
        ListEmptyComponent={<View style={s.empty}><Ionicons name="megaphone-outline" size={48} color={'#999999'} /><Text style={s.emptyText}>No announcements</Text></View>}
      />

      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={s.overlay}><View style={s.modal}>
          <Text style={s.modalTitle}>New Announcement</Text>
          <TextInput style={s.input} placeholder="Title" placeholderTextColor={'#999999'} value={form.title} onChangeText={t => setForm(p => ({ ...p, title: t }))} />
          <TextInput style={[s.input, { height: 100 }]} placeholder="Message" placeholderTextColor={'#999999'} value={form.message} onChangeText={t => setForm(p => ({ ...p, message: t }))} multiline textAlignVertical="top" />
          <Text style={s.label}>Priority</Text>
          <View style={s.priorityRow}>
            {['low', 'normal', 'high', 'urgent'].map(p => (
              <TouchableOpacity key={p} style={[s.priorityOption, form.priority === p && { borderColor: PRIORITY_COLORS[p], backgroundColor: `${PRIORITY_COLORS[p]}15` }]}
                onPress={() => setForm(f => ({ ...f, priority: p }))}>
                <Text style={[s.priorityOptionText, form.priority === p && { color: PRIORITY_COLORS[p] }]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput style={s.input} placeholder="Target Role (optional: student/alumni/faculty)" placeholderTextColor={'#999999'} value={form.targetRole} onChangeText={t => setForm(p => ({ ...p, targetRole: t }))} />
          <View style={s.formActions}>
            <TouchableOpacity style={s.cancelBtn} onPress={() => setShowCreate(false)}><Text style={s.cancelText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={s.createBtn} onPress={handleCreate}><Text style={s.createText}>Broadcast</Text></TouchableOpacity>
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
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FF9800', alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 8, padding: 16, borderWidth: 1, borderColor: '#DCE6F1', gap: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  priorityText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  annTitle: { fontSize: 15, fontWeight: '700', color: '#191919' },
  annMessage: { fontSize: 13, color: '#666666', lineHeight: 20 },
  targetRole: { fontSize: 11, color: '#0A66C2', fontWeight: '600' },
  date: { fontSize: 11, color: '#999999' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyText: { fontSize: 15, color: '#999999' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 12, borderTopRightRadius: 12, padding: 24, gap: 16 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#191919' },
  input: { backgroundColor: '#F3F2EF', borderRadius: 4, padding: 16, color: '#191919', borderWidth: 1, borderColor: '#DCE6F1' },
  label: { fontSize: 13, color: '#999999', fontWeight: '600' },
  priorityRow: { flexDirection: 'row', gap: 4 },
  priorityOption: { flex: 1, padding: 8, borderRadius: 4, borderWidth: 1, borderColor: '#DCE6F1', alignItems: 'center' },
  priorityOptionText: { fontSize: 11, color: '#999999', fontWeight: '600', textTransform: 'capitalize' },
  formActions: { flexDirection: 'row', gap: 16 },
  cancelBtn: { flex: 1, padding: 16, borderRadius: 4, backgroundColor: '#F3F2EF', alignItems: 'center' },
  cancelText: { color: '#666666', fontWeight: '600' },
  createBtn: { flex: 1, padding: 16, borderRadius: 4, backgroundColor: '#FF9800', alignItems: 'center' },
  createText: { color: '#fff', fontWeight: '700' },
});
