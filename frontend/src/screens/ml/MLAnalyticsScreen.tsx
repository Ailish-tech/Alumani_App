import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  StyleSheet, Platform, Animated, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const METRIC_WIDTH = (SCREEN_WIDTH - 52) / 2;

type Tab = 'sentiment' | 'engagement' | 'trending' | 'similar';

const TABS: { key: Tab; label: string; iosIcon: string; gradient: [string, string] }[] = [
  { key: 'sentiment', label: 'Sentiment', iosIcon: 'happy', gradient: ['#667EEA', '#764BA2'] },
  { key: 'engagement', label: 'Engage', iosIcon: 'pulse', gradient: ['#43E97B', '#38F9D7'] },
  { key: 'trending', label: 'Trending', iosIcon: 'flame', gradient: ['#FF6B6B', '#FFA07A'] },
  { key: 'similar', label: 'Profiles', iosIcon: 'people', gradient: ['#4FACFE', '#00F2FE'] },
];

const ENDPOINTS: Record<Tab, string> = {
  sentiment: '/ml/sentiment', engagement: '/ml/engagement',
  trending: '/ml/trending-topics', similar: '/ml/similar-profiles',
};

// Safe array extractor
function toArray(d: any): any[] {
  if (Array.isArray(d)) return d;
  if (d && typeof d === 'object') {
    for (const key of ['data', 'profiles', 'results', 'items', 'users']) {
      if (Array.isArray(d[key])) return d[key];
    }
  }
  return [];
}

// ─── Metric Card ────────────────────────────────────────────────────────────
function MetricCard({ value, label, gradient, icon }: { value: string | number; label: string; gradient: [string, string]; icon: string }) {
  return (
    <View style={s.metricCard}>
      <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.metricGradientBar} />
      <View style={s.metricContent}>
        <View style={s.metricIconRow}>
          <Ionicons name={icon as any} size={16} color={gradient[0]} />
        </View>
        <Text style={s.metricNum}>{value}</Text>
        <Text style={s.metricLabel}>{label}</Text>
      </View>
    </View>
  );
}

