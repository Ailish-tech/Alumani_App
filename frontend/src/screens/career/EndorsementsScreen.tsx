import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';


// LinkedIn-Inspired Colors
const LI = {
  blue: '#0A66C2', white: '#FFF', bgLight: '#F2F2F7',
  border: '#E5E5EA', textDark: '#1C1C1E', textSecondary: '#8E8E93',
  green: '#057642',
};interface Endorsement {
  id: string;
  skill: string;
  endorserId: string;
  endorserName: string;
  createdAt: string;
}

export default function EndorsementsScreen({ route }: any) {
  const { userId } = route.params;
  const { user: currentUser } = useAuthStore();
  const [endorsements, setEndorsements] = useState<Endorsement[]>([]);
  const [loading, setLoading] = useState(true);
  const isOwnProfile = currentUser?.id === userId;

  const loadEndorsements = useCallback(async () => {
    try {
      const res = await api.get(`/endorsements/${userId}`);
      setEndorsements(res.data.data || []);
    } catch {
      // Endpoint may not exist yet — show empty state gracefully
      setEndorsements([]);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { loadEndorsements(); }, [loadEndorsements]);

  if (loading) {
    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator size="large" color={'#0A66C2'} />
      </View>
    );
  }

  const groupedBySkill = endorsements.reduce<Record<string, Endorsement[]>>((acc, e) => {
    acc[e.skill] = [...(acc[e.skill] || []), e];
    return acc;
  }, {});

  return (
    <View style={s.container}>
      {/* Summary Bar */}
      <View style={s.summaryBar}>
        <Ionicons name="thumbs-up" size={18} color={'#0A66C2'} />
        <Text style={s.summaryText}>
          {endorsements.length} endorsement{endorsements.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {endorsements.length === 0 ? (
        <View style={s.emptyState}>
          <Ionicons name="ribbon-outline" size={52} color={'#C7C7CC'} />
          <Text style={s.emptyTitle}>No Endorsements Yet</Text>
          <Text style={s.emptySubtext}>
            {isOwnProfile
              ? 'Ask your connections to endorse your skills!'
              : 'Be the first to endorse this person\'s skills.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={Object.entries(groupedBySkill)}
          keyExtractor={([skill]) => skill}
          contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}
          renderItem={({ item: [skill, endorsers] }) => (
            <View style={s.card}>
              <View style={s.cardHeader}>
                <Ionicons name="star" size={16} color={'#E16745'} />
                <Text style={s.skillName}>{skill}</Text>
                <View style={s.countBadge}>
                  <Text style={s.countText}>{endorsers.length}</Text>
                </View>
              </View>
              {endorsers.map((e) => (
                <View key={e.id} style={s.endorserRow}>
                  <View style={s.miniAvatar}>
                    <Text style={s.miniAvatarText}>
                      {e.endorserName?.charAt(0)?.toUpperCase() || '?'}
                    </Text>
                  </View>
                  <Text style={s.endorserName}>{e.endorserName}</Text>
                </View>
              ))}
            </View>
          )}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  loadingContainer: { flex: 1, backgroundColor: '#F2F2F7', alignItems: 'center', justifyContent: 'center' },
  summaryBar: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 16, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: '#E5E5EA',
  },
  summaryText: { fontSize: 13, color: '#8E8E93', fontWeight: '600' },
  card: {
    backgroundColor: '#FFF', borderRadius: 12,
    padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    gap: 8,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  skillName: { fontSize: 15, fontWeight: '700', color: '#1C1C1E', flex: 1 },
  countBadge: {
    backgroundColor: '#E8F1FA', paddingHorizontal: 8,
    paddingVertical: 2, borderRadius: 999,
  },
  countText: { fontSize: 11, fontWeight: '700', color: '#0A66C2' },
  endorserRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 24 },
  miniAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#E8F1FA', alignItems: 'center', justifyContent: 'center',
  },
  miniAvatarText: { fontSize: 11, fontWeight: '700', color: '#0A66C2' },
  endorserName: { fontSize: 13, color: '#8E8E93' },
  emptyState: { alignItems: 'center', paddingTop: 80, gap: 8, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#8E8E93' },
  emptySubtext: { fontSize: 13, color: '#C7C7CC', textAlign: 'center', lineHeight: 20 },
});
