import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { User, Role } from '../../types';
import api from '../../services/api';

const LI = {
  blue: '#0A66C2',
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
  [Role.ADMIN]: '#004182',
};

export default function FollowListScreen({ route, navigation }: any) {
  const { userId, type } = route.params as { userId: string; type: 'followers' | 'following' };
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    navigation.setOptions({
      title: type === 'followers' ? 'Followers' : 'Following',
    });
    (async () => {
      try {
        const res = await api.get(`/follow/${userId}/${type}`);
        setUsers(res.data.data || []);
      } catch {}
      setLoading(false);
    })();
  }, [userId, type]);

  const renderUser = ({ item }: { item: User }) => {
    const roleColor = ROLE_COLORS[item.role] || LI.blue;
    const initials = item.fullName?.charAt(0)?.toUpperCase() || '?';
    return (
      <TouchableOpacity
        style={s.card}
        onPress={() => navigation.push('UserProfile', { userId: item.id })}
        activeOpacity={0.7}
      >
        <View style={[s.avatar, { backgroundColor: roleColor }]}>
          <Text style={s.avatarText}>{initials}</Text>
        </View>
        <View style={s.info}>
          <Text style={s.name}>{item.fullName}</Text>
          <View style={s.metaRow}>
            <Text style={[s.roleText, { color: roleColor }]}>
              {item.role.charAt(0) + item.role.slice(1).toLowerCase()}
            </Text>
            {item.domain ? <Text style={s.domain}>• {item.domain}</Text> : null}
          </View>
          {item.bio ? <Text style={s.bio} numberOfLines={1}>{item.bio}</Text> : null}
        </View>
        <Ionicons name="chevron-forward" size={18} color={LI.textSecondary} />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator size="large" color={LI.blue} />
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.countBar}>
        <Ionicons name="people" size={18} color={LI.blue} />
        <Text style={s.countText}>
          {users.length} {type === 'followers' ? 'follower' : 'following'}{users.length !== 1 && type === 'followers' ? 's' : ''}
        </Text>
      </View>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderUser}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="people-outline" size={48} color={LI.textSecondary} />
            <Text style={s.emptyText}>
              {type === 'followers' ? 'No followers yet' : 'Not following anyone'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: LI.white },
  loadingContainer: { flex: 1, backgroundColor: LI.white, alignItems: 'center', justifyContent: 'center' },
  countBar: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: LI.border,
  },
  countText: { fontSize: 14, color: LI.textSecondary, fontWeight: '600' },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: LI.border,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: LI.white },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 15, fontWeight: '700', color: LI.textDark },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  roleText: { fontSize: 12, fontWeight: '600' },
  domain: { fontSize: 12, color: LI.textSecondary },
  bio: { fontSize: 12, color: LI.textSecondary, marginTop: 2 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, color: LI.textSecondary },
});
