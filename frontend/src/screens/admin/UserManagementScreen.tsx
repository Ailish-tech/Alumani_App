import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet,
  RefreshControl, Alert,
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

export default function UserManagementScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // Fetching mentors as a proxy for user list — in production this would be a dedicated admin endpoint
      const res = await api.get('/admin/top-mentors');
      setUsers(res.data.data);
    } catch {}
    setIsLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const toggleBan = async (userId: string, isBanned: boolean) => {
    const action = isBanned ? 'unban' : 'ban';
    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
      `Are you sure you want to ${action} this user?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          style: isBanned ? 'default' : 'destructive',
          onPress: async () => {
            try {
              await api.put(`/admin/${action}/${userId}`);
              setUsers((u) => u.map((usr) => usr.id === userId ? { ...usr, isBanned: !isBanned } : usr));
              Alert.alert('Done', `User has been ${action}ned.`);
            } catch (e: any) {
              Alert.alert('Error', e.response?.data?.error || 'Failed');
            }
          },
        },
      ]
    );
  };

  const filtered = users.filter((u) =>
    (u.fullName || u.id).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const roleColor = ROLE_COLORS[item.role] || Colors.primary;
          return (
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <View style={[styles.avatar, { borderColor: roleColor }]}>
                  <Ionicons name="person" size={18} color={roleColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.userName}>{item.fullName || item.id.substring(0, 16)}</Text>
                  <View style={styles.metaRow}>
                    <View style={[styles.roleBadge, { backgroundColor: `${roleColor}20` }]}>
                      <Text style={[styles.roleText, { color: roleColor }]}>{item.role}</Text>
                    </View>
                    <Text style={styles.domain}>{item.domain || '--'}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.banBtn, item.isBanned && styles.unbanBtn]}
                  onPress={() => toggleBan(item.id, item.isBanned)}
                >
                  <Ionicons name={item.isBanned ? 'lock-open' : 'ban'} size={16} color={item.isBanned ? Colors.success : Colors.error} />
                  <Text style={[styles.banText, { color: item.isBanned ? Colors.success : Colors.error }]}>
                    {item.isBanned ? 'Unban' : 'Ban'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchUsers} tintColor={Colors.primary} />}
        contentContainerStyle={{ padding: Spacing.md }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDark },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.bgInput, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    margin: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: { flex: 1, color: Colors.textPrimary, fontSize: FontSize.md },
  card: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primaryGlow,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
  },
  userName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 2 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.sm },
  roleText: { fontSize: FontSize.xs, fontWeight: '700' },
  domain: { fontSize: FontSize.xs, color: Colors.textMuted },
  banBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm, backgroundColor: `${Colors.error}15`,
  },
  unbanBtn: { backgroundColor: `${Colors.success}15` },
  banText: { fontSize: FontSize.xs, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: Spacing.sm },
  emptyText: { fontSize: FontSize.md, color: Colors.textMuted },
});
