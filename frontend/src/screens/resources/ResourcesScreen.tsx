import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, TextInput, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import api from '../../services/api';

export default function ResourcesScreen() {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', subject: '', fileUrl: '' });

  const fetch = async () => { setLoading(true); try { const r = await api.get('/features/resources'); setResources(r.data.data || []); } catch {} setLoading(false); };
  useEffect(() => { fetch(); }, []);

  const handleCreate = async () => {
    if (!form.title) { Alert.alert('Error', 'Title required'); return; }
    await api.post('/features/resources', form); setShowCreate(false); setForm({ title: '', description: '', subject: '', fileUrl: '' }); fetch();
  };

  const SUBJECT_COLORS: Record<string, string> = { 'CS': '#6C63FF', 'Math': '#FF6E40', 'Physics': '#00D9FF', 'English': '#FFD600' };

  return (
    <View style={s.container}>
      <View style={s.header}><Text style={s.title}>Resources</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowCreate(true)}><Ionicons name="add" size={24} color="#fff" /></TouchableOpacity>
      </View>
      <FlatList data={resources} keyExtractor={i => i.id} contentContainerStyle={{ padding: Spacing.md, gap: Spacing.md }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetch} tintColor={Colors.primary} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.card} activeOpacity={0.8}>
            <View style={[s.iconCircle, { backgroundColor: `${SUBJECT_COLORS[item.subject] || Colors.primary}20` }]}>
              <Ionicons name="document-text" size={24} color={SUBJECT_COLORS[item.subject] || Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>{item.title}</Text>
              <Text style={s.cardSub}>{item.description}</Text>
              <View style={s.metaRow}>
                <View style={s.subjectBadge}><Text style={s.subjectText}>{item.subject || 'General'}</Text></View>
                <Text style={s.downloads}>{item.downloads || 0} downloads</Text>
              </View>
            </View>
            <Ionicons name="download-outline" size={20} color={Colors.primary} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={<View style={s.empty}><Ionicons name="document-text-outline" size={48} color={Colors.textMuted} /><Text style={s.emptyText}>No resources yet</Text></View>}
      />
      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={s.overlay}><View style={s.modal}>
          <Text style={s.modalTitle}>Share Resource</Text>
          <TextInput style={s.input} placeholder="Title" placeholderTextColor={Colors.textMuted} value={form.title} onChangeText={t => setForm(p => ({ ...p, title: t }))} />
          <TextInput style={[s.input, { height: 60 }]} placeholder="Description" placeholderTextColor={Colors.textMuted} value={form.description} onChangeText={t => setForm(p => ({ ...p, description: t }))} multiline />
          <TextInput style={s.input} placeholder="Subject (e.g. CS, Math)" placeholderTextColor={Colors.textMuted} value={form.subject} onChangeText={t => setForm(p => ({ ...p, subject: t }))} />
          <View style={s.actions}>
            <TouchableOpacity style={s.cancelBtn} onPress={() => setShowCreate(false)}><Text style={s.cancelText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={s.createBtn} onPress={handleCreate}><Text style={s.createText}>Share</Text></TouchableOpacity>
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
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, gap: Spacing.md },
  iconCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  cardSub: { fontSize: FontSize.sm, color: Colors.textSecondary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 4 },
  subjectBadge: { backgroundColor: Colors.primaryGlow, paddingHorizontal: Spacing.sm, paddingVertical: 1, borderRadius: BorderRadius.full },
  subjectText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '600' },
  downloads: { fontSize: FontSize.xs, color: Colors.textMuted },
  empty: { alignItems: 'center', paddingTop: 80, gap: Spacing.md },
  emptyText: { fontSize: FontSize.md, color: Colors.textMuted },
  overlay: { flex: 1, backgroundColor: Colors.bgOverlay, justifyContent: 'flex-end' },
  modal: { backgroundColor: Colors.bgCard, borderTopLeftRadius: BorderRadius.lg, borderTopRightRadius: BorderRadius.lg, padding: Spacing.lg, gap: Spacing.md },
  modalTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary },
  input: { backgroundColor: Colors.bgInput, borderRadius: BorderRadius.sm, padding: Spacing.md, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border },
  actions: { flexDirection: 'row', gap: Spacing.md },
  cancelBtn: { flex: 1, padding: Spacing.md, borderRadius: BorderRadius.sm, backgroundColor: Colors.bgDark, alignItems: 'center' },
  cancelText: { color: Colors.textSecondary, fontWeight: '600' },
  createBtn: { flex: 1, padding: Spacing.md, borderRadius: BorderRadius.sm, backgroundColor: Colors.primary, alignItems: 'center' },
  createText: { color: '#fff', fontWeight: '700' },
});
