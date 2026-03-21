import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { Connection, ConnectionStatus } from '../../types';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function ConnectionsScreen() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuthStore();

  const fetchConnections = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/connections');
      setConnections(res.data.data);
    } catch {}
    setIsLoading(false);
  };

  useEffect(() => { fetchConnections(); }, []);

  const respondToConnection = async (otherUserId: string, status: 'ACCEPTED' | 'REJECTED') => {
    try {
      await api.put(`/connections/${otherUserId}/respond`, { status });
      fetchConnections();
      if (status === 'ACCEPTED') {
        Alert.alert('Connected!', 'A chat room has been created. You can now message each other.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error || 'Failed');
    }
  };

  const getOtherUserId = (conn: Connection) =>
    conn.userA === user?.id ? conn.userB : conn.userA;

  const isPendingForMe = (conn: Connection) =>
    conn.status === ConnectionStatus.PENDING && conn.requesterId !== user?.id;

  const statusColor = (s: ConnectionStatus) => {
    if (s === ConnectionStatus.ACCEPTED) return Colors.success;
    if (s === ConnectionStatus.PENDING) return Colors.warning;
    return Colors.error;
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={connections}
        keyExtractor={(item) => `${item.userA}-${item.userB}`}
        renderItem={({ item }) => {
          const otherId = getOtherUserId(item);
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.avatar}>
                  <Ionicons name="person" size={20} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.userName}>{otherId.substring(0, 16)}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: `${statusColor(item.status)}20` }]}>
                    <View style={[styles.statusDot, { backgroundColor: statusColor(item.status) }]} />
                    <Text style={[styles.statusText, { color: statusColor(item.status) }]}>{item.status}</Text>
                  </View>
                </View>
              </View>

              {isPendingForMe(item) && (
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: Colors.success }]}
                    onPress={() => respondToConnection(otherId, 'ACCEPTED')}
                  >
                    <Ionicons name="checkmark" size={18} color="#fff" />
                    <Text style={styles.actionText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: Colors.error }]}
                    onPress={() => respondToConnection(otherId, 'REJECTED')}
                  >
                    <Ionicons name="close" size={18} color="#fff" />
                    <Text style={styles.actionText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchConnections} tintColor={Colors.primary} />}
        contentContainerStyle={{ padding: Spacing.md }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="link-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No connections yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDark },
  card: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primaryGlow,
    alignItems: 'center', justifyContent: 'center',
  },
  userName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.full, alignSelf: 'flex-start', marginTop: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: FontSize.xs, fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md,
  },
  actionText: { color: '#fff', fontWeight: '700', fontSize: FontSize.sm },
  emptyState: { alignItems: 'center', paddingTop: 80, gap: Spacing.sm },
  emptyText: { fontSize: FontSize.lg, color: Colors.textSecondary, fontWeight: '600' },
});
