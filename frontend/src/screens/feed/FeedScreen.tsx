import React, { useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, TextInput, Image, Alert, ActivityIndicator,
  Modal, KeyboardAvoidingView, Platform, ScrollView, Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { usePostStore } from '../../store/postStore';
import { useAuthStore } from '../../store/authStore';
import { Post, Comment } from '../../types';
import api from '../../services/api';

const SCREEN_WIDTH = Dimensions.get('window').width;
const IMAGE_WIDTH = SCREEN_WIDTH - (Spacing.md * 4);

// ─── Double Tap Heart Animation ────────────────────────────────────────────────

function HeartOverlay({ visible }: { visible: boolean }) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.parallel([
          Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 3 }),
          Animated.timing(opacity, { toValue: 1, duration: 100, useNativeDriver: true }),
        ]),
        Animated.delay(600),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => {
        scale.setValue(0);
      });
    }
  }, [visible]);

  if (!visible) return null;
  return (
    <Animated.View style={[styles.heartOverlay, { transform: [{ scale }], opacity }]}>
      <Ionicons name="heart" size={80} color="#fff" />
    </Animated.View>
  );
}

// ─── Image Carousel ────────────────────────────────────────────────────────────

function ImageCarousel({ urls }: { urls: string[] }) {
  const [activeIndex, setActiveIndex] = React.useState(0);
  if (urls.length === 1) {
    return <Image source={{ uri: urls[0] }} style={styles.postImage} resizeMode="cover" />;
  }
  return (
    <View style={styles.carouselContainer}>
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / IMAGE_WIDTH))}
        style={styles.carousel}>
        {urls.map((uri, i) => (
          <Image key={i} source={{ uri }} style={[styles.postImage, { width: IMAGE_WIDTH }]} resizeMode="cover" />
        ))}
      </ScrollView>
      <View style={styles.dotsRow}>
        {urls.map((_, i) => <View key={i} style={[styles.dot, i === activeIndex && styles.dotActive]} />)}
      </View>
    </View>
  );
}

// ─── Post Card ─────────────────────────────────────────────────────────────────

function PostCard({ post, onLike, onComment, onAuthorPress, onBookmark, onPostMenu, currentUserId }: {
  post: Post; onLike: () => void; onComment: () => void; onAuthorPress: () => void;
  onBookmark: () => void; onPostMenu: () => void; currentUserId: string;
}) {
  const [showHeart, setShowHeart] = React.useState(false);
  const lastTap = useRef(0);

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const likedByNames: string[] = (post as any).likedByNames || [];
  const isLikedByMe = (post as any).isLikedByMe || false;
  const isBookmarked = (post as any).isBookmarked || false;

  const imageUrls: string[] = (post as any).mediaUrls?.length
    ? (post as any).mediaUrls
    : (post as any).mediaUrl ? [(post as any).mediaUrl] : [];

  // Double-tap to like
  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (!isLikedByMe) onLike();
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 1200);
    }
    lastTap.current = now;
  };

  return (
    <View style={styles.postCard}>
      {/* Header */}
      <View style={styles.postHeaderRow}>
        <TouchableOpacity style={styles.postHeader} onPress={onAuthorPress} activeOpacity={0.7}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={20} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.authorName}>{post.authorName || post.authorId.substring(0, 12)}</Text>
            <Text style={styles.timeText}>{timeAgo(post.createdAt)}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={onPostMenu} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="ellipsis-horizontal" size={20} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Content (tappable for double-tap like) */}
      <TouchableOpacity activeOpacity={1} onPress={handleDoubleTap}>
        <Text style={styles.postContent}>{post.textContent}</Text>
        {imageUrls.length > 0 && (
          <View style={{ position: 'relative' }}>
            <ImageCarousel urls={imageUrls} />
            <HeartOverlay visible={showHeart} />
          </View>
        )}
      </TouchableOpacity>

      {/* Liked By */}
      {post.likesCount > 0 && (
        <View style={styles.likedByRow}>
          <Ionicons name="heart" size={14} color={Colors.like} />
          {likedByNames.length > 0 ? (
            <Text style={styles.likedByText}>
              Liked by <Text style={styles.likedByName}>{likedByNames[0]}</Text>
              {likedByNames.length > 1 && (
                <Text> and <Text style={styles.likedByName}>{post.likesCount - 1} others</Text></Text>
              )}
            </Text>
          ) : (
            <Text style={styles.likedByText}>
              {post.likesCount} {post.likesCount === 1 ? 'like' : 'likes'}
            </Text>
          )}
        </View>
      )}

      {/* Actions */}
      <View style={styles.postActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={onLike} activeOpacity={0.7}>
          <Ionicons name={isLikedByMe ? 'heart' : 'heart-outline'} size={22} color={Colors.like} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={onComment} activeOpacity={0.7}>
          <Ionicons name="chatbubble-outline" size={20} color={Colors.accent} />
          <Text style={styles.actionCount}>{post.commentsCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
          <Ionicons name="paper-plane-outline" size={20} color={Colors.textMuted} />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={styles.actionBtn} onPress={onBookmark} activeOpacity={0.7}>
          <Ionicons name={isBookmarked ? 'bookmark' : 'bookmark-outline'} size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Comments disabled indicator */}
      {(post as any).commentsDisabled && (
        <Text style={styles.commentsOff}>🔒 Comments are turned off</Text>
      )}
    </View>
  );
}

