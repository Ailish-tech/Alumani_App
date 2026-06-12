import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, Alert,
} from 'react-native';
import { AppleAlert } from '../../components/AppleAlert';
import { Ionicons } from '@expo/vector-icons';
import { Post } from '../../types';
import api from '../../services/api';

const LI = {
  blue: '#0A66C2',
  white: '#FFFFFF',
  bgLight: '#F3F2EF',
  border: '#DCE6F1',
  textDark: '#191919',
  textSecondary: '#666666',
  like: '#DC3545',
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function MyPostsScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMyPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/posts/my');
      setPosts(res.data.data);
    } catch (e: any) {
      AppleAlert.alert('Error', e.response?.data?.error || 'Failed to load posts');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchMyPosts(); }, []);

  const deletePost = (postId: string) => {
    AppleAlert.alert('Delete Post', 'Remove this post?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/admin/post/${postId}`);
            setPosts((p) => p.filter((x) => x.id !== postId));
          } catch { AppleAlert.alert('Error', 'Could not delete post.'); }
        },
      },
    ]);
  };

  const renderPost = ({ item }: { item: Post }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
        <TouchableOpacity onPress={() => deletePost(item.id)} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={16} color={LI.like} />
        </TouchableOpacity>
      </View>
      <Text style={styles.content}>{item.textContent}</Text>
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Ionicons name="thumbs-up" size={14} color={LI.blue} />
          <Text style={styles.statText}>{item.likesCount}</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="chatbubble-outline" size={13} color={LI.textSecondary} />
          <Text style={styles.statText}>{item.commentsCount}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.summaryBar}>
        <Ionicons name="document-text-outline" size={18} color={LI.blue} />
        <Text style={styles.summaryText}>{posts.length} post{posts.length !== 1 ? 's' : ''}</Text>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchMyPosts} tintColor={LI.blue} colors={[LI.blue]} />}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <Ionicons name="newspaper-outline" size={52} color={LI.textSecondary} />
              <Text style={styles.emptyTitle}>No posts yet</Text>
              <Text style={styles.emptySubtitle}>Head to the Feed tab and share something!</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: LI.bgLight },
  summaryBar: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: LI.white,
    borderBottomWidth: 1, borderBottomColor: LI.border,
  },
  summaryText: { fontSize: 14, color: LI.textSecondary, fontWeight: '600' },
  card: {
    backgroundColor: LI.white, padding: 16,
    borderBottomWidth: 1, borderBottomColor: LI.border,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 10,
  },
  time: { fontSize: 12, color: LI.textSecondary },
  deleteBtn: { padding: 4 },
  content: {
    fontSize: 15, color: LI.textDark, lineHeight: 22, marginBottom: 12,
  },
  stats: {
    flexDirection: 'row', gap: 16,
    borderTopWidth: 1, borderTopColor: LI.border, paddingTop: 10,
  },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 13, color: LI.textSecondary },
  emptyState: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 24, gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: LI.textDark },
  emptySubtitle: { fontSize: 14, color: LI.textSecondary, textAlign: 'center' },
});
