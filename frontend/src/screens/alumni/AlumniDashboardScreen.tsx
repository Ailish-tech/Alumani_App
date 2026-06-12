import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  TouchableOpacity, Platform, Animated, Dimensions, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';
import PremiumHeader from '../../components/PremiumHeader';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 52) / 2;

const IMPACT_CARDS: { key: string; label: string; icon: string; gradient: [string, string] }[] = [
  { key: 'jobsPosted', label: 'Jobs Posted', icon: 'briefcase-outline', gradient: ['#34C759', '#30D158'] },
  { key: 'eventsCreated', label: 'Events', icon: 'calendar-outline', gradient: ['#5856D6', '#AF52DE'] },
  { key: 'resourcesShared', label: 'Resources', icon: 'document-text-outline', gradient: ['#007AFF', '#5AC8FA'] },
  { key: 'questionsAnswered', label: 'Q&A Helped', icon: 'chatbubble-ellipses-outline', gradient: ['#FF3B30', '#FF6B6B'] },
];

const QUICK_ACTIONS: { title: string; icon: string; gradient: [string, string]; screen: string }[] = [
  { title: 'Referrals', icon: 'paper-plane', gradient: ['#AF52DE', '#BF5AF2'], screen: 'Referrals' },
  { title: 'Stories', icon: 'book', gradient: ['#FF9500', '#FFCC00'], screen: 'Stories' },
  { title: 'Companies', icon: 'business', gradient: ['#5AC8FA', '#007AFF'], screen: 'CompanyDirectory' },
  { title: 'Post Job', icon: 'add-circle', gradient: ['#34C759', '#30D158'], screen: 'JobBoard' },
];

function ImpactCard({ value, label, icon, gradient, delay }: {
  value: number; label: string; icon: string; gradient: [string, string]; delay: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 8, delay }).start();
  }, []);

  return (
    <Animated.View style={[s.impactCard, { opacity: anim, transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }] }]}>
      <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.impactGradientBar} />
      <View style={s.impactContent}>
        <Ionicons name={icon as any} size={18} color={gradient[0]} style={{ marginBottom: 6 }} />
        <Text style={s.impactNum}>{value}</Text>
        <Text style={s.impactLabel}>{label}</Text>
      </View>
    </Animated.View>
  );
}

