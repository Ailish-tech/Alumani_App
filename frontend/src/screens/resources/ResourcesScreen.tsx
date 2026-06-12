import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, TextInput, Alert, Modal } from 'react-native';
import { AppleAlert } from '../../components/AppleAlert';
import { Ionicons } from '@expo/vector-icons';

import api from '../../services/api';


// LinkedIn-Inspired Colors
const LI = {
  blue: '#0A66C2', white: '#FFF', bgLight: '#F2F2F7',
  border: '#E5E5EA', textDark: '#1C1C1E', textSecondary: '#8E8E93',
  green: '#057642',
};export default function ResourcesScreen() {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', subject: '', fileUrl: '' });

  const fetch = async () => { setLoading(true); try { const r = await api.get('/features/resources'); setResources(r.data.data || []); } catch {} setLoading(false); };
  useEffect(() => { fetch(); }, []);

  const handleCreate = async () => {
    if (!form.title) { AppleAlert.alert('Error', 'Title required'); return; }
    await api.post('/features/resources', form); setShowCreate(false); setForm({ title: '', description: '', subject: '', fileUrl: '' }); fetch();
  };

  const SUBJECT_COLORS: Record<string, string> = { 'CS': '#6C63FF', 'Math': '#FF6E40', 'Physics': '#00D9FF', 'English': '#FFD600' };

  return (
    <View style={s.container}>
      <View style={s.header}><Text style={s.title}>Resources</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowCreate(true)}><Ionicons name="add" size={24} color="#fff" /></TouchableOpacity>
      </View>
      <FlatList data={resources} keyExtractor={i => i.id} contentContainerStyle={{ padding: 16, gap: 16 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetch} tintColor={'#0A66C2'} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.card} activeOpacity={0.8}>
            <View style={[s.iconCircle, { backgroundColor: `${SUBJECT_COLORS[item.subject] || '#0A66C2'}20` }]}>
              <Ionicons name="document-text" size={24} color={SUBJECT_COLORS[item.subject] || '#0A66C2'} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>{item.title}</Text>
              <Text style={s.cardSub}>{item.description}</Text>
              <View style={s.metaRow}>
                <View style={s.subjectBadge}><Text style={s.subjectText}>{item.subject || 'General'}</Text></View>
                <Text style={s.downloads}>{item.downloads || 0} downloads</Text>
              </View>
            </View>
            <Ionicons name="download-outline" size={20} color={'#0A66C2'} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={<View style={s.empty}><Ionicons name="document-text-outline" size={48} color={'#C7C7CC'} /><Text style={s.emptyText}>No resources yet</Text></View>}
      />
      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={s.overlay}><View style={s.modal}>
          <Text style={s.modalTitle}>Share Resource</Text>
          <TextInput style={s.input} placeholder="Title" placeholderTextColor={'#C7C7CC'} value={form.title} onChangeText={t => setForm(p => ({ ...p, title: t }))} />
          <TextInput style={[s.input, { height: 60 }]} placeholder="Description" placeholderTextColor={'#C7C7CC'} value={form.description} onChangeText={t => setForm(p => ({ ...p, description: t }))} multiline />
          <TextInput style={s.input} placeholder="Subject (e.g. CS, Math)" placeholderTextColor={'#C7C7CC'} value={form.subject} onChangeText={t => setForm(p => ({ ...p, subject: t }))} />
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
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: '#1C1C1E' },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#0A66C2', alignItems: 'center', justifyContent: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, gap: 16 },
  iconCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1C1C1E' },
  cardSub: { fontSize: 13, color: '#8E8E93' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  subjectBadge: { backgroundColor: '#E8F1FA', paddingHorizontal: 8, paddingVertical: 1, borderRadius: 999 },
  subjectText: { fontSize: 11, color: '#0A66C2', fontWeight: '600' },
  downloads: { fontSize: 11, color: '#C7C7CC' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 16 },
  emptyText: { fontSize: 15, color: '#C7C7CC' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#FFF', borderTopLeftRadius: 12, borderTopRightRadius: 12, padding: 24, gap: 16 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1C1C1E' },
  input: { backgroundColor: '#F2F2F7', borderRadius: 16, padding: 16, color: '#1C1C1E', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  actions: { flexDirection: 'row', gap: 16 },
  cancelBtn: { flex: 1, padding: 16, borderRadius: 16, backgroundColor: '#F2F2F7', alignItems: 'center' },
  cancelText: { color: '#8E8E93', fontWeight: '600' },
  createBtn: { flex: 1, padding: 16, borderRadius: 16, backgroundColor: '#0A66C2', alignItems: 'center' },
  createText: { color: '#fff', fontWeight: '700' },
});
