import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { Post } from '../../types';
import api from '../../services/api';

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
      Alert.alert('Error', e.response?.data?.error || 'Failed to load posts');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchMyPosts(); }, []);

  const deletePost = (postId: string) => {
    Alert.alert('Delete Post', 'Remove this post?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/admin/post/${postId}`); // reuse admin delete
            setPosts((p) => p.filter((x) => x.id !== postId));
          } catch {
            Alert.alert('Error', 'Could not delete post.');
          }
        },
      },
    ]);
  };

  const renderPost = ({ item }: { item: Post }) => (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.dot} />
        <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
        <TouchableOpacity onPress={() => deletePost(item.id)} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={16} color={Colors.error} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <Text style={styles.content}>{item.textContent}</Text>

      {/* Footer stats */}
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Ionicons name="heart" size={15} color={Colors.like} />
          <Text style={styles.statText}>{item.likesCount}</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="chatbubble" size={14} color={Colors.accent} />
          <Text style={styles.statText}>{item.commentsCount}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Summary bar */}
      <View style={styles.summaryBar}>
        <Ionicons name="document-text-outline" size={18} color={Colors.primary} />
        <Text style={styles.summaryText}>{posts.length} post{posts.length !== 1 ? 's' : ''}</Text>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={fetchMyPosts} tintColor={Colors.primary} />
        }
        contentContainerStyle={{ padding: Spacing.md, paddingBottom: 40 }}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <Ionicons name="newspaper-outline" size={52} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No posts yet</Text>
              <Text style={styles.emptySubtitle}>
                Head to the Feed tab and share something with your network!
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDark },

  summaryBar: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  summaryText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600' },

  card: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  time: { flex: 1, fontSize: FontSize.xs, color: Colors.textMuted },
  deleteBtn: {
    padding: 4,
    backgroundColor: `${Colors.error}15`,
    borderRadius: BorderRadius.sm,
  },

  content: {
    fontSize: FontSize.md, color: Colors.textPrimary,
    lineHeight: 22, marginBottom: Spacing.md,
  },

  stats: {
    flexDirection: 'row', gap: Spacing.lg,
    borderTopWidth: 1, borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
  },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: FontSize.sm, color: Colors.textSecondary },

  emptyState: {
    alignItems: 'center', paddingTop: 80,
    paddingHorizontal: Spacing.xl, gap: Spacing.sm,
  },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textSecondary },
  emptySubtitle: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
});
