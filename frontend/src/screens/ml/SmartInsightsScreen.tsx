import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  StyleSheet, Platform, Animated, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Tab = 'mentors' | 'skills' | 'career' | 'jobs' | 'events' | 'feed' | 'trending' | 'similar';

const TABS: { key: Tab; label: string; icon: string; iosIcon: string; gradient: [string, string] }[] = [
  { key: 'mentors', label: 'Mentors', icon: '🤝', iosIcon: 'people', gradient: ['#667EEA', '#764BA2'] },
  { key: 'skills', label: 'Skill Gap', icon: '📊', iosIcon: 'bar-chart', gradient: ['#F093FB', '#F5576C'] },
  { key: 'career', label: 'Career', icon: '🚀', iosIcon: 'rocket', gradient: ['#4FACFE', '#00F2FE'] },
  { key: 'jobs', label: 'Jobs', icon: '💼', iosIcon: 'briefcase', gradient: ['#43E97B', '#38F9D7'] },
  { key: 'events', label: 'Events', icon: '📅', iosIcon: 'calendar', gradient: ['#FA709A', '#FEE140'] },
  { key: 'feed', label: 'Feed', icon: '✨', iosIcon: 'sparkles', gradient: ['#A18CD1', '#FBC2EB'] },
  { key: 'trending', label: 'Trending', icon: '🔥', iosIcon: 'flame', gradient: ['#FF6B6B', '#FFA07A'] },
  { key: 'similar', label: 'Similar', icon: '👥', iosIcon: 'person-circle', gradient: ['#667EEA', '#764BA2'] },
];

const ENDPOINTS: Record<Tab, string> = {
  mentors: '/ml/mentor-match', skills: '/ml/skill-gap', career: '/ml/career-path',
  jobs: '/ml/job-match', events: '/ml/event-recommendations', feed: '/ml/personalized-feed',
  trending: '/ml/trending-topics', similar: '/ml/similar-profiles',
};

// ─── Apple Card Component ───────────────────────────────────────────────────
function AppleCard({ children, style }: { children: React.ReactNode; style?: any }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={[s.appleCard, style, { transform: [{ scale: scaleAnim }] }]}>
      {children}
    </Animated.View>
  );
}

function ScorePill({ score, color }: { score: number | string; color?: string }) {
  const bg = color || (Number(score) > 60 ? '#34C759' : Number(score) > 30 ? '#FF9500' : '#8E8E93');
  return (
    <View style={[s.scorePill, { backgroundColor: `${bg}18` }]}>
      <Text style={[s.scorePillText, { color: bg }]}>{score}%</Text>
    </View>
  );
}

function SkillChip({ label }: { label: string }) {
  return (
    <View style={s.skillChip}>
      <Text style={s.skillChipText}>{label}</Text>
    </View>
  );
}

// Safely coerce API response to array — handles object responses
function toArray(d: any): any[] {
  if (Array.isArray(d)) return d;
  if (d && typeof d === 'object') {
    // Check common wrapper keys
    for (const key of ['data', 'profiles', 'results', 'items', 'matches']) {
      if (Array.isArray(d[key])) return d[key];
    }
  }
  return [];
}

