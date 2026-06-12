import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import api from '../../services/api';

const ACTION_ICONS: Record<string, { icon: string; color: string }> = {
  BAN_USER: { icon: 'ban', color: '#FF5252' },
  UNBAN_USER: { icon: 'checkmark-circle', color: '#00E676' },
  CHANGE_ROLE: { icon: 'swap-horizontal', color: '#448AFF' },
  DELETE_POST: { icon: 'trash', color: '#E040FB' },
  DELETE_EVENT: { icon: 'calendar-clear', color: '#FF9800' },
  DELETE_JOB: { icon: 'briefcase', color: '#FF6E40' },
  DELETE_GROUP: { icon: 'people', color: '#FFD600' },
  DELETE_STORY: { icon: 'book', color: '#FF9800' },
  REVIEW_REPORT: { icon: 'flag', color: '#FF5252' },
  CREATE_ANNOUNCEMENT: { icon: 'megaphone', color: '#00BCD4' },
  DELETE_ANNOUNCEMENT: { icon: 'megaphone', color: '#9E9E9E' },
};

export default function AdminAuditLogScreen() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = async () => { setLoading(true); try { const r = await api.get('/admin/audit-log'); setLogs(r.data.data || []); } catch {} setLoading(false); };
  useEffect(() => { fetch(); }, []);

  return (
    <View style={s.container}>
      <View style={s.header}><Text style={s.title}>📋 Audit Log</Text></View>
      <FlatList data={logs} keyExtractor={i => i.id} contentContainerStyle={{ padding: 16, gap: 8 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetch} tintColor={'#004182'} />}
        renderItem={({ item }) => {
          const cfg = ACTION_ICONS[item.action] || { icon: 'ellipse', color: '#999999' };
          return (
            <View style={s.logCard}>
              <View style={[s.iconCircle, { backgroundColor: `${cfg.color}20` }]}>
                <Ionicons name={cfg.icon as any} size={18} color={cfg.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.action}>{item.action?.replace(/_/g, ' ')}</Text>
                <Text style={s.meta}>{item.targetType} • {item.targetId?.substring(0, 16)}...</Text>
                {item.details ? <Text style={s.details}>{item.details}</Text> : null}
                <Text style={s.time}>{new Date(item.timestamp).toLocaleString()}</Text>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={<View style={s.empty}><Ionicons name="clipboard-outline" size={48} color={'#999999'} /><Text style={s.emptyText}>No audit logs</Text></View>}
      />
    </View>
  );
}
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F2EF' },
  header: { paddingHorizontal: 16, paddingTop: 56, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: '#191919' },
  logCard: { flexDirection: 'row', gap: 16, backgroundColor: '#FFFFFF', borderRadius: 4, padding: 16, borderWidth: 1, borderColor: '#DCE6F1' },
  iconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  action: { fontSize: 13, fontWeight: '700', color: '#191919', textTransform: 'capitalize' },
  meta: { fontSize: 11, color: '#999999' },
  details: { fontSize: 11, color: '#0A66C2', fontStyle: 'italic' },
  time: { fontSize: 10, color: '#999999' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyText: { fontSize: 15, color: '#999999' },
});
