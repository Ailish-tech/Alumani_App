import React, { useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, TextInput, Image, Alert, ActivityIndicator,
  Modal, Platform, ScrollView, Dimensions, Animated,
} from 'react-native';
import { AppleAlert } from '../../components/AppleAlert';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { usePostStore } from '../../store/postStore';
import { useAuthStore } from '../../store/authStore';
import { Post, Comment } from '../../types';
import api from '../../services/api';
import PremiumHeader from '../../components/PremiumHeader';

const SCREEN_WIDTH = Dimensions.get('window').width;
const IMAGE_WIDTH = SCREEN_WIDTH - 64;

// ─── LinkedIn-Inspired Colors ───────────────────────────────────────────────
const LI = {
  blue: '#0A66C2',
  blueDark: '#004182',
  white: '#FFFFFF',
  bgLight: '#F3F2EF',
  border: '#DCE6F1',
  textDark: '#191919',
  textSecondary: '#666666',
  like: '#DC3545',
  green: '#057642',
};

// ─── Double Tap Heart Animation ────────────────────────────────────────────
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
      ]).start(() => { scale.setValue(0); });
    }
  }, [visible]);

  if (!visible) return null;
  return (
    <Animated.View style={[styles.heartOverlay, { transform: [{ scale }], opacity }]}>
      <Ionicons name="heart" size={80} color={LI.like} />
    </Animated.View>
  );
}

// ─── Image Carousel ────────────────────────────────────────────────────────
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

