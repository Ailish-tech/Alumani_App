import React, { useLayoutEffect, useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { Role, Post } from '../../types';
import api from '../../services/api';

const mm = Colors.mm;
const SCREEN_WIDTH = Dimensions.get('window').width;

const ROLE_LABELS: Record<Role, string> = {
  [Role.STUDENT]: 'Student',
  [Role.ALUMNI]: 'Alumni',
  [Role.FACULTY]: 'Faculty',
  [Role.ADMIN]: 'Admin',
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

type TabKey = 'posts' | 'about' | 'activity';

export default function ProfileScreen({ navigation }: any) {
  const { user, logout, fetchProfile } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });
  const [activeTab, setActiveTab] = useState<TabKey>('posts');

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const loadPosts = useCallback(async () => {
    try {
      const res = await api.get('/posts/my');
      setPosts(res.data.data || []);
    } catch {}
    setLoadingPosts(false);
  }, []);

  useEffect(() => { loadPosts(); }, []);

  const loadFollowCounts = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get(`/follow/${user.id}/counts`);
      setFollowCounts(res.data.data);
    } catch {}
  }, [user]);

  useEffect(() => { loadFollowCounts(); }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchProfile(), loadPosts(), loadFollowCounts()]);
    setRefreshing(false);
  };

  if (!user) return null;

  const totalLikes = posts.reduce((sum, p) => sum + (p.likesCount || 0), 0);
  const totalComments = posts.reduce((sum, p) => sum + (p.commentsCount || 0), 0);

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'posts', label: 'Posts' },
    { key: 'about', label: 'About' },
    { key: 'activity', label: 'Activity' },
  ];

  // ── Tab Content Renderers ──

  const renderPostsTab = () => (
    <View style={s.tabContent}>
      {loadingPosts ? (
        <ActivityIndicator color={mm.primary} style={{ marginTop: 24 }} />
      ) : posts.length === 0 ? (
        <View style={s.emptyPosts}>
          <Ionicons name="newspaper-outline" size={36} color={mm.outline} />
          <Text style={s.emptyText}>No posts yet</Text>
        </View>
      ) : (
        posts.slice(0, 5).map((post) => (
          <View key={post.id} style={s.postCard}>
            <View style={s.postHeader}>
              <View style={s.postAvatar}>
                <Ionicons name="person" size={16} color={mm.primary} />
              </View>
              <View>
                <Text style={s.postAuthor}>{user.fullName || user.id}</Text>
                <Text style={s.postTime}>{timeAgo(post.createdAt)}</Text>
              </View>
            </View>
            <Text style={s.postContent} numberOfLines={3}>{post.textContent}</Text>
            <View style={s.postFooter}>
              <View style={s.postActions}>
                <View style={s.postStat}>
                  <Ionicons name="heart" size={16} color={mm.outline} />
                  <Text style={s.postStatText}>{post.likesCount}</Text>
                </View>
                <View style={s.postStat}>
                  <Ionicons name="chatbubble" size={14} color={mm.outline} />
                  <Text style={s.postStatText}>{post.commentsCount}</Text>
                </View>
              </View>
              <Ionicons name="share-outline" size={16} color={mm.outline} />
            </View>
          </View>
        ))
      )}
      {posts.length > 5 && (
        <TouchableOpacity onPress={() => navigation.navigate('MyPosts')} style={s.seeAllBtn}>
          <Text style={s.seeAllText}>See All Posts ({posts.length})</Text>
          <Ionicons name="chevron-forward" size={16} color={mm.primary} />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderAboutTab = () => (
    <View style={s.tabContent}>
      <View style={s.aboutCard}>
        {user.bio ? (
          <Text style={s.bioText}>{user.bio}</Text>
        ) : (
          <Text style={s.bioText}>No bio added yet. Tap "Edit Profile" to add one.</Text>
        )}
        {(user.domain || user.workplace) && <View style={s.divider} />}
        {user.domain && (
          <View style={s.infoRow}>
            <Ionicons name="briefcase-outline" size={16} color={mm.secondary} />
            <Text style={s.infoLabel}>Domain</Text>
            <Text style={s.infoValue}>{user.domain}</Text>
          </View>
        )}
        {user.workplace && (
          <View style={s.infoRow}>
            <Ionicons name="business-outline" size={16} color={mm.secondary} />
            <Text style={s.infoLabel}>Works At</Text>
            <Text style={s.infoValue}>{user.workplace}</Text>
          </View>
        )}
        <View style={s.infoRow}>
          <Ionicons name="mail-outline" size={16} color={mm.secondary} />
          <Text style={s.infoLabel}>Email</Text>
          <Text style={s.infoValue}>{user.email}</Text>
        </View>
      </View>

      {/* Skills */}
      {user.skills.length > 0 && (
        <View style={s.skillsSection}>
          <Text style={s.skillsSectionTitle}>Skills & Expertise</Text>
          <View style={s.skillsRow}>
            {user.skills.map((skill, i) => (
              <View key={i} style={s.skillChip}>
                <Text style={s.skillText}>{skill}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );

  const renderActivityTab = () => (
    <View style={s.tabContent}>
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
          <Text style={[s.activityValue, { color: mm.secondary }]}>{totalComments}</Text>
        </View>
        <View style={[s.activityRow, { borderBottomWidth: 0 }]}>
          <Text style={s.activityLabel}>Avg Likes per Post</Text>
          <Text style={s.activityValue}>{posts.length ? (totalLikes / posts.length).toFixed(1) : '0'}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={{ paddingBottom: 100 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={mm.primary} />}
    >
      {/* ── Hero Banner ── */}
      <View style={s.heroBanner}>
        <LinearGradient
          colors={[mm.surfaceContainerLow, mm.surfaceDim, `${mm.secondaryContainer}33`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.heroBannerGradient}
        />
        {/* Glowing Avatar */}
        <View style={s.avatarAbsolute}>
          <LinearGradient
            colors={[mm.gradientStart, mm.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.avatarGlowRing}
          >
            <View style={s.avatarInner}>
              <Ionicons name="person" size={48} color={mm.primary} />
            </View>
          </LinearGradient>
        </View>
      </View>

      {/* ── Profile Info & Actions ── */}
      <View style={s.profileInfo}>
        <View style={s.nameRow}>
          <Text style={s.name}>{user.fullName || user.id}</Text>
          <Ionicons name="checkmark-circle" size={20} color={mm.primary} />
        </View>
        <Text style={s.roleSubtitle}>
          {ROLE_LABELS[user.role]} • {user.domain || 'AlumniConnect Member'}
        </Text>
        {user.workplace && (
          <View style={s.workplaceRow}>
            <Ionicons name="briefcase-outline" size={14} color={mm.outline} />
            <Text style={s.workplaceText}>
              {user.role === Role.STUDENT ? 'Studying at' : 'Working at'}{' '}
              <Text style={{ color: mm.onSurface }}>{user.workplace}</Text>
            </Text>
          </View>
        )}

        {/* Buttons */}
        <View style={s.actionButtons}>
          <TouchableOpacity
            style={s.editProfileBtn}
            onPress={() => navigation.navigate('EditProfile')}
            activeOpacity={0.8}
          >
            <Text style={s.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.connectBtnWrapper} activeOpacity={0.85}>
            <LinearGradient
              colors={[mm.gradientStart, mm.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.connectBtn}
            >
              <Text style={s.connectBtnText}>Connect</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Stats Row (Glassmorphism) ── */}
      <View style={s.statsSection}>
        <View style={s.statsCard}>
          <TouchableOpacity style={s.statItem}>
            <Text style={s.statNum}>{posts.length}</Text>
            <Text style={s.statLabel}>POSTS</Text>
          </TouchableOpacity>
          <View style={s.statDivider} />
          <TouchableOpacity
            style={s.statItem}
            onPress={() => navigation.navigate('FollowList', { userId: user.id, type: 'followers' })}
          >
            <Text style={s.statNum}>{followCounts.followers}</Text>
            <Text style={s.statLabel}>FOLLOWERS</Text>
          </TouchableOpacity>
          <View style={s.statDivider} />
          <TouchableOpacity
            style={s.statItem}
            onPress={() => navigation.navigate('FollowList', { userId: user.id, type: 'following' })}
          >
            <Text style={s.statNum}>{followCounts.following}</Text>
            <Text style={s.statLabel}>FOLLOWING</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Tabs ── */}
      <View style={s.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[s.tab, activeTab === tab.key && s.tabActive]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={[s.tabText, activeTab === tab.key && s.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Tab Content ── */}
      {activeTab === 'posts' && renderPostsTab()}
      {activeTab === 'about' && renderAboutTab()}
      {activeTab === 'activity' && renderActivityTab()}

      {/* ── Logout ── */}
      <TouchableOpacity style={s.logoutBtn} onPress={logout} activeOpacity={0.8}>
        <Ionicons name="log-out-outline" size={18} color={Colors.error} />
        <Text style={s.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Styles (Midnight Meridian) ─────────────────────────────────────────────────

const GLASS_BG = mm.glassBackground;
const CARD_BORDER = `${mm.outlineVariant}1A`;
const DIVIDER_COLOR = `${mm.outlineVariant}0D`;

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: mm.surfaceDim },

  // ── Hero Banner ──────────────────────────────────────────────
  heroBanner: {
    height: 180,
    position: 'relative',
  },
  heroBannerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  avatarAbsolute: {
    position: 'absolute',
    bottom: -56,
    left: 24,
  },
  avatarGlowRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    padding: 4,
    shadowColor: mm.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 56,
    backgroundColor: mm.surfaceDim,
    borderWidth: 4,
    borderColor: mm.surfaceDim,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Profile Info ─────────────────────────────────────────────
  profileInfo: {
    paddingTop: 68,
    paddingHorizontal: 24,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 28,
    fontWeight: '800',
    color: mm.onSurface,
    letterSpacing: -0.5,
  },
  roleSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: mm.primary,
    marginTop: 4,
    letterSpacing: 0.3,
  },
  workplaceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  workplaceText: {
    fontSize: 13,
    color: mm.outline,
  },

  // ── Action Buttons ───────────────────────────────────────────
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  editProfileBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${mm.outline}33`,
    alignItems: 'center',
  },
  editProfileText: {
    fontSize: 14,
    fontWeight: '600',
    color: mm.onSurface,
  },
  connectBtnWrapper: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: mm.primaryContainer,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 6,
  },
  connectBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  connectBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: mm.onPrimary,
  },

  // ── Stats Card ───────────────────────────────────────────────
  statsSection: {
    paddingHorizontal: 24,
    marginTop: 28,
  },
  statsCard: {
    backgroundColor: GLASS_BG,
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: CARD_BORDER,
  },
  statItem: {
    alignItems: 'center',
  },
  statNum: {
    fontSize: 24,
    fontWeight: '900',
    color: mm.onSurface,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: mm.outline,
    letterSpacing: 1.5,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: `${mm.outline}1A`,
  },

  // ── Tabs ─────────────────────────────────────────────────────
  tabBar: {
    flexDirection: 'row',
    marginTop: 32,
    marginHorizontal: 24,
    borderBottomWidth: 0.5,
    borderBottomColor: DIVIDER_COLOR,
    gap: 28,
  },
  tab: {
    paddingBottom: 14,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: mm.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: mm.outline,
    letterSpacing: 0.3,
  },
  tabTextActive: {
    color: mm.primary,
    fontWeight: '700',
  },

  // ── Tab Content ──────────────────────────────────────────────
  tabContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },

  // ── Post Cards ───────────────────────────────────────────────
  postCard: {
    backgroundColor: GLASS_BG,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 0.5,
    borderColor: CARD_BORDER,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${mm.primary}1A`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postAuthor: { fontSize: 14, fontWeight: '700', color: mm.onSurface },
  postTime: { fontSize: 11, color: mm.outline },
  postContent: {
    fontSize: 14, color: mm.onSurfaceVariant, lineHeight: 21,
    marginBottom: 12,
  },
  postFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 12, borderTopWidth: 0.5, borderTopColor: DIVIDER_COLOR,
  },
  postActions: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  postStat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  postStatText: { fontSize: 12, color: mm.outline, fontWeight: '600' },

  seeAllBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: 12,
  },
  seeAllText: { fontSize: 14, color: mm.primary, fontWeight: '600' },

  emptyPosts: {
    alignItems: 'center', padding: 32,
    backgroundColor: GLASS_BG, borderRadius: 20,
    borderWidth: 0.5, borderColor: CARD_BORDER, gap: 8,
  },
  emptyText: { fontSize: 14, color: mm.outline },

  // ── About Tab ────────────────────────────────────────────────
  aboutCard: {
    backgroundColor: GLASS_BG, borderRadius: 20,
    padding: 20, borderWidth: 0.5, borderColor: CARD_BORDER,
  },
  bioText: { fontSize: 14, color: mm.onSurfaceVariant, lineHeight: 22 },
  divider: { height: 0.5, backgroundColor: DIVIDER_COLOR, marginVertical: 14 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  infoLabel: { fontSize: 12, color: mm.outline, width: 65, fontWeight: '500' },
  infoValue: { fontSize: 13, color: mm.onSurface, fontWeight: '600', flex: 1 },

  // Skills
  skillsSection: { marginTop: 20 },
  skillsSectionTitle: {
    fontSize: 13, fontWeight: '700', color: mm.onSurfaceVariant,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12,
  },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillChip: {
    backgroundColor: mm.surfaceContainerHigh,
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 999,
  },
  skillText: { fontSize: 12, color: mm.primary, fontWeight: '600' },

  // ── Activity Tab ─────────────────────────────────────────────
  activityCard: {
    backgroundColor: GLASS_BG, borderRadius: 20,
    padding: 20, borderWidth: 0.5, borderColor: CARD_BORDER,
  },
  activityRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: DIVIDER_COLOR,
  },
  activityLabel: { fontSize: 14, color: mm.onSurfaceVariant },
  activityValue: { fontSize: 15, fontWeight: '700', color: mm.onSurface },

  // ── Logout ───────────────────────────────────────────────────
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: 16, backgroundColor: GLASS_BG, borderRadius: 16,
    borderWidth: 0.5, borderColor: `${Colors.error}33`,
    marginHorizontal: 24, marginTop: 28,
  },
  logoutText: { fontSize: 14, fontWeight: '600', color: Colors.error },
});
