import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, TextInput, Alert, Modal, Platform } from 'react-native';
import { AppleAlert } from '../../components/AppleAlert';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

const CATEGORY_COLORS: Record<string, [string, string]> = {
  Coding: ['#667EEA', '#764BA2'], Sports: ['#43E97B', '#38F9D7'], Music: ['#FA709A', '#FEE140'],
  Design: ['#4FACFE', '#00F2FE'], Business: ['#FF6B6B', '#FFA07A'], default: ['#A18CD1', '#FBC2EB'],
};

export default function GroupsScreen({ navigation }: any) {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', category: '' });

  const load = async () => { setLoading(true); try { const r = await api.get('/community/groups'); setGroups(r.data.data || []); } catch {} setLoading(false); };
  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.name) { AppleAlert.alert('Error', 'Name required'); return; }
    await api.post('/community/groups', form); setShowCreate(false); setForm({ name: '', description: '', category: '' }); load();
  };
  const join = async (id: string) => { await api.post(`/community/groups/${id}/join`); load(); };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}><Ionicons name="chevron-back" size={24} color="#1C1C1E" /></TouchableOpacity>
        <Text style={s.headerTitle}>Groups</Text>
        <TouchableOpacity onPress={() => setShowCreate(true)}>
          <LinearGradient colors={['#FA709A', '#FEE140']} style={s.addBtnGrad}><Ionicons name="add" size={22} color="#fff" /></LinearGradient>
        </TouchableOpacity>
      </View>
      <FlatList data={groups} keyExtractor={i => i.id} contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor="#FA709A" colors={['#FA709A']} />}
        renderItem={({ item }) => {
          const gradient = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.default;
          return (
            <View style={s.card}>
              <View style={s.cardRow}>
                <LinearGradient colors={gradient} style={s.iconBox}><Ionicons name="people" size={20} color="#fff" /></LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardTitle}>{item.name}</Text>
                  <Text style={s.cardSub}>{item.description}</Text>
                  <Text style={s.members}>{item.memberCount || 0} members</Text>
                </View>
                <TouchableOpacity onPress={() => join(item.id)}>
                  <LinearGradient colors={gradient} style={s.joinBtn}><Text style={s.joinText}>Join</Text></LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={<View style={s.empty}><Ionicons name="people-outline" size={48} color="#C7C7CC" /><Text style={s.emptyText}>No groups yet</Text></View>}
      />
      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={s.overlay}><View style={s.modal}>
          <View style={s.modalHandle} />
          <Text style={s.modalTitle}>Create Group</Text>
          <TextInput style={s.input} placeholder="Group Name" placeholderTextColor="#C7C7CC" value={form.name} onChangeText={t => setForm(p => ({ ...p, name: t }))} />
          <TextInput style={[s.input, { height: 80 }]} placeholder="Description" placeholderTextColor="#C7C7CC" value={form.description} onChangeText={t => setForm(p => ({ ...p, description: t }))} multiline />
          <TextInput style={s.input} placeholder="Category (e.g. Coding, Sports)" placeholderTextColor="#C7C7CC" value={form.category} onChangeText={t => setForm(p => ({ ...p, category: t }))} />
          <View style={s.modalActions}>
            <TouchableOpacity style={s.cancelBtn} onPress={() => setShowCreate(false)}><Text style={s.cancelText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity onPress={handleCreate}><LinearGradient colors={['#FA709A', '#FEE140']} style={s.createBtn}><Text style={s.createText}>Create</Text></LinearGradient></TouchableOpacity>
          </View>
        </View></View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 56 : 44, paddingBottom: 10, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(120,120,128,0.08)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1C1C1E' },
  addBtnGrad: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1C1C1E' },
  cardSub: { fontSize: 13, color: '#8E8E93', marginTop: 1 },
  members: { fontSize: 11, color: '#C7C7CC', marginTop: 2 },
  joinBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 16 },
  joinText: { fontSize: 13, color: '#fff', fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, color: '#8E8E93' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, gap: 14 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#D1D1D6', alignSelf: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1C1C1E' },
  input: { backgroundColor: '#F2F2F7', borderRadius: 12, padding: 14, fontSize: 15, color: '#1C1C1E' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 24, backgroundColor: '#F2F2F7', alignItems: 'center' },
  cancelText: { color: '#8E8E93', fontWeight: '600', fontSize: 15 },
  createBtn: { flex: 1, padding: 14, borderRadius: 24, alignItems: 'center', minWidth: 140 },
  createText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
