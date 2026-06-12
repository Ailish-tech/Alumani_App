import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, TextInput, Alert, Modal, Platform } from 'react-native';
import { AppleAlert } from '../../components/AppleAlert';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

export default function PollsScreen({ navigation }: any) {
  const [polls, setPolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);

  const load = async () => { setLoading(true); try { const r = await api.get('/community/polls'); setPolls(r.data.data || []); } catch {} setLoading(false); };
  useEffect(() => { load(); }, []);

  const vote = async (pollId: string, idx: number) => { await api.post(`/community/polls/${pollId}/vote`, { optionIndex: idx }); load(); };

  const handleCreate = async () => {
    const valid = options.filter(o => o.trim());
    if (!question || valid.length < 2) { AppleAlert.alert('Error', 'Question and at least 2 options required'); return; }
    await api.post('/community/polls', { question, options: valid }); setShowCreate(false); setQuestion(''); setOptions(['', '']); load();
  };

  const getPercent = (poll: any, idx: number) => {
    if (!poll.totalVotes) return 0;
    return Math.round(((poll.votes?.[`opt${idx}`] || 0) / poll.totalVotes) * 100);
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}><Ionicons name="chevron-back" size={24} color="#1C1C1E" /></TouchableOpacity>
        <Text style={s.headerTitle}>Polls</Text>
        <TouchableOpacity onPress={() => setShowCreate(true)}>
          <LinearGradient colors={['#F5576C', '#FF6B6B']} style={s.addBtnGrad}><Ionicons name="add" size={22} color="#fff" /></LinearGradient>
        </TouchableOpacity>
      </View>
      <FlatList data={polls} keyExtractor={i => i.id} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor="#F5576C" colors={['#F5576C']} />}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.questionRow}>
              <LinearGradient colors={['#F5576C', '#FF6B6B']} style={s.pollIcon}><Ionicons name="bar-chart" size={16} color="#fff" /></LinearGradient>
              <Text style={s.question}>{item.question}</Text>
            </View>
            {item.options?.map((opt: string, idx: number) => {
              const pct = getPercent(item, idx);
              return (
                <TouchableOpacity key={idx} style={s.option} onPress={() => vote(item.id, idx)} activeOpacity={0.7}>
                  <LinearGradient colors={['#F5576C20', '#FF6B6B08']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={[s.optionFill, { width: `${pct}%` as any }]} />
                  <Text style={s.optionText}>{opt}</Text>
                  <Text style={s.optionPct}>{pct}%</Text>
                </TouchableOpacity>
              );
            })}
            <Text style={s.totalVotes}>{item.totalVotes || 0} votes</Text>
          </View>
        )}
        ListEmptyComponent={<View style={s.empty}><Ionicons name="bar-chart-outline" size={48} color="#C7C7CC" /><Text style={s.emptyText}>No polls yet</Text></View>}
      />
      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={s.overlay}><View style={s.modal}>
          <View style={s.modalHandle} />
          <Text style={s.modalTitle}>Create Poll</Text>
          <TextInput style={s.input} placeholder="Ask a question..." placeholderTextColor="#C7C7CC" value={question} onChangeText={setQuestion} />
          {options.map((o, i) => (
            <TextInput key={i} style={s.input} placeholder={`Option ${i + 1}`} placeholderTextColor="#C7C7CC" value={o}
              onChangeText={t => { const n = [...options]; n[i] = t; setOptions(n); }} />
          ))}
          <TouchableOpacity onPress={() => setOptions([...options, ''])}><Text style={s.addOption}>+ Add Option</Text></TouchableOpacity>
          <View style={s.modalActions}>
            <TouchableOpacity style={s.cancelBtn} onPress={() => setShowCreate(false)}><Text style={s.cancelText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity onPress={handleCreate}><LinearGradient colors={['#F5576C', '#FF6B6B']} style={s.createBtn}><Text style={s.createText}>Create</Text></LinearGradient></TouchableOpacity>
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
  questionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  pollIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  question: { fontSize: 16, fontWeight: '700', color: '#1C1C1E', flex: 1 },
  option: { position: 'relative', backgroundColor: '#F2F2F7', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', overflow: 'hidden' },
  optionFill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 12 },
  optionText: { fontSize: 15, color: '#1C1C1E', zIndex: 1, fontWeight: '500' },
  optionPct: { fontSize: 13, color: '#F5576C', fontWeight: '700', zIndex: 1 },
  totalVotes: { fontSize: 11, color: '#C7C7CC', textAlign: 'right' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, color: '#8E8E93' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, gap: 14 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#D1D1D6', alignSelf: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1C1C1E' },
  input: { backgroundColor: '#F2F2F7', borderRadius: 12, padding: 14, fontSize: 15, color: '#1C1C1E' },
  addOption: { color: '#F5576C', fontWeight: '600', fontSize: 14 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 24, backgroundColor: '#F2F2F7', alignItems: 'center' },
  cancelText: { color: '#8E8E93', fontWeight: '600', fontSize: 15 },
  createBtn: { flex: 1, padding: 14, borderRadius: 24, alignItems: 'center', minWidth: 140 },
  createText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
