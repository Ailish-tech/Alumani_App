import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, Alert, RefreshControl, Modal, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { useMentorshipStore } from '../../store/mentorshipStore';
import { useAuthStore } from '../../store/authStore';
import { User, Role, MentorshipRequest } from '../../types';

// ─── Mentor Card (for students browsing mentors) ────────────────────────────

function MentorCard({ mentor, onRequest }: { mentor: User; onRequest: () => void }) {
  const roleColor = mentor.role === Role.ALUMNI ? Colors.roleAlumni : Colors.roleFaculty;
  return (
    <View style={styles.mentorCard}>
      <View style={styles.mentorHeader}>
        <View style={[styles.avatar, { borderColor: roleColor }]}>
          <Ionicons name="person" size={24} color={roleColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.mentorName}>{mentor.fullName || mentor.id}</Text>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: `${roleColor}20` }]}>
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
          <Ionicons name="star" size={16} color={Colors.warning} />
          <Text style={styles.statValue}>{mentor.reputationScore}</Text>
          <Text style={styles.statLabel}>Rep</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="people" size={16} color={Colors.accent} />
          <Text style={styles.statValue}>{mentor.studentsGuided}</Text>
          <Text style={styles.statLabel}>Guided</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.requestButton} onPress={onRequest} activeOpacity={0.8}>
        <Ionicons name="hand-right-outline" size={18} color="#fff" />
        <Text style={styles.requestButtonText}>Request Mentorship</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Request Card (for viewing incoming/outgoing requests) ──────────────────