// ─── Post Card ─────────────────────────────────────────────────────────────
function PostCard({ post, onLike, onComment, onAuthorPress, onBookmark, onPostMenu, currentUserId }: {
  post: Post; onLike: () => void; onComment: () => void; onAuthorPress: () => void;
  onBookmark: () => void; onPostMenu: () => void; currentUserId: string;
}) {
  const [showHeart, setShowHeart] = React.useState(false);
  const lastTap = useRef(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  const likedByNames: string[] = (post as any).likedByNames || [];
  const isLikedByMe = (post as any).isLikedByMe || false;
  const isBookmarked = (post as any).isBookmarked || false;
  const imageUrls: string[] = (post as any).mediaUrls?.length
    ? (post as any).mediaUrls
    : (post as any).mediaUrl ? [(post as any).mediaUrl] : [];

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
    <Animated.View style={[styles.postCard, { opacity: fadeAnim }]}>
      {/* Header */}
      <View style={styles.postHeaderRow}>
        <TouchableOpacity style={styles.postHeader} onPress={onAuthorPress} activeOpacity={0.7}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={20} color={LI.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.authorName}>{post.authorName || post.authorId.substring(0, 12)}</Text>
            <Text style={styles.timeText}>{timeAgo(post.createdAt)}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={onPostMenu} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="ellipsis-horizontal" size={20} color={LI.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Content */}
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
          <Ionicons name="thumbs-up" size={14} color={LI.blue} />
          {likedByNames.length > 0 ? (
            <Text style={styles.likedByText}>
              <Text style={styles.likedByName}>{likedByNames[0]}</Text>
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
          <Ionicons name={isLikedByMe ? 'thumbs-up' : 'thumbs-up-outline'} size={20} color={isLikedByMe ? LI.blue : LI.textSecondary} />
          <Text style={[styles.actionLabel, isLikedByMe && { color: LI.blue }]}>Like</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={onComment} activeOpacity={0.7}>
          <Ionicons name="chatbubble-outline" size={20} color={LI.textSecondary} />
          <Text style={styles.actionLabel}>Comment</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-redo-outline" size={20} color={LI.textSecondary} />
          <Text style={styles.actionLabel}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={onBookmark} activeOpacity={0.7}>
          <Ionicons name={isBookmarked ? 'bookmark' : 'bookmark-outline'} size={20} color={isBookmarked ? LI.blue : LI.textSecondary} />
        </TouchableOpacity>
      </View>

      {(post as any).commentsDisabled && (
        <Text style={styles.commentsOff}>🔒 Comments are turned off</Text>
      )}
    </Animated.View>
  );
}

// ─── Comment Modal ─────────────────────────────────────────────────────────
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
    AppleAlert.alert('Delete Comment', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/posts/${postId}/comments/${commentId}`);
            setComments(prev => prev.filter(c => c.id !== commentId));
          } catch { AppleAlert.alert('Error', 'Failed to delete comment'); }
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
      <View style={styles.modalOverlay}>
        <View style={styles.commentSheet}>
          <View style={styles.commentHeader}>
            <Text style={styles.commentTitle}>Comments</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={LI.textSecondary} />
            </TouchableOpacity>
          </View>
          {loading ? (
            <ActivityIndicator size="large" color={LI.blue} style={{ marginTop: 40 }} />
          ) : (
            <ScrollView style={styles.commentList} contentContainerStyle={{ paddingBottom: 16 }}>
              {topLevel.length === 0 && <Text style={styles.noComments}>No comments yet. Be the first!</Text>}
              {topLevel.map((c) => (
                <View key={c.id}>
                  <View style={styles.commentItem}>
                    <View style={styles.commentAvatar}>
                      <Ionicons name="person" size={14} color={LI.white} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.commentBubble}>
                        <Text style={styles.commentAuthor}>{c.authorName || c.authorId?.substring(0, 10)}</Text>
                        <Text style={styles.commentText}>{c.content}</Text>
                      </View>
                      <View style={styles.commentActionsRow}>
                        <Text style={styles.commentTime}>{timeAgo(c.createdAt)}</Text>
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
                        <Ionicons name="person" size={11} color={LI.white} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={styles.commentBubble}>
                          <Text style={styles.commentAuthor}>{reply.authorName || reply.authorId?.substring(0, 10)}</Text>
                          <Text style={styles.commentText}>
                            <Text style={styles.replyMention}>@{reply.replyToAuthorId?.substring(0, 8) || ''} </Text>
                            {reply.content}
                          </Text>
                        </View>
                        <View style={styles.commentActionsRow}>
                          <Text style={styles.commentTime}>{timeAgo(reply.createdAt)}</Text>
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

          {replyTo && (
            <View style={styles.replyIndicator}>
              <Text style={styles.replyIndicatorText}>Replying to <Text style={{ fontWeight: '700' }}>{replyTo.name}</Text></Text>
              <TouchableOpacity onPress={() => setReplyTo(null)}>
                <Ionicons name="close" size={18} color={LI.textSecondary} />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.commentInputRow}>
            <TextInput
              ref={inputRef}
              style={styles.commentInput}
              placeholder={replyTo ? `Reply to ${replyTo.name}...` : 'Add a comment...'}
              placeholderTextColor="#999"
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
              {posting ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="send" size={16} color="#fff" />}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Feed Screen ───────────────────────────────────────────────────────────
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

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { AppleAlert.alert('Permission needed'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: 10, quality: 0.8,
    });
    if (!result.canceled) setSelectedImages(prev => [...prev, ...result.assets.map(a => a.uri)].slice(0, 10));
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { AppleAlert.alert('Permission needed'); return; }
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
    } catch { AppleAlert.alert('Error', 'Failed to create post.'); }
    setIsPosting(false);
  };

  const handleLikeToggle = async (post: Post) => {
    if ((post as any).isLikedByMe) {
      await unlikePost(post.id);
    } else {
      await likePost(post.id);
    }
  };

  const handleBookmarkToggle = async (post: Post) => {
    const wasBookmarked = (post as any).isBookmarked;
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
      const { feed: currentFeed } = usePostStore.getState();
      usePostStore.setState({
        feed: currentFeed.map((p) =>
          p.id === post.id ? { ...p, isBookmarked: wasBookmarked } as any : p
        ),
      });
    }
  };

  const handlePostMenu = (post: Post) => {
    const isOwner = post.authorId === user?.id;
    const options: any[] = [];
    if (isOwner) {
      options.push({
        text: (post as any).commentsDisabled ? 'Turn on comments' : 'Turn off comments',
        icon: (post as any).commentsDisabled ? 'chatbubble-outline' : 'chatbubble-ellipses-outline',
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
        text: 'Delete post', style: 'destructive', icon: 'trash-outline',
        onPress: () => {
          AppleAlert.alert('Delete Post', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete', style: 'destructive', onPress: async () => {
                try {
                  await api.delete(`/posts/${post.id}`);
                  fetchFeed();
                } catch { AppleAlert.alert('Error', 'Failed to delete post'); }
              }
            },
          ]);
        },
      });
    }
    options.push({ text: 'Cancel', style: 'cancel' });
    AppleAlert.actionSheet('Post Options', options);
  };

  const openComments = (post: Post) => {
    if ((post as any).commentsDisabled) {
      AppleAlert.alert('Comments Disabled', 'The author has turned off comments for this post.');
      return;
    }
    setCommentPostId(post.id);
    setCommentPostAuthorId(post.authorId);
  };

  return (
    <View style={styles.container}>
      <PremiumHeader title="Home" variant="home" showSearch showNotifications />
      {/* Compose Prompt */}
      {!showCompose && (
        <TouchableOpacity style={styles.composePrompt} onPress={() => setShowCompose(true)} activeOpacity={0.8}>
          <View style={styles.composePromptAvatar}>
            <Ionicons name="person" size={18} color={LI.white} />
          </View>
          <Text style={styles.composePromptText}>Start a post...</Text>
          <Ionicons name="images-outline" size={22} color={LI.blue} />
        </TouchableOpacity>
      )}

      {/* Compose Area */}
      {showCompose && (
        <View style={styles.composeBox}>
          <TextInput
            style={styles.composeInput}
            placeholder="What do you want to talk about?"
            placeholderTextColor="#999"
            multiline value={newPost} onChangeText={setNewPost}
          />
          {selectedImages.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagePreviewScroll}>
              {selectedImages.map((uri, i) => (
                <View key={i} style={styles.imagePreviewItem}>
                  <Image source={{ uri }} style={styles.imagePreviewThumb} resizeMode="cover" />
                  <TouchableOpacity style={styles.removeImageBtn} onPress={() => setSelectedImages(p => p.filter((_, j) => j !== i))}>
                    <Ionicons name="close-circle" size={22} color={LI.like} />
                  </TouchableOpacity>
                </View>
              ))}
              {selectedImages.length < 10 && (
                <TouchableOpacity style={styles.addMoreBtn} onPress={pickImages}>
                  <Ionicons name="add" size={28} color={LI.textSecondary} />
                  <Text style={styles.addMoreText}>{selectedImages.length}/10</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          )}
          <View style={styles.composeActions}>
            <View style={styles.mediaButtons}>
              <TouchableOpacity onPress={() => AppleAlert.actionSheet('Add Photos', [
                { text: 'Take Photo', icon: 'camera-outline', onPress: takePhoto },
                { text: 'Choose from Gallery', icon: 'images-outline', onPress: pickImages },
                { text: 'Cancel', style: 'cancel' },
              ])} style={styles.mediaBtn}>
                <Ionicons name="images-outline" size={22} color={LI.blue} />
              </TouchableOpacity>
              <TouchableOpacity onPress={takePhoto} style={styles.mediaBtn}>
                <Ionicons name="camera-outline" size={22} color={LI.green} />
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
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchFeed} tintColor={LI.blue} colors={[LI.blue]} />}
        contentContainerStyle={{ padding: 0, paddingBottom: 100 }}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="newspaper-outline" size={48} color={LI.textSecondary} />
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

// ─── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: LI.bgLight },

  // Compose Prompt (LinkedIn-style)
  composePrompt: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: LI.white, padding: 12, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: LI.border,
  },
  composePromptAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: LI.blue, alignItems: 'center', justifyContent: 'center',
  },
  composePromptText: {
    flex: 1, fontSize: 14, color: LI.textSecondary,
    borderWidth: 1, borderColor: LI.border, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10,
  },

  // Post Card
  postCard: {
    backgroundColor: LI.white,
    paddingVertical: 12, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: LI.border,
  },
  postHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: LI.blue, alignItems: 'center', justifyContent: 'center',
  },
  authorName: { fontSize: 15, fontWeight: '700', color: LI.textDark },
  timeText: { fontSize: 12, color: LI.textSecondary },
  postContent: { fontSize: 14, color: LI.textDark, lineHeight: 21, marginBottom: 10 },

  // Images
  postImage: {
    width: '100%', height: 250, borderRadius: 8,
    marginBottom: 8, backgroundColor: LI.bgLight,
  },
  carouselContainer: { marginBottom: 8 },
  carousel: { borderRadius: 8, overflow: 'hidden' },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#BDBDBD' },
  dotActive: { backgroundColor: LI.blue, width: 8, height: 8, borderRadius: 4 },

  heartOverlay: {
    position: 'absolute', top: '50%', left: '50%',
    marginTop: -40, marginLeft: -40,
  },

  // Liked by
  likedByRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: LI.border },
  likedByText: { fontSize: 13, color: LI.textSecondary },
  likedByName: { fontWeight: '700', color: LI.textDark },

  // Actions (LinkedIn layout)
  postActions: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    paddingTop: 4,
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 8, paddingHorizontal: 8 },
  actionLabel: { fontSize: 12, fontWeight: '600', color: LI.textSecondary },
  commentsOff: { fontSize: 12, color: LI.textSecondary, marginTop: 6, fontStyle: 'italic' },

  // Compose
  composeBox: {
    backgroundColor: LI.white, padding: 16,
    borderBottomWidth: 1, borderBottomColor: LI.border,
  },
  composeInput: { color: LI.textDark, fontSize: 15, minHeight: 80, textAlignVertical: 'top' },
  composeActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  mediaButtons: { flexDirection: 'row', gap: 12 },
  mediaBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: LI.bgLight, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: LI.border,
  },
  composeRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  cancelText: { color: LI.textSecondary, fontSize: 14 },
  postButton: {
    backgroundColor: LI.blue, paddingHorizontal: 20,
    paddingVertical: 8, borderRadius: 20,
    minWidth: 70, alignItems: 'center',
  },
  postButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  imagePreviewScroll: { marginTop: 10, marginBottom: 4 },
  imagePreviewItem: { position: 'relative', marginRight: 8 },
  imagePreviewThumb: { width: 80, height: 80, borderRadius: 8, backgroundColor: LI.bgLight },
  removeImageBtn: { position: 'absolute', top: -6, right: -6, backgroundColor: LI.white, borderRadius: 12 },
  addMoreBtn: {
    width: 80, height: 80, borderRadius: 8,
    borderWidth: 2, borderColor: LI.border, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },
  addMoreText: { fontSize: 10, color: LI.textSecondary, marginTop: 2 },

  // Comment Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  commentSheet: {
    backgroundColor: LI.white, borderTopLeftRadius: 16, borderTopRightRadius: 16,
    maxHeight: '75%', minHeight: 300,
  },
  commentHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderBottomColor: LI.border,
  },
  commentTitle: { fontSize: 17, fontWeight: '700', color: LI.textDark },
  commentList: { flex: 1, paddingHorizontal: 16 },
  noComments: { textAlign: 'center', color: LI.textSecondary, marginTop: 40, fontSize: 14 },
  commentItem: { flexDirection: 'row', gap: 10, paddingVertical: 10 },
  commentAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: LI.blue, alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  commentBubble: {
    backgroundColor: LI.bgLight, borderRadius: 12, padding: 10,
  },
  commentAuthor: { fontSize: 13, fontWeight: '700', color: LI.textDark, marginBottom: 2 },
  commentText: { fontSize: 13, color: LI.textDark, lineHeight: 18 },
  commentActionsRow: { flexDirection: 'row', gap: 16, marginTop: 4, paddingLeft: 10 },
  commentTime: { fontSize: 11, color: LI.textSecondary },
  replyBtn: { fontSize: 11, color: LI.blue, fontWeight: '700' },
  deleteBtn: { fontSize: 11, color: LI.like, fontWeight: '700' },

  replyItem: { flexDirection: 'row', gap: 8, paddingVertical: 6, paddingLeft: 42 },
  replyAvatar: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: LI.blueDark, alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  replyMention: { color: LI.blue, fontWeight: '700' },

  replyIndicator: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: LI.bgLight, borderTopWidth: 1, borderTopColor: LI.border,
  },
  replyIndicatorText: { fontSize: 13, color: LI.textSecondary },

  commentInputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, borderTopWidth: 1, borderTopColor: LI.border,
  },
  commentInput: {
    flex: 1, backgroundColor: LI.bgLight, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10,
    color: LI.textDark, fontSize: 14,
    borderWidth: 1, borderColor: LI.border,
  },
  sendBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: LI.blue, alignItems: 'center', justifyContent: 'center',
  },

  // FAB
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: LI.blue, alignItems: 'center', justifyContent: 'center',
    elevation: 8, shadowColor: LI.blue, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8,
  },
  emptyState: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyText: { fontSize: 17, color: LI.textDark, fontWeight: '600' },
  emptySubtext: { fontSize: 14, color: LI.textSecondary },
});
