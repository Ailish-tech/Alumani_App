import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { getSocket, connectSocket } from '../../services/socket';
import { Message } from '../../types';

// ─── LinkedIn-Inspired Colors ───────────────────────────────────────────────
const LI = {
  blue: '#0A66C2',
  white: '#FFFFFF',
  bgLight: '#F3F2EF',
  border: '#DCE6F1',
  textDark: '#191919',
  textSecondary: '#666666',
};

export default function ChatScreen({ route, navigation }: any) {
  const { roomId, otherUserName } = route.params;
  const { messages, fetchMessages, addMessage } = useChatStore();
  const { user } = useAuthStore();
  const [text, setText] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const roomMessages = messages[roomId] || [];

  useEffect(() => {
    navigation.setOptions({ headerTitle: otherUserName || 'Chat' });
  }, [otherUserName]);

  useEffect(() => {
    fetchMessages(roomId);
    let cleanedUp = false;

    (async () => {
      const socket = await connectSocket(user?.id || 'anonymous');
      if (cleanedUp) return;

      socket.on('connect', () => {
        setIsConnected(true);
        socket.emit('chat:joinRoom', { roomId });
      });

      socket.on('disconnect', () => setIsConnected(false));
      socket.on('connect_error', () => setIsConnected(false));

      socket.on('chat:newMessage', (message: Message) => {
        if (message.roomId === roomId) addMessage(message);
      });

      socket.on('chat:typing', (data: { userId: string; roomId: string }) => {
        if (data.roomId === roomId && data.userId !== user?.id) {
          setIsTyping(true);
          setTimeout(() => setIsTyping(false), 2000);
        }
      });

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
    if (!socket) return;

    socket.emit('chat:sendMessage', { roomId, content: trimmed });

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
    if (socket) socket.emit('chat:typing', { roomId });
  }, [roomId]);

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.senderId === user?.id;
    return (
      <View style={[styles.messageRow, isMe && styles.messageRowMe]}>
        <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.theirBubble]}>
          <Text style={[styles.messageText, isMe && styles.myMessageText]}>{item.content}</Text>
          <Text style={[styles.messageTime, isMe && styles.myMessageTime]}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
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
          <ActivityIndicator size="small" color="#E16745" />
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
            <Ionicons name="chatbubble-ellipses-outline" size={40} color={LI.textSecondary} />
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
          placeholder="Write a message..."
          placeholderTextColor="#999"
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendButton, !text.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!text.trim()}
        >
          <Ionicons name="send" size={18} color={text.trim() ? '#fff' : '#BDBDBD'} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: LI.bgLight },
  statusBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#FEF3C7', paddingVertical: 6,
  },
  statusText: { fontSize: 12, color: '#92400E' },
  messagesList: {
    padding: 16, paddingBottom: 8, flexGrow: 1, justifyContent: 'flex-end',
  },
  messageRow: { marginBottom: 4 },
  messageRowMe: { alignItems: 'flex-end' },
  messageBubble: {
    maxWidth: '78%', padding: 10, paddingHorizontal: 14,
    borderRadius: 18, marginBottom: 2,
  },
  myBubble: {
    backgroundColor: LI.blue, alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    backgroundColor: LI.white, alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
  },
  messageText: { fontSize: 15, color: LI.textDark, lineHeight: 21 },
  myMessageText: { color: '#fff' },
  messageTime: { fontSize: 10, color: LI.textSecondary, alignSelf: 'flex-end', marginTop: 3 },
  myMessageTime: { color: 'rgba(255,255,255,0.65)' },
  typingIndicator: { paddingHorizontal: 20, paddingVertical: 4 },
  typingText: { fontSize: 12, color: LI.textSecondary, fontStyle: 'italic' },
  inputContainer: {
    flexDirection: 'row', alignItems: 'flex-end',
    padding: 10, paddingHorizontal: 14,
    backgroundColor: LI.white, borderTopWidth: 1, borderTopColor: LI.border,
    gap: 10,
  },
  input: {
    flex: 1, backgroundColor: LI.bgLight,
    borderRadius: 20, paddingHorizontal: 16,
    paddingVertical: 10, fontSize: 15,
    color: LI.textDark, maxHeight: 100,
    borderWidth: 1, borderColor: LI.border,
  },
  sendButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: LI.blue,
    alignItems: 'center', justifyContent: 'center',
  },
  sendButtonDisabled: { backgroundColor: LI.bgLight },
  emptyState: { alignItems: 'center', paddingTop: 40, gap: 8 },
  emptyText: { fontSize: 14, color: LI.textSecondary },
});
