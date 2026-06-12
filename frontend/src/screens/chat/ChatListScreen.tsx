import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { ChatRoom } from '../../types';
import api from '../../services/api';
import PremiumHeader from '../../components/PremiumHeader';

// ─── LinkedIn-Inspired Colors ───────────────────────────────────────────────
const LI = {
  blue: '#0A66C2',
  white: '#FFFFFF',
  bgLight: '#F3F2EF',
  border: '#DCE6F1',
  textDark: '#191919',
  textSecondary: '#666666',
  green: '#057642',
};

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

function RoomCard({ room, currentUserId, onPress, index }: { room: ChatRoom; currentUserId: string; onPress: () => void; index: number }) {
  const otherUserId = room.participantOneId === currentUserId ? room.participantTwoId : room.participantOneId;
  const [displayName, setDisplayName] = useState(otherUserId.substring(0, 16));
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    getUserName(otherUserId).then(setDisplayName);
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 350, delay: index * 60, useNativeDriver: true,
    }).start();
  }, [otherUserId]);

  const initials = displayName.charAt(0).toUpperCase();
  const colors = ['#0A66C2', '#057642', '#5F4BB6', '#B24020', '#0073B1'];
  const bgColor = colors[initials.charCodeAt(0) % colors.length];

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <TouchableOpacity style={styles.roomCard} onPress={onPress} activeOpacity={0.7}>
        <View style={[styles.avatar, { backgroundColor: bgColor }]}>
          <Text style={styles.avatarText}>{initials}</Text>
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
        <Ionicons name="chevron-forward" size={18} color={LI.textSecondary} />
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function ChatListScreen({ navigation }: any) {
  const { rooms, isLoading, fetchRooms, error } = useChatStore();
  const { user } = useAuthStore();

  useEffect(() => { fetchRooms(); }, []);

  return (
    <View style={styles.container}>
      <PremiumHeader title="Messages" subtitle="Your conversations" showNotifications />
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="warning" size={16} color="#E16745" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      <FlatList
        data={rooms}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <RoomCard
            room={item}
            currentUserId={user?.id || ''}
            index={index}
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
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchRooms} tintColor={LI.blue} colors={[LI.blue]} />}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={48} color={LI.textSecondary} />
            <Text style={styles.emptyText}>No conversations yet</Text>
            <Text style={styles.emptySubtext}>Connect with someone to start chatting</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: LI.white },
  roomCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: LI.border,
  },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20, fontWeight: '700', color: LI.white,
  },
  nameRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  roomName: { fontSize: 15, fontWeight: '600', color: LI.textDark, flex: 1, marginRight: 8 },
  lastMessage: { fontSize: 13, color: LI.textSecondary, marginTop: 2 },
  timeText: { fontSize: 12, color: LI.textSecondary },
  emptyState: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyText: { fontSize: 17, color: LI.textDark, fontWeight: '600' },
  emptySubtext: { fontSize: 14, color: LI.textSecondary },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FEF3C7', padding: 10, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: '#FDE68A',
  },
  errorText: { fontSize: 13, color: '#92400E' },
});
