import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert,
} from 'react-native';
import { AppleAlert } from '../../components/AppleAlert';
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
        AppleAlert.alert('Connected', 'A chat room has been created. You can now message each other.');
      }
    } catch (e: any) {
      AppleAlert.alert('Error', e.response?.data?.error || 'Failed');
    }
  };

  const getOtherUserId = (conn: Connection) =>
    conn.userA === user?.id ? conn.userB : conn.userA;

  const isPendingForMe = (conn: Connection) =>
    conn.status === ConnectionStatus.PENDING && conn.requesterId !== user?.id;

  const statusColor = (s: ConnectionStatus) => {
    if (s === ConnectionStatus.ACCEPTED) return '#057642';
    if (s === ConnectionStatus.PENDING) return '#E16745';
    return '#CC1016';
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
                  <Ionicons name="person" size={20} color={'#0A66C2'} />
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
                    style={[styles.actionBtn, { backgroundColor: '#057642' }]}
                    onPress={() => respondToConnection(otherId, 'ACCEPTED')}
                  >
                    <Ionicons name="checkmark" size={18} color="#fff" />
                    <Text style={styles.actionText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#CC1016' }]}
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
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchConnections} tintColor={'#0A66C2'} />}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="link-outline" size={48} color={'#999999'} />
            <Text style={styles.emptyText}>No connections yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F2EF' },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 12,
    padding: 16, marginBottom: 8,
    borderWidth: 1, borderColor: '#DCE6F1',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#E8F1FA',
    alignItems: 'center', justifyContent: 'center',
  },
  userName: { fontSize: 15, fontWeight: '600', color: '#191919' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, alignSelf: 'flex-start', marginTop: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: 8, borderRadius: 8,
  },
  actionText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  emptyState: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyText: { fontSize: 17, color: '#666666', fontWeight: '600' },
});
