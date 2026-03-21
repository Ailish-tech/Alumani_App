import React, { useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { ChatRoom } from '../../types';

const mm = Colors.mm;
const GLASS_BG = mm.glassBackground;
const CARD_BORDER = `${mm.outlineVariant}1A`;

function RoomCard({ room, currentUserId, onPress }: { room: ChatRoom; currentUserId: string; onPress: () => void }) {
  const otherUser = room.participantOneId === currentUserId ? room.participantTwoId : room.participantOneId;
  const hasUnread = (room as any).unreadCount > 0;

  return (
    <TouchableOpacity style={styles.roomCard} onPress={onPress} activeOpacity={0.7}>
      {/* Avatar with online indicator */}
      <View style={styles.avatarWrapper}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={22} color={mm.primary} />
        </View>
        <View style={styles.onlineDot} />
      </View>

      {/* Name & Preview */}
      <View style={{ flex: 1 }}>
        <View style={styles.roomNameRow}>
          <Text style={styles.roomName} numberOfLines={1}>{otherUser.substring(0, 16)}</Text>
          <Text style={styles.roomTime}>
            {(room as any).lastMessageTime
              ? new Date((room as any).lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : ''}
          </Text>
        </View>
        <View style={styles.previewRow}>
          <Text style={[styles.lastMessage, hasUnread && styles.lastMessageUnread]} numberOfLines={1}>
            {room.lastMessagePreview || 'No messages yet'}
          </Text>
          {hasUnread && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{(room as any).unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ChatListScreen({ navigation }: any) {
  const { rooms, isLoading, fetchRooms } = useChatStore();
  const { user } = useAuthStore();

  useEffect(() => { fetchRooms(); }, []);

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={mm.outline} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            placeholderTextColor={`${mm.outline}66`}
          />
        </View>
      </View>

      <FlatList
        data={rooms}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RoomCard
            room={item}
            currentUserId={user?.id || ''}
            onPress={() => navigation.navigate('Chat', {
              roomId: item.id,
              otherUserName: item.participantOneId === user?.id ? item.participantTwoId : item.participantOneId,
            })}
          />
        )}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchRooms} tintColor={mm.primary} />}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        ItemSeparatorComponent={() => <View style={{ height: 2 }} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="chatbubbles-outline" size={48} color={mm.outline} />
            </View>
            <Text style={styles.emptyText}>No conversations yet</Text>
            <Text style={styles.emptySubtext}>Connect with someone to start chatting</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: mm.surfaceDim },

  // Search
  searchContainer: {
    paddingHorizontal: 16, paddingVertical: 12,
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: GLASS_BG, borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 10,
    borderWidth: 0.5, borderColor: CARD_BORDER,
  },
  searchInput: {
    flex: 1, color: mm.onSurface, fontSize: 14,
  },

  // Room Card
  roomCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: GLASS_BG, borderRadius: 20,
    padding: 16, marginBottom: 2,
    borderWidth: 0.5, borderColor: CARD_BORDER,
  },
  avatarWrapper: { position: 'relative' },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: `${mm.primary}1A`,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: `${mm.primary}33`,
  },
  onlineDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: Colors.online,
    borderWidth: 2, borderColor: mm.surfaceDim,
  },
  roomNameRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  roomName: { fontSize: 15, fontWeight: '700', color: mm.onSurface, flex: 1, letterSpacing: -0.2 },
  roomTime: { fontSize: 11, color: mm.outline, fontWeight: '500' },
  previewRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4,
  },
  lastMessage: { fontSize: 13, color: mm.outline, flex: 1 },
  lastMessageUnread: { color: mm.onSurfaceVariant, fontWeight: '600' },
  unreadBadge: {
    backgroundColor: mm.secondaryContainer,
    minWidth: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 6, marginLeft: 8,
  },
  unreadBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff' },

  // Empty
  emptyState: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: `${mm.primary}0D`,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  emptyText: { fontSize: 18, color: mm.onSurfaceVariant, fontWeight: '600' },
  emptySubtext: { fontSize: 14, color: mm.outline },
});
