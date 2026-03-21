import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, TextInput, Alert, Modal, ScrollView, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { useJobStore, Job } from '../../store/jobStore';

const mm = Colors.mm;
const GLASS_BG = mm.glassBackground;
const CARD_BORDER = `${mm.outlineVariant}1A`;
const DIVIDER = `${mm.outlineVariant}0D`;
const SCREEN_WIDTH = Dimensions.get('window').width;

const FILTER_TYPES = ['All', 'Full-time', 'Internship', 'Remote', 'Freelance'];
const TYPE_MAP: Record<string, string> = { 'All': 'All', 'Full-time': 'job', 'Internship': 'internship', 'Remote': 'job', 'Freelance': 'job' };

// ─── Featured Card ─────────────────────────────────────────────────────────────

function FeaturedCard({ job }: { job: Job }) {
  const isPriority = job.type === 'internship';
  return (
    <View style={styles.featuredCard}>
      {/* Glow */}
      <View style={[styles.featuredGlow, { backgroundColor: isPriority ? `${mm.primaryContainer}1A` : `${mm.secondaryContainer}1A` }]} />

      <View style={styles.featuredTop}>
        <View style={styles.featuredIcon}>
          <Ionicons name={isPriority ? 'school' : 'rocket'} size={22} color={isPriority ? mm.primary : mm.secondary} />
        </View>
        <View style={[styles.featuredBadge, {
          backgroundColor: isPriority ? 'rgba(255,175,211,0.2)' : `${mm.primary}33`,
          borderColor: isPriority ? 'rgba(255,175,211,0.2)' : `${mm.primary}33`,
        }]}>
          <Text style={[styles.featuredBadgeText, { color: isPriority ? '#ffafd3' : mm.primary }]}>
            {isPriority ? 'HIGH PRIORITY' : 'FEATURED'}
          </Text>
        </View>
      </View>

      <Text style={styles.featuredTitle} numberOfLines={1}>{job.title}</Text>
      <Text style={styles.featuredCompany}>{job.company}</Text>

      <View style={styles.featuredMeta}>
        <View style={styles.metaItem}>
          <Ionicons name="location-outline" size={12} color={mm.outline} />
          <Text style={styles.metaText}>{job.location || 'Remote'}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="cash-outline" size={12} color={mm.outline} />
          <Text style={styles.metaText}>{job.salary || 'Competitive'}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Job Card ──────────────────────────────────────────────────────────────────

function JobCard({ job }: { job: Job }) {
  const icons: Record<string, string> = { job: 'briefcase', internship: 'school' };
  const iconColors: Record<string, string> = { job: mm.secondary, internship: mm.primary };

  return (
    <View style={styles.jobCard}>
      <View style={styles.jobCardTop}>
        <View style={styles.jobIcon}>
          <Ionicons name={(icons[job.type] || 'briefcase') as any} size={24} color={iconColors[job.type] || mm.secondary} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.jobTitleRow}>
            <Text style={styles.jobTitle} numberOfLines={1}>{job.title}</Text>
            <Ionicons name="bookmark-outline" size={20} color={mm.outline} />
          </View>
          <Text style={styles.jobCompany}>{job.company}</Text>
        </View>
      </View>

      {/* Tags */}
      <View style={styles.tagRow}>
        <View style={styles.tag}>
          <Text style={styles.tagText}>{job.type === 'internship' ? 'INTERNSHIP' : 'FULL-TIME'}</Text>
        </View>
        {job.location?.toLowerCase().includes('remote') && (
          <View style={styles.tag}>
            <Text style={styles.tagText}>REMOTE</Text>
          </View>
        )}
      </View>

      {/* Description */}
      {job.description ? (
        <Text style={styles.jobDesc} numberOfLines={2}>{job.description}</Text>
      ) : null}

      {/* Footer */}
      <View style={styles.jobFooter}>
        <View>
          <View style={styles.jobLocationRow}>
            <Ionicons name="location-outline" size={12} color={mm.outline} />
            <Text style={styles.jobLocationText}>{job.location || 'Not specified'}</Text>
          </View>
          {job.salary ? (
            <Text style={styles.jobSalary}>{job.salary}</Text>
          ) : null}
        </View>
        <TouchableOpacity activeOpacity={0.85}>
          <LinearGradient
            colors={[mm.gradientStart, mm.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.applyBtn}
          >
            <Text style={styles.applyBtnText}>Apply Now</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Posted time */}
      <Text style={styles.postedTime}>{job.applicantsCount} applicants</Text>
    </View>
  );
}

// ─── Career Hub Screen ─────────────────────────────────────────────────────────

export default function JobBoardScreen() {
  const { jobs, isLoading, fetchJobs, createJob } = useJobStore();
  const [filter, setFilter] = useState('All');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', company: '', type: 'job', description: '', location: '', salary: '' });

  useEffect(() => { fetchJobs(); }, []);

  const filterType = TYPE_MAP[filter] || 'All';
  const filtered = filterType === 'All' ? jobs : jobs.filter(j => j.type === filterType);

  // First 2 jobs as featured
  const featuredJobs = jobs.slice(0, 2);

  const handleCreate = async () => {
    if (!form.title || !form.company) { Alert.alert('Error', 'Title and company are required'); return; }
    await createJob(form as Partial<Job>);
    setShowCreate(false);
    setForm({ title: '', company: '', type: 'job', description: '', location: '', salary: '' });
  };

  const renderHeader = () => (
    <View>
      {/* Featured Opportunities */}
      {featuredJobs.length > 0 && (
        <View style={styles.featuredSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Featured Opportunities</Text>
            <Text style={styles.seeAllText}>See all</Text>
          </View>
          <ScrollView
            horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 14, paddingHorizontal: 4, paddingBottom: 4 }}
          >
            {featuredJobs.map(j => <FeaturedCard key={j.id} job={j} />)}
          </ScrollView>
        </View>
      )}

      {/* Filter Chips */}
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
      >
        {FILTER_TYPES.map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.chip, filter === t && styles.chipActive]}
            onPress={() => setFilter(t)}
            activeOpacity={0.8}
          >
            <Text style={[styles.chipText, filter === t && styles.chipTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Recently Posted Title */}
      <Text style={styles.recentTitle}>Recently Posted</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        renderItem={({ item }) => <JobCard job={item} />}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => fetchJobs()} tintColor={mm.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="briefcase-outline" size={48} color={mm.outline} />
            </View>
            <Text style={styles.emptyText}>No jobs posted yet</Text>
            <Text style={styles.emptySubtext}>Check back later for new opportunities</Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fabWrapper} onPress={() => setShowCreate(true)} activeOpacity={0.85}>
        <LinearGradient
          colors={[mm.gradientStart, mm.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fab}
        >
          <Ionicons name="add" size={28} color={mm.onPrimary} />
        </LinearGradient>
      </TouchableOpacity>

      {/* Create Job Modal */}
      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Post a Job</Text>
              <TouchableOpacity onPress={() => setShowCreate(false)}>
                <Ionicons name="close" size={24} color={mm.outline} />
              </TouchableOpacity>
            </View>

            <TextInput style={styles.input} placeholder="Job Title" placeholderTextColor={mm.outline}
              value={form.title} onChangeText={t => setForm(p => ({ ...p, title: t }))} />
            <TextInput style={styles.input} placeholder="Company" placeholderTextColor={mm.outline}
              value={form.company} onChangeText={t => setForm(p => ({ ...p, company: t }))} />
            <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} placeholder="Description" placeholderTextColor={mm.outline}
              value={form.description} onChangeText={t => setForm(p => ({ ...p, description: t }))} multiline />
            <TextInput style={styles.input} placeholder="Location" placeholderTextColor={mm.outline}
              value={form.location} onChangeText={t => setForm(p => ({ ...p, location: t }))} />
            <TextInput style={styles.input} placeholder="Salary (optional)" placeholderTextColor={mm.outline}
              value={form.salary} onChangeText={t => setForm(p => ({ ...p, salary: t }))} />

            {/* Type Selector */}
            <View style={styles.typeRow}>
              {['job', 'internship'].map(t => (
                <TouchableOpacity key={t} style={[styles.typeBtn, form.type === t && styles.typeBtnActive]}
                  onPress={() => setForm(p => ({ ...p, type: t }))}>
                  <Ionicons name={t === 'job' ? 'briefcase' : 'school'} size={18}
                    color={form.type === t ? mm.primary : mm.outline} />
                  <Text style={[styles.typeBtnText, form.type === t && styles.typeBtnTextActive]}>
                    {t === 'job' ? 'Job' : 'Internship'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCreate(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.postBtnWrapper} onPress={handleCreate} activeOpacity={0.85}>
                <LinearGradient
                  colors={[mm.gradientStart, mm.gradientEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.postBtn}
                >
                  <Text style={styles.postBtnText}>Post Job</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles (Midnight Meridian) ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: mm.surfaceDim },

  // ── Featured Section ─────────────────────────────────────────
  featuredSection: { paddingTop: 8 },
  sectionHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    paddingHorizontal: 16, marginBottom: 14,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: mm.onSurface },
  seeAllText: { fontSize: 13, color: mm.primary, fontWeight: '500' },

  featuredCard: {
    width: 280,
    backgroundColor: GLASS_BG,
    borderRadius: 16,
    padding: 20,
    borderWidth: 0.5,
    borderColor: CARD_BORDER,
    overflow: 'hidden',
  },
  featuredGlow: {
    position: 'absolute', top: -40, right: -40,
    width: 120, height: 120, borderRadius: 60,
  },
  featuredTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 20,
  },
  featuredIcon: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: mm.surfaceContainerHigh,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 0.5, borderColor: `${mm.outline}1A`,
  },
  featuredBadge: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 999, borderWidth: 1,
  },
  featuredBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  featuredTitle: { fontSize: 17, fontWeight: '700', color: '#fff', marginBottom: 4 },
  featuredCompany: { fontSize: 13, color: mm.onSurfaceVariant, marginBottom: 14 },
  featuredMeta: { flexDirection: 'row', gap: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: mm.outline },

  // ── Filter Chips ─────────────────────────────────────────────
  filterRow: { marginVertical: 16, maxHeight: 44 },
  chip: {
    paddingHorizontal: 20, paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: mm.surfaceContainerHigh,
  },
  chipActive: {
    backgroundColor: '#6366F1',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  chipText: { fontSize: 13, color: mm.onSurfaceVariant, fontWeight: '500' },
  chipTextActive: { color: '#fff', fontWeight: '600' },

  // ── Recently Posted ──────────────────────────────────────────
  recentTitle: { fontSize: 18, fontWeight: '700', color: mm.onSurface, paddingHorizontal: 16, marginBottom: 12 },

  // ── Job Card ─────────────────────────────────────────────────
  jobCard: {
    backgroundColor: GLASS_BG,
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 14,
    borderWidth: 0.5,
    borderColor: CARD_BORDER,
  },
  jobCardTop: { flexDirection: 'row', gap: 14, alignItems: 'flex-start', marginBottom: 12 },
  jobIcon: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: mm.surfaceContainerHighest,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 0.5, borderColor: `${mm.outlineVariant}33`,
  },
  jobTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  jobTitle: { fontSize: 17, fontWeight: '700', color: mm.onSurface, flex: 1, marginRight: 8 },
  jobCompany: { fontSize: 13, color: mm.onSurfaceVariant, marginTop: 2 },

  // Tags
  tagRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tag: {
    paddingHorizontal: 8, paddingVertical: 3,
    backgroundColor: mm.surfaceContainerHigh,
    borderRadius: 4,
    borderWidth: 0.5, borderColor: `${mm.outlineVariant}1A`,
  },
  tagText: { fontSize: 9, fontWeight: '700', color: mm.onSurfaceVariant, letterSpacing: 0.5 },

  // Description
  jobDesc: { fontSize: 13, color: mm.onSurfaceVariant, lineHeight: 18, marginBottom: 12 },

  // Footer
  jobFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    paddingTop: 14, borderTopWidth: 0.5, borderTopColor: DIVIDER,
  },
  jobLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  jobLocationText: { fontSize: 11, color: mm.outline },
  jobSalary: { fontSize: 14, fontWeight: '600', color: mm.secondary, marginTop: 4 },
  applyBtn: {
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12,
    shadowColor: mm.primaryContainer,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  applyBtnText: { fontSize: 13, fontWeight: '700', color: mm.onPrimary },
  postedTime: { fontSize: 10, color: mm.outline, textAlign: 'right', marginTop: 10 },

  // ── Empty State ──────────────────────────────────────────────
  empty: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: `${mm.primary}0D`,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  emptyText: { fontSize: 18, color: mm.onSurfaceVariant, fontWeight: '600' },
  emptySubtext: { fontSize: 14, color: mm.outline },

  // ── FAB ──────────────────────────────────────────────────────
  fabWrapper: {
    position: 'absolute', bottom: 24, right: 24,
    borderRadius: 16, overflow: 'hidden',
    shadowColor: mm.primaryContainer,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 32,
    elevation: 12,
  },
  fab: {
    width: 56, height: 56, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Create Modal ─────────────────────────────────────────────
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: mm.surfaceContainer,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: mm.onSurface },
  input: {
    backgroundColor: mm.surfaceContainerLow, borderRadius: 12,
    padding: 14, color: mm.onSurface, fontSize: 14,
    borderWidth: 0.5, borderColor: CARD_BORDER, marginBottom: 12,
  },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  typeBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    backgroundColor: mm.surfaceContainerLow,
    alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 8,
    borderWidth: 0.5, borderColor: CARD_BORDER,
  },
  typeBtnActive: { borderColor: `${mm.primary}66`, backgroundColor: `${mm.primary}0D` },
  typeBtnText: { color: mm.outline, fontWeight: '600', fontSize: 14 },
  typeBtnTextActive: { color: mm.primary },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    backgroundColor: mm.surfaceContainerLow, alignItems: 'center',
  },
  cancelText: { color: mm.onSurfaceVariant, fontWeight: '600', fontSize: 14 },
  postBtnWrapper: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  postBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  postBtnText: { color: mm.onPrimary, fontWeight: '700', fontSize: 14 },
});
