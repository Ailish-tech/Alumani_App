import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import api from '../../services/api';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = async () => { setLoading(true); try { const r = await api.get('/notifications'); setNotifications(r.data.data || []); } catch {} setLoading(false); };
  useEffect(() => { fetch(); }, []);

  const ICONS: Record<string, { icon: string; color: string }> = {
    LIKE: { icon: 'heart', color: Colors.like },
    COMMENT: { icon: 'chatbubble', color: Colors.info },
    CONNECTION_REQUEST: { icon: 'person-add', color: Colors.primary },
    CONNECT_ACCEPT: { icon: 'checkmark-circle', color: Colors.success },
    MENTOR_REQUEST: { icon: 'school', color: Colors.warning },
    MESSAGE: { icon: 'chatbubbles', color: Colors.accent },
  };

  return (
    <View style={s.container}>
      <View style={s.header}><Text style={s.title}>Notifications</Text></View>
      <FlatList data={notifications} keyExtractor={i => i.id} contentContainerStyle={{ padding: Spacing.md, gap: Spacing.sm }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetch} tintColor={Colors.primary} />}
        renderItem={({ item }) => {
          const cfg = ICONS[item.type] || { icon: 'notifications', color: Colors.textMuted };
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
        ListEmptyComponent={<View style={s.empty}><Ionicons name="notifications-outline" size={48} color={Colors.textMuted} /><Text style={s.emptyText}>No notifications</Text></View>}
      />
    </View>
  );
}
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDark },
  header: { paddingHorizontal: Spacing.md, paddingTop: 56, paddingBottom: Spacing.sm },
  title: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgCard, borderRadius: BorderRadius.sm, padding: Spacing.md, gap: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  unread: { borderLeftWidth: 3, borderLeftColor: Colors.primary },
  iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  notifText: { fontSize: FontSize.md, color: Colors.textPrimary, fontWeight: '600', textTransform: 'capitalize' },
  notifTime: { fontSize: FontSize.xs, color: Colors.textMuted },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  empty: { alignItems: 'center', paddingTop: 80, gap: Spacing.md },
  emptyText: { fontSize: FontSize.md, color: Colors.textMuted },
});
