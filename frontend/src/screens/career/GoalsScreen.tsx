import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Alert, Modal, RefreshControl } from 'react-native';
import { AppleAlert } from '../../components/AppleAlert';
import { Ionicons } from '@expo/vector-icons';

import api from '../../services/api';


// LinkedIn-Inspired Colors
const LI = {
  blue: '#0A66C2', white: '#FFF', bgLight: '#F2F2F7',
  border: '#E5E5EA', textDark: '#1C1C1E', textSecondary: '#8E8E93',
  green: '#057642',
};export default function GoalsScreen() {
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '' });

  const fetch = async () => { setLoading(true); try { const r = await api.get('/features/goals'); setGoals(r.data.data || []); } catch {} setLoading(false); };
  useEffect(() => { fetch(); }, []);

  const handleCreate = async () => {
    if (!form.title) { AppleAlert.alert('Error', 'Title required'); return; }
    await api.post('/features/goals', form); setShowCreate(false); setForm({ title: '', description: '' }); fetch();
  };

  const toggleStatus = async (id: string, current: string) => {
    const next = current === 'completed' ? 'in_progress' : 'completed';
    await api.patch(`/features/goals/${id}`, { status: next }); fetch();
  };

  return (
    <View style={s.container}>
      <View style={s.header}><Text style={s.title}>Goals</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowCreate(true)}><Ionicons name="add" size={24} color="#fff" /></TouchableOpacity>
      </View>
      <FlatList data={goals} keyExtractor={i => i.id} contentContainerStyle={{ padding: 16, gap: 16 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetch} tintColor={'#0A66C2'} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.card} onPress={() => toggleStatus(item.id, item.status)} activeOpacity={0.7}>
            <Ionicons name={item.status === 'completed' ? 'checkmark-circle' : 'ellipse-outline'} size={24}
              color={item.status === 'completed' ? '#057642' : '#C7C7CC'} />
            <View style={{ flex: 1 }}>
              <Text style={[s.goalTitle, item.status === 'completed' && s.completed]}>{item.title}</Text>
              {item.description ? <Text style={s.goalDesc}>{item.description}</Text> : null}
            </View>
            <Ionicons name="flag" size={16} color={item.status === 'completed' ? '#057642' : '#E16745'} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={<View style={s.empty}><Ionicons name="flag-outline" size={48} color={'#C7C7CC'} /><Text style={s.emptyText}>Set your first goal!</Text></View>}
      />
      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={s.overlay}><View style={s.modal}>
          <Text style={s.modalTitle}>New Goal</Text>
          <TextInput style={s.input} placeholder="Goal title" placeholderTextColor={'#C7C7CC'} value={form.title} onChangeText={t => setForm(p => ({ ...p, title: t }))} />
          <TextInput style={[s.input, { height: 80 }]} placeholder="Description" placeholderTextColor={'#C7C7CC'} value={form.description} onChangeText={t => setForm(p => ({ ...p, description: t }))} multiline />
          <View style={s.actions}>
            <TouchableOpacity style={s.cancelBtn} onPress={() => setShowCreate(false)}><Text style={s.cancelText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={s.createBtn} onPress={handleCreate}><Text style={s.createText}>Create</Text></TouchableOpacity>
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
  goalTitle: { fontSize: 15, fontWeight: '700', color: '#1C1C1E' },
  completed: { textDecorationLine: 'line-through', color: '#C7C7CC' },
  goalDesc: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
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
