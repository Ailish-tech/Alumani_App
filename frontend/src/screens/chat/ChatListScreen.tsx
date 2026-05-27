import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { ChatRoom } from '../../types';
import api from '../../services/api';

// Cache for user names
const nameCache: Record<string, string> = {};

async function getUserName(userId: string): Promise<string> {
  if (nameCache[userId]) return nameCache[userId];
  try {
    const res = await api.get(`/alumni/search?query=${userId}&limit=1`);
    const users = res.data?.data || [];
    if (users.length > 0 && users[0].fullName) {
      nameCache[userId] = users[0].fullName;
      return users[0].fullName;
    }
  } catch {}
  // Fallback: try profile endpoint
  try {
    const res = await api.get(`/auth/profile/${userId}`);
    if (res.data?.data?.fullName) {
      nameCache[userId] = res.data.data.fullName;
      return res.data.data.fullName;
    }
  } catch {}
  const short = userId.substring(0, 16);
  nameCache[userId] = short;
  return short;
}

function timeAgo(date: string) {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

function RoomCard({ room, currentUserId, onPress }: { room: ChatRoom; currentUserId: string; onPress: () => void }) {
  const otherUserId = room.participantOneId === currentUserId ? room.participantTwoId : room.participantOneId;
  const [displayName, setDisplayName] = useState(otherUserId.substring(0, 16));

  useEffect(() => {
    getUserName(otherUserId).then(setDisplayName);
  }, [otherUserId]);

  return (
    <TouchableOpacity style={styles.roomCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.nameRow}>
          <Text style={styles.roomName} numberOfLines={1}>{displayName}</Text>
          <Text style={styles.timeText}>{timeAgo(room.updatedAt)}</Text>
        </View>
        <Text style={styles.lastMessage} numberOfLines={1}>
          {room.lastMessagePreview || 'No messages yet'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function ChatListScreen({ navigation }: any) {
  const { rooms, isLoading, fetchRooms, error } = useChatStore();
  const { user } = useAuthStore();

  useEffect(() => { fetchRooms(); }, []);

  return (
    <View style={styles.container}>
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="warning" size={16} color={Colors.warning} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      <FlatList
        data={rooms}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RoomCard
            room={item}
            currentUserId={user?.id || ''}
            onPress={() => {
              const otherUserId = item.participantOneId === user?.id ? item.participantTwoId : item.participantOneId;
              const cached = nameCache[otherUserId];
              navigation.navigate('Chat', {
                roomId: item.id,
                otherUserName: cached || otherUserId.substring(0, 16),
              });
            }}
          />
        )}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchRooms} tintColor={Colors.primary} />}
        contentContainerStyle={{ padding: Spacing.md }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No conversations yet</Text>
            <Text style={styles.emptySubtext}>Connect with someone to start chatting</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDark },
  roomCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  avatar: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: Colors.primaryGlow,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.primary,
  },
  avatarText: {
    fontSize: FontSize.lg, fontWeight: '700', color: Colors.primary,
  },
  nameRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  roomName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary, flex: 1, marginRight: Spacing.sm },
  lastMessage: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  timeText: { fontSize: FontSize.xs, color: Colors.textMuted },
  emptyState: { alignItems: 'center', paddingTop: 80, gap: Spacing.sm },
  emptyText: { fontSize: FontSize.lg, color: Colors.textSecondary, fontWeight: '600' },
  emptySubtext: { fontSize: FontSize.sm, color: Colors.textMuted },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: 'rgba(255, 214, 0, 0.1)', padding: Spacing.sm, paddingHorizontal: Spacing.md,
    marginHorizontal: Spacing.md, marginTop: Spacing.sm, borderRadius: BorderRadius.sm,
  },
  errorText: { fontSize: FontSize.sm, color: Colors.warning },
});
