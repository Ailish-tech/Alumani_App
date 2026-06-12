import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, Alert, ScrollView,
} from 'react-native';
import { AppleAlert } from '../../components/AppleAlert';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { User, Post } from '../../types';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function AdminScreen() {
  const [topMentors, setTopMentors] = useState<User[]>([]);
  const [feed, setFeed] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'mentors' | 'feed'>('mentors');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [mentorsRes, feedRes] = await Promise.all([
        api.get('/admin/top-mentors'),
        api.get('/admin/feed'),
      ]);
      setTopMentors(mentorsRes.data.data);
      setFeed(feedRes.data.data);
    } catch {}
    setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const deletePost = async (postId: string) => {
    AppleAlert.alert('Delete Post', 'Are you sure you want to remove this post?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/admin/post/${postId}`);
            setFeed((f) => f.filter((p) => p.id !== postId));
          } catch (e: any) {
            AppleAlert.alert('Error', e.response?.data?.error || 'Failed');
          }
        },
      },
    ]);
  };

  const banUser = async (userId: string) => {
    AppleAlert.alert('Ban User', `Are you sure you want to ban user ${userId.substring(0, 12)}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Ban', style: 'destructive',
        onPress: async () => {
          try {
            await api.put(`/admin/ban/${userId}`);
            AppleAlert.alert('Done', 'User has been banned');
          } catch (e: any) {
            AppleAlert.alert('Error', e.response?.data?.error || 'Failed');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Tab Switcher */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'mentors' && styles.tabActive]}
          onPress={() => setActiveTab('mentors')}
        >
          <Ionicons name="trophy" size={18} color={activeTab === 'mentors' ? '#0A66C2' : '#999999'} />
          <Text style={[styles.tabText, activeTab === 'mentors' && styles.tabTextActive]}>Top Mentors</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'feed' && styles.tabActive]}
          onPress={() => setActiveTab('feed')}
        >
          <Ionicons name="newspaper" size={18} color={activeTab === 'feed' ? '#0A66C2' : '#999999'} />
          <Text style={[styles.tabText, activeTab === 'feed' && styles.tabTextActive]}>Moderation</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'mentors' ? (
        <FlatList
          data={topMentors}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <View style={styles.mentorRow}>
              <Text style={styles.rank}>#{index + 1}</Text>
              <View style={styles.mentorAvatar}>
                <Ionicons name="person" size={18} color={'#E16745'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.mentorName}>{item.fullName || item.id}</Text>
                <Text style={styles.mentorMeta}>{item.role} • {item.domain}</Text>
              </View>
              <View style={styles.mentorStats}>
                <Text style={styles.guidedCount}>{item.studentsGuided}</Text>
                <Text style={styles.guidedLabel}>guided</Text>
              </View>
              <TouchableOpacity onPress={() => banUser(item.id)} style={styles.banIcon}>
                <Ionicons name="ban" size={18} color={'#CC1016'} />
              </TouchableOpacity>
            </View>
          )}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchData} tintColor={'#0A66C2'} />}
          contentContainerStyle={{ padding: Spacing.md }}
        />
      ) : (
        <FlatList
          data={feed}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.modCard}>
              <View style={styles.modHeader}>
                <Text style={styles.modAuthor}>{item.authorId.substring(0, 12)}</Text>
                <Text style={styles.modTime}>{new Date(item.createdAt).toLocaleDateString()}</Text>
              </View>
              <Text style={styles.modContent} numberOfLines={3}>{item.textContent}</Text>
              <View style={styles.modActions}>
                <Text style={styles.modStat}>❤️ {item.likesCount}  💬 {item.commentsCount}</Text>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => deletePost(item.id)}>
                  <Ionicons name="trash-outline" size={16} color={'#CC1016'} />
                  <Text style={styles.deleteText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchData} tintColor={'#0A66C2'} />}
          contentContainerStyle={{ padding: Spacing.md }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F2EF' },
  tabs: { flexDirection: 'row', padding: Spacing.md, gap: Spacing.sm },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs,
    paddingVertical: Spacing.sm, borderRadius: BorderRadius.md,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DCE6F1',
  },
  tabActive: { borderColor: '#0A66C2', backgroundColor: '#E8F1FA' },
  tabText: { fontSize: FontSize.sm, color: '#999999', fontWeight: '600' },
  tabTextActive: { color: '#0A66C2' },
  mentorRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: '#FFFFFF', borderRadius: BorderRadius.md,
    padding: Spacing.md, marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: '#DCE6F1',
  },
  rank: { fontSize: FontSize.lg, fontWeight: '800', color: '#E16745', width: 30 },
  mentorAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E8F1FA', alignItems: 'center', justifyContent: 'center' },
  mentorName: { fontSize: FontSize.md, fontWeight: '600', color: '#191919' },
  mentorMeta: { fontSize: FontSize.xs, color: '#999999' },
  mentorStats: { alignItems: 'center' },
  guidedCount: { fontSize: FontSize.lg, fontWeight: '800', color: '#0A66C2' },
  guidedLabel: { fontSize: FontSize.xs, color: '#999999' },
  banIcon: { padding: Spacing.xs },
  modCard: {
    backgroundColor: '#FFFFFF', borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: '#DCE6F1',
  },
  modHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  modAuthor: { fontSize: FontSize.md, fontWeight: '600', color: '#191919' },
  modTime: { fontSize: FontSize.xs, color: '#999999' },
  modContent: { fontSize: FontSize.md, color: '#666666', lineHeight: 20, marginBottom: Spacing.sm },
  modActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#DCE6F1', paddingTop: Spacing.sm },
  modStat: { fontSize: FontSize.sm, color: '#999999' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: `${'#CC1016'}15`, paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.sm },
  deleteText: { fontSize: FontSize.sm, color: '#CC1016', fontWeight: '600' },
});
