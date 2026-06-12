import React, { useLayoutEffect, useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Animated, Platform, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { Role, Post } from '../../types';
import api from '../../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Soft muted role gradients (desaturated, professional)
const ROLE_GRADIENTS: Record<Role, [string, string]> = {
  [Role.STUDENT]: ['#E8EAF6', '#C5CAE9'],   // soft indigo
  [Role.ALUMNI]: ['#E0F2F1', '#B2DFDB'],     // soft teal  
  [Role.FACULTY]: ['#F3E5F5', '#E1BEE7'],    // soft purple
  [Role.ADMIN]: ['#FBE9E7', '#FFCCBC'],      // soft warm
};

const ROLE_COLORS: Record<Role, string> = {
  [Role.STUDENT]: '#3F51B5',
  [Role.ALUMNI]: '#00897B',
  [Role.FACULTY]: '#8E24AA',
  [Role.ADMIN]: '#E64A19',
};

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

// ─── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({ value, label, icon, gradient }: { value: number; label: string; icon: string; gradient: [string, string] }) {
  return (
    <View style={s.statCard}>
      <LinearGradient colors={gradient} style={s.statGradientBar} />
      <View style={s.statContent}>
        <Ionicons name={icon as any} size={16} color={gradient[0]} style={{ marginBottom: 4 }} />
        <Text style={s.statNum}>{value}</Text>
        <Text style={s.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

export default function ProfileScreen({ navigation }: any) {
  const { user, logout, fetchProfile } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });

  // Animations
  const headerAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(150, [
      Animated.spring(headerAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 10 }),
      Animated.spring(statsAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 10 }),
      Animated.spring(contentAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 10 }),
    ]).start();
  }, []);

  const loadPosts = useCallback(async () => {
    try { const res = await api.get('/posts/my'); setPosts(res.data.data || []); } catch {}
    setLoadingPosts(false);
  }, []);

  const loadFollowCounts = useCallback(async () => {
    if (!user) return;
    try { const res = await api.get(`/follow/${user.id}/counts`); setFollowCounts(res.data.data); } catch {}
  }, [user]);

  useFocusEffect(useCallback(() => { loadPosts(); loadFollowCounts(); }, [loadPosts, loadFollowCounts]));

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchProfile(), loadPosts(), loadFollowCounts()]);
    setRefreshing(false);
  };

  if (!user) return null;
  const accentColor = ROLE_COLORS[user.role] || '#3F51B5';
  const bannerGradient = ROLE_GRADIENTS[user.role] || ['#E8EAF6', '#C5CAE9'];
  const totalLikes = posts.reduce((sum, p) => sum + (p.likesCount || 0), 0);
  const initials = (user.fullName || '?').charAt(0).toUpperCase();

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={{ paddingBottom: 120 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#667EEA" colors={['#667EEA']} />}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Hero Section — Soft Banner + Card ── */}
      <Animated.View style={{ opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
        {/* Soft gradient banner */}
        <LinearGradient colors={bannerGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.banner}>
          <View style={s.bannerTopBar}>
            <View style={{ width: 36 }} />
            <TouchableOpacity style={s.settingsBtn} onPress={() => navigation.navigate('EditProfile')}>
              <Ionicons name="settings-outline" size={20} color={accentColor} />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Profile card overlapping banner */}
        <View style={s.profileCard}>
          {/* Avatar overlapping the banner */}
          <TouchableOpacity style={s.avatarWrap} onPress={() => navigation.navigate('EditProfile')} activeOpacity={0.8}>
            <View style={[s.avatarRing, { borderColor: accentColor }]}>
              <Text style={[s.avatarLetter, { color: accentColor }]}>{initials}</Text>
            </View>
          </TouchableOpacity>

          <Text style={s.profileName}>{user.fullName || user.id}</Text>
          {user.bio ? <Text style={s.profileBio} numberOfLines={2}>{user.bio}</Text> : <Text style={s.profileBio}>{user.email}</Text>}

          {/* Role badge */}
          <View style={[s.rolePill, { backgroundColor: `${accentColor}10` }]}>
            <View style={[s.roleDot, { backgroundColor: accentColor }]} />
            <Text style={[s.roleText, { color: accentColor }]}>{ROLE_LABELS[user.role] || user.role}</Text>
          </View>

          {/* Follow counts */}
          <View style={s.followRow}>
            <TouchableOpacity style={s.followItem} onPress={() => navigation.navigate('FollowList', { userId: user.id, type: 'followers' })}>
              <Text style={s.followNum}>{followCounts.followers}</Text>
              <Text style={s.followLabel}>followers</Text>
            </TouchableOpacity>
            <View style={s.followDivider} />
            <TouchableOpacity style={s.followItem} onPress={() => navigation.navigate('FollowList', { userId: user.id, type: 'following' })}>
              <Text style={s.followNum}>{followCounts.following}</Text>
              <Text style={s.followLabel}>following</Text>
            </TouchableOpacity>
          </View>

          {/* Edit Profile */}
          <TouchableOpacity style={[s.editBtn, { backgroundColor: `${accentColor}0C`, borderColor: `${accentColor}30` }]} onPress={() => navigation.navigate('EditProfile')} activeOpacity={0.8}>
            <Ionicons name="pencil-outline" size={15} color={accentColor} />
            <Text style={[s.editBtnText, { color: accentColor }]}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* ── Stats Grid ── */}
      <Animated.View style={[s.statsGrid, { opacity: statsAnim, transform: [{ translateY: statsAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
        <StatCard value={user.reputationScore} label="Reputation" icon="star-outline" gradient={['#FF9500', '#FFCC00']} />
        <StatCard value={posts.length} label="Posts" icon="newspaper-outline" gradient={['#007AFF', '#5AC8FA']} />
        <StatCard value={totalLikes} label="Likes" icon="heart-outline" gradient={['#FF3B30', '#FF6B6B']} />
        <StatCard value={user.studentsGuided} label="Guided" icon="people-outline" gradient={['#34C759', '#30D158']} />
      </Animated.View>

      {/* ── Content Sections ── */}
      <Animated.View style={{ opacity: contentAnim, transform: [{ translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>

        {/* About */}
        {(user.bio || user.workplace || user.domain) && (
          <View style={s.sectionCard}>
            <Text style={s.sectionTitle}>About</Text>
            {user.bio ? <Text style={s.bioText}>{user.bio}</Text> : null}
            {user.domain ? (
              <View style={s.infoRow}>
                <View style={[s.infoIcon, { backgroundColor: '#667EEA14' }]}>
                  <Ionicons name="briefcase-outline" size={14} color="#667EEA" />
                </View>
                <Text style={s.infoText}>{user.domain}</Text>
              </View>
            ) : null}
            {user.workplace ? (
              <View style={s.infoRow}>
                <View style={[s.infoIcon, { backgroundColor: '#34C75914' }]}>
                  <Ionicons name="business-outline" size={14} color="#34C759" />
                </View>
                <Text style={s.infoText}>{user.workplace}</Text>
              </View>
            ) : null}
          </View>
        )}

        {/* Skills */}
        {(user.skills?.length ?? 0) > 0 && (
          <View style={s.sectionCard}>
            <Text style={s.sectionTitle}>Skills</Text>
            <View style={s.skillsRow}>
              {user.skills.map((skill, i) => (
                <View key={i} style={[s.skillChip, { backgroundColor: `${accentColor}0A` }]}>
                  <Text style={[s.skillText, { color: accentColor }]}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Recent Posts */}
        <View style={s.sectionCard}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Activity</Text>
            {posts.length > 3 && (
              <TouchableOpacity onPress={() => navigation.navigate('MyPosts')}>
                <Text style={s.seeAll}>See all</Text>
              </TouchableOpacity>
            )}
          </View>

          {loadingPosts ? (
            <ActivityIndicator color="#667EEA" style={{ marginTop: 24 }} />
          ) : posts.length === 0 ? (
            <View style={s.emptyPosts}>
              <Ionicons name="newspaper-outline" size={36} color="#C7C7CC" />
              <Text style={s.emptyText}>No posts yet</Text>
            </View>
          ) : (
            posts.slice(0, 5).map((post) => (
              <View key={post.id} style={s.postCard}>
                <Text style={s.postContent} numberOfLines={3}>{post.textContent}</Text>
                <View style={s.postFooter}>
                  <View style={s.postStat}>
                    <Ionicons name="heart" size={14} color="#FF3B30" />
                    <Text style={s.postStatText}>{post.likesCount}</Text>
                  </View>
                  <View style={s.postStat}>
                    <Ionicons name="chatbubble-outline" size={13} color="#8E8E93" />
                    <Text style={s.postStatText}>{post.commentsCount}</Text>
                  </View>
                  <Text style={s.postTime}>{timeAgo(post.createdAt)}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={s.logoutBtn} onPress={logout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={18} color="#FF3B30" />
          <Text style={s.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },

  // ── Banner + Card ──
  banner: {
    paddingTop: Platform.OS === 'ios' ? 50 : 36,
    paddingBottom: 50,
    paddingHorizontal: 20,
  },
  bannerTopBar: {
    flexDirection: 'row', justifyContent: 'space-between',
  },
  settingsBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.65)',
    alignItems: 'center', justifyContent: 'center',
  },
  profileCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: -40,
    borderRadius: 20,
    alignItems: 'center',
    paddingTop: 52,
    paddingBottom: 22,
    paddingHorizontal: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 5,
  },
  avatarWrap: {
    position: 'absolute', top: -44,
  },
  avatarRing: {
    width: 86, height: 86, borderRadius: 43,
    backgroundColor: '#FFF',
    borderWidth: 3,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  avatarLetter: { fontSize: 34, fontWeight: '700' },
  profileName: {
    fontSize: 22, fontWeight: '700', color: '#1C1C1E', letterSpacing: -0.3,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : undefined,
  },
  profileBio: {
    fontSize: 14, color: '#8E8E93', marginTop: 4,
    textAlign: 'center', fontWeight: '400', paddingHorizontal: 10, lineHeight: 19,
  },
  rolePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10, marginTop: 10,
  },
  roleDot: { width: 6, height: 6, borderRadius: 3 },
  roleText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

  // Follow
  followRow: {
    flexDirection: 'row', alignItems: 'center', marginTop: 18, gap: 0,
  },
  followItem: { alignItems: 'center', paddingHorizontal: 24 },
  followNum: { fontSize: 18, fontWeight: '800', color: '#1C1C1E' },
  followLabel: { fontSize: 12, color: '#8E8E93', marginTop: 1 },
  followDivider: { width: 1, height: 24, backgroundColor: '#E5E5EA' },

  // Edit button
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 18, paddingVertical: 10, paddingHorizontal: 28,
    borderRadius: 20, borderWidth: 1,
  },
  editBtnText: { fontSize: 14, fontWeight: '600' },

  // Stats
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
    paddingHorizontal: 16, marginTop: 20,
  },
  statCard: {
    width: (SCREEN_WIDTH - 52) / 2, backgroundColor: '#FFF', borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  statGradientBar: { height: 3 },
  statContent: { padding: 14 },
  statNum: { fontSize: 24, fontWeight: '800', color: '#1C1C1E', letterSpacing: -0.5 },
  statLabel: { fontSize: 12, color: '#8E8E93', marginTop: 2, fontWeight: '500' },

  // Sections
  sectionCard: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 18, marginHorizontal: 16, marginTop: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1C1C1E', letterSpacing: -0.3, marginBottom: 10 },
  seeAll: { fontSize: 14, color: '#667EEA', fontWeight: '600' },

  // About
  bioText: { fontSize: 14, color: '#3C3C43', lineHeight: 21, marginBottom: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  infoIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  infoText: { fontSize: 15, color: '#1C1C1E', fontWeight: '500' },

  // Skills
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
  skillText: { fontSize: 13, fontWeight: '600' },

  // Posts
  postCard: {
    paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#F2F2F7',
  },
  postContent: { fontSize: 14, color: '#1C1C1E', lineHeight: 21, marginBottom: 8 },
  postFooter: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  postStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  postStatText: { fontSize: 13, color: '#8E8E93' },
  postTime: { flex: 1, textAlign: 'right', fontSize: 12, color: '#C7C7CC' },
  emptyPosts: { alignItems: 'center', padding: 28, gap: 10 },
  emptyText: { fontSize: 15, color: '#8E8E93' },

  // Logout
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: 14, backgroundColor: '#FFF', marginHorizontal: 16, marginTop: 12,
    borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  logoutText: { fontSize: 15, fontWeight: '600', color: '#FF3B30' },
});
