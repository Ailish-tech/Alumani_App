import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, TextInput, Alert, Modal, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import api from '../../services/api';

export default function QAScreen() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ question: '', isAnonymous: false });

  const fetch = async () => { setLoading(true); try { const r = await api.get('/community/qa'); setQuestions(r.data.data || []); } catch {} setLoading(false); };
  useEffect(() => { fetch(); }, []);

  const handleCreate = async () => {
    if (!form.question) { Alert.alert('Error', 'Question required'); return; }
    await api.post('/community/qa', form); setShowCreate(false); setForm({ question: '', isAnonymous: false }); fetch();
  };

  return (
    <View style={s.container}>
      <View style={s.header}><Text style={s.title}>Ask Alumni</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowCreate(true)}><Ionicons name="add" size={24} color="#fff" /></TouchableOpacity>
      </View>
      <FlatList data={questions} keyExtractor={i => i.id} contentContainerStyle={{ padding: Spacing.md, gap: Spacing.md }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetch} tintColor={Colors.primary} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.card} activeOpacity={0.8}>
            <View style={s.cardHeader}>
              <Ionicons name={item.isAnonymous ? 'eye-off' : 'person'} size={16} color={Colors.textMuted} />
              <Text style={s.author}>{item.isAnonymous ? 'Anonymous' : item.createdBy?.substring(0, 12)}</Text>
            </View>
            <Text style={s.question}>{item.question}</Text>
            <View style={s.cardFooter}>
              <View style={s.answerBadge}>
                <Ionicons name="chatbubble-outline" size={14} color={Colors.accent} />
                <Text style={s.answerCount}>{item.answersCount || 0} answers</Text>
              </View>
              <Text style={s.time}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<View style={s.empty}><Ionicons name="help-circle-outline" size={48} color={Colors.textMuted} /><Text style={s.emptyText}>No questions yet</Text></View>}
      />
      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={s.overlay}><View style={s.modal}>
          <Text style={s.modalTitle}>Ask a Question</Text>
          <TextInput style={[s.input, { height: 100 }]} placeholder="What would you like to ask alumni?" placeholderTextColor={Colors.textMuted}
            value={form.question} onChangeText={t => setForm(p => ({ ...p, question: t }))} multiline />
          <View style={s.anonRow}>
            <Text style={s.anonText}>Ask anonymously</Text>
            <Switch value={form.isAnonymous} onValueChange={v => setForm(p => ({ ...p, isAnonymous: v }))}
              trackColor={{ false: Colors.border, true: Colors.primaryGlow }} thumbColor={form.isAnonymous ? Colors.primary : Colors.textMuted} />
          </View>
          <View style={s.actions}>
            <TouchableOpacity style={s.cancelBtn} onPress={() => setShowCreate(false)}><Text style={s.cancelText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={s.createBtn} onPress={handleCreate}><Text style={s.createText}>Ask</Text></TouchableOpacity>
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
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  author: { fontSize: FontSize.xs, color: Colors.textMuted },
  question: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary, lineHeight: 22 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  answerBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  answerCount: { fontSize: FontSize.xs, color: Colors.accent, fontWeight: '600' },
  time: { fontSize: FontSize.xs, color: Colors.textMuted },
  empty: { alignItems: 'center', paddingTop: 80, gap: Spacing.md },
  emptyText: { fontSize: FontSize.md, color: Colors.textMuted },
  overlay: { flex: 1, backgroundColor: Colors.bgOverlay, justifyContent: 'flex-end' },
  modal: { backgroundColor: Colors.bgCard, borderTopLeftRadius: BorderRadius.lg, borderTopRightRadius: BorderRadius.lg, padding: Spacing.lg, gap: Spacing.md },
  modalTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary },
  input: { backgroundColor: Colors.bgInput, borderRadius: BorderRadius.sm, padding: Spacing.md, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border },
  anonRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  anonText: { fontSize: FontSize.md, color: Colors.textSecondary },
  actions: { flexDirection: 'row', gap: Spacing.md },
  cancelBtn: { flex: 1, padding: Spacing.md, borderRadius: BorderRadius.sm, backgroundColor: Colors.bgDark, alignItems: 'center' },
  cancelText: { color: Colors.textSecondary, fontWeight: '600' },
  createBtn: { flex: 1, padding: Spacing.md, borderRadius: BorderRadius.sm, backgroundColor: Colors.primary, alignItems: 'center' },
  createText: { color: '#fff', fontWeight: '700' },
});