const STATUS_COLORS: Record<string, string> = {
  PENDING: Colors.warning,
  ACCEPTED: Colors.success,
  REJECTED: '#ef4444',
  COMPLETED: Colors.accent,
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
  const statusColor = STATUS_COLORS[request.status] || Colors.textMuted;
  return (
    <View style={styles.mentorCard}>
      <View style={styles.mentorHeader}>
        <View style={[styles.avatar, { borderColor: statusColor }]}>
          <Ionicons name={isMentor ? 'school' : 'ribbon'} size={24} color={statusColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.mentorName}>
            {isMentor ? `Student: ${request.studentId}` : `Mentor: ${request.mentorId}`}
          </Text>
          <Text style={styles.domainText}>Topic: {request.topic}</Text>
        </View>
      </View>

      <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Text style={[styles.statusText, { color: statusColor }]}>{request.status}</Text>
      </View>

      {request.channel && (
        <Text style={styles.channelText}>
          Channel: {request.channel} {request.scheduledTime ? `• ${new Date(request.scheduledTime).toLocaleString()}` : ''}
        </Text>
      )}

      {/* Accept/Reject buttons for mentor on PENDING requests */}
      {isMentor && request.status === 'PENDING' && onRespond && (
        <View style={styles.responseButtons}>
          <TouchableOpacity
            style={[styles.responseBtn, { backgroundColor: '#ef444420' }]}
            onPress={() => onRespond(request.id, 'REJECTED')}
          >
            <Ionicons name="close" size={18} color="#ef4444" />
            <Text style={[styles.responseBtnText, { color: '#ef4444' }]}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.responseBtn, { backgroundColor: `${Colors.success}20` }]}
            onPress={() => onRespond(request.id, 'ACCEPTED')}
          >
            <Ionicons name="checkmark" size={18} color={Colors.success} />
            <Text style={[styles.responseBtnText, { color: Colors.success }]}>Accept</Text>
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
      Alert.alert('Required', 'Please enter a topic for mentorship.');
      return;
    }
    setIsSending(true);
    try {
      await requestMentorship(selectedMentorId, topic.trim());
      setShowModal(false);
      Alert.alert('Sent! ✅', 'Your mentorship request has been sent.');
      fetchMyMentorships(); // refresh
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
      fetchMyMentorships(); // refresh
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error || e.message || 'Failed to respond.');
    }
  };

  // Combine requests for the requests tab
  const allRequests = isMentorRole
    ? [...(myMentorships.asMentor || []), ...(myMentorships.asStudent || [])]
    : [...(myMentorships.asStudent || []), ...(myMentorships.asMentor || [])];

  return (
    <View style={styles.container}>
      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'find' && styles.tabActive]}
          onPress={() => setActiveTab('find')}
        >
          <Ionicons name="search" size={18} color={activeTab === 'find' ? Colors.primary : Colors.textMuted} />
          <Text style={[styles.tabText, activeTab === 'find' && styles.tabTextActive]}>Find Mentors</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'requests' && styles.tabActive]}
          onPress={() => { setActiveTab('requests'); fetchMyMentorships(); }}
        >
          <Ionicons name="mail" size={18} color={activeTab === 'requests' ? Colors.primary : Colors.textMuted} />
          <Text style={[styles.tabText, activeTab === 'requests' && styles.tabTextActive]}>
            My Requests{myMentorships.asMentor?.filter(r => r.status === 'PENDING').length > 0
              ? ` (${myMentorships.asMentor.filter(r => r.status === 'PENDING').length})`
              : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'find' ? (
        <>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color={Colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by domain..."
                placeholderTextColor={Colors.textMuted}
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
            renderItem={({ item }) => (
              <MentorCard mentor={item} onRequest={() => handleRequest(item.id)} />
            )}
            refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => searchMentors()} tintColor={Colors.primary} />}
            contentContainerStyle={{ padding: Spacing.md, paddingBottom: 100 }}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="school-outline" size={48} color={Colors.textMuted} />
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
            <RequestCard
              request={item}
              isMentor={item.mentorId === user?.id}
              onRespond={handleRespond}
            />
          )}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => fetchMyMentorships()} tintColor={Colors.primary} />}
          contentContainerStyle={{ padding: Spacing.md, paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="mail-outline" size={48} color={Colors.textMuted} />
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
              placeholderTextColor={Colors.textMuted}
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
                <Ionicons name="send" size={16} color="#fff" />
                <Text style={styles.sendBtnText}>{isSending ? 'Sending...' : 'Send'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDark },
  // Tab bar
  tabBar: {
    flexDirection: 'row', paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm, gap: Spacing.sm,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.xs, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md, backgroundColor: Colors.bgCard,
    borderWidth: 1, borderColor: Colors.border,
  },
  tabActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryGlow },
  tabText: { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: '600' },
  tabTextActive: { color: Colors.primary },
  // Search
  searchContainer: { padding: Spacing.md, paddingBottom: 0 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.bgInput, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: { flex: 1, color: Colors.textPrimary, fontSize: FontSize.md },
  // Mentor card
  mentorCard: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  mentorHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  avatar: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: Colors.primaryGlow,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2,
  },
  mentorName: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 2 },
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm },
  badgeText: { fontSize: FontSize.xs, fontWeight: '700' },
  domainText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.sm },
  skillChip: { backgroundColor: Colors.bgInput, paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.full },
  skillText: { fontSize: FontSize.xs, color: Colors.accent },
  statsRow: { flexDirection: 'row', gap: Spacing.xl, marginBottom: Spacing.md },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statValue: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  statLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  requestButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: Spacing.sm,
  },
  requestButtonText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md },
  // Status badge
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    alignSelf: 'flex-start', paddingHorizontal: Spacing.sm,
    paddingVertical: 4, borderRadius: BorderRadius.full, marginBottom: Spacing.sm,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: FontSize.xs, fontWeight: '700' },
  channelText: { fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: Spacing.sm },
  // Response buttons
  responseButtons: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs },
  responseBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.xs, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md,
  },
  responseBtnText: { fontWeight: '700', fontSize: FontSize.md },
  // Empty state
  emptyState: { alignItems: 'center', paddingTop: 80, gap: Spacing.sm },
  emptyText: { fontSize: FontSize.lg, color: Colors.textSecondary, fontWeight: '600' },
  emptySubtext: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center' },
  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center', alignItems: 'center', padding: Spacing.lg,
  },
  modalCard: {
    width: '100%', backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border,
  },
  modalTitle: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
  modalSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.md },
  modalInput: {
    backgroundColor: Colors.bgInput, borderRadius: BorderRadius.md,
    padding: Spacing.md, color: Colors.textPrimary, fontSize: FontSize.md,
    borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md,
  },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.sm },
  cancelBtn: {
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md, backgroundColor: Colors.bgInput,
  },
  cancelBtnText: { color: Colors.textSecondary, fontWeight: '600', fontSize: FontSize.md },
  sendBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md, backgroundColor: Colors.primary,
  },
  sendBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md },
});
