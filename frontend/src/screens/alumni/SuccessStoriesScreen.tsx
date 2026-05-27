import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, TextInput, Alert, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import api from '../../services/api';

export default function SuccessStoriesScreen() {
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', company: '', yearGraduated: '', tags: '' });

  const fetch = async () => { setLoading(true); try { const r = await api.get('/alumni/stories'); setStories(r.data.data || []); } catch {} setLoading(false); };
  useEffect(() => { fetch(); }, []);

  const handleCreate = async () => {
    if (!form.title || !form.content) { Alert.alert('Error', 'Title and content required'); return; }
    await api.post('/alumni/stories', { ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) });
    setShowCreate(false); setForm({ title: '', content: '', company: '', yearGraduated: '', tags: '' }); fetch();
  };

  const like = async (id: string) => { await api.post(`/alumni/stories/${id}/like`); fetch(); };

  return (
    <View style={s.container}>
      <View style={s.header}><Text style={s.title}>Success Stories</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowCreate(true)}><Ionicons name="add" size={24} color="#fff" /></TouchableOpacity>
      </View>

      <FlatList data={stories} keyExtractor={i => i.id} contentContainerStyle={{ padding: Spacing.md, gap: Spacing.lg }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetch} tintColor={Colors.roleAlumni} />}
        renderItem={({ item }) => (
          <View style={s.card}>
            {/* Author header */}
            <View style={s.authorRow}>
              <View style={s.authorAvatar}><Text style={s.authorInitial}>{item.authorId?.charAt(0)?.toUpperCase() || '?'}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={s.authorName}>Alumni</Text>
                {item.company ? <Text style={s.authorCompany}>{item.company} · Class of {item.yearGraduated || '?'}</Text> : null}
              </View>
              {item.featured && <Ionicons name="star" size={16} color={Colors.roleAlumni} />}
            </View>

            {/* Content */}
            <Text style={s.storyTitle}>{item.title}</Text>
            <Text style={s.storyContent} numberOfLines={6}>{item.content}</Text>

            {/* Tags */}
            {item.tags?.length > 0 && (
              <View style={s.tagsRow}>
                {item.tags.map((t: string, i: number) => (
                  <View key={i} style={s.tag}><Text style={s.tagText}>#{t}</Text></View>
                ))}
              </View>
            )}

            {/* Actions */}
            <View style={s.actionsRow}>
              <TouchableOpacity style={s.likeBtn} onPress={() => like(item.id)}>
                <Ionicons name="heart-outline" size={18} color={Colors.like} />
                <Text style={s.likeCount}>{item.likesCount || 0}</Text>
              </TouchableOpacity>
              <Text style={s.dateText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={<View style={s.empty}><Ionicons name="book-outline" size={48} color={Colors.textMuted} /><Text style={s.emptyText}>No stories yet</Text><Text style={s.emptySub}>Share your career journey!</Text></View>}
      />

      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={s.overlay}><ScrollView style={s.modal}>
          <Text style={s.modalTitle}>Share Your Story</Text>
          <TextInput style={s.input} placeholder="Story Title" placeholderTextColor={Colors.textMuted} value={form.title} onChangeText={t => setForm(p => ({ ...p, title: t }))} />
          <TextInput style={[s.input, { height: 120 }]} placeholder="Your career journey, lessons learned, advice..." placeholderTextColor={Colors.textMuted}
            value={form.content} onChangeText={t => setForm(p => ({ ...p, content: t }))} multiline textAlignVertical="top" />
          <TextInput style={s.input} placeholder="Current Company" placeholderTextColor={Colors.textMuted} value={form.company} onChangeText={t => setForm(p => ({ ...p, company: t }))} />
          <TextInput style={s.input} placeholder="Year Graduated" placeholderTextColor={Colors.textMuted} value={form.yearGraduated} onChangeText={t => setForm(p => ({ ...p, yearGraduated: t }))} keyboardType="numeric" />
          <TextInput style={s.input} placeholder="Tags (comma-separated)" placeholderTextColor={Colors.textMuted} value={form.tags} onChangeText={t => setForm(p => ({ ...p, tags: t }))} />
          <View style={s.formActions}>
            <TouchableOpacity style={s.cancelBtn} onPress={() => setShowCreate(false)}><Text style={s.cancelText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={s.createBtn} onPress={handleCreate}><Text style={s.createText}>Publish</Text></TouchableOpacity>
          </View>
        </ScrollView></View>
      </Modal>
    </View>
  );
}
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDark },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, paddingTop: 56, paddingBottom: Spacing.sm },
  title: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FF9800', alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  authorAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.roleAlumni, alignItems: 'center', justifyContent: 'center' },
  authorInitial: { fontSize: FontSize.md, fontWeight: '800', color: '#111' },
  authorName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  authorCompany: { fontSize: FontSize.xs, color: Colors.textMuted },
  storyTitle: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textPrimary },
  storyContent: { fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 22 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  tag: { backgroundColor: Colors.bgDark, paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.full },
  tagText: { fontSize: FontSize.xs, color: Colors.primary },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.xs },
  likeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  likeCount: { fontSize: FontSize.sm, color: Colors.like, fontWeight: '600' },
  dateText: { fontSize: FontSize.xs, color: Colors.textMuted },
  empty: { alignItems: 'center', paddingTop: 80, gap: Spacing.sm },
  emptyText: { fontSize: FontSize.md, color: Colors.textMuted },
  emptySub: { fontSize: FontSize.sm, color: Colors.textMuted },
  overlay: { flex: 1, backgroundColor: Colors.bgOverlay, justifyContent: 'flex-end' },
  modal: { backgroundColor: Colors.bgCard, borderTopLeftRadius: BorderRadius.lg, borderTopRightRadius: BorderRadius.lg, padding: Spacing.lg, gap: Spacing.md, maxHeight: '85%' },
  modalTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm },
  input: { backgroundColor: Colors.bgInput, borderRadius: BorderRadius.sm, padding: Spacing.md, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.sm },
  formActions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm },
  cancelBtn: { flex: 1, padding: Spacing.md, borderRadius: BorderRadius.sm, backgroundColor: Colors.bgDark, alignItems: 'center' },
  cancelText: { color: Colors.textSecondary, fontWeight: '600' },
  createBtn: { flex: 1, padding: Spacing.md, borderRadius: BorderRadius.sm, backgroundColor: '#FF9800', alignItems: 'center' },
  createText: { color: '#fff', fontWeight: '700' },
});
