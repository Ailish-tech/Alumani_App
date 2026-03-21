import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity,
  Image, Dimensions, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { Role, User, Post } from '../../types';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_ITEM_SIZE = (SCREEN_WIDTH - Spacing.md * 2 - 4) / 3; // 3 columns with 2px gaps

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

export default function UserProfileScreen({ route, navigation }: any) {
  const { userId } = route.params;
  const { user: currentUser } = useAuthStore();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const isOwnProfile = currentUser?.id === userId;

  useEffect(() => {
    (async () => {
      try {
        const [profileRes, postsRes, countsRes] = await Promise.all([
          api.get(`/auth/user/${userId}`),
          api.get(`/posts/user/${userId}`),
          api.get(`/follow/${userId}/counts`),
        ]);
        setUser(profileRes.data.data);
        setPosts(postsRes.data.data || []);
        setFollowCounts(countsRes.data.data);

        if (!isOwnProfile) {
          const statusRes = await api.get(`/follow/${userId}/status`);
          setIsFollowing(statusRes.data.data.isFollowing);
        }
      } catch {}
      setLoading(false);
    })();
  }, [userId]);

  const handleFollow = async () => {
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await api.delete(`/follow/${userId}`);
        setIsFollowing(false);
        setFollowCounts(prev => ({ ...prev, followers: prev.followers - 1 }));
      } else {
        await api.post(`/follow/${userId}`);
        setIsFollowing(true);
        setFollowCounts(prev => ({ ...prev, followers: prev.followers + 1 }));
      }
    } catch {}
    setFollowLoading(false);
  };

  if (loading) {
    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={s.loadingContainer}>
        <Ionicons name="person-outline" size={48} color={Colors.textMuted} />
        <Text style={s.emptyText}>User not found</Text>
      </View>
    );
  }

  const roleColor = ROLE_COLORS[user.role] || Colors.primary;
  const postsWithImages = posts.filter((p: any) =>
    (p.mediaUrls?.length > 0) || p.mediaUrl
  );

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 100 }}>

      {/* ═══════════════════════════════════════════════════════════════════════
          INSTAGRAM-STYLE HEADER
          ═══════════════════════════════════════════════════════════════════════ */}
      <View style={s.headerSection}>
        <View style={s.headerRow}>
          {/* Avatar */}
          <View style={[s.avatarRing, { borderColor: roleColor }]}>
            <View style={s.avatarInner}>
              <Ionicons name="person" size={36} color={roleColor} />
            </View>
          </View>

          {/* Stats Row: Posts / Followers / Following */}
          <View style={s.statsRow}>
            <View style={s.statItem}>
              <Text style={s.statNum}>{posts.length}</Text>
              <Text style={s.statLabel}>Posts</Text>
            </View>
            <TouchableOpacity
              style={s.statItem}
              onPress={() => navigation.push('FollowList', { userId, type: 'followers' })}
            >
              <Text style={s.statNum}>{followCounts.followers}</Text>
              <Text style={s.statLabel}>Followers</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.statItem}
              onPress={() => navigation.push('FollowList', { userId, type: 'following' })}
            >
              <Text style={s.statNum}>{followCounts.following}</Text>
              <Text style={s.statLabel}>Following</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Name + Role Badge */}
        <Text style={s.displayName}>{user.fullName || user.id}</Text>
        <View style={[s.roleBadge, { backgroundColor: `${roleColor}20` }]}>
          <Ionicons name="ribbon" size={12} color={roleColor} />
          <Text style={[s.roleText, { color: roleColor }]}>
            {user.role.charAt(0) + user.role.slice(1).toLowerCase()}
          </Text>
        </View>

        {/* Bio */}
        {user.bio ? <Text style={s.bioText}>{user.bio}</Text> : null}

        {/* Workplace / Domain tags */}
        {(user.workplace || user.domain) && (
          <View style={s.infoTags}>
            {user.domain ? (
              <View style={s.infoTag}>
                <Ionicons name="briefcase-outline" size={13} color={Colors.accent} />
                <Text style={s.infoTagText}>{user.domain}</Text>
              </View>
            ) : null}
            {user.workplace ? (
              <View style={s.infoTag}>
                <Ionicons name="business-outline" size={13} color={Colors.accent} />
                <Text style={s.infoTagText}>{user.workplace}</Text>
              </View>
            ) : null}
          </View>
        )}

        {/* ── Action Buttons ── */}
        {!isOwnProfile ? (
          <View style={s.actionBtns}>
            <TouchableOpacity
              style={[s.primaryBtn, isFollowing && s.primaryBtnOutline]}
              onPress={handleFollow}
              disabled={followLoading}
              activeOpacity={0.8}
            >
              {followLoading ? (
                <ActivityIndicator size="small" color={isFollowing ? Colors.primary : '#fff'} />
              ) : (
                <Text style={[s.primaryBtnText, isFollowing && s.primaryBtnTextOutline]}>
                  {isFollowing ? 'Following' : 'Follow'}
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={s.secondaryBtn}
              onPress={() =>
                navigation.navigate('Chat', { roomId: `dm-${userId}`, otherUserName: user.fullName })
              }
            >
              <Text style={s.secondaryBtnText}>Message</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.iconBtn}
              onPress={() => navigation.navigate('Endorsements', { userId })}
            >
              <Ionicons name="thumbs-up-outline" size={18} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={s.editProfileBtn}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={s.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ═══════════════════════════════════════════════════════════════════════
          HIGHLIGHTS-STYLE SKILLS
          ═══════════════════════════════════════════════════════════════════════ */}
      {user.skills && user.skills.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.skillsScroll}
          contentContainerStyle={{ paddingHorizontal: Spacing.md, gap: Spacing.md }}>
          {user.skills.map((skill, i) => (
            <View key={i} style={s.skillHighlight}>
              <View style={s.skillCircle}>
                <Text style={s.skillEmoji}>
                  {['💻', '🎨', '📊', '🔧', '🧠', '📱', '🌐', '⚡', '🔬', '📝'][i % 10]}
                </Text>
              </View>
              <Text style={s.skillName} numberOfLines={1}>{skill}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB SWITCHER (Grid / List)
          ═══════════════════════════════════════════════════════════════════════ */}
      <View style={s.tabBar}>
        <TouchableOpacity
          style={[s.tab, viewMode === 'grid' && s.tabActive]}
          onPress={() => setViewMode('grid')}
        >
          <Ionicons name="grid-outline" size={22} color={viewMode === 'grid' ? Colors.primary : Colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tab, viewMode === 'list' && s.tabActive]}
          onPress={() => setViewMode('list')}
        >
          <Ionicons name="list-outline" size={22} color={viewMode === 'list' ? Colors.primary : Colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* ═══════════════════════════════════════════════════════════════════════
          POSTS — GRID VIEW (Instagram 3-column)
          ═══════════════════════════════════════════════════════════════════════ */}
      {viewMode === 'grid' ? (
        posts.length === 0 ? (
          <View style={s.emptyPosts}>
            <Ionicons name="camera-outline" size={48} color={Colors.textMuted} />
            <Text style={s.emptyTitle}>No Posts Yet</Text>
          </View>
        ) : (
          <View style={s.gridContainer}>
            {posts.map((post: any, idx) => {
              const imgUrl = post.mediaUrls?.[0] || post.mediaUrl;
              const hasMultiple = (post.mediaUrls?.length || 0) > 1;
              return (
                <TouchableOpacity key={post.id} style={s.gridItem} activeOpacity={0.8}>
                  {imgUrl ? (
                    <Image source={{ uri: imgUrl }} style={s.gridImage} resizeMode="cover" />
                  ) : (
                    <View style={s.gridTextPost}>
                      <Text style={s.gridTextContent} numberOfLines={4}>{post.textContent}</Text>
                    </View>
                  )}
                  {/* Multi-image indicator */}
                  {hasMultiple && (
                    <View style={s.multiIcon}>
                      <Ionicons name="copy-outline" size={14} color="#fff" />
                    </View>
                  )}
                  {/* Engagement overlay */}
                  <View style={s.gridOverlay}>
                    <View style={s.gridStat}>
                      <Ionicons name="heart" size={12} color="#fff" />
                      <Text style={s.gridStatText}>{post.likesCount}</Text>
                    </View>
                    <View style={s.gridStat}>
                      <Ionicons name="chatbubble" size={11} color="#fff" />
                      <Text style={s.gridStatText}>{post.commentsCount}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )
      ) : (
        /* ═══════════════════════════════════════════════════════════════════════
           POSTS — LIST VIEW
           ═══════════════════════════════════════════════════════════════════════ */
        <View style={{ paddingHorizontal: Spacing.md }}>
          {posts.length === 0 ? (
            <View style={s.emptyPosts}>
              <Ionicons name="newspaper-outline" size={48} color={Colors.textMuted} />
              <Text style={s.emptyTitle}>No Posts Yet</Text>
            </View>
          ) : (
            posts.map((post: any) => {
              const imgUrls: string[] = post.mediaUrls?.length
                ? post.mediaUrls
                : post.mediaUrl ? [post.mediaUrl] : [];
              return (
                <View key={post.id} style={s.listPostCard}>
                  <View style={s.listPostHeader}>
                    <View style={s.avatar}>
                      <Ionicons name="person" size={16} color={roleColor} />
                    </View>
                    <View>
                      <Text style={s.listPostAuthor}>{user.fullName}</Text>
                      <Text style={s.listPostTime}>{timeAgo(post.createdAt)}</Text>
                    </View>
                  </View>
                  <Text style={s.listPostContent}>{post.textContent}</Text>
                  {imgUrls.length > 0 && (
                    <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
                      {imgUrls.map((uri: string, i: number) => (
                        <Image key={i} source={{ uri }} style={s.listPostImage} resizeMode="cover" />
                      ))}
                    </ScrollView>
                  )}
                  <View style={s.listPostFooter}>
                    <View style={s.listPostStat}>
                      <Ionicons name="heart" size={16} color={Colors.like} />
                      <Text style={s.listPostStatText}>{post.likesCount}</Text>
                    </View>
                    <View style={s.listPostStat}>
                      <Ionicons name="chatbubble" size={14} color={Colors.accent} />
                      <Text style={s.listPostStatText}>{post.commentsCount}</Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      )}
    </ScrollView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDark },
  loadingContainer: { flex: 1, backgroundColor: Colors.bgDark, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },

  // ── Header ──────────────────────────────────────────────
  headerSection: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },

  avatarRing: {
    width: 86, height: 86, borderRadius: 43,
    borderWidth: 3, alignItems: 'center', justifyContent: 'center',
    padding: 3,
  },
  avatarInner: {
    width: 74, height: 74, borderRadius: 37,
    backgroundColor: Colors.bgCard,
    alignItems: 'center', justifyContent: 'center',
  },

  statsRow: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statNum: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  statLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },

  displayName: {
    fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary,
    marginTop: Spacing.sm,
  },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: BorderRadius.full, marginTop: 4,
    alignSelf: 'flex-start',
  },
  roleText: { fontSize: 11, fontWeight: '700' },
  bioText: {
    fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20,
    marginTop: Spacing.sm,
  },
  infoTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  infoTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoTagText: { fontSize: 12, color: Colors.textSecondary },

  // ── Action Buttons ──────────────────────────────────────
  actionBtns: { flexDirection: 'row', gap: 8, marginTop: Spacing.md },
  primaryBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: Spacing.sm, borderRadius: 8,
    backgroundColor: Colors.primary,
  },
  primaryBtnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5, borderColor: Colors.border,
  },
  primaryBtnText: { fontSize: FontSize.sm, fontWeight: '700', color: '#fff' },
  primaryBtnTextOutline: { color: Colors.textPrimary },
  secondaryBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: Spacing.sm, borderRadius: 8,
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
  },
  secondaryBtnText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary },
  iconBtn: {
    width: 38, height: 38, borderRadius: 8,
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  editProfileBtn: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: Spacing.sm, borderRadius: 8,
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border,
    marginTop: Spacing.md,
  },
  editProfileText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary },

  // ── Skills (Story Highlights style) ─────────────────────
  skillsScroll: { marginTop: Spacing.md, marginBottom: Spacing.sm },
  skillHighlight: { alignItems: 'center', width: 70 },
  skillCircle: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: Colors.bgCard, borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  skillEmoji: { fontSize: 24 },
  skillName: { fontSize: 10, color: Colors.textMuted, marginTop: 4, textAlign: 'center' },

  // ── Tab Bar ─────────────────────────────────────────────
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1, borderTopColor: Colors.border,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    marginTop: Spacing.sm,
  },
  tab: {
    flex: 1, alignItems: 'center', paddingVertical: Spacing.sm,
  },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.primary },

  // ── Grid View ───────────────────────────────────────────
  gridContainer: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: Spacing.md, paddingTop: 2,
    gap: 2,
  },
  gridItem: {
    width: GRID_ITEM_SIZE, height: GRID_ITEM_SIZE,
    backgroundColor: Colors.bgCard, position: 'relative',
    overflow: 'hidden',
  },
  gridImage: { width: '100%', height: '100%' },
  gridTextPost: {
    flex: 1, padding: 8,
    backgroundColor: Colors.bgCard,
    justifyContent: 'center',
  },
  gridTextContent: { fontSize: 10, color: Colors.textSecondary, lineHeight: 14 },
  multiIcon: {
    position: 'absolute', top: 6, right: 6,
  },
  gridOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', gap: 10, padding: 4,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
  },
  gridStat: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  gridStatText: { fontSize: 10, color: '#fff', fontWeight: '600' },

  // ── List View ───────────────────────────────────────────
  listPostCard: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  listPostHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  avatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.primaryGlow, alignItems: 'center', justifyContent: 'center',
  },
  listPostAuthor: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary },
  listPostTime: { fontSize: 10, color: Colors.textMuted },
  listPostContent: { fontSize: FontSize.md, color: Colors.textPrimary, lineHeight: 22, marginBottom: Spacing.sm },
  listPostImage: {
    width: SCREEN_WIDTH - Spacing.md * 4 - 2, height: 220,
    borderRadius: BorderRadius.md, marginBottom: Spacing.sm,
    backgroundColor: Colors.bgInput,
  },
  listPostFooter: {
    flexDirection: 'row', gap: Spacing.lg,
    borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.sm,
  },
  listPostStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  listPostStatText: { fontSize: FontSize.sm, color: Colors.textSecondary },

  // ── Empty ───────────────────────────────────────────────
  emptyPosts: {
    alignItems: 'center', paddingVertical: 60, gap: Spacing.sm,
  },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '600', color: Colors.textMuted },
  emptyText: { fontSize: FontSize.sm, color: Colors.textMuted },
});
