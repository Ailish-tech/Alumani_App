import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert, TextInput, ScrollView } from 'react-native';
import { AppleAlert } from '../../components/AppleAlert';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import api from '../../services/api';

const CONTENT_TYPES = ['posts', 'events', 'jobs', 'groups', 'stories'];
const CONTENT_LABELS: Record<string, { label: string; icon: string; color: string; endpoint: string }> = {
  posts: { label: 'Posts', icon: 'document-text', color: '#00E676', endpoint: '/admin/feed' },
  events: { label: 'Events', icon: 'calendar', color: '#FF9800', endpoint: '/events' },
  jobs: { label: 'Jobs', icon: 'briefcase', color: '#448AFF', endpoint: '/jobs' },
  groups: { label: 'Groups', icon: 'people-circle', color: '#FFD600', endpoint: '/community/groups' },
  stories: { label: 'Stories', icon: 'book', color: '#E040FB', endpoint: '/alumni/stories' },
};

export default function AdminContentModerationScreen() {
  const [tab, setTab] = useState('posts');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try {
      const endpoint = CONTENT_LABELS[tab].endpoint;
      const r = await api.get(endpoint);
      setItems(r.data.data || []);
    } catch {}
    setLoading(false);
  };
  useEffect(() => { fetch(); }, [tab]);

  const handleDelete = (id: string) => {
    const deleteEndpoints: Record<string, string> = {
      posts: `/admin/post/${id}`, events: `/admin/event/${id}`, jobs: `/admin/job/${id}`,
      groups: `/admin/group/${id}`, stories: `/admin/story/${id}`,
    };
    AppleAlert.alert('Delete Content', `Permanently delete this ${tab.slice(0, -1)}?`, [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await api.delete(deleteEndpoints[tab]); fetch(); } },
    ]);
  };

  return (
    <View style={s.container}>
      <View style={s.header}><Text style={s.title}>🛡️ Content Moderation</Text></View>

      {/* Content type tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabRow} contentContainerStyle={{ gap: 4, paddingHorizontal: 16 }}>
        {CONTENT_TYPES.map(t => {
          const cfg = CONTENT_LABELS[t];
          return (
            <TouchableOpacity key={t} style={[s.tab, tab === t && { borderColor: cfg.color, backgroundColor: `${cfg.color}15` }]}
              onPress={() => setTab(t)}>
              <Ionicons name={cfg.icon as any} size={14} color={tab === t ? cfg.color : '#999999'} />
              <Text style={[s.tabText, tab === t && { color: cfg.color }]}>{cfg.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <FlatList data={items} keyExtractor={i => i.id} contentContainerStyle={{ padding: 16, gap: 8 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetch} tintColor={'#004182'} />}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.cardContent}>
              <View style={{ flex: 1 }}>
                <Text style={s.cardTitle} numberOfLines={1}>{item.title || item.content?.substring(0, 50) || item.companyName || item.name || 'Untitled'}</Text>
                <Text style={s.cardMeta}>ID: {item.id?.substring(0, 16)}... • By: {(item.authorId || item.createdBy || item.postedBy || item.alumniId || '?')?.substring(0, 12)}...</Text>
                <Text style={s.cardDate}>{new Date(item.createdAt).toLocaleString()}</Text>
              </View>
              <TouchableOpacity style={s.deleteBtn} onPress={() => handleDelete(item.id)}>
                <Ionicons name="trash" size={20} color="#FF5252" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<View style={s.empty}><Ionicons name="checkmark-done-circle-outline" size={48} color={'#999999'} /><Text style={s.emptyText}>No {CONTENT_LABELS[tab].label.toLowerCase()} found</Text></View>}
      />
    </View>
  );
}
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F2EF' },
  header: { paddingHorizontal: 16, paddingTop: 56, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: '#191919' },
  tabRow: { maxHeight: 44, marginBottom: 8 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 16, paddingVertical: 4, borderRadius: 999, borderWidth: 1, borderColor: '#DCE6F1' },
  tabText: { fontSize: 13, color: '#999999', fontWeight: '600' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 4, padding: 16, borderWidth: 1, borderColor: '#DCE6F1' },
  cardContent: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#191919' },
  cardMeta: { fontSize: 11, color: '#999999' },
  cardDate: { fontSize: 10, color: '#999999' },
  deleteBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FF525215', alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyText: { fontSize: 15, color: '#999999' },
});