export default function AlumniDashboardScreen() {
  const { user } = useAuthStore();
  const navigation = useNavigation();
  const [impact, setImpact] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const load = async () => {
    try { const r = await api.get('/alumni/impact'); setImpact(r.data.data); } catch {}
    setLoading(false);
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  };

  useEffect(() => { load(); }, []);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const firstName = user?.fullName?.split(' ')[0] || 'Alumni';

  return (
    <View style={s.container}>
      <PremiumHeader title="Impact" subtitle={`Welcome, ${firstName}`} showNotifications />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#34C759" />}
      >
        {/* Welcome Hero */}
        <View style={s.heroCard}>
          <LinearGradient colors={['#E8F5E9', '#C8E6C9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.heroBg} />
          <View style={s.heroContent}>
            <View style={s.heroAvatarRing}>
              <Text style={s.heroInitial}>{user?.fullName?.charAt(0) || '?'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.heroGreeting}>Welcome back,</Text>
              <Text style={s.heroName}>{user?.fullName || 'Alumni'}</Text>
              <Text style={s.heroSub}>Your contributions make a difference ✨</Text>
            </View>
          </View>
        </View>

        {/* Impact Grid */}
        <Text style={s.sectionLabel}>Your Impact</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#34C759" style={{ marginTop: 30 }} />
        ) : (
          <View style={s.impactGrid}>
            {IMPACT_CARDS.map((c, i) => (
              <ImpactCard key={c.key} value={impact?.[c.key] || 0} label={c.label} icon={c.icon} gradient={c.gradient} delay={i * 80} />
            ))}
          </View>
        )}

        {/* Quick Actions */}
        <Text style={s.sectionLabel}>Quick Actions</Text>
        <View style={s.actionsRow}>
          {QUICK_ACTIONS.map(a => (
            <TouchableOpacity key={a.screen} style={s.actionCard} activeOpacity={0.8}
              onPress={() => navigation.navigate(a.screen as any)}>
              <LinearGradient colors={a.gradient} style={s.actionIcon}>
                <Ionicons name={a.icon as any} size={20} color="#fff" />
              </LinearGradient>
              <Text style={s.actionText}>{a.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* CTA Cards */}
        <Animated.View style={{ opacity: fadeAnim, gap: 10, paddingHorizontal: 16, marginTop: 6 }}>
          <TouchableOpacity style={s.ctaCard} onPress={() => navigation.navigate('Booking' as any)} activeOpacity={0.8}>
            <LinearGradient colors={['#34C759', '#30D158']} style={s.ctaIcon}>
              <Ionicons name="time" size={22} color="#fff" />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={s.ctaTitle}>Set Up Office Hours</Text>
              <Text style={s.ctaSub}>Students are waiting to connect with you</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
          </TouchableOpacity>

          <TouchableOpacity style={s.ctaCard} onPress={() => navigation.navigate('QA' as any)} activeOpacity={0.8}>
            <LinearGradient colors={['#FF3B30', '#FF6B6B']} style={s.ctaIcon}>
              <Ionicons name="help-circle" size={22} color="#fff" />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={s.ctaTitle}>Answer Questions</Text>
              <Text style={s.ctaSub}>Share your experience with students</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
          </TouchableOpacity>

          <TouchableOpacity style={s.ctaCard} onPress={() => navigation.navigate('SmartInsights' as any)} activeOpacity={0.8}>
            <LinearGradient colors={['#AF52DE', '#BF5AF2']} style={s.ctaIcon}>
              <Ionicons name="sparkles" size={22} color="#fff" />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={s.ctaTitle}>AI Insights</Text>
              <Text style={s.ctaSub}>Smart analytics & career intelligence</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },

  // Hero
  heroCard: {
    marginHorizontal: 16, marginTop: 12, borderRadius: 20, overflow: 'hidden',
    backgroundColor: '#FFF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 5,
  },
  heroBg: { ...StyleSheet.absoluteFillObject },
  heroContent: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 16 },
  heroAvatarRing: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#fff', borderWidth: 2.5, borderColor: '#34C759',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3,
  },
  heroInitial: { fontSize: 24, fontWeight: '700', color: '#34C759' },
  heroGreeting: { fontSize: 13, color: '#3C3C43', fontWeight: '500' },
  heroName: { fontSize: 20, fontWeight: '700', color: '#1C1C1E', letterSpacing: -0.3 },
  heroSub: { fontSize: 12, color: '#8E8E93', marginTop: 2 },

  // Section
  sectionLabel: {
    fontSize: 17, fontWeight: '700', color: '#1C1C1E', letterSpacing: -0.3,
    paddingHorizontal: 16, marginTop: 20, marginBottom: 10,
  },

  // Impact
  impactGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10 },
  impactCard: {
    width: CARD_WIDTH, backgroundColor: '#FFF', borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  impactGradientBar: { height: 3 },
  impactContent: { padding: 14 },
  impactNum: { fontSize: 28, fontWeight: '800', color: '#1C1C1E', letterSpacing: -0.5 },
  impactLabel: { fontSize: 12, color: '#8E8E93', marginTop: 2, fontWeight: '500' },

  // Actions
  actionsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10 },
  actionCard: {
    flex: 1, backgroundColor: '#FFF', borderRadius: 16, paddingVertical: 16, alignItems: 'center', gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  actionIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionText: { fontSize: 12, fontWeight: '600', color: '#1C1C1E' },

  // CTAs
  ctaCard: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  ctaIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  ctaTitle: { fontSize: 15, fontWeight: '700', color: '#1C1C1E', letterSpacing: -0.2 },
  ctaSub: { fontSize: 13, color: '#8E8E93', marginTop: 1 },
});
