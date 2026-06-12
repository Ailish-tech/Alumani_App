import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet,
  RefreshControl, Alert,
} from 'react-native';
import { AppleAlert } from '../../components/AppleAlert';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { User, Role } from '../../types';
import api from '../../services/api';

const ROLE_COLORS: Record<Role, string> = {
  [Role.STUDENT]: '#0A66C2',
  [Role.ALUMNI]: '#057642',
  [Role.FACULTY]: '#5F4BB6',
  [Role.ADMIN]: '#004182',
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
    AppleAlert.alert(
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
              AppleAlert.alert('Done', `User has been ${action}ned.`);
            } catch (e: any) {
              AppleAlert.alert('Error', e.response?.data?.error || 'Failed');
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
        <Ionicons name="search" size={20} color={'#999999'} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          placeholderTextColor={'#999999'}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const roleColor = ROLE_COLORS[item.role] || '#0A66C2';
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
                  <Ionicons name={item.isBanned ? 'lock-open' : 'ban'} size={16} color={item.isBanned ? '#057642' : '#CC1016'} />
                  <Text style={[styles.banText, { color: item.isBanned ? '#057642' : '#CC1016' }]}>
                    {item.isBanned ? 'Unban' : 'Ban'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchUsers} tintColor={'#0A66C2'} />}
        contentContainerStyle={{ padding: Spacing.md }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={'#999999'} />
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F2EF' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: '#F3F2EF', borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    margin: Spacing.md, borderWidth: 1, borderColor: '#DCE6F1',
  },
  searchInput: { flex: 1, color: '#191919', fontSize: FontSize.md },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: '#DCE6F1',
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#E8F1FA',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
  },
  userName: { fontSize: FontSize.md, fontWeight: '600', color: '#191919' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 2 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.sm },
  roleText: { fontSize: FontSize.xs, fontWeight: '700' },
  domain: { fontSize: FontSize.xs, color: '#999999' },
  banBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm, backgroundColor: `${'#CC1016'}15`,
  },
  unbanBtn: { backgroundColor: `${'#057642'}15` },
  banText: { fontSize: FontSize.xs, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: Spacing.sm },
  emptyText: { fontSize: FontSize.md, color: '#999999' },
});
