import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import api from '../../services/api';
import { User, Role } from '../../types';
import { useNavigation } from '@react-navigation/native';


// LinkedIn-Inspired Colors
const LI = {
  blue: '#0A66C2', white: '#FFF', bgLight: '#F2F2F7',
  border: '#E5E5EA', textDark: '#1C1C1E', textSecondary: '#8E8E93',
  green: '#057642',
};const ROLE_COLORS: Record<string, string> = {
  STUDENT: '#0A66C2', ALUMNI: '#057642',
  FACULTY: '#5F4BB6', ADMIN: '#004182',
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
          <View style={[styles.roleBadge, { backgroundColor: `${ROLE_COLORS[item.role] || '#0A66C2'}20` }]}>
            <Text style={[styles.roleText, { color: ROLE_COLORS[item.role] || '#0A66C2' }]}>{item.role}</Text>
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
      <Ionicons name="chevron-forward" size={20} color={'#C7C7CC'} />
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
          <Ionicons name="search" size={18} color={'#C7C7CC'} />
          <TextInput style={styles.searchInput} placeholder="Search by name, domain, skills..."
            placeholderTextColor={'#C7C7CC'} value={query}
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
        <ActivityIndicator size="large" color={'#0A66C2'} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={i => i.id}
          renderItem={renderUser}
          contentContainerStyle={{ padding: 16, gap: 8 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={48} color={'#C7C7CC'} />
              <Text style={styles.emptyText}>Search for alumni, faculty, or students</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { paddingHorizontal: 16, paddingTop: 56, paddingBottom: 8 },
  heroTitle: { fontSize: 24, fontWeight: '800', color: '#1C1C1E' },
  searchRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F2F2F7', borderRadius: 16, paddingHorizontal: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  searchInput: { flex: 1, color: '#1C1C1E', fontSize: 15, paddingVertical: 8 },
  searchBtn: { width: 44, height: 44, borderRadius: 16, backgroundColor: '#0A66C2', alignItems: 'center', justifyContent: 'center' },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 4, borderRadius: 999, backgroundColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  chipActive: { backgroundColor: '#E8F1FA', borderColor: '#0A66C2' },
  chipText: { fontSize: 13, color: '#C7C7CC' },
  chipTextActive: { color: '#0A66C2', fontWeight: '600' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, gap: 16 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#E8F1FA', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 17, fontWeight: '700', color: '#0A66C2' },
  cardContent: { flex: 1, gap: 4 },
  name: { fontSize: 15, fontWeight: '700', color: '#1C1C1E' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 1, borderRadius: 999 },
  roleText: { fontSize: 11, fontWeight: '600' },
  domain: { fontSize: 11, color: '#8E8E93' },
  skillsRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  skillChip: { backgroundColor: '#F2F2F7', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 16 },
  skillText: { fontSize: 10, color: '#C7C7CC' },
  moreSkills: { fontSize: 10, color: '#0A66C2' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 16 },
  emptyText: { fontSize: 15, color: '#C7C7CC' },
});
