import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
import api from '../../services/api';

const { width } = Dimensions.get('window');

type Tab = 'mentors' | 'skills' | 'career' | 'jobs' | 'events' | 'feed' | 'trending' | 'similar';

export default function SmartInsightsScreen() {
  const [tab, setTab] = useState<Tab>('mentors');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'mentors', label: 'Mentors', icon: '🤝' },
    { key: 'skills', label: 'Skill Gap', icon: '📊' },
    { key: 'career', label: 'Career', icon: '🚀' },
    { key: 'jobs', label: 'Jobs', icon: '💼' },
    { key: 'events', label: 'Events', icon: '📅' },
    { key: 'feed', label: 'Smart Feed', icon: '✨' },
    { key: 'trending', label: 'Trending', icon: '🔥' },
    { key: 'similar', label: 'Similar', icon: '👥' },
  ];

  const endpoints: Record<Tab, string> = {
    mentors: '/ml/mentor-match',
    skills: '/ml/skill-gap',
    career: '/ml/career-path',
    jobs: '/ml/job-match',
    events: '/ml/event-recommendations',
    feed: '/ml/personalized-feed',
    trending: '/ml/trending-topics',
    similar: '/ml/similar-profiles',
  };

  useEffect(() => {
    fetchData();
  }, [tab]);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await api.get(endpoints[tab]);
      setData(res.data.data);
    } catch { setData(null); }
    setLoading(false);
  }

  const renderMentors = () => (
    <View>
      {(data || []).map((m: any, i: number) => (
        <View key={i} style={s.card}>
          <View style={s.cardHeader}>
            <Text style={s.cardTitle}>{m.fullName}</Text>
            <View style={[s.scoreBadge, { backgroundColor: m.matchScore > 60 ? '#10b981' : m.matchScore > 30 ? '#f59e0b' : '#6b7280' }]}>
              <Text style={s.scoreText}>{m.matchScore}%</Text>
            </View>
          </View>
          <Text style={s.cardSub}>{m.domain} · ⭐ {m.reputationScore}</Text>
          {m.matchReasons?.map((r: string, j: number) => (
            <Text key={j} style={s.reason}>✓ {r}</Text>
          ))}
          <View style={s.skillRow}>
            {(m.skills || []).slice(0, 4).map((sk: string, k: number) => (
              <View key={k} style={s.skillChip}><Text style={s.skillChipText}>{sk}</Text></View>
            ))}
          </View>
        </View>
      ))}
      {(!data || data.length === 0) && <Text style={s.empty}>No mentor matches found</Text>}
    </View>
  );

  const renderSkills = () => (
    <View>
      {data?.marketFitScore !== undefined && (
        <View style={s.scoreCard}>
          <Text style={s.bigScore}>{data.marketFitScore}%</Text>
          <Text style={s.scoreLabel}>Market Fit Score</Text>
        </View>
      )}
      <Text style={s.sectionTitle}>🔴 Skill Gaps (High Demand)</Text>
      {(data?.gaps || []).map((g: any, i: number) => (
        <View key={i} style={s.gapRow}>
          <Text style={s.gapSkill}>{g.skill}</Text>
          <View style={[s.priorityBadge, { backgroundColor: g.priority === 'high' ? '#ef4444' : g.priority === 'medium' ? '#f59e0b' : '#6b7280' }]}>
            <Text style={s.priorityText}>{g.priority}</Text>
          </View>
          <Text style={s.demand}>{g.demand} jobs</Text>
        </View>
      ))}
      <Text style={[s.sectionTitle, { marginTop: 16 }]}>🟢 Your Strengths</Text>
      {(data?.strengths || []).map((st: any, i: number) => (
        <View key={i} style={s.gapRow}>
          <Text style={[s.gapSkill, { color: '#10b981' }]}>✓ {st.skill}</Text>
          <Text style={s.demand}>{st.demand} jobs</Text>
        </View>
      ))}
    </View>
  );

  const renderCareer = () => (
    <View>
      {(data?.insights || []).map((ins: string, i: number) => (
        <View key={i} style={s.insightRow}><Text style={s.insightText}>💡 {ins}</Text></View>
      ))}
      <Text style={s.sectionTitle}>Career Paths</Text>
      {(data?.paths || []).map((p: any, i: number) => (
        <View key={i} style={s.card}>
          <Text style={s.cardTitle}>{p.industry}</Text>
          <View style={s.row}>
            <Text style={s.cardSub}>{p.alumniCount} alumni</Text>
            <View style={s.scoreBadge}><Text style={s.scoreText}>{p.probability}%</Text></View>
          </View>
          {p.commonRoles?.length > 0 && (
            <Text style={s.reason}>Roles: {p.commonRoles.join(', ')}</Text>
          )}
        </View>
      ))}
    </View>
  );

  const renderJobs = () => (
    <View>
      {(data || []).map((j: any, i: number) => (
        <View key={i} style={s.card}>
          <View style={s.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>{j.title}</Text>
              <Text style={s.cardSub}>{j.company} · {j.location || 'Remote'}</Text>
            </View>
            <View style={[s.scoreBadge, { backgroundColor: j.matchScore > 50 ? '#10b981' : '#f59e0b' }]}>
              <Text style={s.scoreText}>{j.matchScore}%</Text>
            </View>
          </View>
          {j.matchReasons?.map((r: string, k: number) => (
            <Text key={k} style={s.reason}>✓ {r}</Text>
          ))}
        </View>
      ))}
    </View>
  );

  const renderEvents = () => (
    <View>
      {(data || []).map((e: any, i: number) => (
        <View key={i} style={s.card}>
          <View style={s.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>{e.title}</Text>
              <Text style={s.cardSub}>{e.date ? new Date(e.date).toLocaleDateString() : ''} · {e.location || ''}</Text>
            </View>
            <View style={[s.scoreBadge, { backgroundColor: '#8b5cf6' }]}>
              <Text style={s.scoreText}>{e.matchScore}pt</Text>
            </View>
          </View>
          {e.matchReasons?.map((r: string, k: number) => (
            <Text key={k} style={s.reason}>✓ {r}</Text>
          ))}
        </View>
      ))}
    </View>
  );

  const renderFeed = () => (
    <View>
      <Text style={s.sectionTitle}>✨ Posts Ranked For You</Text>
      {(data || []).length === 0 && <Text style={s.empty}>No posts to personalize yet</Text>}
      {(data || []).slice(0, 15).map((post: any, i: number) => (
        <View key={i} style={s.card}>
          <View style={s.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle} numberOfLines={2}>{post.textContent || 'Post'}</Text>
              <Text style={s.cardSub}>{post.authorName || post.authorId} · Score: {post.mlScore}</Text>
            </View>
            <View style={[s.scoreBadge, { backgroundColor: post.mlScore > 50 ? '#10b981' : post.mlScore > 25 ? '#f59e0b' : '#6b7280' }]}>
              <Text style={s.scoreText}>{post.mlScore}</Text>
            </View>
          </View>
          <View style={s.row}>
            <Text style={s.reason}>❤️ {post.likesCount || 0}  💬 {post.commentsCount || 0}</Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderTrending = () => (
    <View>
      <Text style={s.sectionTitle}>🔥 Trending Topics (Last 7 days)</Text>
      <Text style={s.cardSub}>{data?.totalPosts || 0} posts analyzed</Text>
      {(data?.topics || []).map((t: any, i: number) => (
        <View key={i} style={s.card}>
          <View style={s.cardHeader}>
            <Text style={s.rank}>#{i + 1}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>{t.topic}</Text>
              <Text style={s.cardSub}>{t.mentions} mentions · {t.postsCount} posts</Text>
            </View>
            <View style={[s.scoreBadge, { backgroundColor: '#f59e0b' }]}>
              <Text style={s.scoreText}>{t.trendScore}</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  const renderSimilar = () => (
    <View>
      <Text style={s.sectionTitle}>👥 People Like You</Text>
      {(data || []).length === 0 && <Text style={s.empty}>No similar profiles found</Text>}
      {(data || []).map((p: any, i: number) => (
        <View key={i} style={s.card}>
          <View style={s.cardHeader}>
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
    mentors: renderMentors, skills: renderSkills, career: renderCareer,
    jobs: renderJobs, events: renderEvents, feed: renderFeed,
    trending: renderTrending, similar: renderSimilar,
  };

  return (
    <View style={s.container}>
      <Text style={s.header}>🧠 AI Insights</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabBar}>
        {tabs.map(t => (
          <TouchableOpacity key={t.key} style={[s.tab, tab === t.key && s.tabActive]} onPress={() => setTab(t.key)}>
            <Text style={s.tabIcon}>{t.icon}</Text>
            <Text style={[s.tabLabel, tab === t.key && s.tabLabelActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <ScrollView style={s.body} contentContainerStyle={{ paddingBottom: 40 }}>
        {loading ? <ActivityIndicator size="large" color="#8b5cf6" style={{ marginTop: 40 }} /> : renderers[tab]()}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { fontSize: 24, fontWeight: '700', color: '#fff', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  tabBar: { flexGrow: 0, paddingHorizontal: 12, marginBottom: 8 },
  tab: { paddingHorizontal: 14, paddingVertical: 10, marginHorizontal: 4, borderRadius: 20, backgroundColor: '#1e293b', alignItems: 'center' },
  tabActive: { backgroundColor: '#8b5cf6' },
  tabIcon: { fontSize: 18 },
  tabLabel: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  tabLabelActive: { color: '#fff', fontWeight: '600' },
  body: { flex: 1, paddingHorizontal: 16 },
  card: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#f1f5f9' },
  cardSub: { fontSize: 13, color: '#94a3b8', marginTop: 4 },
  scoreBadge: { backgroundColor: '#8b5cf6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  scoreText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  reason: { fontSize: 13, color: '#a5b4fc', marginTop: 4 },
  skillRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 6 },
  skillChip: { backgroundColor: '#334155', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  skillChipText: { color: '#e2e8f0', fontSize: 12 },
  empty: { color: '#64748b', textAlign: 'center', marginTop: 40, fontSize: 15 },
  rank: { fontSize: 16, fontWeight: '700', color: '#8b5cf6', width: 32 },
  scoreCard: { alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 16, padding: 24, marginBottom: 16 },
  bigScore: { fontSize: 48, fontWeight: '800', color: '#8b5cf6' },
  scoreLabel: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#f1f5f9', marginBottom: 8 },
  gapRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  gapSkill: { flex: 1, fontSize: 14, color: '#f1f5f9', textTransform: 'capitalize' },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginRight: 8 },
  priorityText: { color: '#fff', fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  demand: { fontSize: 13, color: '#94a3b8' },
  insightRow: { backgroundColor: '#1e293b', borderRadius: 10, padding: 12, marginBottom: 8 },
  insightText: { color: '#e2e8f0', fontSize: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
});
