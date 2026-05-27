import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import api from '../../services/api';

type Tab = 'sentiment' | 'engagement' | 'trending' | 'similar';

export default function MLAnalyticsScreen() {
  const [tab, setTab] = useState<Tab>('sentiment');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'sentiment', label: 'Sentiment', icon: '😊' },
    { key: 'engagement', label: 'Engagement', icon: '📈' },
    { key: 'trending', label: 'Trending', icon: '🔥' },
    { key: 'similar', label: 'Profiles', icon: '👥' },
  ];

  const endpoints: Record<Tab, string> = {
    sentiment: '/ml/sentiment',
    engagement: '/ml/engagement',
    trending: '/ml/trending-topics',
    similar: '/ml/similar-profiles',
  };

  useEffect(() => { fetchData(); }, [tab]);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await api.get(endpoints[tab]);
      setData(res.data.data);
    } catch { setData(null); }
    setLoading(false);
  }

  const renderSentiment = () => {
    const sm = data?.summary;
    return (
      <View>
        {sm && (
          <View style={s.metricsGrid}>
            <View style={[s.metricCard, { borderLeftColor: '#10b981' }]}>
              <Text style={s.metricNum}>{sm.positive}</Text>
              <Text style={s.metricLabel}>Positive</Text>
            </View>
            <View style={[s.metricCard, { borderLeftColor: '#f59e0b' }]}>
              <Text style={s.metricNum}>{sm.neutral}</Text>
              <Text style={s.metricLabel}>Neutral</Text>
            </View>
            <View style={[s.metricCard, { borderLeftColor: '#ef4444' }]}>
              <Text style={s.metricNum}>{sm.negative}</Text>
              <Text style={s.metricLabel}>Negative</Text>
            </View>
            <View style={[s.metricCard, { borderLeftColor: '#8b5cf6' }]}>
              <Text style={s.metricNum}>{sm.avgScore}</Text>
              <Text style={s.metricLabel}>Avg Score</Text>
            </View>
          </View>
        )}
        <Text style={s.sectionTitle}>⚠️ Flagged Posts</Text>
        {(data?.flagged || []).map((p: any, i: number) => (
          <View key={i} style={[s.card, { borderLeftWidth: 3, borderLeftColor: '#ef4444' }]}>
            <Text style={s.cardTitle}>{p.preview}...</Text>
            <View style={s.row}>
              <Text style={[s.sentimentBadge, { color: '#ef4444' }]}>Score: {p.score}</Text>
              <Text style={s.cardSub}>{p.confidence * 100}% confidence</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderEngagement = () => {
    const tiers = data?.tiers;
    return (
      <View>
        {tiers && (
          <View style={s.metricsGrid}>
            <View style={[s.metricCard, { borderLeftColor: '#f59e0b' }]}>
              <Text style={s.metricNum}>{tiers.champion}</Text>
              <Text style={s.metricLabel}>🏆 Champion</Text>
            </View>
            <View style={[s.metricCard, { borderLeftColor: '#10b981' }]}>
              <Text style={s.metricNum}>{tiers.active}</Text>
              <Text style={s.metricLabel}>⚡ Active</Text>
            </View>
            <View style={[s.metricCard, { borderLeftColor: '#6366f1' }]}>
              <Text style={s.metricNum}>{tiers.regular}</Text>
              <Text style={s.metricLabel}>📋 Regular</Text>
            </View>
            <View style={[s.metricCard, { borderLeftColor: '#6b7280' }]}>
              <Text style={s.metricNum}>{tiers.lurker}</Text>
              <Text style={s.metricLabel}>👀 Lurker</Text>
            </View>
          </View>
        )}
        <Text style={s.sectionTitle}>Top Users</Text>
        {(data?.users || []).slice(0, 15).map((u: any, i: number) => (
          <View key={i} style={s.card}>
            <View style={s.row}>
              <Text style={s.rank}>#{i + 1}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.cardTitle}>{u.fullName}</Text>
                <Text style={s.cardSub}>{u.role} · {u.tier}</Text>
              </View>
              <View style={[s.scoreBadge, {
                backgroundColor: u.tier === 'Champion' ? '#f59e0b' : u.tier === 'Active' ? '#10b981' : '#6b7280'
              }]}>
                <Text style={s.scoreText}>{u.engagementScore}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderTrending = () => (
    <View>
      <Text style={s.sectionTitle}>🔥 Trending Topics (Last 7 days)</Text>
      <Text style={s.cardSub}>{data?.totalPosts || 0} posts analyzed</Text>
      {(data?.topics || []).map((t: any, i: number) => (
        <View key={i} style={s.trendRow}>
          <Text style={s.rank}>#{i + 1}</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.trendWord}>{t.topic}</Text>
            <Text style={s.cardSub}>{t.mentions} mentions · {t.postsCount} posts</Text>
          </View>
          <View style={s.trendBar}>
            <View style={[s.trendFill, { width: `${Math.min(t.trendScore * 20, 100)}%` as any }]} />
          </View>
        </View>
      ))}
    </View>
  );

  const renderSimilar = () => (
    <View>
      <Text style={s.sectionTitle}>👥 People Like You</Text>
      {(data || []).map((p: any, i: number) => (
        <View key={i} style={s.card}>
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>{p.fullName}</Text>
              <Text style={s.cardSub}>{p.role} · {p.domain}</Text>
            </View>
            <View style={s.scoreBadge}><Text style={s.scoreText}>{p.similarity}%</Text></View>
          </View>
          {p.commonSkills?.length > 0 && (
            <View style={s.skillRow}>
              {p.commonSkills.slice(0, 4).map((sk: string, k: number) => (
                <View key={k} style={s.skillChip}><Text style={s.skillChipText}>{sk}</Text></View>
              ))}
            </View>
          )}
        </View>
      ))}
    </View>
  );

  const renderers: Record<Tab, () => React.JSX.Element> = {
    sentiment: renderSentiment, engagement: renderEngagement,
    trending: renderTrending, similar: renderSimilar,
  };

  return (
    <View style={s.container}>
      <Text style={s.header}>🤖 ML Analytics</Text>
      <View style={s.tabBar}>
        {tabs.map(t => (
          <TouchableOpacity key={t.key} style={[s.tab, tab === t.key && s.tabActive]} onPress={() => setTab(t.key)}>
            <Text style={s.tabIcon}>{t.icon}</Text>
            <Text style={[s.tabLabel, tab === t.key && s.tabLabelActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView style={s.body} contentContainerStyle={{ paddingBottom: 40 }}>
        {loading ? <ActivityIndicator size="large" color="#8b5cf6" style={{ marginTop: 40 }} /> : renderers[tab]()}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { fontSize: 24, fontWeight: '700', color: '#fff', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  tabBar: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 8 },
  tab: { flex: 1, paddingVertical: 10, marginHorizontal: 4, borderRadius: 12, backgroundColor: '#1e293b', alignItems: 'center' },
  tabActive: { backgroundColor: '#8b5cf6' },
  tabIcon: { fontSize: 18 },
  tabLabel: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
  tabLabelActive: { color: '#fff', fontWeight: '600' },
  body: { flex: 1, paddingHorizontal: 16 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  metricCard: { width: '47%' as any, backgroundColor: '#1e293b', borderRadius: 12, padding: 16, borderLeftWidth: 4 },
  metricNum: { fontSize: 28, fontWeight: '800', color: '#f1f5f9' },
  metricLabel: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  card: { backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 10 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#f1f5f9' },
  cardSub: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#f1f5f9', marginBottom: 8, marginTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rank: { fontSize: 16, fontWeight: '700', color: '#8b5cf6', width: 32 },
  scoreBadge: { backgroundColor: '#8b5cf6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  scoreText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  sentimentBadge: { fontSize: 14, fontWeight: '600' },
  trendRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1e293b', gap: 8 },
  trendWord: { fontSize: 15, fontWeight: '600', color: '#f1f5f9', textTransform: 'capitalize' },
  trendBar: { width: 60, height: 6, backgroundColor: '#334155', borderRadius: 3, overflow: 'hidden' },
  trendFill: { height: '100%', backgroundColor: '#f59e0b', borderRadius: 3 },
  skillRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 6 },
  skillChip: { backgroundColor: '#334155', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  skillChipText: { color: '#e2e8f0', fontSize: 11 },
});
