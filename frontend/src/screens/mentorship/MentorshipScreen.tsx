import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, Alert, RefreshControl, Modal, ActivityIndicator, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { useMentorshipStore } from '../../store/mentorshipStore';
import { useAuthStore } from '../../store/authStore';
import { User, Role, MentorshipRequest } from '../../types';

const mm = Colors.mm;
const GLASS_BG = mm.glassBackground;
const CARD_BORDER = `${mm.outlineVariant}1A`;

const TABS = ['Find a Mentor', 'My Mentorships'];

// ─── Mentor Card ───────────────────────────────────────────────────────────────

function MentorCard({ mentor, onRequest }: { mentor: User; onRequest: () => void }) {
  return (
    <View style={styles.mentorCard}>
      <View style={styles.mentorTop}>
        {/* Glow-ring avatar */}
        <View style={styles.avatarOuter}>
          <LinearGradient
            colors={[mm.gradientStart, mm.secondaryContainer]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarGradient}
          >
            <View style={styles.avatarInner}>
              <Ionicons name="person" size={24} color={mm.primary} />
            </View>
          </LinearGradient>
          <View style={styles.onlineDot} />
        </View>

        {/* Rating badge */}
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={12} color="#f59e0b" />
          <Text style={styles.ratingText}>{mentor.reputationScore || '—'}</Text>
        </View>
      </View>

      <Text style={styles.mentorName}>{mentor.fullName || mentor.id}</Text>
      <Text style={styles.mentorRole}>
        {mentor.domain || mentor.role}
        {mentor.workplace ? ` at ${mentor.workplace}` : ''}
      </Text>

      {/* Skill pills */}
      {mentor.skills?.length > 0 && (
        <View style={styles.skillsRow}>
          {mentor.skills.slice(0, 4).map((skill, i) => (
            <View key={i} style={styles.skillChip}>
              <Text style={styles.skillText}>{skill.toUpperCase()}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Request button */}
      <TouchableOpacity onPress={onRequest} activeOpacity={0.85} style={styles.requestBtnWrapper}>
        <LinearGradient
          colors={[mm.gradientStart, mm.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.requestBtn}
        >
          <Text style={styles.requestBtnText}>Request Mentor</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

// ─── Recommended Mentor (horizontal card) ──────────────────────────────────────

function RecommendedCard({ mentor, onRequest }: { mentor: User; onRequest: () => void }) {
  return (
    <View style={styles.recCard}>
      <View style={styles.recTop}>
        <View style={styles.avatarOuter}>
          <LinearGradient
            colors={[mm.gradientStart, mm.secondaryContainer]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarGradient}
          >
            <View style={styles.avatarInner}>
              <Ionicons name="person" size={22} color={mm.primary} />
            </View>
          </LinearGradient>
          <View style={styles.onlineDot} />
        </View>
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={10} color="#f59e0b" />
          <Text style={styles.ratingText}>{mentor.reputationScore || '—'}</Text>
        </View>
      </View>
      <Text style={styles.recName} numberOfLines={1}>{mentor.fullName || mentor.id}</Text>
      <Text style={styles.recRole} numberOfLines={1}>{mentor.domain || mentor.role}</Text>
      {mentor.skills?.length > 0 && (
        <View style={styles.recSkillsRow}>
          {mentor.skills.slice(0, 2).map((s, i) => (
            <View key={i} style={styles.skillChip}>
              <Text style={styles.skillText}>{s.toUpperCase()}</Text>
            </View>
          ))}
        </View>
      )}
      <TouchableOpacity onPress={onRequest} activeOpacity={0.85} style={styles.requestBtnWrapper}>
        <LinearGradient
          colors={[mm.gradientStart, mm.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.recRequestBtn}
        >
          <Text style={styles.requestBtnText}>Request Mentor</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

// ─── Request Card ──────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#f59e0b',
  ACCEPTED: '#22c55e',
  REJECTED: '#ef4444',
  COMPLETED: mm.primary,
};

function RequestCard({
  request,
  isMentor,
  onRespond,
}: {
  request: MentorshipRequest;
  isMentor: boolean;
  onRespond?: (id: string, status: 'ACCEPTED' | 'REJECTED') => void;
}) {
  const statusColor = STATUS_COLORS[request.status] || mm.outline;

  return (
    <View style={styles.mentorCard}>
      <View style={styles.mentorTop}>
        <View style={[styles.requestAvatar, { borderColor: statusColor }]}>
          <Ionicons name={isMentor ? 'school' : 'ribbon'} size={22} color={statusColor} />
        </View>
      </View>
      <Text style={styles.mentorName}>
        {isMentor ? `Student: ${request.studentId}` : `Mentor: ${request.mentorId}`}
      </Text>
      <Text style={styles.mentorRole}>Topic: {request.topic}</Text>

      <View style={[styles.statusBadge, { backgroundColor: `${statusColor}1A` }]}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Text style={[styles.statusText, { color: statusColor }]}>{request.status}</Text>
      </View>

      {request.channel && (
        <Text style={styles.channelText}>
          Channel: {request.channel} {request.scheduledTime ? `• ${new Date(request.scheduledTime).toLocaleString()}` : ''}
        </Text>
      )}

      {isMentor && request.status === 'PENDING' && onRespond && (
        <View style={styles.responseButtons}>
          <TouchableOpacity
            style={[styles.responseBtn, { backgroundColor: 'rgba(239,68,68,0.1)' }]}
            onPress={() => onRespond(request.id, 'REJECTED')}
          >
            <Ionicons name="close" size={18} color="#ef4444" />
            <Text style={[styles.responseBtnText, { color: '#ef4444' }]}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.responseBtn, { backgroundColor: 'rgba(34,197,94,0.1)' }]}
            onPress={() => onRespond(request.id, 'ACCEPTED')}
          >
            <Ionicons name="checkmark" size={18} color="#22c55e" />
            <Text style={[styles.responseBtnText, { color: '#22c55e' }]}>Accept</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function MentorshipScreen() {
  const { mentors, myMentorships, isLoading, searchMentors, requestMentorship, respondToMentorship, fetchMyMentorships } = useMentorshipStore();
  const { user } = useAuthStore();
  const [searchDomain, setSearchDomain] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedMentorId, setSelectedMentorId] = useState('');
  const [topic, setTopic] = useState('');
  const [isSending, setIsSending] = useState(false);

  const isMentorRole = user?.role === Role.ALUMNI || user?.role === Role.FACULTY;
  const [activeTab, setActiveTab] = useState<'find' | 'requests'>(isMentorRole ? 'requests' : 'find');

  useEffect(() => {
    searchMentors();
    fetchMyMentorships();
  }, []);

  const handleSearch = () => searchMentors(searchDomain || undefined);

  const handleRequest = (mentorId: string) => {
    setSelectedMentorId(mentorId);
    setTopic('');
    setShowModal(true);
  };

  const handleSendRequest = async () => {
    if (!topic.trim()) {
      Alert.alert('Required', 'Please enter a topic for mentorship.');
      return;
    }
    setIsSending(true);
    try {
      await requestMentorship(selectedMentorId, topic.trim());
      setShowModal(false);
      Alert.alert('Sent! ✅', 'Your mentorship request has been sent.');
      fetchMyMentorships();
    } catch (e: any) {
      const msg = e.response?.data?.error || e.message || 'Failed to send request.';
      Alert.alert('Error', msg);
    }
    setIsSending(false);
  };

  const handleRespond = async (id: string, status: 'ACCEPTED' | 'REJECTED') => {
    try {
      await respondToMentorship(id, status, status === 'ACCEPTED' ? 'TEXT' : undefined);
      Alert.alert('Done ✅', `Request ${status.toLowerCase()}.`);
      fetchMyMentorships();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error || e.message || 'Failed to respond.');
    }
  };

  const allRequests = isMentorRole
    ? [...(myMentorships.asMentor || []), ...(myMentorships.asStudent || [])]
    : [...(myMentorships.asStudent || []), ...(myMentorships.asMentor || [])];

  const recommendedMentors = mentors.slice(0, 3);

  const renderFindHeader = () => (
    <View>
      {/* Title */}
      <Text style={styles.pageTitle}>Mentorship</Text>

      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color={mm.outline} />
        <TextInput
          style={styles.searchInput}
          placeholder="Filter by expertise, industry, or name..."
          placeholderTextColor={mm.outline}
          value={searchDomain}
          onChangeText={setSearchDomain}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'find' && styles.tabActive]}
          onPress={() => setActiveTab('find')}
        >
          <Text style={[styles.tabText, activeTab === 'find' && styles.tabTextActive]}>Find a Mentor</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'requests' && styles.tabActive]}
          onPress={() => { setActiveTab('requests'); fetchMyMentorships(); }}
        >
          <Text style={[styles.tabText, activeTab === 'requests' && styles.tabTextActive]}>
            My Mentorships{myMentorships.asMentor?.filter(r => r.status === 'PENDING').length > 0
              ? ` (${myMentorships.asMentor.filter(r => r.status === 'PENDING').length})`
              : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Recommended Section (horizontal scroll) */}
      {recommendedMentors.length > 0 && (
        <View style={styles.recSection}>
          <View style={styles.recHeaderRow}>
            <Text style={styles.recTitle}>Recommended for You</Text>
            <Text style={styles.viewAllText}>View All</Text>
          </View>
          <ScrollView
            horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 14, paddingHorizontal: 16, paddingBottom: 4 }}
          >
            {recommendedMentors.map(m => (
              <RecommendedCard key={m.id} mentor={m} onRequest={() => handleRequest(m.id)} />
            ))}
          </ScrollView>
        </View>
      )}

      <Text style={styles.exploreTitle}>Explore Mentors</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {activeTab === 'find' ? (
        <FlatList
          data={mentors}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MentorCard mentor={item} onRequest={() => handleRequest(item.id)} />
          )}
          ListHeaderComponent={renderFindHeader}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => searchMentors()} tintColor={mm.primary} />}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="school-outline" size={48} color={mm.outline} />
              </View>
              <Text style={styles.emptyText}>No mentors found</Text>
              <Text style={styles.emptySubtext}>Try a different domain or pull to refresh</Text>
            </View>
          }
        />
      ) : (
        <>
          {/* Re-render tabs header for requests view */}
          <View style={{ paddingHorizontal: 16 }}>
            <Text style={styles.pageTitle}>Mentorship</Text>
            <View style={styles.tabBar}>
              <TouchableOpacity style={styles.tab} onPress={() => setActiveTab('find')}>
                <Text style={styles.tabText}>Find a Mentor</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tab, styles.tabActive]} onPress={() => { setActiveTab('requests'); fetchMyMentorships(); }}>
                <Text style={[styles.tabText, styles.tabTextActive]}>My Mentorships</Text>
              </TouchableOpacity>
            </View>
          </View>
          <FlatList
            data={allRequests}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <RequestCard
                request={item}
                isMentor={item.mentorId === user?.id}
                onRespond={handleRespond}
              />
            )}
            refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => fetchMyMentorships()} tintColor={mm.primary} />}
            contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="mail-outline" size={48} color={mm.outline} />
                </View>
                <Text style={styles.emptyText}>No requests yet</Text>
                <Text style={styles.emptySubtext}>
                  {isMentorRole ? 'Incoming mentorship requests will appear here' : 'Send a request from Find Mentors tab'}
                </Text>
              </View>
            }
          />
        </>
      )}

      {/* Topic Input Modal */}
      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Request Mentorship</Text>
            <Text style={styles.modalSubtitle}>What topic do you need help with?</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g., Career guidance, Resume review..."
              placeholderTextColor={mm.outline}
              value={topic}
              onChangeText={setTopic}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sendBtnWrapper, isSending && { opacity: 0.6 }]}
                onPress={handleSendRequest}
                disabled={isSending}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[mm.gradientStart, mm.gradientEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.sendBtn}
                >
                  <Ionicons name="send" size={16} color="#fff" />
                  <Text style={styles.sendBtnText}>{isSending ? 'Sending...' : 'Send'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles (Midnight Meridian) ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: mm.surfaceDim },

  // Page title
  pageTitle: {
    fontSize: 32, fontWeight: '800', color: mm.onSurface,
    letterSpacing: -1, paddingHorizontal: 16, paddingTop: 8, marginBottom: 16,
  },

  // Search
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: mm.surfaceContainerLow, borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 12,
    borderWidth: 0.5, borderColor: `${mm.outline}33`,
    marginHorizontal: 16, marginBottom: 20,
  },
  searchInput: { flex: 1, color: mm.onSurface, fontSize: 14 },

  // Tabs (pill style — prominent)
  tabBar: {
    flexDirection: 'row', gap: 10,
    backgroundColor: mm.surfaceContainerLow,
    borderRadius: 14, padding: 4,
    marginHorizontal: 16, marginBottom: 24,
  },
  tab: {
    flex: 1, paddingVertical: 12,
    borderRadius: 12, alignItems: 'center',
  },
  tabActive: {
    backgroundColor: mm.primary,
    shadowColor: mm.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  tabText: { fontSize: 14, fontWeight: '700', color: mm.outline },
  tabTextActive: { color: '#ffffff' },

  // Recommended section
  recSection: { marginBottom: 28 },
  recHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, marginBottom: 14,
  },
  recTitle: { fontSize: 18, fontWeight: '700', color: mm.onSurface },
  viewAllText: { fontSize: 13, fontWeight: '500', color: mm.primary },

  recCard: {
    width: 280, backgroundColor: GLASS_BG, borderRadius: 20,
    padding: 20, borderWidth: 0.5, borderColor: CARD_BORDER,
  },
  recTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 14,
  },
  recName: { fontSize: 17, fontWeight: '700', color: mm.onSurface, marginBottom: 4 },
  recRole: { fontSize: 13, color: mm.onSurfaceVariant, marginBottom: 16 },
  recSkillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 18 },
  recRequestBtn: { paddingVertical: 8, borderRadius: 12, alignItems: 'center' },

  // Explore title
  exploreTitle: {
    fontSize: 18, fontWeight: '700', color: mm.onSurface,
    paddingHorizontal: 16, marginBottom: 14,
  },

  // Mentor card (vertical list)
  mentorCard: {
    backgroundColor: GLASS_BG, borderRadius: 20,
    padding: 20, marginHorizontal: 16, marginBottom: 16,
    borderWidth: 0.5, borderColor: CARD_BORDER,
  },
  mentorTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 12,
  },

  // Avatar with glow ring
  avatarOuter: { position: 'relative' },
  avatarGradient: {
    width: 60, height: 60, borderRadius: 30, padding: 2,
    shadowColor: mm.primary, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4, shadowRadius: 15, elevation: 6,
  },
  avatarInner: {
    flex: 1, borderRadius: 28, backgroundColor: mm.surfaceContainer,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: mm.surfaceDim,
  },
  onlineDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: '#22c55e', borderWidth: 2, borderColor: mm.surfaceContainer,
  },
  requestAvatar: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: `${mm.primary}0D`,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2,
  },

  // Rating badge
  ratingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: mm.surfaceContainerHighest,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  ratingText: { fontSize: 11, fontWeight: '700', color: mm.onSurface },

  // Text
  mentorName: { fontSize: 19, fontWeight: '700', color: mm.onSurface, marginBottom: 4 },
  mentorRole: { fontSize: 13, color: mm.onSurfaceVariant, marginBottom: 14 },

  // Skills
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 18 },
  skillChip: {
    backgroundColor: mm.surfaceContainerHigh,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
  },
  skillText: { fontSize: 9, fontWeight: '700', color: mm.onSurfaceVariant, letterSpacing: 0.5 },

  // Request button
  requestBtnWrapper: { borderRadius: 12, overflow: 'hidden' },
  requestBtn: { paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  requestBtnText: { fontSize: 13, fontWeight: '700', color: mm.onPrimary },

  // Status badge
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: 999, marginBottom: 10,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },
  channelText: { fontSize: 12, color: mm.outline, marginBottom: 10 },

  // Response buttons
  responseButtons: { flexDirection: 'row', gap: 10, marginTop: 4 },
  responseBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 12,
  },
  responseBtnText: { fontWeight: '700', fontSize: 14 },

  // Empty
  emptyState: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: `${mm.primary}0D`,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  emptyText: { fontSize: 18, color: mm.onSurfaceVariant, fontWeight: '600' },
  emptySubtext: { fontSize: 14, color: mm.outline, textAlign: 'center' },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  modalCard: {
    width: '100%', backgroundColor: mm.surfaceContainer,
    borderRadius: 20, padding: 24,
    borderWidth: 0.5, borderColor: CARD_BORDER,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: mm.onSurface, marginBottom: 4 },
  modalSubtitle: { fontSize: 13, color: mm.outline, marginBottom: 16 },
  modalInput: {
    backgroundColor: mm.surfaceContainerLow, borderRadius: 12,
    padding: 14, color: mm.onSurface, fontSize: 14,
    borderWidth: 0.5, borderColor: CARD_BORDER, marginBottom: 16,
  },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  cancelBtn: {
    paddingVertical: 10, paddingHorizontal: 20,
    borderRadius: 12, backgroundColor: mm.surfaceContainerLow,
  },
  cancelBtnText: { color: mm.onSurfaceVariant, fontWeight: '600', fontSize: 14 },
  sendBtnWrapper: { borderRadius: 12, overflow: 'hidden' },
  sendBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12,
  },
  sendBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
