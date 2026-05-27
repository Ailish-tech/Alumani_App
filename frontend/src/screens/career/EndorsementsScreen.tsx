import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

interface Endorsement {
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
        <ActivityIndicator size="large" color={Colors.primary} />
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
        <Ionicons name="thumbs-up" size={18} color={Colors.primary} />
        <Text style={s.summaryText}>
          {endorsements.length} endorsement{endorsements.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {endorsements.length === 0 ? (
        <View style={s.emptyState}>
          <Ionicons name="ribbon-outline" size={52} color={Colors.textMuted} />
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
          contentContainerStyle={{ padding: Spacing.md, gap: Spacing.md, paddingBottom: 40 }}
          renderItem={({ item: [skill, endorsers] }) => (
            <View style={s.card}>
              <View style={s.cardHeader}>
                <Ionicons name="star" size={16} color={Colors.warning} />
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
  container: { flex: 1, backgroundColor: Colors.bgDark },
  loadingContainer: { flex: 1, backgroundColor: Colors.bgDark, alignItems: 'center', justifyContent: 'center' },
  summaryBar: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  summaryText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600' },
  card: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
    gap: Spacing.sm,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  skillName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
  countBadge: {
    backgroundColor: Colors.primaryGlow, paddingHorizontal: Spacing.sm,
    paddingVertical: 2, borderRadius: BorderRadius.full,
  },
  countText: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.primary },
  endorserRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingLeft: Spacing.lg },
  miniAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.primaryGlow, alignItems: 'center', justifyContent: 'center',
  },
  miniAvatarText: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.primary },
  endorserName: { fontSize: FontSize.sm, color: Colors.textSecondary },
  emptyState: { alignItems: 'center', paddingTop: 80, gap: Spacing.sm, paddingHorizontal: Spacing.xl },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textSecondary },
  emptySubtext: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
});