export default function MLAnalyticsScreen({ navigation }: any) {
  const [tab, setTab] = useState<Tab>('sentiment');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    fetchData();
  }, [tab]);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await api.get(ENDPOINTS[tab]);
      setData(res.data.data);
    } catch { setData(null); }
    setLoading(false);
    Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }

  // ── Sentiment ─────────────────────────────────────────────────────────────
  const renderSentiment = () => {
    const sm = data?.summary;
    return (
      <View style={s.contentGap}>
        {sm && (
          <View style={s.metricsGrid}>
            <MetricCard value={sm.positive} label="Positive" gradient={['#34C759', '#30D158']} icon="happy-outline" />
            <MetricCard value={sm.neutral} label="Neutral" gradient={['#FF9500', '#FFCC00']} icon="remove-circle-outline" />
            <MetricCard value={sm.negative} label="Negative" gradient={['#FF3B30', '#FF6B6B']} icon="sad-outline" />
            <MetricCard value={sm.avgScore} label="Avg Score" gradient={['#AF52DE', '#BF5AF2']} icon="analytics-outline" />
          </View>
        )}

        <Text style={s.sectionLabel}>Flagged Posts</Text>
        {(data?.flagged || []).map((p: any, i: number) => (
          <View key={i} style={s.card}>
            <View style={s.flagStripe} />
            <View style={{ padding: 16 }}>
              <Text style={s.cardTitle} numberOfLines={2}>{p.preview}...</Text>
              <View style={[s.cardRow, { marginTop: 8 }]}>
                <View style={s.scorePillRed}>
                  <Text style={s.scorePillRedText}>Score: {p.score}</Text>
                </View>
                <Text style={s.cardSub}>{Math.round(p.confidence * 100)}% confidence</Text>
              </View>
            </View>
          </View>
        ))}
        {(!data?.flagged || data.flagged.length === 0) && <Text style={s.emptyText}>No flagged posts</Text>}
      </View>
    );
  };

  // ── Engagement ────────────────────────────────────────────────────────────
  const renderEngagement = () => {
    const tiers = data?.tiers;
    return (
      <View style={s.contentGap}>
        {tiers && (
          <View style={s.metricsGrid}>
            <MetricCard value={tiers.champion} label="Champion" gradient={['#FF9500', '#FFCC00']} icon="trophy-outline" />
            <MetricCard value={tiers.active} label="Active" gradient={['#34C759', '#30D158']} icon="flash-outline" />
            <MetricCard value={tiers.regular} label="Regular" gradient={['#5856D6', '#AF52DE']} icon="clipboard-outline" />
            <MetricCard value={tiers.lurker} label="Lurker" gradient={['#8E8E93', '#C7C7CC']} icon="eye-outline" />
          </View>
        )}

        <Text style={s.sectionLabel}>Top Users</Text>
        {(data?.users || []).slice(0, 15).map((u: any, i: number) => {
          const tierColor = u.tier === 'Champion' ? '#FF9500' : u.tier === 'Active' ? '#34C759' : '#8E8E93';
          return (
            <View key={i} style={s.card}>
              <View style={{ padding: 16 }}>
                <View style={s.cardRow}>
                  <Text style={s.rankNum}>#{i + 1}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.cardTitle}>{u.fullName}</Text>
                    <Text style={s.cardSub}>{u.role} · {u.tier}</Text>
                  </View>
                  <View style={[s.tierPill, { backgroundColor: `${tierColor}18` }]}>
                    <Text style={[s.tierPillText, { color: tierColor }]}>{u.engagementScore}</Text>
                  </View>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  // ── Trending ──────────────────────────────────────────────────────────────
  const renderTrending = () => (
    <View style={s.contentGap}>
      <Text style={s.sectionLabel}>Trending Topics — Last 7 days</Text>
      <Text style={[s.cardSub, { marginBottom: 8 }]}>{data?.totalPosts || 0} posts analyzed</Text>
      {(data?.topics || []).map((t: any, i: number) => (
        <View key={i} style={s.card}>
          <View style={{ padding: 16 }}>
            <View style={s.cardRow}>
              <Text style={s.rankNum}>#{i + 1}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.cardTitle}>{t.topic}</Text>
                <Text style={s.cardSub}>{t.mentions} mentions · {t.postsCount} posts</Text>
              </View>
            </View>
            {/* Progress bar */}
            <View style={s.trendBarContainer}>
              <LinearGradient
                colors={['#FF6B6B', '#FFA07A']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={[s.trendBarFill, { width: `${Math.min(t.trendScore * 20, 100)}%` as any }]}
              />
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  // ── Similar Profiles ──────────────────────────────────────────────────────
  const renderSimilar = () => {
    const profiles = toArray(data);
    return (
      <View style={s.contentGap}>
        <Text style={s.sectionLabel}>People Like You</Text>
        {profiles.length === 0 && <Text style={s.emptyText}>No similar profiles found</Text>}
        {profiles.map((p: any, i: number) => (
          <View key={i} style={s.card}>
            <View style={{ padding: 16 }}>
              <View style={s.cardRow}>
                <LinearGradient colors={['#4FACFE', '#00F2FE']} style={s.avatarCircle}>
                  <Ionicons name="person" size={14} color="#fff" />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardTitle}>{p.fullName}</Text>
                  <Text style={s.cardSub}>{p.role} · {p.domain}</Text>
                </View>
                <View style={s.simPill}>
                  <Text style={s.simPillText}>{p.similarity}%</Text>
                </View>
              </View>
              {p.commonSkills?.length > 0 && (
                <View style={s.chipRow}>
                  {p.commonSkills.slice(0, 4).map((sk: string, k: number) => (
                    <View key={k} style={s.skillChip}><Text style={s.skillChipText}>{sk}</Text></View>
                  ))}
                </View>
              )}
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderers: Record<Tab, () => React.JSX.Element> = {
    sentiment: renderSentiment, engagement: renderEngagement,
    trending: renderTrending, similar: renderSimilar,
  };

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>ML Analytics</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Tab Bar */}
      <View style={s.tabBar}>
        {TABS.map(t => (
          <TouchableOpacity key={t.key} onPress={() => setTab(t.key)} style={{ flex: 1 }} activeOpacity={0.8}>
            {tab === t.key ? (
              <LinearGradient colors={t.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.tabPill}>
                <Ionicons name={t.iosIcon as any} size={15} color="#fff" />
                <Text style={s.tabTextActive}>{t.label}</Text>
              </LinearGradient>
            ) : (
              <View style={s.tabPillInactive}>
                <Ionicons name={t.iosIcon as any} size={15} color="#8E8E93" />
                <Text style={s.tabText}>{t.label}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Body */}
      <ScrollView style={s.body} contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 16 }}>
        {loading ? (
          <ActivityIndicator size="large" color="#667EEA" style={{ marginTop: 60 }} />
        ) : (
          <Animated.View style={{ opacity: fadeAnim }}>
            {renderers[tab]()}
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 56 : 44, paddingBottom: 10,
    backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(120,120,128,0.08)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1C1C1E' },

  // Tabs
  tabBar: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#FFF', gap: 6 },
  tabPill: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 9, borderRadius: 14 },
  tabPillInactive: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 9, borderRadius: 14, backgroundColor: 'rgba(120,120,128,0.08)' },
  tabText: { fontSize: 12, color: '#8E8E93', fontWeight: '500' },
  tabTextActive: { fontSize: 12, color: '#fff', fontWeight: '700' },

  body: { flex: 1 },
  contentGap: { gap: 10, marginTop: 16 },

  // Section label
  sectionLabel: { fontSize: 17, fontWeight: '700', color: '#1C1C1E', letterSpacing: -0.3, marginTop: 8, marginBottom: 4 },

  // Metrics
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metricCard: {
    width: METRIC_WIDTH, backgroundColor: '#FFF', borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  metricGradientBar: { height: 4 },
  metricContent: { padding: 14 },
  metricIconRow: { marginBottom: 8 },
  metricNum: { fontSize: 28, fontWeight: '800', color: '#1C1C1E', letterSpacing: -0.5 },
  metricLabel: { fontSize: 12, color: '#8E8E93', marginTop: 2, fontWeight: '500' },

  // Cards
  card: {
    backgroundColor: '#FFF', borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1C1C1E', letterSpacing: -0.2 },
  cardSub: { fontSize: 13, color: '#8E8E93', marginTop: 2 },

  // Flag stripe
  flagStripe: { height: 3, backgroundColor: '#FF3B30' },

  // Score pills
  scorePillRed: { backgroundColor: '#FF3B3018', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  scorePillRedText: { fontSize: 12, fontWeight: '700', color: '#FF3B30' },

  // Rank
  rankNum: { fontSize: 18, fontWeight: '800', color: '#667EEA', width: 36 },

  // Tier pill
  tierPill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10 },
  tierPillText: { fontSize: 13, fontWeight: '700' },

  // Trend bar
  trendBarContainer: { height: 6, backgroundColor: '#F2F2F7', borderRadius: 3, marginTop: 10, overflow: 'hidden' },
  trendBarFill: { height: '100%', borderRadius: 3 },

  // Avatar
  avatarCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  // Similarity pill
  simPill: { backgroundColor: '#4FACFE18', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  simPillText: { fontSize: 13, fontWeight: '700', color: '#4FACFE' },

  // Chips
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, gap: 6 },
  skillChip: { backgroundColor: '#F2F2F7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  skillChipText: { color: '#3C3C43', fontSize: 12, fontWeight: '500' },

  // Empty
  emptyText: { fontSize: 15, color: '#8E8E93', textAlign: 'center', marginTop: 40 },
});
