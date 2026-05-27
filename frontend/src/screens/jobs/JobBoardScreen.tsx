import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, TextInput, Alert, Modal, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { useJobStore, Job } from '../../store/jobStore';

const JOB_TYPES = ['All', 'job', 'internship'];

export default function JobBoardScreen() {
  const { jobs, isLoading, fetchJobs, createJob } = useJobStore();
  const [filter, setFilter] = useState('All');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', company: '', type: 'job', description: '', location: '', salary: '' });

  useEffect(() => { fetchJobs(); }, []);

  const filtered = filter === 'All' ? jobs : jobs.filter(j => j.type === filter);

  const handleCreate = async () => {
    if (!form.title || !form.company) { Alert.alert('Error', 'Title and company are required'); return; }
    await createJob(form as Partial<Job>);
    setShowCreate(false);
    setForm({ title: '', company: '', type: 'job', description: '', location: '', salary: '' });
  };

  const renderJob = ({ item }: { item: Job }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.8}>
      <View style={styles.cardHeader}>
        <View style={[styles.typeBadge, { backgroundColor: item.type === 'internship' ? 'rgba(0,217,255,0.15)' : 'rgba(0,230,118,0.15)' }]}>
          <Ionicons name={item.type === 'internship' ? 'school' : 'briefcase'} size={14}
            color={item.type === 'internship' ? Colors.accent : Colors.success} />
          <Text style={[styles.typeBadgeText, { color: item.type === 'internship' ? Colors.accent : Colors.success }]}>
            {item.type}
          </Text>
        </View>
        {item.salary ? <Text style={styles.salaryText}>{item.salary}</Text> : null}
      </View>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.companyText}>{item.company}</Text>
      <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
      <View style={styles.cardFooter}>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.locationText}>{item.location}</Text>
        </View>
        <View style={styles.applicantRow}>
          <Ionicons name="people-outline" size={14} color={Colors.primary} />
          <Text style={styles.applicantText}>{item.applicantsCount} applied</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heroTitle}>Jobs & Internships</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreate(true)}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}
        contentContainerStyle={{ gap: Spacing.sm, paddingHorizontal: Spacing.md }}>
        {JOB_TYPES.map(t => (
          <TouchableOpacity key={t} style={[styles.chip, filter === t && styles.chipActive]} onPress={() => setFilter(t)}>
            <Text style={[styles.chipText, filter === t && styles.chipTextActive]}>
              {t === 'All' ? 'All' : t === 'job' ? '💼 Jobs' : '🎓 Internships'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        renderItem={renderJob}
        contentContainerStyle={{ padding: Spacing.md, gap: Spacing.md }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => fetchJobs()} tintColor={Colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="briefcase-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No jobs posted yet</Text>
          </View>
        }
      />

      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalTitle}>Post a Job</Text>
            <TextInput style={styles.input} placeholder="Job Title" placeholderTextColor={Colors.textMuted}
              value={form.title} onChangeText={t => setForm(p => ({ ...p, title: t }))} />
            <TextInput style={styles.input} placeholder="Company" placeholderTextColor={Colors.textMuted}
              value={form.company} onChangeText={t => setForm(p => ({ ...p, company: t }))} />
            <TextInput style={[styles.input, { height: 80 }]} placeholder="Description" placeholderTextColor={Colors.textMuted}
              value={form.description} onChangeText={t => setForm(p => ({ ...p, description: t }))} multiline />
            <TextInput style={styles.input} placeholder="Location" placeholderTextColor={Colors.textMuted}
              value={form.location} onChangeText={t => setForm(p => ({ ...p, location: t }))} />
            <TextInput style={styles.input} placeholder="Salary (optional)" placeholderTextColor={Colors.textMuted}
              value={form.salary} onChangeText={t => setForm(p => ({ ...p, salary: t }))} />
            <View style={styles.typeRow}>
              {['job', 'internship'].map(t => (
                <TouchableOpacity key={t} style={[styles.typeBtn, form.type === t && styles.typeBtnActive]}
                  onPress={() => setForm(p => ({ ...p, type: t }))}>
                  <Text style={[styles.typeBtnText, form.type === t && styles.typeBtnTextActive]}>
                    {t === 'job' ? '💼 Job' : '🎓 Internship'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCreate(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.createBtn} onPress={handleCreate}>
                <Text style={styles.createText}>Post</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDark },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, paddingTop: 56, paddingBottom: Spacing.sm },
  heroTitle: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  filterRow: { maxHeight: 44, marginBottom: Spacing.sm },
  chip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primaryGlow, borderColor: Colors.primary },
  chipText: { fontSize: FontSize.sm, color: Colors.textMuted },
  chipTextActive: { color: Colors.primary, fontWeight: '600' },
  card: { backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full },
  typeBadgeText: { fontSize: FontSize.xs, fontWeight: '600', textTransform: 'capitalize' },
  salaryText: { fontSize: FontSize.sm, color: Colors.success, fontWeight: '700' },
  cardTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary, marginBottom: 2 },
  companyText: { fontSize: FontSize.md, color: Colors.primary, fontWeight: '600', marginBottom: 4 },
  cardDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 18 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.sm },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: FontSize.xs, color: Colors.textMuted },
  applicantRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  applicantText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 80, gap: Spacing.md },
  emptyText: { fontSize: FontSize.md, color: Colors.textMuted },
  modalOverlay: { flex: 1, backgroundColor: Colors.bgOverlay, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.bgCard, borderTopLeftRadius: BorderRadius.lg, borderTopRightRadius: BorderRadius.lg, padding: Spacing.lg, gap: Spacing.md, maxHeight: '80%' },
  modalTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm },
  input: { backgroundColor: Colors.bgInput, borderRadius: BorderRadius.sm, padding: Spacing.md, color: Colors.textPrimary, fontSize: FontSize.md, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.sm },
  typeRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  typeBtn: { flex: 1, padding: Spacing.md, borderRadius: BorderRadius.sm, backgroundColor: Colors.bgDark, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  typeBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryGlow },
  typeBtnText: { color: Colors.textMuted, fontWeight: '600' },
  typeBtnTextActive: { color: Colors.primary },
  modalActions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm },
  cancelBtn: { flex: 1, padding: Spacing.md, borderRadius: BorderRadius.sm, backgroundColor: Colors.bgDark, alignItems: 'center' },
  cancelText: { color: Colors.textSecondary, fontWeight: '600' },
  createBtn: { flex: 1, padding: Spacing.md, borderRadius: BorderRadius.sm, backgroundColor: Colors.primary, alignItems: 'center' },
  createText: { color: '#fff', fontWeight: '700' },
});