export default function SmartInsightsScreen({ navigation }: any) {
  const [tab, setTab] = useState<Tab>('mentors');
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

  const activeTab = TABS.find(t => t.key === tab)!;

  // ── Content Renderers ─────────────────────────────────────────────────────
  const renderMentors = () => (
    <View style={s.contentGap}>
      {toArray(data).map((m: any, i: number) => (
        <AppleCard key={i}>
          <View style={s.cardRow}>
            <View style={s.avatarCircle}>
              <Ionicons name="person" size={18} color="#667EEA" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>{m.fullName}</Text>
              <Text style={s.cardSub}>{m.domain} · ⭐ {m.reputationScore}</Text>
            </View>
            <ScorePill score={m.matchScore} />
          </View>
          {m.matchReasons?.map((r: string, j: number) => (
            <Text key={j} style={s.reasonText}>✓ {r}</Text>
          ))}
          {m.skills?.length > 0 && (
            <View style={s.chipRow}>
              {m.skills.slice(0, 4).map((sk: string, k: number) => <SkillChip key={k} label={sk} />)}
            </View>
          )}
        </AppleCard>
      ))}
      {toArray(data).length === 0 && <Text style={s.emptyText}>No mentor matches found</Text>}
    </View>
  );

  const renderSkills = () => (
    <View style={s.contentGap}>
      {data?.marketFitScore !== undefined && (
        <View style={s.heroScoreCard}>
          <LinearGradient colors={['#667EEA', '#764BA2']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.heroScoreGradient}>
            <Text style={s.heroScoreNum}>{data.marketFitScore}%</Text>
            <Text style={s.heroScoreLabel}>Market Fit Score</Text>
          </LinearGradient>
        </View>
      )}
      <Text style={s.sectionLabel}>Skill Gaps — High Demand</Text>
      {(data?.gaps || []).map((g: any, i: number) => (
        <View key={i} style={s.gapRow}>
          <View style={[s.gapDot, { backgroundColor: g.priority === 'high' ? '#FF3B30' : g.priority === 'medium' ? '#FF9500' : '#8E8E93' }]} />
          <Text style={s.gapSkill}>{g.skill}</Text>
          <View style={[s.priorityBadge, { backgroundColor: g.priority === 'high' ? '#FF3B3018' : '#FF950018' }]}>
            <Text style={[s.priorityText, { color: g.priority === 'high' ? '#FF3B30' : '#FF9500' }]}>{g.priority}</Text>
          </View>
          <Text style={s.gapDemand}>{g.demand} jobs</Text>
        </View>
      ))}
      <Text style={[s.sectionLabel, { marginTop: 20 }]}>Your Strengths</Text>
      {(data?.strengths || []).map((st: any, i: number) => (
        <View key={i} style={s.gapRow}>
          <View style={[s.gapDot, { backgroundColor: '#34C759' }]} />
          <Text style={[s.gapSkill, { color: '#34C759' }]}>✓ {st.skill}</Text>
          <Text style={s.gapDemand}>{st.demand} jobs</Text>
        </View>
      ))}
    </View>
  );

  const renderCareer = () => (
    <View style={s.contentGap}>
      {(data?.insights || []).map((ins: string, i: number) => (
        <AppleCard key={i}>
          <View style={s.cardRow}>
            <Ionicons name="bulb-outline" size={18} color="#FF9500" />
            <Text style={[s.cardTitle, { flex: 1, marginLeft: 10 }]}>{ins}</Text>
          </View>
        </AppleCard>
      ))}
      <Text style={s.sectionLabel}>Career Paths</Text>
      {(data?.paths || []).map((p: any, i: number) => (
        <AppleCard key={i}>
          <View style={s.cardRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>{p.industry}</Text>
              <Text style={s.cardSub}>{p.alumniCount} alumni</Text>
            </View>
            <ScorePill score={p.probability} color="#4FACFE" />
          </View>
          {p.commonRoles?.length > 0 && <Text style={s.reasonText}>Roles: {p.commonRoles.join(', ')}</Text>}
        </AppleCard>
      ))}
    </View>
  );

  const renderGenericList = (items: any[], titleKey: string, subKey: string, scoreKey: string, scoreColor?: string) => (
    <View style={s.contentGap}>
      {toArray(items).map((item: any, i: number) => (
        <AppleCard key={i}>
          <View style={s.cardRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle} numberOfLines={2}>{item[titleKey]}</Text>
              <Text style={s.cardSub}>{item[subKey]}</Text>
            </View>
            <ScorePill score={item[scoreKey]} color={scoreColor} />
          </View>
          {item.matchReasons?.map((r: string, k: number) => (
            <Text key={k} style={s.reasonText}>✓ {r}</Text>
          ))}
        </AppleCard>
      ))}
      {toArray(items).length === 0 && <Text style={s.emptyText}>No data available</Text>}
    </View>
  );

  const renderJobs = () => renderGenericList(data, 'title', 'company', 'matchScore', '#34C759');
  const renderEvents = () => renderGenericList(data, 'title', 'date', 'matchScore', '#AF52DE');

  const renderFeed = () => (
    <View style={s.contentGap}>
      <Text style={s.sectionLabel}>Posts Ranked For You</Text>
      {toArray(data).length === 0 && <Text style={s.emptyText}>No posts to personalize yet</Text>}
      {toArray(data).slice(0, 15).map((post: any, i: number) => (
        <AppleCard key={i}>
          <Text style={s.cardTitle} numberOfLines={2}>{post.textContent || 'Post'}</Text>
          <Text style={s.cardSub}>{post.authorName || post.authorId} · Score: {post.mlScore}</Text>
          <View style={[s.cardRow, { marginTop: 8, gap: 16 }]}>
            <Text style={s.reasonText}>❤️ {post.likesCount || 0}</Text>
            <Text style={s.reasonText}>💬 {post.commentsCount || 0}</Text>
          </View>
        </AppleCard>
      ))}
    </View>
  );

  const renderTrending = () => (
    <View style={s.contentGap}>
      <Text style={s.sectionLabel}>Trending Topics — Last 7 days</Text>
      <Text style={[s.cardSub, { marginBottom: 8 }]}>{data?.totalPosts || 0} posts analyzed</Text>
      {(data?.topics || []).map((t: any, i: number) => (
        <AppleCard key={i}>
          <View style={s.cardRow}>
            <Text style={s.rankNum}>#{i + 1}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>{t.topic}</Text>
              <Text style={s.cardSub}>{t.mentions} mentions · {t.postsCount} posts</Text>
            </View>
            <ScorePill score={t.trendScore} color="#FF9500" />
          </View>
        </AppleCard>
      ))}
    </View>
  );

  const renderSimilar = () => (
    <View style={s.contentGap}>
      <Text style={s.sectionLabel}>People Like You</Text>
      {toArray(data).length === 0 && <Text style={s.emptyText}>No similar profiles found</Text>}
      {toArray(data).map((p: any, i: number) => (
        <AppleCard key={i}>
          <View style={s.cardRow}>
            <View style={s.avatarCircle}>
              <Ionicons name="person" size={16} color="#667EEA" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>{p.fullName}</Text>
              <Text style={s.cardSub}>{p.role} · {p.domain}</Text>
            </View>
            <ScorePill score={p.similarity} />
          </View>
          {p.commonSkills?.length > 0 && (
            <View style={s.chipRow}>
              {p.commonSkills.slice(0, 4).map((sk: string, k: number) => <SkillChip key={k} label={sk} />)}
            </View>
          )}
        </AppleCard>
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
      {/* Header */}
      <View style={s.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>AI Insights</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Tab Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabScroll}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {TABS.map(t => (
          <TouchableOpacity key={t.key} onPress={() => setTab(t.key)} activeOpacity={0.8}>
            {tab === t.key ? (
              <LinearGradient colors={t.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.tabPill}>
                <Ionicons name={t.iosIcon as any} size={14} color="#fff" />
                <Text style={s.tabPillTextActive}>{t.label}</Text>
              </LinearGradient>
            ) : (
              <View style={s.tabPillInactive}>
                <Ionicons name={t.iosIcon as any} size={14} color="#8E8E93" />
                <Text style={s.tabPillText}>{t.label}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

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
  headerBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 56 : 44, paddingBottom: 10,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(120,120,128,0.08)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1C1C1E', fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : undefined },
  tabScroll: { flexGrow: 0, paddingVertical: 12, backgroundColor: '#FFFFFF' },
  tabPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  tabPillInactive: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(120,120,128,0.08)' },
  tabPillText: { fontSize: 13, color: '#8E8E93', fontWeight: '500' },
  tabPillTextActive: { fontSize: 13, color: '#FFFFFF', fontWeight: '700' },
  body: { flex: 1 },
  contentGap: { gap: 10, marginTop: 16 },

  // Card
  appleCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#667EEA14', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1C1C1E', letterSpacing: -0.2 },
  cardSub: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  reasonText: { fontSize: 13, color: '#34C759', marginTop: 4, fontWeight: '500' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, gap: 6 },
  skillChip: { backgroundColor: '#F2F2F7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  skillChipText: { color: '#3C3C43', fontSize: 12, fontWeight: '500' },

  // Score pill
  scorePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  scorePillText: { fontSize: 13, fontWeight: '700' },

  // Section label
  sectionLabel: { fontSize: 17, fontWeight: '700', color: '#1C1C1E', letterSpacing: -0.3, marginTop: 8, marginBottom: 4 },

  // Hero score
  heroScoreCard: { borderRadius: 20, overflow: 'hidden', marginBottom: 8 },
  heroScoreGradient: { alignItems: 'center', paddingVertical: 28 },
  heroScoreNum: { fontSize: 52, fontWeight: '800', color: '#fff' },
  heroScoreLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4, fontWeight: '500' },

  // Gap rows
  gapRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F2F2F7', gap: 8 },
  gapDot: { width: 8, height: 8, borderRadius: 4 },
  gapSkill: { flex: 1, fontSize: 15, color: '#1C1C1E', fontWeight: '500', textTransform: 'capitalize' },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  priorityText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  gapDemand: { fontSize: 13, color: '#8E8E93', marginLeft: 8 },

  // Trending
  rankNum: { fontSize: 18, fontWeight: '800', color: '#FF9500', width: 36 },

  // Empty
  emptyText: { fontSize: 15, color: '#8E8E93', textAlign: 'center', marginTop: 40 },
});
