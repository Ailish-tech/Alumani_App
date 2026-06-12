import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import api from '../../services/api';


// LinkedIn-Inspired Colors
const LI = {
  blue: '#0A66C2', white: '#FFFFFF', bgLight: '#F3F2EF',
  border: '#DCE6F1', textDark: '#191919', textSecondary: '#666666',
  green: '#057642',
};export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = async () => { setLoading(true); try { const r = await api.get('/notifications'); setNotifications(r.data.data || []); } catch {} setLoading(false); };
  useEffect(() => { fetch(); }, []);

  const ICONS: Record<string, { icon: string; color: string }> = {
    LIKE: { icon: 'heart', color: '#DC3545' },
    COMMENT: { icon: 'chatbubble', color: '#0A66C2' },
    CONNECTION_REQUEST: { icon: 'person-add', color: '#0A66C2' },
    CONNECT_ACCEPT: { icon: 'checkmark-circle', color: '#057642' },
    MENTOR_REQUEST: { icon: 'school', color: '#E16745' },
    MESSAGE: { icon: 'chatbubbles', color: '#0A66C2' },
  };

  return (
    <View style={s.container}>
      <View style={s.header}><Text style={s.title}>Notifications</Text></View>
      <FlatList data={notifications} keyExtractor={i => i.id} contentContainerStyle={{ padding: 16, gap: 8 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetch} tintColor={'#0A66C2'} />}
        renderItem={({ item }) => {
          const cfg = ICONS[item.type] || { icon: 'notifications', color: '#999999' };
          return (
            <TouchableOpacity style={[s.card, !item.readStatus && s.unread]} activeOpacity={0.7}>
              <View style={[s.iconCircle, { backgroundColor: `${cfg.color}20` }]}>
                <Ionicons name={cfg.icon as any} size={20} color={cfg.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.notifText}>{item.type?.replace(/_/g, ' ')}</Text>
                <Text style={s.notifTime}>{new Date(item.createdAt).toLocaleString()}</Text>
              </View>
              {!item.readStatus && <View style={s.dot} />}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={<View style={s.empty}><Ionicons name="notifications-outline" size={48} color={'#999999'} /><Text style={s.emptyText}>No notifications</Text></View>}
      />
    </View>
  );
}
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F2EF' },
  header: { paddingHorizontal: 16, paddingTop: 56, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: '#191919' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 4, padding: 16, gap: 16, borderWidth: 1, borderColor: '#DCE6F1' },
  unread: { borderLeftWidth: 3, borderLeftColor: '#0A66C2' },
  iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  notifText: { fontSize: 15, color: '#191919', fontWeight: '600', textTransform: 'capitalize' },
  notifTime: { fontSize: 11, color: '#999999' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#0A66C2' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 16 },
  emptyText: { fontSize: 15, color: '#999999' },
});