// ─── Comment Modal (with replies) ──────────────────────────────────────────────

function CommentModal({ visible, postId, postAuthorId, onClose, currentUserId }: {
  visible: boolean; postId: string | null; postAuthorId: string; onClose: () => void;
  currentUserId: string;
}) {
  const [comments, setComments] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [newComment, setNewComment] = React.useState('');
  const [posting, setPosting] = React.useState(false);
  const [replyTo, setReplyTo] = React.useState<{ id: string; authorId: string; name: string } | null>(null);
  const { addComment } = usePostStore();
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible && postId) fetchComments();
    if (!visible) { setReplyTo(null); setNewComment(''); }
  }, [visible, postId]);

  const fetchComments = async () => {
    if (!postId) return;
    setLoading(true);
    try {
      const res = await api.get(`/posts/${postId}/comments`);
      setComments(res.data.data);
    } catch { }
    setLoading(false);
  };

  const handlePost = async () => {
    if (!newComment.trim() || !postId) return;
    setPosting(true);
    try {
      const body: any = { content: newComment.trim() };
      if (replyTo) {
        body.parentId = replyTo.id;
        body.replyToAuthorId = replyTo.authorId;
      }
      const res = await api.post(`/posts/${postId}/comment`, body);
      setComments(prev => [...prev, res.data.data]);
      setNewComment('');
      setReplyTo(null);
    } catch { }
    setPosting(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    Alert.alert('Delete Comment', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/posts/${postId}/comments/${commentId}`);
            setComments(prev => prev.filter(c => c.id !== commentId));
          } catch { Alert.alert('Error', 'Failed to delete comment'); }
        }
      },
    ]);
  };

  const handleReply = (comment: any) => {
    setReplyTo({
      id: comment.id,
      authorId: comment.authorId,
      name: comment.authorName || comment.authorId?.substring(0, 10),
    });
    inputRef.current?.focus();
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  // Group replies under parent comments
  const topLevel = comments.filter(c => !c.parentId);
  const repliesMap: Record<string, any[]> = {};
  comments.filter(c => c.parentId).forEach(c => {
    if (!repliesMap[c.parentId]) repliesMap[c.parentId] = [];
    repliesMap[c.parentId].push(c);
  });

  const canDelete = (comment: any) =>
    comment.authorId === currentUserId || postAuthorId === currentUserId;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
        <View style={styles.commentSheet}>
          <View style={styles.commentHeader}>
            <Text style={styles.commentTitle}>Comments</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
          {loading ? (
            <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
          ) : (
            <ScrollView style={styles.commentList} contentContainerStyle={{ paddingBottom: 16 }}>
              {topLevel.length === 0 && <Text style={styles.noComments}>No comments yet. Be the first!</Text>}
              {topLevel.map((c) => (
                <View key={c.id}>
                  {/* Top-level comment */}
                  <View style={styles.commentItem}>
                    <View style={styles.commentAvatar}>
                      <Ionicons name="person" size={14} color={Colors.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.commentMeta}>
                        <Text style={styles.commentAuthor}>{c.authorName || c.authorId?.substring(0, 10)}</Text>
                        <Text style={styles.commentTime}>{timeAgo(c.createdAt)}</Text>
                      </View>
                      <Text style={styles.commentText}>{c.content}</Text>
                      <View style={styles.commentActionsRow}>
                        <TouchableOpacity onPress={() => handleReply(c)}>
                          <Text style={styles.replyBtn}>Reply</Text>
                        </TouchableOpacity>
                        {canDelete(c) && (
                          <TouchableOpacity onPress={() => handleDeleteComment(c.id)}>
                            <Text style={styles.deleteBtn}>Delete</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>

                  {/* Replies */}
                  {repliesMap[c.id]?.map((reply) => (
                    <View key={reply.id} style={styles.replyItem}>
                      <View style={styles.replyAvatar}>
                        <Ionicons name="person" size={12} color={Colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={styles.commentMeta}>
                          <Text style={styles.commentAuthor}>{reply.authorName || reply.authorId?.substring(0, 10)}</Text>
                          <Text style={styles.commentTime}>{timeAgo(reply.createdAt)}</Text>
                        </View>
                        <Text style={styles.commentText}>
                          <Text style={styles.replyMention}>@{reply.replyToAuthorId?.substring(0, 8) || ''} </Text>
                          {reply.content}
                        </Text>
                        <View style={styles.commentActionsRow}>
                          <TouchableOpacity onPress={() => handleReply(reply)}>
                            <Text style={styles.replyBtn}>Reply</Text>
                          </TouchableOpacity>
                          {canDelete(reply) && (
                            <TouchableOpacity onPress={() => handleDeleteComment(reply.id)}>
                              <Text style={styles.deleteBtn}>Delete</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              ))}
            </ScrollView>
          )}

          {/* Reply indicator */}
          {replyTo && (
            <View style={styles.replyIndicator}>
              <Text style={styles.replyIndicatorText}>Replying to <Text style={{ fontWeight: '700' }}>{replyTo.name}</Text></Text>
              <TouchableOpacity onPress={() => setReplyTo(null)}>
                <Ionicons name="close" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          )}

          {/* Comment Input */}
          <View style={styles.commentInputRow}>
            <TextInput
              ref={inputRef}
              style={styles.commentInput}
              placeholder={replyTo ? `Reply to ${replyTo.name}...` : 'Add a comment...'}
              placeholderTextColor={Colors.textMuted}
              value={newComment}
              onChangeText={setNewComment}
              returnKeyType="send"
              onSubmitEditing={handlePost}
            />
            <TouchableOpacity
              onPress={handlePost}
              disabled={posting || !newComment.trim()}
              style={[styles.sendBtn, (!newComment.trim() || posting) && { opacity: 0.4 }]}
            >
              {posting ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="send" size={18} color="#fff" />}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Feed Screen ───────────────────────────────────────────────────────────────

export default function FeedScreen({ navigation }: any) {
  const { feed, isLoading, fetchFeed, likePost, unlikePost, createPost } = usePostStore();
  const { user } = useAuthStore();
  const [newPost, setNewPost] = React.useState('');
  const [showCompose, setShowCompose] = React.useState(false);
  const [selectedImages, setSelectedImages] = React.useState<string[]>([]);
  const [isPosting, setIsPosting] = React.useState(false);
  const [commentPostId, setCommentPostId] = React.useState<string | null>(null);
  const [commentPostAuthorId, setCommentPostAuthorId] = React.useState('');

  useEffect(() => { fetchFeed(); }, []);

  // ── Image Picker ──
  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: 10, quality: 0.8,
    });
    if (!result.canceled) setSelectedImages(prev => [...prev, ...result.assets.map(a => a.uri)].slice(0, 10));
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed'); return; }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 });
    if (!result.canceled) setSelectedImages(prev => [...prev, result.assets[0].uri].slice(0, 10));
  };

  const uploadOneImage = async (imageUri: string): Promise<string | null> => {
    try {
      const fileName = imageUri.split('/').pop() || 'photo.jpg';
      const ext = fileName.split('.').pop()?.toLowerCase() || 'jpg';
      const contentType = `image/${ext === 'png' ? 'png' : 'jpeg'}`;
      const urlRes = await api.post('/posts/upload-url', { fileName, contentType });
      const { uploadUrl, publicUrl } = urlRes.data.data;
      const response = await fetch(imageUri);
      const blob = await response.blob();
      await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': contentType }, body: blob });
      return publicUrl;
    } catch { return null; }
  };

  const handlePost = async () => {
    if (!newPost.trim() && selectedImages.length === 0) return;
    setIsPosting(true);
    try {
      let mediaUrls: string[] | undefined;
      if (selectedImages.length > 0) {
        const uploads = await Promise.all(selectedImages.map(uploadOneImage));
        mediaUrls = uploads.filter((u): u is string => u !== null);
        if (!mediaUrls.length) mediaUrls = undefined;
      }
      await createPost(newPost.trim() || '📷', mediaUrls);
      setNewPost(''); setSelectedImages([]); setShowCompose(false);
    } catch { Alert.alert('Error', 'Failed to create post.'); }
    setIsPosting(false);
  };

  // ── Like Toggle ──
  const handleLikeToggle = async (post: Post) => {
    if ((post as any).isLikedByMe) {
      await unlikePost(post.id);
    } else {
      await likePost(post.id);
    }
  };

  // ── Bookmark Toggle ──
  const handleBookmarkToggle = async (post: Post) => {
    const wasBookmarked = (post as any).isBookmarked;
    // Optimistic update
    const { feed } = usePostStore.getState();
    usePostStore.setState({
      feed: feed.map((p) =>
        p.id === post.id ? { ...p, isBookmarked: !wasBookmarked } as any : p
      ),
    });
    try {
      if (wasBookmarked) {
        await api.delete(`/posts/${post.id}/bookmark`);
      } else {
        await api.post(`/posts/${post.id}/bookmark`);
      }
    } catch {
      // Revert on failure
      const { feed: currentFeed } = usePostStore.getState();
      usePostStore.setState({
        feed: currentFeed.map((p) =>
          p.id === post.id ? { ...p, isBookmarked: wasBookmarked } as any : p
        ),
      });
    }
  };

  // ── Post Menu (delete, toggle comments) ──
  const handlePostMenu = (post: Post) => {
    const isOwner = post.authorId === user?.id;
    const options: any[] = [];
    if (isOwner) {
      options.push({
        text: (post as any).commentsDisabled ? '💬 Turn on comments' : '🔇 Turn off comments',
        onPress: async () => {
          try {
            await api.patch(`/posts/${post.id}/toggle-comments`, {
              disabled: !(post as any).commentsDisabled,
            });
            fetchFeed();
          } catch { }
        },
      });
      options.push({
        text: '🗑️ Delete post',
        style: 'destructive',
        onPress: () => {
          Alert.alert('Delete Post', 'Are you sure you want to delete this post?', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete', style: 'destructive', onPress: async () => {
                try {
                  await api.delete(`/posts/${post.id}`);
                  fetchFeed();
                } catch { Alert.alert('Error', 'Failed to delete post'); }
              }
            },
          ]);
        },
      });
    }
    options.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert('Post Options', undefined, options);
  };

  const openComments = (post: Post) => {
    if ((post as any).commentsDisabled) {
      Alert.alert('Comments Disabled', 'The author has turned off comments for this post.');
      return;
    }
    setCommentPostId(post.id);
    setCommentPostAuthorId(post.authorId);
  };

  return (
    <View style={styles.container}>
      {/* Compose Area */}
      {showCompose && (
        <View style={styles.composeBox}>
          <TextInput
            style={styles.composeInput}
            placeholder="Share something with your network..."
            placeholderTextColor={Colors.textMuted}
            multiline value={newPost} onChangeText={setNewPost}
          />
          {selectedImages.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagePreviewScroll}>
              {selectedImages.map((uri, i) => (
                <View key={i} style={styles.imagePreviewItem}>
                  <Image source={{ uri }} style={styles.imagePreviewThumb} resizeMode="cover" />
                  <TouchableOpacity style={styles.removeImageBtn} onPress={() => setSelectedImages(p => p.filter((_, j) => j !== i))}>
                    <Ionicons name="close-circle" size={22} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
              {selectedImages.length < 10 && (
                <TouchableOpacity style={styles.addMoreBtn} onPress={pickImages}>
                  <Ionicons name="add" size={28} color={Colors.textMuted} />
                  <Text style={styles.addMoreText}>{selectedImages.length}/10</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          )}
          <View style={styles.composeActions}>
            <View style={styles.mediaButtons}>
              <TouchableOpacity onPress={() => Alert.alert('Add Photos', 'Choose', [
                { text: '📷 Camera', onPress: takePhoto },
                { text: '🖼️ Gallery', onPress: pickImages },
                { text: 'Cancel', style: 'cancel' },
              ])} style={styles.mediaBtn}>
                <Ionicons name="images-outline" size={22} color={Colors.accent} />
              </TouchableOpacity>
              <TouchableOpacity onPress={takePhoto} style={styles.mediaBtn}>
                <Ionicons name="camera-outline" size={22} color={Colors.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.composeRight}>
              <TouchableOpacity onPress={() => { setShowCompose(false); setSelectedImages([]); }}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.postButton, isPosting && { opacity: 0.5 }]} onPress={handlePost} disabled={isPosting}>
                {isPosting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.postButtonText}>Post</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Feed */}
      <FlatList
        data={feed}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            currentUserId={user?.id || ''}
            onLike={() => handleLikeToggle(item)}
            onComment={() => openComments(item)}
            onAuthorPress={() => navigation.navigate('UserProfile', { userId: item.authorId })}
            onBookmark={() => handleBookmarkToggle(item)}
            onPostMenu={() => handlePostMenu(item)}
          />
        )}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchFeed} tintColor={Colors.primary} />}
        contentContainerStyle={{ padding: Spacing.md, paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="newspaper-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No posts yet</Text>
            <Text style={styles.emptySubtext}>Be the first to share something!</Text>
          </View>
        }
      />

      {/* Comment Modal */}
      <CommentModal
        visible={!!commentPostId}
        postId={commentPostId}
        postAuthorId={commentPostAuthorId}
        onClose={() => setCommentPostId(null)}
        currentUserId={user?.id || ''}
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowCompose(true)} activeOpacity={0.8}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDark },
  postCard: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  postHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primaryGlow, alignItems: 'center', justifyContent: 'center',
  },
  authorName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
  timeText: { fontSize: FontSize.xs, color: Colors.textMuted },
  postContent: { fontSize: FontSize.md, color: Colors.textPrimary, lineHeight: 22, marginBottom: Spacing.sm },

  // Images
  postImage: {
    width: '100%', height: 250, borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm, backgroundColor: Colors.bgInput,
  },
  carouselContainer: { marginBottom: Spacing.sm },
  carousel: { borderRadius: BorderRadius.md, overflow: 'hidden' },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.textMuted },
  dotActive: { backgroundColor: Colors.primary, width: 8, height: 8, borderRadius: 4 },

  // Heart overlay (double-tap)
  heartOverlay: {
    position: 'absolute', top: '50%', left: '50%',
    marginTop: -40, marginLeft: -40,
  },

  // Liked by
  likedByRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.sm },
  likedByText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  likedByName: { fontWeight: '700', color: Colors.textPrimary },

  // Actions (Instagram layout: like, comment, share ... bookmark)
  postActions: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.lg,
    borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.sm,
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionCount: { fontSize: FontSize.sm, color: Colors.textSecondary },
  commentsOff: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 6, fontStyle: 'italic' },

  // Compose
  composeBox: {
    backgroundColor: Colors.bgCard, padding: Spacing.md, margin: Spacing.md,
    borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.primary,
  },
  composeInput: { color: Colors.textPrimary, fontSize: FontSize.md, minHeight: 80, textAlignVertical: 'top' },
  composeActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.sm },
  mediaButtons: { flexDirection: 'row', gap: Spacing.md },
  mediaBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.bgInput, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  composeRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  cancelText: { color: Colors.textMuted, fontSize: FontSize.md },
  postButton: {
    backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm, borderRadius: BorderRadius.full,
    minWidth: 70, alignItems: 'center',
  },
  postButtonText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md },
  imagePreviewScroll: { marginTop: Spacing.sm, marginBottom: Spacing.xs },
  imagePreviewItem: { position: 'relative', marginRight: 8 },
  imagePreviewThumb: { width: 80, height: 80, borderRadius: 10, backgroundColor: Colors.bgInput },
  removeImageBtn: { position: 'absolute', top: -6, right: -6, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, padding: 1 },
  addMoreBtn: {
    width: 80, height: 80, borderRadius: 10,
    borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },
  addMoreText: { fontSize: 10, color: Colors.textMuted, marginTop: 2 },

  // Comment Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  commentSheet: {
    backgroundColor: Colors.bgCard, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: '75%', minHeight: 300,
  },
  commentHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  commentTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  commentList: { flex: 1, paddingHorizontal: Spacing.md },
  noComments: { textAlign: 'center', color: Colors.textMuted, marginTop: 40, fontSize: FontSize.md },
  commentItem: { flexDirection: 'row', gap: Spacing.sm, paddingVertical: Spacing.sm },
  commentAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.primaryGlow, alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  commentMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  commentAuthor: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary },
  commentTime: { fontSize: FontSize.xs, color: Colors.textMuted },
  commentText: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 18, marginTop: 2 },
  commentActionsRow: { flexDirection: 'row', gap: Spacing.lg, marginTop: 4 },
  replyBtn: { fontSize: FontSize.xs, color: Colors.accent, fontWeight: '600' },
  deleteBtn: { fontSize: FontSize.xs, color: Colors.like, fontWeight: '600' },

  // Replies (indented)
  replyItem: { flexDirection: 'row', gap: Spacing.sm, paddingVertical: 6, paddingLeft: 40 },
  replyAvatar: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: Colors.primaryGlow, alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  replyMention: { color: Colors.primary, fontWeight: '700' },

  // Reply indicator bar
  replyIndicator: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: 8,
    backgroundColor: Colors.bgInput, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  replyIndicatorText: { fontSize: FontSize.sm, color: Colors.textSecondary },

  // Comment Input
  commentInputRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    padding: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  commentInput: {
    flex: 1, backgroundColor: Colors.bgInput, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    color: Colors.textPrimary, fontSize: FontSize.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  sendBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },

  // FAB
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    elevation: 8, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8,
  },
  emptyState: { alignItems: 'center', paddingTop: 80, gap: Spacing.sm },
  emptyText: { fontSize: FontSize.lg, color: Colors.textSecondary, fontWeight: '600' },
  emptySubtext: { fontSize: FontSize.sm, color: Colors.textMuted },
});
