import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import api from '../../services/api';
import { User, Role } from '../../types';
import { useNavigation } from '@react-navigation/native';

const ROLE_COLORS: Record<string, string> = {
  STUDENT: Colors.roleStudent, ALUMNI: Colors.roleAlumni,
  FACULTY: Colors.roleFaculty, ADMIN: Colors.roleAdmin,
};

export default function AlumniSearchScreen() {
  const navigation = useNavigation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>('');

  const search = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (roleFilter) params.set('role', roleFilter);
      const res = await api.get(`/connections/search?${params.toString()}`);
      setResults(res.data.data || []);
    } catch { setResults([]); }
    setIsLoading(false);
  }, [query, roleFilter]);

  const renderUser = ({ item }: { item: User }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.8}
      onPress={() => navigation.navigate('UserProfile' as any, { userId: item.id })}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.fullName?.charAt(0)?.toUpperCase() || '?'}</Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.name}>{item.fullName}</Text>
        <View style={styles.metaRow}>
          <View style={[styles.roleBadge, { backgroundColor: `${ROLE_COLORS[item.role] || Colors.primary}20` }]}>
            <Text style={[styles.roleText, { color: ROLE_COLORS[item.role] || Colors.primary }]}>{item.role}</Text>
          </View>
          {item.domain ? <Text style={styles.domain}>{item.domain}</Text> : null}
        </View>
        {item.skills?.length > 0 && (
          <View style={styles.skillsRow}>
            {item.skills.slice(0, 3).map((s, i) => (
              <View key={i} style={styles.skillChip}>
                <Text style={styles.skillText}>{s}</Text>
              </View>
            ))}
            {item.skills.length > 3 && <Text style={styles.moreSkills}>+{item.skills.length - 3}</Text>}
          </View>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heroTitle}>Search Alumni</Text>
      </View>

      {/* Search bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={Colors.textMuted} />
          <TextInput style={styles.searchInput} placeholder="Search by name, domain, skills..."
            placeholderTextColor={Colors.textMuted} value={query}
            onChangeText={setQuery} onSubmitEditing={search} returnKeyType="search" />
        </View>
        <TouchableOpacity style={styles.searchBtn} onPress={search}>
          <Ionicons name="search" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Role filter */}
      <View style={styles.filterRow}>
        {['', 'ALUMNI', 'FACULTY', 'STUDENT'].map(r => (
          <TouchableOpacity key={r} style={[styles.chip, roleFilter === r && styles.chipActive]}
            onPress={() => { setRoleFilter(r); }}>
            <Text style={[styles.chipText, roleFilter === r && styles.chipTextActive]}>
              {r || 'All'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={i => i.id}
          renderItem={renderUser}
          contentContainerStyle={{ padding: Spacing.md, gap: Spacing.sm }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>Search for alumni, faculty, or students</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDark },
  header: { paddingHorizontal: Spacing.md, paddingTop: 56, paddingBottom: Spacing.sm },
  heroTitle: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary },
  searchRow: { flexDirection: 'row', paddingHorizontal: Spacing.md, gap: Spacing.sm, marginBottom: Spacing.sm },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.bgInput, borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  searchInput: { flex: 1, color: Colors.textPrimary, fontSize: FontSize.md, paddingVertical: Spacing.sm },
  searchBtn: { width: 44, height: 44, borderRadius: BorderRadius.sm, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  filterRow: { flexDirection: 'row', paddingHorizontal: Spacing.md, gap: Spacing.sm, marginBottom: Spacing.sm },
  chip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primaryGlow, borderColor: Colors.primary },
  chipText: { fontSize: FontSize.sm, color: Colors.textMuted },
  chipTextActive: { color: Colors.primary, fontWeight: '600' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, gap: Spacing.md },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primaryGlow, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.primary },
  cardContent: { flex: 1, gap: 4 },
  name: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  roleBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 1, borderRadius: BorderRadius.full },
  roleText: { fontSize: FontSize.xs, fontWeight: '600' },
  domain: { fontSize: FontSize.xs, color: Colors.textSecondary },
  skillsRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  skillChip: { backgroundColor: Colors.bgDark, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  skillText: { fontSize: 10, color: Colors.textMuted },
  moreSkills: { fontSize: 10, color: Colors.primary },
  empty: { alignItems: 'center', paddingTop: 80, gap: Spacing.md },
  emptyText: { fontSize: FontSize.md, color: Colors.textMuted },
});
