import React, { useLayoutEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { Role, Post } from '../../types';
import api from '../../services/api';

const ROLE_COLORS: Record<Role, string> = {
  [Role.STUDENT]: Colors.roleStudent,
  [Role.ALUMNI]: Colors.roleAlumni,
  [Role.FACULTY]: Colors.roleFaculty,
  [Role.ADMIN]: Colors.roleAdmin,
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

export default function ProfileScreen({ navigation }: any) {
  const { user, logout, fetchProfile } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => navigation.navigate('EditProfile')} style={{ marginRight: 8 }}>
          <Ionicons name="create-outline" size={24} color={Colors.primary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const loadPosts = useCallback(async () => {
    try {
      const res = await api.get('/posts/my');
      setPosts(res.data.data || []);
    } catch {}
    setLoadingPosts(false);
  }, []);

  const loadFollowCounts = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get(`/follow/${user.id}/counts`);
      setFollowCounts(res.data.data);
    } catch {}
  }, [user]);

  // Refresh posts and follow counts every time the screen is focused
  useFocusEffect(
    useCallback(() => {
      loadPosts();
      loadFollowCounts();
    }, [loadPosts, loadFollowCounts])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchProfile(), loadPosts(), loadFollowCounts()]);
    setRefreshing(false);
  };

  if (!user) return null;
  const roleColor = ROLE_COLORS[user.role] || Colors.primary;

  const totalLikes = posts.reduce((sum, p) => sum + (p.likesCount || 0), 0);
  const totalComments = posts.reduce((sum, p) => sum + (p.commentsCount || 0), 0);

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={{ padding: Spacing.md, paddingBottom: 100 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      {/* ── Header Card ── */}
      <View style={s.headerCard}>
        <TouchableOpacity
          style={s.avatarWrapper}
          onPress={() => navigation.navigate('EditProfile')}
          activeOpacity={0.8}
        >
          <View style={[s.avatarLarge, { borderColor: roleColor }]}>
            <Ionicons name="person" size={40} color={roleColor} />
          </View>
          <View style={s.editBadge}>
            <Ionicons name="pencil" size={12} color="#fff" />
          </View>
        </TouchableOpacity>
        <Text style={s.name}>{user.fullName || user.id}</Text>
        <Text style={s.email}>{user.email}</Text>
        <View style={[s.roleBadge, { backgroundColor: `${roleColor}20` }]}>
          <Ionicons name="ribbon" size={13} color={roleColor} />
          <Text style={[s.roleText, { color: roleColor }]}>
            {user.role.charAt(0) + user.role.slice(1).toLowerCase()}
          </Text>
        </View>

        {/* ── Followers / Following ── */}
        <View style={s.followRow}>
          <TouchableOpacity
            style={s.followStat}
            onPress={() => navigation.navigate('FollowList', { userId: user.id, type: 'followers' })}
          >
            <Text style={s.followNum}>{followCounts.followers}</Text>
            <Text style={s.followLabel}>Followers</Text>
          </TouchableOpacity>
          <View style={s.followDivider} />
          <TouchableOpacity
            style={s.followStat}
            onPress={() => navigation.navigate('FollowList', { userId: user.id, type: 'following' })}
          >
            <Text style={s.followNum}>{followCounts.following}</Text>
            <Text style={s.followLabel}>Following</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Stats Grid (4 cards) ── */}
      <View style={s.statsGrid}>
        <View style={s.statCard}>
          <Text style={s.statNum}>{user.reputationScore}</Text>
          <Text style={s.statLabel}>⭐ Reputation</Text>
        </View>
        <View style={s.statCard}>
          <Text style={s.statNum}>{user.studentsGuided}</Text>
          <Text style={s.statLabel}>🎓 Guided</Text>
        </View>
        <View style={s.statCard}>
          <Text style={s.statNum}>{posts.length}</Text>
          <Text style={s.statLabel}>📝 Posts</Text>
        </View>
        <View style={s.statCard}>
          <Text style={s.statNum}>{totalLikes}</Text>
          <Text style={s.statLabel}>❤️ Likes</Text>
        </View>
      </View>

      {/* ── About & Info Section ── */}
      {(user.bio || user.workplace || user.domain) && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>📋 About</Text>
          <View style={s.aboutCard}>
            {user.bio ? (
              <Text style={s.bioText}>{user.bio}</Text>
            ) : null}
            {user.bio && (user.domain || user.workplace) ? <View style={s.divider} /> : null}
            {user.domain ? (
              <View style={s.infoRow}>
                <Ionicons name="briefcase-outline" size={16} color={Colors.accent} />
                <Text style={s.infoLabel}>Domain</Text>
                <Text style={s.infoValue}>{user.domain}</Text>
              </View>
            ) : null}
            {user.workplace ? (
              <View style={s.infoRow}>
                <Ionicons name="business-outline" size={16} color={Colors.accent} />
                <Text style={s.infoLabel}>Works At</Text>
                <Text style={s.infoValue}>{user.workplace}</Text>
              </View>
            ) : null}
          </View>
        </View>
      )}

      {/* ── Skills ── */}
      {user.skills.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>🛠️ Skills</Text>
          <View style={s.skillsRow}>
            {user.skills.map((skill, i) => (
              <View key={i} style={s.skillChip}>
                <Text style={s.skillText}>{skill}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* ── Recent Posts ── */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>📰 My Posts</Text>
          {posts.length > 3 && (
            <TouchableOpacity onPress={() => navigation.navigate('MyPosts')}>
              <Text style={s.seeAll}>See All ({posts.length})</Text>
            </TouchableOpacity>
          )}
        </View>

        {loadingPosts ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 20 }} />
        ) : posts.length === 0 ? (
          <View style={s.emptyPosts}>
            <Ionicons name="newspaper-outline" size={36} color={Colors.textMuted} />
            <Text style={s.emptyText}>No posts yet</Text>
          </View>
        ) : (
          posts.slice(0, 5).map((post) => (
            <View key={post.id} style={s.postCard}>
              <Text style={s.postContent} numberOfLines={3}>{post.textContent}</Text>
              <View style={s.postFooter}>
                <View style={s.postStat}>
                  <Ionicons name="heart" size={14} color={Colors.like} />
                  <Text style={s.postStatText}>{post.likesCount}</Text>
                </View>
                <View style={s.postStat}>
                  <Ionicons name="chatbubble" size={13} color={Colors.accent} />
                  <Text style={s.postStatText}>{post.commentsCount}</Text>
                </View>
                <Text style={s.postTime}>{timeAgo(post.createdAt)}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* ── Activity Summary ── */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>📊 Activity Summary</Text>
        <View style={s.activityCard}>
          <View style={s.activityRow}>
            <Text style={s.activityLabel}>Total Posts</Text>
            <Text style={s.activityValue}>{posts.length}</Text>
          </View>
          <View style={s.activityRow}>
            <Text style={s.activityLabel}>Total Likes Received</Text>
            <Text style={[s.activityValue, { color: Colors.like }]}>{totalLikes}</Text>
          </View>
          <View style={s.activityRow}>
            <Text style={s.activityLabel}>Total Comments Received</Text>
            <Text style={[s.activityValue, { color: Colors.accent }]}>{totalComments}</Text>
          </View>
          <View style={[s.activityRow, { borderBottomWidth: 0 }]}>
            <Text style={s.activityLabel}>Avg Likes per Post</Text>
            <Text style={s.activityValue}>{posts.length ? (totalLikes / posts.length).toFixed(1) : '0'}</Text>
          </View>
        </View>
      </View>

      {/* ── Logout ── */}
      <TouchableOpacity style={s.logoutBtn} onPress={logout} activeOpacity={0.8}>
        <Ionicons name="log-out-outline" size={20} color={Colors.error} />
        <Text style={s.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDark },

  // Header
  headerCard: {
    alignItems: 'center', padding: Spacing.lg,
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md,
  },
  avatarWrapper: { position: 'relative', marginBottom: Spacing.md },
  avatarLarge: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.primaryGlow,
    alignItems: 'center', justifyContent: 'center', borderWidth: 3,
  },
  editBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.bgCard,
  },
  name: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  email: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 4 },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.md, paddingVertical: 4,
    borderRadius: BorderRadius.full, marginTop: Spacing.sm,
  },
  roleText: { fontSize: FontSize.sm, fontWeight: '700' },

  // Follow
  followRow: {
    flexDirection: 'row', alignItems: 'center', marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  followStat: { alignItems: 'center', paddingHorizontal: Spacing.lg },
  followNum: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  followLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  followDivider: { width: 1, height: 32, backgroundColor: Colors.border },

  // Stats Grid
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  statCard: {
    width: '48%' as any, alignItems: 'center', paddingVertical: Spacing.md,
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border,
  },
  statNum: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.primary },
  statLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 4 },

  // Sections
  section: { marginBottom: Spacing.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textSecondary, marginBottom: Spacing.sm },
  seeAll: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600' },

  // About Card
  aboutCard: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  bioText: { fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 22 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 6 },
  infoLabel: { fontSize: FontSize.xs, color: Colors.textMuted, width: 65 },
  infoValue: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: '600', flex: 1 },

  // Skills
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  skillChip: {
    backgroundColor: Colors.bgCard, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border,
  },
  skillText: { fontSize: FontSize.sm, color: Colors.accent },

  // Posts
  postCard: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  postContent: { fontSize: FontSize.md, color: Colors.textPrimary, lineHeight: 22, marginBottom: Spacing.sm },
  postFooter: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.lg,
    borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.sm,
  },
  postStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  postStatText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  postTime: { flex: 1, textAlign: 'right', fontSize: FontSize.xs, color: Colors.textMuted },
  emptyPosts: {
    alignItems: 'center', padding: Spacing.xl,
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border, gap: Spacing.xs,
  },
  emptyText: { fontSize: FontSize.sm, color: Colors.textMuted },

  // Activity Summary
  activityCard: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  activityRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  activityLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  activityValue: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },

  // Logout
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    padding: Spacing.md, backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.error, marginTop: Spacing.md,
  },
  logoutText: { fontSize: FontSize.md, fontWeight: '600', color: Colors.error },
});
