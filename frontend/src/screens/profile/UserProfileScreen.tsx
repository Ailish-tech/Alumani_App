import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity,
  Image, Dimensions, Alert, Animated,
} from 'react-native';
import { AppleAlert } from '../../components/AppleAlert';
import { Ionicons } from '@expo/vector-icons';
import { Role, User, Post } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import api from '../../services/api';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_ITEM_SIZE = (SCREEN_WIDTH - 4) / 3;

const LI = {
  blue: '#0A66C2',
  blueDark: '#004182',
  white: '#FFFFFF',
  bgLight: '#F3F2EF',
  border: '#DCE6F1',
  textDark: '#191919',
  textSecondary: '#666666',
  green: '#057642',
};

const ROLE_COLORS: Record<Role, string> = {
  [Role.STUDENT]: LI.blue,
  [Role.ALUMNI]: LI.green,
  [Role.FACULTY]: '#5F4BB6',
  [Role.ADMIN]: LI.blueDark,
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
  const { createRoom } = useChatStore();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [messageLoading, setMessageLoading] = useState(false);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  const isOwnProfile = currentUser?.id === userId;

  useEffect(() => {
    Animated.stagger(200, [
      Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(contentAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [loading]);

  const handleMessage = async () => {
    setMessageLoading(true);
    try {
      const room = await createRoom(userId);
      if (room) {
        navigation.navigate('Chat', { roomId: room.id, otherUserName: user?.fullName });
      } else {
        AppleAlert.alert('Error', 'Could not start conversation.');
      }
    } catch (e: any) {
      AppleAlert.alert('Error', e?.message || 'Could not start conversation.');
    } finally {
      setMessageLoading(false);
    }
  };

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
        <ActivityIndicator size="large" color={LI.blue} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={s.loadingContainer}>
        <Ionicons name="person-outline" size={48} color={LI.textSecondary} />
        <Text style={s.emptyText}>User not found</Text>
      </View>
    );
  }

  const roleColor = ROLE_COLORS[user.role] || LI.blue;

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 100 }}>

      {/* ── LinkedIn-Style Header ── */}
      <Animated.View style={[s.headerSection, { opacity: headerAnim }]}>
        <View style={s.bannerBar} />
        <View style={s.headerContent}>
          <View style={[s.avatarLarge, { backgroundColor: roleColor }]}>
            <Ionicons name="person" size={36} color={LI.white} />
          </View>
          <Text style={s.displayName}>{user.fullName || user.id}</Text>
          {user.bio ? <Text style={s.bioText}>{user.bio}</Text> : null}

          <View style={[s.roleBadge, { backgroundColor: `${roleColor}15` }]}>
            <Text style={[s.roleText, { color: roleColor }]}>
              {user.role.charAt(0) + user.role.slice(1).toLowerCase()}
            </Text>
          </View>

          {(user.workplace || user.domain) && (
            <View style={s.infoTags}>
              {user.domain ? (
                <View style={s.infoTag}>
                  <Ionicons name="briefcase-outline" size={13} color={LI.blue} />
                  <Text style={s.infoTagText}>{user.domain}</Text>
                </View>
              ) : null}
              {user.workplace ? (
                <View style={s.infoTag}>
                  <Ionicons name="business-outline" size={13} color={LI.blue} />
                  <Text style={s.infoTagText}>{user.workplace}</Text>
                </View>
              ) : null}
            </View>
          )}

          {/* Stats */}
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

          {/* Action Buttons */}
          {!isOwnProfile ? (
            <View style={s.actionBtns}>
              <TouchableOpacity
                style={[s.primaryBtn, isFollowing && s.primaryBtnOutline]}
                onPress={handleFollow}
                disabled={followLoading}
                activeOpacity={0.8}
              >
                {followLoading ? (
                  <ActivityIndicator size="small" color={isFollowing ? LI.blue : '#fff'} />
                ) : (
                  <Text style={[s.primaryBtnText, isFollowing && s.primaryBtnTextOutline]}>
                    {isFollowing ? 'Following' : 'Follow'}
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={s.secondaryBtn} onPress={handleMessage} disabled={messageLoading}>
                {messageLoading ? (
                  <ActivityIndicator size="small" color={LI.blue} />
                ) : (
                  <Text style={s.secondaryBtnText}>Message</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={s.editProfileBtn} onPress={() => navigation.navigate('EditProfile')}>
              <Ionicons name="pencil-outline" size={16} color={LI.blue} />
              <Text style={s.editProfileText}>Edit Profile</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      {/* ── Skills ── */}
      <Animated.View style={{ opacity: contentAnim }}>
        {user.skills && user.skills.length > 0 && (
          <View style={s.sectionCard}>
            <Text style={s.sectionTitle}>Skills</Text>
            <View style={s.skillsRow}>
              {user.skills.map((skill, i) => (
                <View key={i} style={s.skillChip}>
                  <Text style={s.skillText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Tab Switcher ── */}
        <View style={s.tabBar}>
          <TouchableOpacity
            style={[s.tab, viewMode === 'list' && s.tabActive]}
            onPress={() => setViewMode('list')}
          >
            <Ionicons name="list-outline" size={20} color={viewMode === 'list' ? LI.blue : LI.textSecondary} />
            <Text style={[s.tabText, viewMode === 'list' && { color: LI.blue }]}>Posts</Text>
            {viewMode === 'list' && <View style={s.tabIndicator} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.tab, viewMode === 'grid' && s.tabActive]}
            onPress={() => setViewMode('grid')}
          >
            <Ionicons name="grid-outline" size={20} color={viewMode === 'grid' ? LI.blue : LI.textSecondary} />
            <Text style={[s.tabText, viewMode === 'grid' && { color: LI.blue }]}>Grid</Text>
            {viewMode === 'grid' && <View style={s.tabIndicator} />}
          </TouchableOpacity>
        </View>

        {/* ── Posts ── */}
        {viewMode === 'grid' ? (
          posts.length === 0 ? (
            <View style={s.emptyPosts}>
              <Ionicons name="camera-outline" size={48} color={LI.textSecondary} />
              <Text style={s.emptyTitle}>No Posts Yet</Text>
            </View>
          ) : (
            <View style={s.gridContainer}>
              {posts.map((post: any) => {
                const imgUrl = post.mediaUrls?.[0] || post.mediaUrl;
                return (
                  <View key={post.id} style={s.gridItem}>
                    {imgUrl ? (
                      <Image source={{ uri: imgUrl }} style={s.gridImage} resizeMode="cover" />
                    ) : (
                      <View style={s.gridTextPost}>
                        <Text style={s.gridTextContent} numberOfLines={4}>{post.textContent}</Text>
                      </View>
                    )}
                    <View style={s.gridOverlay}>
                      <View style={s.gridStat}>
                        <Ionicons name="thumbs-up" size={11} color="#fff" />
                        <Text style={s.gridStatText}>{post.likesCount}</Text>
                      </View>
                      <View style={s.gridStat}>
                        <Ionicons name="chatbubble" size={10} color="#fff" />
                        <Text style={s.gridStatText}>{post.commentsCount}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )
        ) : (
          <View>
            {posts.length === 0 ? (
              <View style={s.emptyPosts}>
                <Ionicons name="newspaper-outline" size={48} color={LI.textSecondary} />
                <Text style={s.emptyTitle}>No Posts Yet</Text>
              </View>
            ) : (
              posts.map((post: any) => {
                const imgUrls: string[] = post.mediaUrls?.length
                  ? post.mediaUrls : post.mediaUrl ? [post.mediaUrl] : [];
                return (
                  <View key={post.id} style={s.listPostCard}>
                    <View style={s.listPostHeader}>
                      <View style={[s.avatar, { backgroundColor: roleColor }]}>
                        <Ionicons name="person" size={14} color={LI.white} />
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
                        <Ionicons name="thumbs-up" size={14} color={LI.blue} />
                        <Text style={s.listPostStatText}>{post.likesCount}</Text>
                      </View>
                      <View style={s.listPostStat}>
                        <Ionicons name="chatbubble-outline" size={13} color={LI.textSecondary} />
                        <Text style={s.listPostStatText}>{post.commentsCount}</Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}
      </Animated.View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: LI.bgLight },
  loadingContainer: { flex: 1, backgroundColor: LI.bgLight, alignItems: 'center', justifyContent: 'center', gap: 8 },

  // Header
  headerSection: { backgroundColor: LI.white, marginBottom: 8 },
  bannerBar: { height: 80, backgroundColor: LI.blue },
  headerContent: { alignItems: 'center', paddingHorizontal: 20, paddingBottom: 20 },
  avatarLarge: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 4, borderColor: LI.white, marginTop: -40,
  },
  displayName: { fontSize: 22, fontWeight: '800', color: LI.textDark, marginTop: 10 },
  bioText: { fontSize: 14, color: LI.textSecondary, lineHeight: 20, marginTop: 6, textAlign: 'center', paddingHorizontal: 16 },
  roleBadge: {
    paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 4, marginTop: 8,
  },
  roleText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  infoTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10, justifyContent: 'center' },
  infoTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoTagText: { fontSize: 13, color: LI.textSecondary },

  // Stats
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: LI.border },
  statItem: { alignItems: 'center' },
  statNum: { fontSize: 18, fontWeight: '800', color: LI.textDark },
  statLabel: { fontSize: 12, color: LI.textSecondary, marginTop: 2 },

  // Action Buttons
  actionBtns: { flexDirection: 'row', gap: 10, marginTop: 16, width: '100%' },
  primaryBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: 24, backgroundColor: LI.blue,
  },
  primaryBtnOutline: {
    backgroundColor: 'transparent', borderWidth: 1.5, borderColor: LI.textSecondary,
  },
  primaryBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  primaryBtnTextOutline: { color: LI.textDark },
  secondaryBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: 24,
    borderWidth: 1.5, borderColor: LI.blue,
  },
  secondaryBtnText: { fontSize: 14, fontWeight: '700', color: LI.blue },
  editProfileBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 24,
    borderWidth: 1.5, borderColor: LI.blue,
    marginTop: 16, width: '100%',
  },
  editProfileText: { fontSize: 14, fontWeight: '700', color: LI.blue },

  // Skills
  sectionCard: {
    backgroundColor: LI.white, padding: 16, marginBottom: 8,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: LI.border,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: LI.textDark, marginBottom: 10 },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillChip: {
    backgroundColor: LI.bgLight, paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 16, borderWidth: 1, borderColor: LI.border,
  },
  skillText: { fontSize: 13, color: LI.blue, fontWeight: '600' },

  // Tab Bar
  tabBar: {
    flexDirection: 'row', backgroundColor: LI.white,
    borderBottomWidth: 1, borderBottomColor: LI.border,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 14, position: 'relative',
  },
  tabActive: {},
  tabText: { fontSize: 14, fontWeight: '600', color: LI.textSecondary },
  tabIndicator: {
    position: 'absolute', bottom: 0, left: '20%', right: '20%',
    height: 2.5, backgroundColor: LI.blue, borderRadius: 2,
  },

  // Grid View
  gridContainer: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 2,
  },
  gridItem: {
    width: GRID_ITEM_SIZE, height: GRID_ITEM_SIZE,
    backgroundColor: LI.bgLight, position: 'relative', overflow: 'hidden',
  },
  gridImage: { width: '100%', height: '100%' },
  gridTextPost: { flex: 1, padding: 8, justifyContent: 'center' },
  gridTextContent: { fontSize: 10, color: LI.textSecondary, lineHeight: 14 },
  gridOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', gap: 10, padding: 4,
    backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center',
  },
  gridStat: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  gridStatText: { fontSize: 10, color: '#fff', fontWeight: '600' },

  // List View
  listPostCard: {
    backgroundColor: LI.white, padding: 16,
    borderBottomWidth: 1, borderBottomColor: LI.border,
  },
  listPostHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  listPostAuthor: { fontSize: 14, fontWeight: '700', color: LI.textDark },
  listPostTime: { fontSize: 11, color: LI.textSecondary },
  listPostContent: { fontSize: 14, color: LI.textDark, lineHeight: 21, marginBottom: 10 },
  listPostImage: {
    width: SCREEN_WIDTH - 32, height: 220,
    borderRadius: 8, marginBottom: 10, backgroundColor: LI.bgLight,
  },
  listPostFooter: {
    flexDirection: 'row', gap: 16,
    borderTopWidth: 1, borderTopColor: LI.border, paddingTop: 10,
  },
  listPostStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  listPostStatText: { fontSize: 13, color: LI.textSecondary },

  // Empty
  emptyPosts: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: LI.textSecondary },
  emptyText: { fontSize: 14, color: LI.textSecondary },
});
