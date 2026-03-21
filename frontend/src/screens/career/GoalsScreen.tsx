import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Alert, Modal, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import api from '../../services/api';

export default function GoalsScreen() {
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '' });

  const fetch = async () => { setLoading(true); try { const r = await api.get('/features/goals'); setGoals(r.data.data || []); } catch {} setLoading(false); };
  useEffect(() => { fetch(); }, []);

  const handleCreate = async () => {
    if (!form.title) { Alert.alert('Error', 'Title required'); return; }
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
      <FlatList data={goals} keyExtractor={i => i.id} contentContainerStyle={{ padding: Spacing.md, gap: Spacing.md }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetch} tintColor={Colors.primary} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.card} onPress={() => toggleStatus(item.id, item.status)} activeOpacity={0.7}>
            <Ionicons name={item.status === 'completed' ? 'checkmark-circle' : 'ellipse-outline'} size={24}
              color={item.status === 'completed' ? Colors.success : Colors.textMuted} />
            <View style={{ flex: 1 }}>
              <Text style={[s.goalTitle, item.status === 'completed' && s.completed]}>{item.title}</Text>
              {item.description ? <Text style={s.goalDesc}>{item.description}</Text> : null}
            </View>
            <Ionicons name="flag" size={16} color={item.status === 'completed' ? Colors.success : Colors.warning} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={<View style={s.empty}><Ionicons name="flag-outline" size={48} color={Colors.textMuted} /><Text style={s.emptyText}>Set your first goal!</Text></View>}
      />
      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={s.overlay}><View style={s.modal}>
          <Text style={s.modalTitle}>New Goal</Text>
          <TextInput style={s.input} placeholder="Goal title" placeholderTextColor={Colors.textMuted} value={form.title} onChangeText={t => setForm(p => ({ ...p, title: t }))} />
          <TextInput style={[s.input, { height: 80 }]} placeholder="Description" placeholderTextColor={Colors.textMuted} value={form.description} onChangeText={t => setForm(p => ({ ...p, description: t }))} multiline />
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
  container: { flex: 1, backgroundColor: Colors.bgDark },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, paddingTop: 56, paddingBottom: Spacing.sm },
  title: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, gap: Spacing.md },
  goalTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  completed: { textDecorationLine: 'line-through', color: Colors.textMuted },
  goalDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
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
