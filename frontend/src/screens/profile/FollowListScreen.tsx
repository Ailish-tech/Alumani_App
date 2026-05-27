import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { User, Role } from '../../types';
import api from '../../services/api';

const ROLE_COLORS: Record<Role, string> = {
  [Role.STUDENT]: Colors.roleStudent,
  [Role.ALUMNI]: Colors.roleAlumni,
  [Role.FACULTY]: Colors.roleFaculty,
  [Role.ADMIN]: Colors.roleAdmin,
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
    const roleColor = ROLE_COLORS[item.role] || Colors.primary;
    return (
      <TouchableOpacity
        style={s.card}
        onPress={() => navigation.push('UserProfile', { userId: item.id })}
        activeOpacity={0.7}
      >
        <View style={[s.avatar, { borderColor: roleColor }]}>
          <Text style={[s.avatarText, { color: roleColor }]}>
            {item.fullName?.charAt(0)?.toUpperCase() || '?'}
          </Text>
        </View>
        <View style={s.info}>
          <Text style={s.name}>{item.fullName}</Text>
          <View style={s.metaRow}>
            <View style={[s.roleBadge, { backgroundColor: `${roleColor}20` }]}>
              <Text style={[s.roleText, { color: roleColor }]}>
                {item.role.charAt(0) + item.role.slice(1).toLowerCase()}
              </Text>
            </View>
            {item.domain ? <Text style={s.domain}>{item.domain}</Text> : null}
          </View>
          {item.bio ? (
            <Text style={s.bio} numberOfLines={1}>{item.bio}</Text>
          ) : null}
        </View>
        <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.countBar}>
        <Ionicons name="people" size={18} color={Colors.primary} />
        <Text style={s.countText}>
          {users.length} {type === 'followers' ? 'follower' : 'following'}{users.length !== 1 && type === 'followers' ? 's' : ''}
        </Text>
      </View>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderUser}
        contentContainerStyle={{ padding: Spacing.md, gap: Spacing.sm }}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="people-outline" size={48} color={Colors.textMuted} />
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
  container: { flex: 1, backgroundColor: Colors.bgDark },
  loadingContainer: { flex: 1, backgroundColor: Colors.bgDark, alignItems: 'center', justifyContent: 'center' },
  countBar: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  countText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600' },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.primaryGlow,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
  },
  avatarText: { fontSize: FontSize.lg, fontWeight: '700' },
  info: { flex: 1, gap: 2 },
  name: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  roleBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 1, borderRadius: BorderRadius.full },
  roleText: { fontSize: FontSize.xs, fontWeight: '600' },
  domain: { fontSize: FontSize.xs, color: Colors.textSecondary },
  bio: { fontSize: FontSize.xs, color: Colors.textMuted },
  empty: { alignItems: 'center', paddingTop: 80, gap: Spacing.md },
  emptyText: { fontSize: FontSize.md, color: Colors.textMuted },
});
