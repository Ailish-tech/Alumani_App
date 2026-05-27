import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, TextInput, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import api from '../../services/api';

export default function PollsScreen() {
  const [polls, setPolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);

  const fetch = async () => { setLoading(true); try { const r = await api.get('/community/polls'); setPolls(r.data.data || []); } catch {} setLoading(false); };
  useEffect(() => { fetch(); }, []);

  const vote = async (pollId: string, idx: number) => { await api.post(`/community/polls/${pollId}/vote`, { optionIndex: idx }); fetch(); };

  const handleCreate = async () => {
    const valid = options.filter(o => o.trim());
    if (!question || valid.length < 2) { Alert.alert('Error', 'Question and at least 2 options required'); return; }
    await api.post('/community/polls', { question, options: valid }); setShowCreate(false); setQuestion(''); setOptions(['', '']); fetch();
  };

  const getPercent = (poll: any, idx: number) => {
    if (!poll.totalVotes) return 0;
    const key = `opt${idx}`;
    return Math.round(((poll.votes?.[key] || 0) / poll.totalVotes) * 100);
  };

  return (
    <View style={s.container}>
      <View style={s.header}><Text style={s.title}>Polls</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowCreate(true)}><Ionicons name="add" size={24} color="#fff" /></TouchableOpacity>
      </View>
      <FlatList data={polls} keyExtractor={i => i.id} contentContainerStyle={{ padding: Spacing.md, gap: Spacing.md }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetch} tintColor={Colors.primary} />}
        renderItem={({ item }) => (
          <View style={s.card}>
            <Text style={s.question}>{item.question}</Text>
            {item.options?.map((opt: string, idx: number) => (
              <TouchableOpacity key={idx} style={s.option} onPress={() => vote(item.id, idx)} activeOpacity={0.7}>
                <View style={[s.optionFill, { width: `${getPercent(item, idx)}%` }]} />
                <Text style={s.optionText}>{opt}</Text>
                <Text style={s.optionPct}>{getPercent(item, idx)}%</Text>
              </TouchableOpacity>
            ))}
            <Text style={s.totalVotes}>{item.totalVotes || 0} votes</Text>
          </View>
        )}
        ListEmptyComponent={<View style={s.empty}><Ionicons name="bar-chart-outline" size={48} color={Colors.textMuted} /><Text style={s.emptyText}>No polls yet</Text></View>}
      />
      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={s.overlay}><View style={s.modal}>
          <Text style={s.modalTitle}>Create Poll</Text>
          <TextInput style={s.input} placeholder="Ask a question..." placeholderTextColor={Colors.textMuted} value={question} onChangeText={setQuestion} />
          {options.map((o, i) => (
            <TextInput key={i} style={s.input} placeholder={`Option ${i + 1}`} placeholderTextColor={Colors.textMuted} value={o}
              onChangeText={t => { const n = [...options]; n[i] = t; setOptions(n); }} />
          ))}
          <TouchableOpacity onPress={() => setOptions([...options, ''])}><Text style={s.addOption}>+ Add Option</Text></TouchableOpacity>
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
  card: { backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm },
  question: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  option: { position: 'relative', backgroundColor: Colors.bgDark, borderRadius: BorderRadius.sm, padding: Spacing.sm, flexDirection: 'row', justifyContent: 'space-between', overflow: 'hidden' },
  optionFill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: Colors.primaryGlow, borderRadius: BorderRadius.sm },
  optionText: { fontSize: FontSize.md, color: Colors.textPrimary, zIndex: 1 },
  optionPct: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '700', zIndex: 1 },
  totalVotes: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'right' },
  empty: { alignItems: 'center', paddingTop: 80, gap: Spacing.md },
  emptyText: { fontSize: FontSize.md, color: Colors.textMuted },
  overlay: { flex: 1, backgroundColor: Colors.bgOverlay, justifyContent: 'flex-end' },
  modal: { backgroundColor: Colors.bgCard, borderTopLeftRadius: BorderRadius.lg, borderTopRightRadius: BorderRadius.lg, padding: Spacing.lg, gap: Spacing.md },
  modalTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary },
  input: { backgroundColor: Colors.bgInput, borderRadius: BorderRadius.sm, padding: Spacing.md, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border },
  addOption: { color: Colors.primary, fontWeight: '600', fontSize: FontSize.sm },
  actions: { flexDirection: 'row', gap: Spacing.md },
  cancelBtn: { flex: 1, padding: Spacing.md, borderRadius: BorderRadius.sm, backgroundColor: Colors.bgDark, alignItems: 'center' },
  cancelText: { color: Colors.textSecondary, fontWeight: '600' },
  createBtn: { flex: 1, padding: Spacing.md, borderRadius: BorderRadius.sm, backgroundColor: Colors.primary, alignItems: 'center' },
  createText: { color: '#fff', fontWeight: '700' },
});
