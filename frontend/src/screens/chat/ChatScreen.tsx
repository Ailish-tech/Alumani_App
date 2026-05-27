import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { getSocket, connectSocket } from '../../services/socket';
import { Message } from '../../types';

export default function ChatScreen({ route, navigation }: any) {
  const { roomId, otherUserName } = route.params;
  const { messages, fetchMessages, addMessage } = useChatStore();
  const { user } = useAuthStore();
  const [text, setText] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const roomMessages = messages[roomId] || [];

  // Set header title
  useEffect(() => {
    navigation.setOptions({
      headerTitle: otherUserName || 'Chat',
    });
  }, [otherUserName]);

  // Fetch messages and setup socket
  useEffect(() => {
    fetchMessages(roomId);

    let cleanedUp = false;

    (async () => {
      const socket = await connectSocket(user?.id || 'anonymous');
      if (cleanedUp) return;

      socket.on('connect', () => {
        console.log('[Chat] Socket connected');
        setIsConnected(true);
        socket.emit('chat:joinRoom', { roomId });
      });

      socket.on('disconnect', () => {
        console.log('[Chat] Socket disconnected');
        setIsConnected(false);
      });

      socket.on('connect_error', (err: any) => {
        console.log('[Chat] Socket connect error:', err.message);
        setIsConnected(false);
      });

      socket.on('chat:newMessage', (message: Message) => {
        if (message.roomId === roomId) {
          addMessage(message);
        }
      });

      socket.on('chat:typing', (data: { userId: string; roomId: string }) => {
        if (data.roomId === roomId && data.userId !== user?.id) {
          setIsTyping(true);
          setTimeout(() => setIsTyping(false), 2000);
        }
      });

      // If already connected, join immediately
      if (socket.connected) {
        setIsConnected(true);
        socket.emit('chat:joinRoom', { roomId });
      }
    })();

    return () => {
      cleanedUp = true;
      const sock = getSocket();
      if (sock) {
        sock.off('chat:newMessage');
        sock.off('chat:typing');
        sock.off('connect');
        sock.off('disconnect');
        sock.off('connect_error');
        sock.emit('chat:leaveRoom', { roomId });
      }
    };
  }, [roomId]);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const socket = getSocket();
    if (!socket) {
      console.warn('[Chat] No socket to send');
      return;
    }

    socket.emit('chat:sendMessage', {
      roomId,
      content: trimmed,
    });

    // Optimistic add
    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      roomId,
      senderId: user?.id || '',
      content: trimmed,
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    addMessage(optimistic);
    setText('');
  }, [text, roomId, user]);

  const handleTyping = useCallback(() => {
    const socket = getSocket();
    if (socket) {
      socket.emit('chat:typing', { roomId });
    }
  }, [roomId]);

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.senderId === user?.id;
    return (
      <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.theirBubble]}>
        <Text style={[styles.messageText, isMe && styles.myMessageText]}>{item.content}</Text>
        <Text style={[styles.messageTime, isMe && styles.myMessageTime]}>
          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {/* Connection status */}
      {!isConnected && (
        <View style={styles.statusBar}>
          <ActivityIndicator size="small" color={Colors.warning} />
          <Text style={styles.statusText}>Connecting...</Text>
        </View>
      )}

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={roomMessages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="chatbubble-ellipses-outline" size={40} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Start a conversation!</Text>
          </View>
        }
      />

      {/* Typing indicator */}
      {isTyping && (
        <View style={styles.typingIndicator}>
          <Text style={styles.typingText}>{otherUserName || 'User'} is typing...</Text>
        </View>
      )}

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={(v) => { setText(v); handleTyping(); }}
          placeholder="Type a message..."
          placeholderTextColor={Colors.textMuted}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendButton, !text.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!text.trim()}
        >
          <Ionicons name="send" size={20} color={text.trim() ? '#fff' : Colors.textMuted} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDark },
  statusBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs,
    backgroundColor: 'rgba(255, 214, 0, 0.1)', paddingVertical: Spacing.xs,
  },
  statusText: { fontSize: FontSize.xs, color: Colors.warning },
  messagesList: {
    padding: Spacing.md, paddingBottom: Spacing.lg, flexGrow: 1, justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '78%', padding: Spacing.sm, paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg, marginBottom: Spacing.xs,
  },
  myBubble: {
    backgroundColor: Colors.primary, alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    backgroundColor: Colors.bgCard, alignSelf: 'flex-start',
    borderBottomLeftRadius: 4, borderWidth: 1, borderColor: Colors.border,
  },
  messageText: { fontSize: FontSize.md, color: Colors.textPrimary, lineHeight: 20 },
  myMessageText: { color: '#fff' },
  messageTime: { fontSize: 10, color: Colors.textMuted, alignSelf: 'flex-end', marginTop: 2 },
  myMessageTime: { color: 'rgba(255,255,255,0.7)' },
  typingIndicator: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xs,
  },
  typingText: { fontSize: FontSize.xs, color: Colors.textMuted, fontStyle: 'italic' },
  inputContainer: {
    flexDirection: 'row', alignItems: 'flex-end',
    padding: Spacing.sm, paddingHorizontal: Spacing.md,
    backgroundColor: Colors.bgCard, borderTopWidth: 1, borderTopColor: Colors.border,
    gap: Spacing.sm,
  },
  input: {
    flex: 1, backgroundColor: Colors.bgDark,
    borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm, fontSize: FontSize.md,
    color: Colors.textPrimary, maxHeight: 100,
    borderWidth: 1, borderColor: Colors.border,
  },
  sendButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  sendButtonDisabled: { backgroundColor: Colors.bgCard },
  emptyState: { alignItems: 'center', paddingTop: 40, gap: Spacing.sm },
  emptyText: { fontSize: FontSize.md, color: Colors.textMuted },
});
