import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { Message } from '../../types';
import io from 'socket.io-client';
import { BASE_URL } from '../../services/api';

const mm = Colors.mm;
const GLASS_BG = mm.glassBackground;
const CARD_BORDER = `${mm.outlineVariant}1A`;
const SOCKET_URL = BASE_URL.replace('/api', '');

// ─── Typing Indicator ──────────────────────────────────────────────────────────

function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: -4, duration: 200, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 200, useNativeDriver: true }),
          Animated.delay(800),
        ])
      ).start();
    };
    animate(dot1, 0);
    animate(dot2, 200);
    animate(dot3, 400);
  }, []);

  return (
    <View style={styles.typingContainer}>
      <View style={styles.typingDots}>
        {[dot1, dot2, dot3].map((dot, i) => (
          <Animated.View
            key={i}
            style={[styles.typingDot, { transform: [{ translateY: dot }] }]}
          />
        ))}
      </View>
      <Text style={styles.typingText}>typing...</Text>
    </View>
  );
}

// ─── Date Badge ────────────────────────────────────────────────────────────────

function DateBadge({ date }: { date: string }) {
  const d = new Date(date);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const label = isToday
    ? `Today, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : d.toLocaleDateString([], { month: 'short', day: 'numeric' });

  return (
    <View style={styles.dateBadgeRow}>
      <View style={styles.dateBadge}>
        <Text style={styles.dateBadgeText}>{label}</Text>
      </View>
    </View>
  );
}

// ─── Chat Screen ───────────────────────────────────────────────────────────────

export default function ChatScreen({ route }: any) {
  const { roomId, otherUserName } = route.params;
  const { messages, fetchMessages, addMessage } = useChatStore();
  const { user, accessToken } = useAuthStore();
  const [text, setText] = useState('');
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    fetchMessages(roomId);

    // Connect socket
    socketRef.current = io(SOCKET_URL, {
      auth: { token: accessToken || `dev:${user?.id}:${user?.role}` },
    });

    socketRef.current.on('chat:newMessage', (msg: Message) => {
      if (msg.roomId === roomId && msg.senderId !== user?.id) {
        addMessage(msg);
        setIsOtherTyping(false);
      }
    });

    socketRef.current.on('chat:typing', (data: any) => {
      if (data.roomId === roomId && data.userId !== user?.id) {
        setIsOtherTyping(true);
        setTimeout(() => setIsOtherTyping(false), 3000);
      }
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [roomId]);

  const emitTyping = () => {
    socketRef.current?.emit('chat:typing', { roomId });
  };

  const sendMessage = () => {
    if (!text.trim()) return;
    socketRef.current?.emit(
      'chat:sendMessage',
      { roomId, content: text.trim() },
      (res: any) => {
        if (res?.success) {
          addMessage(res.data);
          setText('');
        }
      }
    );
  };

  const roomMessages = (messages[roomId] || []).sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Group messages by date for date badges
  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMe = item.senderId === user?.id;
    const timeStr = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Show date badge if first message or different day from previous
    let showDateBadge = false;
    if (index === 0) {
      showDateBadge = true;
    } else {
      const prevDate = new Date(roomMessages[index - 1].timestamp).toDateString();
      const currDate = new Date(item.timestamp).toDateString();
      if (prevDate !== currDate) showDateBadge = true;
    }

    return (
      <View>
        {showDateBadge && <DateBadge date={item.timestamp} />}

        {isMe ? (
          <View style={[styles.msgRow, styles.msgRowMe]}>
            <View style={styles.sentMsgCol}>
              <LinearGradient
                colors={[mm.gradientStart, mm.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.bubble, styles.bubbleMe]}
              >
                <Text style={styles.msgTextMe}>{item.content}</Text>
              </LinearGradient>
              <View style={styles.sentMeta}>
                <Text style={styles.msgTimeSent}>{timeStr}</Text>
                <Ionicons
                  name="checkmark-done"
                  size={14}
                  color={mm.primary}
                />
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.msgRow}>
            <View style={styles.receivedAvatar}>
              <Ionicons name="person" size={12} color={mm.primary} />
            </View>
            <View style={styles.receivedMsgCol}>
              <View style={[styles.bubble, styles.bubbleOther]}>
                <Text style={styles.msgTextOther}>{item.content}</Text>
              </View>
              <Text style={styles.msgTimeReceived}>{timeStr}</Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Decorative Glows */}
      <View style={styles.glowPurple} />
      <View style={styles.glowBlue} />

      <FlatList
        ref={flatListRef}
        data={roomMessages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListFooterComponent={isOtherTyping ? <TypingIndicator /> : null}
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <View style={styles.emptyIcon}>
              <Ionicons name="chatbubbles-outline" size={48} color={mm.outline} />
            </View>
            <Text style={styles.emptyTitle}>Start the conversation!</Text>
            <Text style={styles.emptySubtext}>Say hello to {otherUserName}</Text>
          </View>
        }
      />

      {/* Input Bar */}
      <View style={styles.inputBar}>
        <TouchableOpacity style={styles.attachBtn} activeOpacity={0.7}>
          <Ionicons name="add" size={24} color={mm.onSurfaceVariant} />
        </TouchableOpacity>

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder={`Message ${otherUserName}...`}
            placeholderTextColor={mm.outline}
            value={text}
            onChangeText={(t) => { setText(t); emitTyping(); }}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity style={styles.emojiBtn}>
            <Ionicons name="happy-outline" size={20} color={mm.onSurfaceVariant} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.sendBtnWrapper, !text.trim() && { opacity: 0.4 }]}
          onPress={sendMessage}
          disabled={!text.trim()}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[mm.gradientStart, mm.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.sendBtn}
          >
            <Ionicons name="send" size={18} color={mm.onPrimary} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles (Midnight Meridian) ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A14' },

  // Decorative Glows
  glowPurple: {
    position: 'absolute', top: '25%', left: -120,
    width: 300, height: 300, borderRadius: 150,
    backgroundColor: `${mm.primaryContainer}1A`,
    opacity: 0.5,
  },
  glowBlue: {
    position: 'absolute', bottom: '25%', right: -120,
    width: 300, height: 300, borderRadius: 150,
    backgroundColor: `${mm.secondaryContainer}1A`,
    opacity: 0.5,
  },

  // Date Badge
  dateBadgeRow: { alignItems: 'center', marginVertical: 16 },
  dateBadge: {
    backgroundColor: `${mm.surfaceContainerLow}80`,
    paddingHorizontal: 16, paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 0.5, borderColor: `${mm.outlineVariant}15`,
  },
  dateBadgeText: {
    fontSize: 10, fontWeight: '700', color: mm.outline,
    textTransform: 'uppercase', letterSpacing: 1,
  },

  // Messages
  msgRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end', maxWidth: '85%' },
  msgRowMe: { alignSelf: 'flex-end', maxWidth: '85%' },
  bubble: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20 },
  bubbleMe: {
    borderBottomRightRadius: 4,
    shadowColor: mm.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 4,
  },
  bubbleOther: {
    backgroundColor: `${mm.surfaceContainer}99`,
    borderBottomLeftRadius: 4,
    borderWidth: 0.5,
    borderColor: `${mm.outlineVariant}33`,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },

  // Sent message
  sentMsgCol: { alignItems: 'flex-end' },
  msgTextMe: { fontSize: 14, color: mm.onPrimary, lineHeight: 21, fontWeight: '500' },
  sentMeta: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, marginRight: 4,
  },
  msgTimeSent: { fontSize: 10, color: mm.outline, fontWeight: '500' },

  // Received message
  receivedAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: `${mm.primary}15`,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 8, marginBottom: 4,
    borderWidth: 0.5, borderColor: `${mm.outlineVariant}33`,
  },
  receivedMsgCol: { flex: 1 },
  msgTextOther: { fontSize: 14, color: mm.onSurface, lineHeight: 21 },
  msgTimeReceived: { fontSize: 10, color: mm.outline, marginTop: 4, marginLeft: 4, fontWeight: '500' },

  // Typing Indicator
  typingContainer: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 36, marginTop: 4,
  },
  typingDots: { flexDirection: 'row', gap: 4 },
  typingDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: `${mm.primary}66`,
  },
  typingText: {
    fontSize: 11, color: mm.outlineVariant, fontStyle: 'italic', fontWeight: '500',
  },

  // Input Bar
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32,
    backgroundColor: `${mm.surfaceDim}E6`,
    borderTopWidth: 0.5, borderTopColor: `${mm.outlineVariant}26`,
  },
  attachBtn: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: mm.surfaceContainerHigh,
    alignItems: 'center', justifyContent: 'center',
  },
  inputWrapper: {
    flex: 1, position: 'relative',
  },
  input: {
    backgroundColor: mm.surfaceContainerLow,
    borderRadius: 20, borderWidth: 0.5,
    borderColor: `${mm.outline}33`,
    paddingLeft: 18, paddingRight: 40, paddingVertical: 12,
    color: mm.onSurface, fontSize: 14, maxHeight: 120,
  },
  emojiBtn: {
    position: 'absolute', right: 12, bottom: 12,
  },
  sendBtnWrapper: { borderRadius: 12, overflow: 'hidden' },
  sendBtn: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: mm.secondaryContainer,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 8,
  },

  // Empty State
  emptyChat: { alignItems: 'center', paddingTop: 120, gap: 8 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: `${mm.primary}0D`,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  emptyTitle: { fontSize: 18, color: mm.onSurfaceVariant, fontWeight: '600' },
  emptySubtext: { fontSize: 14, color: mm.outline },
});
