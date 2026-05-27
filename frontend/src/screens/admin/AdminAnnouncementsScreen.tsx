import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, TextInput, Alert, Modal } from 'react-native';
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
    if (!form.title || !form.message) { Alert.alert('Error', 'Title and message required'); return; }
    await api.post('/admin/announcements', { ...form, targetRole: form.targetRole || undefined });
    setShowCreate(false); setForm({ title: '', message: '', priority: 'normal', targetRole: '' }); fetch();
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete?', 'Remove this announcement?', [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await api.delete(`/admin/announcements/${id}`); fetch(); } },
    ]);
  };

  return (
    <View style={s.container}>
      <View style={s.header}><Text style={s.title}>📢 Announcements</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowCreate(true)}><Ionicons name="add" size={24} color="#fff" /></TouchableOpacity>
      </View>

      <FlatList data={announcements} keyExtractor={i => i.id} contentContainerStyle={{ padding: Spacing.md, gap: Spacing.md }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetch} tintColor={Colors.roleAdmin} />}
        renderItem={({ item }) => (
          <View style={[s.card, { borderLeftWidth: 3, borderLeftColor: PRIORITY_COLORS[item.priority] || Colors.border }]}>
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
        ListEmptyComponent={<View style={s.empty}><Ionicons name="megaphone-outline" size={48} color={Colors.textMuted} /><Text style={s.emptyText}>No announcements</Text></View>}
      />

      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={s.overlay}><View style={s.modal}>
          <Text style={s.modalTitle}>New Announcement</Text>
          <TextInput style={s.input} placeholder="Title" placeholderTextColor={Colors.textMuted} value={form.title} onChangeText={t => setForm(p => ({ ...p, title: t }))} />
          <TextInput style={[s.input, { height: 100 }]} placeholder="Message" placeholderTextColor={Colors.textMuted} value={form.message} onChangeText={t => setForm(p => ({ ...p, message: t }))} multiline textAlignVertical="top" />
          <Text style={s.label}>Priority</Text>
          <View style={s.priorityRow}>
            {['low', 'normal', 'high', 'urgent'].map(p => (
              <TouchableOpacity key={p} style={[s.priorityOption, form.priority === p && { borderColor: PRIORITY_COLORS[p], backgroundColor: `${PRIORITY_COLORS[p]}15` }]}
                onPress={() => setForm(f => ({ ...f, priority: p }))}>
                <Text style={[s.priorityOptionText, form.priority === p && { color: PRIORITY_COLORS[p] }]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput style={s.input} placeholder="Target Role (optional: student/alumni/faculty)" placeholderTextColor={Colors.textMuted} value={form.targetRole} onChangeText={t => setForm(p => ({ ...p, targetRole: t }))} />
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
  container: { flex: 1, backgroundColor: Colors.bgDark },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, paddingTop: 56, paddingBottom: Spacing.sm },
  title: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FF9800', alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, gap: Spacing.xs },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priorityBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full },
  priorityText: { fontSize: FontSize.xs, fontWeight: '700', textTransform: 'uppercase' },
  annTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  annMessage: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  targetRole: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '600' },
  date: { fontSize: FontSize.xs, color: Colors.textMuted },
  empty: { alignItems: 'center', paddingTop: 80, gap: Spacing.sm },
  emptyText: { fontSize: FontSize.md, color: Colors.textMuted },
  overlay: { flex: 1, backgroundColor: Colors.bgOverlay, justifyContent: 'flex-end' },
  modal: { backgroundColor: Colors.bgCard, borderTopLeftRadius: BorderRadius.lg, borderTopRightRadius: BorderRadius.lg, padding: Spacing.lg, gap: Spacing.md },
  modalTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary },
  input: { backgroundColor: Colors.bgInput, borderRadius: BorderRadius.sm, padding: Spacing.md, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border },
  label: { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: '600' },
  priorityRow: { flexDirection: 'row', gap: Spacing.xs },
  priorityOption: { flex: 1, padding: Spacing.sm, borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  priorityOptionText: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: '600', textTransform: 'capitalize' },
  formActions: { flexDirection: 'row', gap: Spacing.md },
  cancelBtn: { flex: 1, padding: Spacing.md, borderRadius: BorderRadius.sm, backgroundColor: Colors.bgDark, alignItems: 'center' },
  cancelText: { color: Colors.textSecondary, fontWeight: '600' },
  createBtn: { flex: 1, padding: Spacing.md, borderRadius: BorderRadius.sm, backgroundColor: '#FF9800', alignItems: 'center' },
  createText: { color: '#fff', fontWeight: '700' },
});
