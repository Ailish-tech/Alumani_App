import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, TextInput, Alert, Modal, Switch, Platform } from 'react-native';
import { AppleAlert } from '../../components/AppleAlert';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

export default function QAScreen({ navigation }: any) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ question: '', isAnonymous: false });

  const load = async () => { setLoading(true); try { const r = await api.get('/community/qa'); setQuestions(r.data.data || []); } catch {} setLoading(false); };
  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.question) { AppleAlert.alert('Error', 'Question required'); return; }
    await api.post('/community/qa', form); setShowCreate(false); setForm({ question: '', isAnonymous: false }); load();
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}><Ionicons name="chevron-back" size={24} color="#1C1C1E" /></TouchableOpacity>
        <Text style={s.headerTitle}>Ask Alumni</Text>
        <TouchableOpacity onPress={() => setShowCreate(true)}>
          <LinearGradient colors={['#A18CD1', '#FBC2EB']} style={s.addBtnGrad}><Ionicons name="add" size={22} color="#fff" /></LinearGradient>
        </TouchableOpacity>
      </View>
      <FlatList data={questions} keyExtractor={i => i.id} contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor="#A18CD1" colors={['#A18CD1']} />}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.cardHeader}>
              <LinearGradient colors={item.isAnonymous ? ['#8E8E93', '#C7C7CC'] : ['#A18CD1', '#FBC2EB']} style={s.authorIcon}>
                <Ionicons name={item.isAnonymous ? 'eye-off' : 'person'} size={12} color="#fff" />
              </LinearGradient>
              <Text style={s.author}>{item.isAnonymous ? 'Anonymous' : item.createdBy?.substring(0, 16)}</Text>
              <Text style={s.time}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>
            <Text style={s.question}>{item.question}</Text>
            <View style={s.cardFooter}>
              <View style={s.answerBadge}>
                <Ionicons name="chatbubble-outline" size={14} color="#A18CD1" />
                <Text style={s.answerCount}>{item.answersCount || 0} answers</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
            </View>
          </View>
        )}
        ListEmptyComponent={<View style={s.empty}><Ionicons name="help-circle-outline" size={48} color="#C7C7CC" /><Text style={s.emptyText}>No questions yet</Text></View>}
      />
      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={s.overlay}><View style={s.modal}>
          <View style={s.modalHandle} />
          <Text style={s.modalTitle}>Ask a Question</Text>
          <TextInput style={[s.input, { height: 100, textAlignVertical: 'top' }]} placeholder="What would you like to ask alumni?" placeholderTextColor="#C7C7CC"
            value={form.question} onChangeText={t => setForm(p => ({ ...p, question: t }))} multiline />
          <View style={s.anonRow}>
            <Text style={s.anonText}>Ask anonymously</Text>
            <Switch value={form.isAnonymous} onValueChange={v => setForm(p => ({ ...p, isAnonymous: v }))}
              trackColor={{ false: '#E5E5EA', true: '#A18CD180' }} thumbColor={form.isAnonymous ? '#A18CD1' : '#FFFFFF'} />
          </View>
          <View style={s.modalActions}>
            <TouchableOpacity style={s.cancelBtn} onPress={() => setShowCreate(false)}><Text style={s.cancelText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity onPress={handleCreate}><LinearGradient colors={['#A18CD1', '#FBC2EB']} style={s.createBtn}><Text style={s.createText}>Ask</Text></LinearGradient></TouchableOpacity>
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
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  authorIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  author: { fontSize: 13, color: '#8E8E93', flex: 1, fontWeight: '500' },
  time: { fontSize: 11, color: '#C7C7CC' },
  question: { fontSize: 16, fontWeight: '600', color: '#1C1C1E', lineHeight: 22 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6 },
  answerBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  answerCount: { fontSize: 12, color: '#A18CD1', fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, color: '#8E8E93' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, gap: 14 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#D1D1D6', alignSelf: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1C1C1E' },
  input: { backgroundColor: '#F2F2F7', borderRadius: 12, padding: 14, fontSize: 15, color: '#1C1C1E' },
  anonRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  anonText: { fontSize: 15, color: '#3C3C43' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 24, backgroundColor: '#F2F2F7', alignItems: 'center' },
  cancelText: { color: '#8E8E93', fontWeight: '600', fontSize: 15 },
  createBtn: { flex: 1, padding: 14, borderRadius: 24, alignItems: 'center', minWidth: 140 },
  createText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
