import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, TextInput, Alert, Modal, ScrollView } from 'react-native';
import { AppleAlert } from '../../components/AppleAlert';
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
    if (!form.title || !form.content) { AppleAlert.alert('Error', 'Title and content required'); return; }
    await api.post('/alumni/stories', { ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) });
    setShowCreate(false); setForm({ title: '', content: '', company: '', yearGraduated: '', tags: '' }); fetch();
  };

  const like = async (id: string) => { await api.post(`/alumni/stories/${id}/like`); fetch(); };

  return (
    <View style={s.container}>
      <View style={s.header}><Text style={s.title}>Success Stories</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowCreate(true)}><Ionicons name="add" size={24} color="#fff" /></TouchableOpacity>
      </View>

      <FlatList data={stories} keyExtractor={i => i.id} contentContainerStyle={{ padding: 16, gap: 24 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetch} tintColor={'#057642'} />}
        renderItem={({ item }) => (
          <View style={s.card}>
            {/* Author header */}
            <View style={s.authorRow}>
              <View style={s.authorAvatar}><Text style={s.authorInitial}>{item.authorId?.charAt(0)?.toUpperCase() || '?'}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={s.authorName}>Alumni</Text>
                {item.company ? <Text style={s.authorCompany}>{item.company} · Class of {item.yearGraduated || '?'}</Text> : null}
              </View>
              {item.featured && <Ionicons name="star" size={16} color={'#057642'} />}
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
                <Ionicons name="heart-outline" size={18} color={'#DC3545'} />
                <Text style={s.likeCount}>{item.likesCount || 0}</Text>
              </TouchableOpacity>
              <Text style={s.dateText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={<View style={s.empty}><Ionicons name="book-outline" size={48} color={'#999999'} /><Text style={s.emptyText}>No stories yet</Text><Text style={s.emptySub}>Share your career journey!</Text></View>}
      />

      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={s.overlay}><ScrollView style={s.modal}>
          <Text style={s.modalTitle}>Share Your Story</Text>
          <TextInput style={s.input} placeholder="Story Title" placeholderTextColor={'#999999'} value={form.title} onChangeText={t => setForm(p => ({ ...p, title: t }))} />
          <TextInput style={[s.input, { height: 120 }]} placeholder="Your career journey, lessons learned, advice..." placeholderTextColor={'#999999'}
            value={form.content} onChangeText={t => setForm(p => ({ ...p, content: t }))} multiline textAlignVertical="top" />
          <TextInput style={s.input} placeholder="Current Company" placeholderTextColor={'#999999'} value={form.company} onChangeText={t => setForm(p => ({ ...p, company: t }))} />
          <TextInput style={s.input} placeholder="Year Graduated" placeholderTextColor={'#999999'} value={form.yearGraduated} onChangeText={t => setForm(p => ({ ...p, yearGraduated: t }))} keyboardType="numeric" />
          <TextInput style={s.input} placeholder="Tags (comma-separated)" placeholderTextColor={'#999999'} value={form.tags} onChangeText={t => setForm(p => ({ ...p, tags: t }))} />
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
  container: { flex: 1, backgroundColor: '#F3F2EF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: '#191919' },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FF9800', alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 8, padding: 24, borderWidth: 1, borderColor: '#DCE6F1', gap: 8 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  authorAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#057642', alignItems: 'center', justifyContent: 'center' },
  authorInitial: { fontSize: 15, fontWeight: '800', color: '#111' },
  authorName: { fontSize: 15, fontWeight: '700', color: '#191919' },
  authorCompany: { fontSize: 11, color: '#999999' },
  storyTitle: { fontSize: 17, fontWeight: '800', color: '#191919' },
  storyContent: { fontSize: 15, color: '#666666', lineHeight: 22 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  tag: { backgroundColor: '#F3F2EF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  tagText: { fontSize: 11, color: '#0A66C2' },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  likeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  likeCount: { fontSize: 13, color: '#DC3545', fontWeight: '600' },
  dateText: { fontSize: 11, color: '#999999' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyText: { fontSize: 15, color: '#999999' },
  emptySub: { fontSize: 13, color: '#999999' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 12, borderTopRightRadius: 12, padding: 24, gap: 16, maxHeight: '85%' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#191919', marginBottom: 8 },
  input: { backgroundColor: '#F3F2EF', borderRadius: 4, padding: 16, color: '#191919', borderWidth: 1, borderColor: '#DCE6F1', marginBottom: 8 },
  formActions: { flexDirection: 'row', gap: 16, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 16, borderRadius: 4, backgroundColor: '#F3F2EF', alignItems: 'center' },
  cancelText: { color: '#666666', fontWeight: '600' },
  createBtn: { flex: 1, padding: 16, borderRadius: 4, backgroundColor: '#FF9800', alignItems: 'center' },
  createText: { color: '#fff', fontWeight: '700' },
});
