import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert, TextInput, ScrollView } from 'react-native';
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
    Alert.alert('Delete Content', `Permanently delete this ${tab.slice(0, -1)}?`, [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await api.delete(deleteEndpoints[tab]); fetch(); } },
    ]);
  };

  return (
    <View style={s.container}>
      <View style={s.header}><Text style={s.title}>🛡️ Content Moderation</Text></View>

      {/* Content type tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabRow} contentContainerStyle={{ gap: Spacing.xs, paddingHorizontal: Spacing.md }}>
        {CONTENT_TYPES.map(t => {
          const cfg = CONTENT_LABELS[t];
          return (
            <TouchableOpacity key={t} style={[s.tab, tab === t && { borderColor: cfg.color, backgroundColor: `${cfg.color}15` }]}
              onPress={() => setTab(t)}>
              <Ionicons name={cfg.icon as any} size={14} color={tab === t ? cfg.color : Colors.textMuted} />
              <Text style={[s.tabText, tab === t && { color: cfg.color }]}>{cfg.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <FlatList data={items} keyExtractor={i => i.id} contentContainerStyle={{ padding: Spacing.md, gap: Spacing.sm }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetch} tintColor={Colors.roleAdmin} />}
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
        ListEmptyComponent={<View style={s.empty}><Ionicons name="checkmark-done-circle-outline" size={48} color={Colors.textMuted} /><Text style={s.emptyText}>No {CONTENT_LABELS[tab].label.toLowerCase()} found</Text></View>}
      />
    </View>
  );
}
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDark },
  header: { paddingHorizontal: Spacing.md, paddingTop: 56, paddingBottom: Spacing.sm },
  title: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary },
  tabRow: { maxHeight: 44, marginBottom: Spacing.sm },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border },
  tabText: { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: '600' },
  card: { backgroundColor: Colors.bgCard, borderRadius: BorderRadius.sm, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  cardContent: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  cardTitle: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
  cardMeta: { fontSize: FontSize.xs, color: Colors.textMuted },
  cardDate: { fontSize: 10, color: Colors.textMuted },
  deleteBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FF525215', alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingTop: 80, gap: Spacing.sm },
  emptyText: { fontSize: FontSize.md, color: Colors.textMuted },
});
