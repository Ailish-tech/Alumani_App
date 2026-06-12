import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, Alert, RefreshControl, Modal, ActivityIndicator, Animated,
} from 'react-native';
import { AppleAlert } from '../../components/AppleAlert';
import { Ionicons } from '@expo/vector-icons';
import { useMentorshipStore } from '../../store/mentorshipStore';
import { useAuthStore } from '../../store/authStore';
import { User, Role, MentorshipRequest } from '../../types';
import PremiumHeader from '../../components/PremiumHeader';

// ─── LinkedIn-Inspired Colors ───────────────────────────────────────────────
const LI = {
  blue: '#0A66C2',
  blueDark: '#004182',
  white: '#FFFFFF',
  bgLight: '#F3F2EF',
  border: '#DCE6F1',
  textDark: '#191919',
  textSecondary: '#666666',
  green: '#057642',
  warning: '#E16745',
  success: '#057642',
  reject: '#CC1016',
};

// ─── Mentor Card ────────────────────────────────────────────────────────────
function MentorCard({ mentor, onRequest, index }: { mentor: User; onRequest: () => void; index: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay: index * 80, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, delay: index * 80, useNativeDriver: true }),
    ]).start();
  }, []);

  const roleColor = mentor.role === Role.ALUMNI ? LI.blue : LI.green;
  return (
    <Animated.View style={[styles.mentorCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.mentorHeader}>
        <View style={[styles.avatar, { backgroundColor: roleColor }]}>
          <Ionicons name="person" size={22} color={LI.white} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.mentorName}>{mentor.fullName || mentor.id}</Text>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: `${roleColor}15` }]}>
              <Text style={[styles.badgeText, { color: roleColor }]}>{mentor.role}</Text>
            </View>
            {mentor.domain ? <Text style={styles.domainText}>{mentor.domain}</Text> : null}
          </View>
        </View>
      </View>

      {mentor.skills?.length > 0 && (
        <View style={styles.skillsRow}>
          {mentor.skills.slice(0, 4).map((skill, i) => (
            <View key={i} style={styles.skillChip}>
              <Text style={styles.skillText}>{skill}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Ionicons name="star" size={16} color="#F5A623" />
          <Text style={styles.statValue}>{mentor.reputationScore}</Text>
          <Text style={styles.statLabel}>Rep</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="people" size={16} color={LI.blue} />
          <Text style={styles.statValue}>{mentor.studentsGuided}</Text>
          <Text style={styles.statLabel}>Guided</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.requestButton} onPress={onRequest} activeOpacity={0.8}>
        <Text style={styles.requestButtonText}>Request Mentorship</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Request Card ───────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  PENDING: '#E16745',
  ACCEPTED: '#057642',
  REJECTED: '#CC1016',
  COMPLETED: '#0A66C2',
};

function RequestCard({ request, isMentor, onRespond }: {
  request: MentorshipRequest; isMentor: boolean;
  onRespond?: (id: string, status: 'ACCEPTED' | 'REJECTED') => void;
}) {
  const statusColor = STATUS_COLORS[request.status] || LI.textSecondary;
  return (
    <View style={styles.mentorCard}>
      <View style={styles.mentorHeader}>
        <View style={[styles.avatar, { backgroundColor: statusColor }]}>
          <Ionicons name={isMentor ? 'school' : 'ribbon'} size={22} color={LI.white} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.mentorName}>
            {isMentor ? `Student: ${request.studentId}` : `Mentor: ${request.mentorId}`}
          </Text>
          <Text style={styles.domainText}>Topic: {request.topic}</Text>
        </View>
      </View>

      <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
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
            style={[styles.responseBtn, { borderColor: LI.reject, borderWidth: 1 }]}
            onPress={() => onRespond(request.id, 'REJECTED')}
          >
            <Text style={[styles.responseBtnText, { color: LI.reject }]}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.responseBtn, { backgroundColor: LI.blue }]}
            onPress={() => onRespond(request.id, 'ACCEPTED')}
          >
            <Text style={[styles.responseBtnText, { color: LI.white }]}>Accept</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Main Screen ────────────────────────────────────────────────────────────
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
      AppleAlert.alert('Required', 'Please enter a topic for mentorship.');
      return;
    }
    setIsSending(true);
    try {
      await requestMentorship(selectedMentorId, topic.trim());
      setShowModal(false);
      AppleAlert.alert('Sent! ✅', 'Your mentorship request has been sent.');
      fetchMyMentorships();
    } catch (e: any) {
      AppleAlert.alert('Error', e.response?.data?.error || e.message || 'Failed to send request.');
    }
    setIsSending(false);
  };

  const handleRespond = async (id: string, status: 'ACCEPTED' | 'REJECTED') => {
    try {
      await respondToMentorship(id, status, status === 'ACCEPTED' ? 'TEXT' : undefined);
      AppleAlert.alert('Done ✅', `Request ${status.toLowerCase()}.`);
      fetchMyMentorships();
    } catch (e: any) {
      AppleAlert.alert('Error', e.response?.data?.error || e.message || 'Failed to respond.');
    }
  };

  const allRequests = isMentorRole
    ? [...(myMentorships.asMentor || []), ...(myMentorships.asStudent || [])]
    : [...(myMentorships.asStudent || []), ...(myMentorships.asMentor || [])];

  return (
    <View style={styles.container}>
      <PremiumHeader title="Mentorship" subtitle="Connect with mentors" showNotifications />
      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'find' && styles.tabActive]}
          onPress={() => setActiveTab('find')}
        >
          <Text style={[styles.tabText, activeTab === 'find' && styles.tabTextActive]}>Find Mentors</Text>
          {activeTab === 'find' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'requests' && styles.tabActive]}
          onPress={() => { setActiveTab('requests'); fetchMyMentorships(); }}
        >
          <Text style={[styles.tabText, activeTab === 'requests' && styles.tabTextActive]}>
            My Requests{myMentorships.asMentor?.filter(r => r.status === 'PENDING').length > 0
              ? ` (${myMentorships.asMentor.filter(r => r.status === 'PENDING').length})`
              : ''}
          </Text>
          {activeTab === 'requests' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
      </View>

      {activeTab === 'find' ? (
        <>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color={LI.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by domain..."
                placeholderTextColor="#999"
                value={searchDomain}
                onChangeText={setSearchDomain}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
            </View>
          </View>

          <FlatList
            data={mentors}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <MentorCard mentor={item} onRequest={() => handleRequest(item.id)} index={index} />
            )}
            refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => searchMentors()} tintColor={LI.blue} colors={[LI.blue]} />}
            contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="school-outline" size={48} color={LI.textSecondary} />
                <Text style={styles.emptyText}>No mentors found</Text>
                <Text style={styles.emptySubtext}>Try a different domain or pull to refresh</Text>
              </View>
            }
          />
        </>
      ) : (
        <FlatList
          data={allRequests}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RequestCard request={item} isMentor={item.mentorId === user?.id} onRespond={handleRespond} />
          )}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => fetchMyMentorships()} tintColor={LI.blue} colors={[LI.blue]} />}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="mail-outline" size={48} color={LI.textSecondary} />
              <Text style={styles.emptyText}>No requests yet</Text>
              <Text style={styles.emptySubtext}>
                {isMentorRole ? 'Incoming mentorship requests will appear here' : 'Send a request from Find Mentors tab'}
              </Text>
            </View>
          }
        />
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
              placeholderTextColor="#999"
              value={topic}
              onChangeText={setTopic}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sendBtn, isSending && { opacity: 0.6 }]}
                onPress={handleSendRequest}
                disabled={isSending}
              >
                <Text style={styles.sendBtnText}>{isSending ? 'Sending...' : 'Send Request'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: LI.bgLight },

  // Tab bar
  tabBar: {
    flexDirection: 'row', backgroundColor: LI.white,
    borderBottomWidth: 1, borderBottomColor: LI.border,
  },
  tab: {
    flex: 1, alignItems: 'center', paddingVertical: 14, position: 'relative',
  },
  tabActive: {},
  tabText: { fontSize: 14, color: LI.textSecondary, fontWeight: '600' },
  tabTextActive: { color: LI.blue, fontWeight: '700' },
  tabIndicator: {
    position: 'absolute', bottom: 0, left: '20%', right: '20%',
    height: 2.5, backgroundColor: LI.blue, borderRadius: 2,
  },

  // Search
  searchContainer: { padding: 16, paddingBottom: 8, backgroundColor: LI.white },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: LI.bgLight, borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: LI.border,
  },
  searchInput: { flex: 1, color: LI.textDark, fontSize: 15 },

  // Mentor card
  mentorCard: {
    backgroundColor: LI.white, borderRadius: 12,
    padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: LI.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  mentorHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  avatar: {
    width: 50, height: 50, borderRadius: 25,
    alignItems: 'center', justifyContent: 'center',
  },
  mentorName: { fontSize: 16, fontWeight: '700', color: LI.textDark },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  domainText: { fontSize: 13, color: LI.textSecondary },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  skillChip: { backgroundColor: LI.bgLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: LI.border },
  skillText: { fontSize: 12, color: LI.blue, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 24, marginBottom: 14 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statValue: { fontSize: 15, fontWeight: '700', color: LI.textDark },
  statLabel: { fontSize: 12, color: LI.textSecondary },
  requestButton: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: LI.blue, borderRadius: 24, paddingVertical: 10,
  },
  requestButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Status badge
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: 12, marginBottom: 10,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '700' },
  channelText: { fontSize: 12, color: LI.textSecondary, marginBottom: 10 },

  // Response buttons
  responseButtons: { flexDirection: 'row', gap: 10, marginTop: 4 },
  responseBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: 24,
  },
  responseBtnText: { fontWeight: '700', fontSize: 14 },

  // Empty state
  emptyState: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyText: { fontSize: 17, color: LI.textDark, fontWeight: '600' },
  emptySubtext: { fontSize: 14, color: LI.textSecondary, textAlign: 'center' },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  modalCard: {
    width: '100%', backgroundColor: LI.white,
    borderRadius: 12, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 16, elevation: 8,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: LI.textDark, marginBottom: 4 },
  modalSubtitle: { fontSize: 14, color: LI.textSecondary, marginBottom: 16 },
  modalInput: {
    backgroundColor: LI.bgLight, borderRadius: 8,
    padding: 14, color: LI.textDark, fontSize: 15,
    borderWidth: 1, borderColor: LI.border, marginBottom: 16,
  },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  cancelBtn: {
    paddingVertical: 10, paddingHorizontal: 20,
    borderRadius: 24, borderWidth: 1, borderColor: LI.border,
  },
  cancelBtnText: { color: LI.textSecondary, fontWeight: '600', fontSize: 14 },
  sendBtn: {
    paddingVertical: 10, paddingHorizontal: 20,
    borderRadius: 24, backgroundColor: LI.blue,
  },
  sendBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
