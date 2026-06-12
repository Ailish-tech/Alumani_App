import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Animated, Dimensions, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import PremiumHeader from '../../components/PremiumHeader';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 12;
const HALF_CARD = (SCREEN_WIDTH - 48 - CARD_GAP) / 2;

// ─── Hero Featured Items (App Store "Today" style) ──────────────────────────
const HERO_CARD = {
  title: 'AI Insights',
  subtitle: 'Mentor match, skill gap analysis, career path predictions',
  icon: 'sparkles',
  screen: 'SmartInsights',
  gradient: ['#667EEA', '#764BA2'] as [string, string],
};

const FEATURED_CARDS = [
  { title: 'Events', subtitle: 'Meetups & workshops', icon: 'calendar', screen: 'Events', gradient: ['#F093FB', '#F5576C'] as [string, string] },
  { title: 'Jobs', subtitle: 'Career opportunities', icon: 'briefcase', screen: 'JobBoard', gradient: ['#4FACFE', '#00F2FE'] as [string, string] },
];

const MEDIUM_CARDS = [
  { title: 'Alumni Search', subtitle: 'Find by company, batch', icon: 'search', screen: 'AlumniSearch', gradient: ['#0A66C2', '#0073B1'] as [string, string] },
  { title: 'Groups', subtitle: 'Interest-based clubs', icon: 'people', screen: 'Groups', gradient: ['#FA709A', '#FEE140'] as [string, string] },
];

// ─── Utility cards (frosted glass style) ────────────────────────────────────
const UTILITY_CARDS = [
  { title: 'Polls', subtitle: 'Community questions', icon: 'bar-chart', color: '#F5576C', screen: 'Polls' },
  { title: 'Ask Alumni', subtitle: 'Anonymous Q&A', icon: 'help-circle', color: '#7C3AED', screen: 'QA' },
  { title: 'Resources', subtitle: 'Study materials', icon: 'document-text', color: '#0A66C2', screen: 'Resources' },
  { title: 'Career Explorer', subtitle: 'Where alumni work', icon: 'trending-up', color: '#057642', screen: 'CareerExplorer' },
  { title: 'Goals', subtitle: 'Track career goals', icon: 'flag', color: '#0073B1', screen: 'Goals' },
  { title: 'Book a Slot', subtitle: 'Mentor office hours', icon: 'time', color: '#F5576C', screen: 'Booking' },
  { title: 'Resume Builder', subtitle: 'Generate your resume', icon: 'document', color: '#057642', screen: 'ResumeBuilder' },
  { title: 'Analytics', subtitle: 'ML-powered insights', icon: 'analytics', color: '#764BA2', screen: 'MLAnalytics' },
];

// ─── Animated Entry Wrapper ─────────────────────────────────────────────────
function FadeSlideIn({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: any }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 500, delay, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, delay, useNativeDriver: true, tension: 80, friction: 12 }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}

// ─── Hero Card (Full-width, App Store "Today" style) ────────────────────────
function HeroCard({ item, onPress }: { item: typeof HERO_CARD; onPress: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, tension: 300, friction: 15 }).start();
  const onPressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 300, friction: 15 }).start();

  return (
    <FadeSlideIn delay={0}>
      <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
        <TouchableOpacity onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} activeOpacity={1}>
          <LinearGradient colors={item.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.heroCard}>
            {/* Glass highlight */}
            <View style={s.heroHighlight} />

            {/* Icon glow */}
            <View style={s.heroIconWrap}>
              <View style={s.heroIconGlow} />
              <Ionicons name={item.icon as any} size={32} color="#fff" />
            </View>

            <View style={s.heroContent}>
              <Text style={s.heroLabel}>FEATURED</Text>
              <Text style={s.heroTitle}>{item.title}</Text>
              <Text style={s.heroSubtitle}>{item.subtitle}</Text>
            </View>

            {/* Bottom glass bar */}
            <View style={s.heroBottomBar}>
              <Text style={s.heroAction}>Explore</Text>
              <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.9)" />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </FadeSlideIn>
  );
}

// ─── Featured Card (Medium, gradient) ───────────────────────────────────────
function FeaturedCard({ item, index, onPress }: { item: typeof FEATURED_CARDS[0]; index: number; onPress: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = () => Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true, tension: 300, friction: 15 }).start();
  const onPressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 300, friction: 15 }).start();

  return (
    <FadeSlideIn delay={100 + index * 80} style={{ width: HALF_CARD }}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} activeOpacity={1}>
          <LinearGradient colors={item.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.featuredCard}>
            <View style={s.featuredIconWrap}>
              <Ionicons name={item.icon as any} size={28} color="rgba(255,255,255,0.95)" />
            </View>
            <Text style={s.featuredTitle}>{item.title}</Text>
            <Text style={s.featuredSubtitle}>{item.subtitle}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </FadeSlideIn>
  );
}

