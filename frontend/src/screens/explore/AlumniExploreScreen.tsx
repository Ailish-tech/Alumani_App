import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform, Animated, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import PremiumHeader from '../../components/PremiumHeader';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Give Back (primary alumni actions) ──────────────────────────────────────
const GIVE_BACK: { title: string; sub: string; icon: string; gradient: [string, string]; screen: string }[] = [
  { title: 'Post a Job', sub: 'Help students find opportunities', icon: 'briefcase', gradient: ['#34C759', '#30D158'], screen: 'JobBoard' },
  { title: 'Create Event', sub: 'Organize meetups & webinars', icon: 'calendar', gradient: ['#5856D6', '#AF52DE'], screen: 'Events' },
  { title: 'Office Hours', sub: 'Offer 1-on-1 mentoring slots', icon: 'time', gradient: ['#FF9500', '#FFCC00'], screen: 'Booking' },
  { title: 'Answer Q&A', sub: 'Help students via Q&A', icon: 'help-circle', gradient: ['#FF3B30', '#FF6B6B'], screen: 'QA' },
  { title: 'Share Resources', sub: 'Upload study materials', icon: 'document-text', gradient: ['#007AFF', '#5AC8FA'], screen: 'Resources' },
  { title: 'Referrals', sub: 'Refer students to companies', icon: 'paper-plane', gradient: ['#AF52DE', '#BF5AF2'], screen: 'Referrals' },
  { title: 'Success Stories', sub: 'Share your career journey', icon: 'book', gradient: ['#FF9500', '#FFCC00'], screen: 'Stories' },
  { title: 'Company Directory', sub: 'Register your company', icon: 'business', gradient: ['#5AC8FA', '#007AFF'], screen: 'CompanyDirectory' },
];

// ─── Community & Career (shared features) ────────────────────────────────────
const COMMUNITY: { title: string; icon: string; gradient: [string, string]; screen: string }[] = [
  { title: 'AI Insights', icon: 'sparkles', gradient: ['#AF52DE', '#BF5AF2'], screen: 'SmartInsights' },
  { title: 'Groups', icon: 'people', gradient: ['#FF9500', '#FFCC00'], screen: 'Groups' },
  { title: 'Polls', icon: 'bar-chart', gradient: ['#FF6B6B', '#FF3B30'], screen: 'Polls' },
  { title: 'Network', icon: 'search', gradient: ['#5AC8FA', '#007AFF'], screen: 'AlumniSearch' },
  { title: 'Careers', icon: 'trending-up', gradient: ['#AF52DE', '#BF5AF2'], screen: 'CareerExplorer' },
  { title: 'Goals', icon: 'flag', gradient: ['#34C759', '#30D158'], screen: 'Goals' },
  { title: 'Resume', icon: 'document', gradient: ['#007AFF', '#5AC8FA'], screen: 'ResumeBuilder' },
  { title: 'Analytics', icon: 'analytics', gradient: ['#FF3B30', '#FF9500'], screen: 'MLAnalytics' },
];

// ─── Action Card ─────────────────────────────────────────────────────────────
function ActionRow({ item, index, onPress }: { item: typeof GIVE_BACK[0]; index: number; onPress: () => void }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 9, delay: index * 50 }).start();
  }, []);

  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }] }}>
      <TouchableOpacity style={s.actionRow} activeOpacity={0.75} onPress={onPress}>
        <LinearGradient colors={item.gradient} style={s.actionIcon}>
          <Ionicons name={item.icon as any} size={20} color="#fff" />
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={s.actionTitle}>{item.title}</Text>
          <Text style={s.actionSub}>{item.sub}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Community Grid Tile ─────────────────────────────────────────────────────
function CommunityTile({ item, index, onPress }: { item: typeof COMMUNITY[0]; index: number; onPress: () => void }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 9, delay: 400 + index * 60 }).start();
  }, []);

  return (
    <Animated.View style={[{ opacity: anim, transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }] }]}>
      <TouchableOpacity style={s.communityTile} activeOpacity={0.75} onPress={onPress}>
        <LinearGradient colors={item.gradient} style={s.communityIcon}>
          <Ionicons name={item.icon as any} size={20} color="#fff" />
        </LinearGradient>
        <Text style={s.communityText}>{item.title}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function AlumniExploreScreen() {
  const navigation = useNavigation();

  return (
    <View style={s.container}>
      <PremiumHeader title="Alumni Hub" subtitle="Give back to your community" showNotifications />
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        
        {/* Hero Banner */}
        <View style={s.heroBanner}>
          <LinearGradient colors={['#E0F2F1', '#B2DFDB']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />
          <View style={s.heroBannerIcon}>
            <Ionicons name="ribbon" size={24} color="#00897B" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.heroBannerTitle}>Alumni Network</Text>
            <Text style={s.heroBannerSub}>Give back, mentor students & grow your impact</Text>
          </View>
        </View>

        {/* Give Back Section */}
        <Text style={s.sectionLabel}>🎓 Give Back</Text>
        <View style={s.actionList}>
          {GIVE_BACK.map((item, i) => (
            <ActionRow key={item.screen} item={item} index={i} onPress={() => navigation.navigate(item.screen as any)} />
          ))}
        </View>

        {/* Community Grid */}
        <Text style={s.sectionLabel}>🤝 Community & Career</Text>
        <View style={s.communityGrid}>
          {COMMUNITY.map((item, i) => (
            <CommunityTile key={item.screen} item={item} index={i} onPress={() => navigation.navigate(item.screen as any)} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },

  // Hero
  heroBanner: {
    marginHorizontal: 16, marginTop: 12, borderRadius: 20, overflow: 'hidden',
    flexDirection: 'row', alignItems: 'center', padding: 18, gap: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 14, elevation: 4,
  },
  heroBannerIcon: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroBannerTitle: { fontSize: 18, fontWeight: '700', color: '#00695C', letterSpacing: -0.3 },
  heroBannerSub: { fontSize: 13, color: '#00897B', marginTop: 2 },

  // Section label
  sectionLabel: {
    fontSize: 17, fontWeight: '700', color: '#1C1C1E', letterSpacing: -0.3,
    paddingHorizontal: 16, marginTop: 22, marginBottom: 10,
  },

  // Action list
  actionList: {
    backgroundColor: '#FFF', marginHorizontal: 16, borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  actionRow: {
    flexDirection: 'row', alignItems: 'center', padding: 14, gap: 14,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#F2F2F7',
  },
  actionIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionTitle: { fontSize: 15, fontWeight: '600', color: '#1C1C1E', letterSpacing: -0.2 },
  actionSub: { fontSize: 12, color: '#8E8E93', marginTop: 1 },

  // Community grid
  communityGrid: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10,
  },
  communityTile: {
    width: (SCREEN_WIDTH - 52) / 4,
    backgroundColor: '#FFF', borderRadius: 16, paddingVertical: 14,
    alignItems: 'center', gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  communityIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  communityText: { fontSize: 11, fontWeight: '600', color: '#1C1C1E', textAlign: 'center' },
});