// ─── Medium Gradient Card ───────────────────────────────────────────────────
function MediumCard({ item, index, onPress }: { item: typeof MEDIUM_CARDS[0]; index: number; onPress: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = () => Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true, tension: 300, friction: 15 }).start();
  const onPressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 300, friction: 15 }).start();

  return (
    <FadeSlideIn delay={260 + index * 80} style={{ width: HALF_CARD }}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} activeOpacity={1}>
          <LinearGradient colors={item.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.mediumCard}>
            <Ionicons name={item.icon as any} size={22} color="rgba(255,255,255,0.9)" />
            <Text style={s.mediumTitle}>{item.title}</Text>
            <Text style={s.mediumSubtitle}>{item.subtitle}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </FadeSlideIn>
  );
}

// ─── Utility Glass Card (Frosted) ───────────────────────────────────────────
function UtilityCard({ item, index, onPress }: { item: typeof UTILITY_CARDS[0]; index: number; onPress: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = () => Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true, tension: 300, friction: 15 }).start();
  const onPressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 300, friction: 15 }).start();

  return (
    <FadeSlideIn delay={420 + index * 50} style={{ width: HALF_CARD }}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} activeOpacity={1}>
          <View style={s.utilityCard}>
            {/* Colored accent line */}
            <View style={[s.utilityAccent, { backgroundColor: item.color }]} />

            <View style={[s.utilityIcon, { backgroundColor: `${item.color}14` }]}>
              <Ionicons name={item.icon as any} size={20} color={item.color} />
            </View>
            <Text style={s.utilityTitle}>{item.title}</Text>
            <Text style={s.utilitySubtitle}>{item.subtitle}</Text>
            <View style={s.utilityArrow}>
              <Ionicons name="chevron-forward" size={14} color="#C7C7CC" />
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </FadeSlideIn>
  );
}

// ─── Section Header ─────────────────────────────────────────────────────────
function SectionHeader({ title, delay = 0 }: { title: string; delay?: number }) {
  return (
    <FadeSlideIn delay={delay} style={{ marginTop: 24, marginBottom: 10 }}>
      <Text style={s.sectionTitle}>{title}</Text>
    </FadeSlideIn>
  );
}

// ─── Main Screen ────────────────────────────────────────────────────────────
export default function ExploreScreen() {
  const navigation = useNavigation();

  return (
    <View style={s.container}>
      <PremiumHeader title="Explore" subtitle="Discover features & tools" showSearch />
      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Card ── */}
        <HeroCard
          item={HERO_CARD}
          onPress={() => navigation.navigate(HERO_CARD.screen as any)}
        />

        {/* ── Featured Row ── */}
        <SectionHeader title="Quick Access" delay={80} />
        <View style={s.row}>
          {FEATURED_CARDS.map((item, i) => (
            <FeaturedCard
              key={item.screen}
              item={item}
              index={i}
              onPress={() => navigation.navigate(item.screen as any)}
            />
          ))}
        </View>

        {/* ── Medium Cards Row ── */}
        <View style={[s.row, { marginTop: CARD_GAP }]}>
          {MEDIUM_CARDS.map((item, i) => (
            <MediumCard
              key={item.screen}
              item={item}
              index={i}
              onPress={() => navigation.navigate(item.screen as any)}
            />
          ))}
        </View>

        {/* ── Utility Grid ── */}
        <SectionHeader title="Tools & Resources" delay={400} />
        <View style={s.utilityGrid}>
          {UTILITY_CARDS.map((item, i) => (
            <UtilityCard
              key={item.screen}
              item={item}
              index={i}
              onPress={() => navigation.navigate(item.screen as any)}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7', // Apple system background
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 120,
  },

  // ── Section ──
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.4,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : undefined,
  },

  row: {
    flexDirection: 'row',
    gap: CARD_GAP,
  },

  // ── Hero Card ──
  heroCard: {
    borderRadius: 22,
    padding: 24,
    minHeight: 200,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#764BA2',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
  },
  heroHighlight: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  heroIconWrap: {
    position: 'relative',
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  heroIconGlow: {
    position: 'absolute',
    top: -8, left: -8,
    width: 48, height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  heroContent: {
    flex: 1,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : undefined,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
    fontWeight: '500',
  },
  heroBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  heroAction: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },

  // ── Featured Card ──
  featuredCard: {
    borderRadius: 18,
    padding: 18,
    height: 140,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  featuredIconWrap: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 42, height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : undefined,
  },
  featuredSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
    fontWeight: '500',
  },

  // ── Medium Card ──
  mediumCard: {
    borderRadius: 16,
    padding: 16,
    height: 100,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  mediumTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
    marginTop: 6,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : undefined,
  },
  mediumSubtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 1,
    fontWeight: '500',
  },

  // ── Utility Card (Glass) ──
  utilityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },
  utilityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    minHeight: 110,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  utilityAccent: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 3,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  utilityIcon: {
    width: 38, height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  utilityTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.2,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : undefined,
  },
  utilitySubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
    lineHeight: 16,
    fontWeight: '400',
  },
  utilityArrow: {
    position: 'absolute',
    top: 16,
    right: 14,
  },
});
