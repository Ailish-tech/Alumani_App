import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, TextInput, Alert, Modal, ScrollView, Platform,
} from 'react-native';
import { AppleAlert } from '../../components/AppleAlert';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useJobStore, Job } from '../../store/jobStore';

const JOB_TYPES = ['All', 'job', 'internship'];

export default function JobBoardScreen({ navigation }: any) {
  const { jobs, isLoading, fetchJobs, createJob } = useJobStore();
  const [filter, setFilter] = useState('All');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', company: '', type: 'job', description: '', location: '', salary: '' });

  useEffect(() => { fetchJobs(); }, []);
  const filtered = filter === 'All' ? jobs : jobs.filter(j => j.type === filter);

  const handleCreate = async () => {
    if (!form.title || !form.company) { AppleAlert.alert('Error', 'Title and company required'); return; }
    await createJob(form as Partial<Job>);
    setShowCreate(false);
    setForm({ title: '', company: '', type: 'job', description: '', location: '', salary: '' });
  };

  const renderJob = ({ item }: { item: Job }) => {
    const isInternship = item.type === 'internship';
    const gradient: [string, string] = isInternship ? ['#4FACFE', '#00F2FE'] : ['#43E97B', '#38F9D7'];
    return (
      <TouchableOpacity style={s.card} activeOpacity={0.8}>
        <View style={s.cardRow}>
          <LinearGradient colors={gradient} style={s.iconBox}>
            <Ionicons name={isInternship ? 'school' : 'briefcase'} size={18} color="#fff" />
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={s.jobTitle}>{item.title}</Text>
            <Text style={s.company}>{item.company}</Text>
          </View>
          {item.salary ? (
            <View style={s.salaryBadge}><Text style={s.salaryText}>{item.salary}</Text></View>
          ) : null}
        </View>
        {item.description ? <Text style={s.desc} numberOfLines={2}>{item.description}</Text> : null}
        <View style={s.footer}>
          <View style={s.metaItem}><Ionicons name="location-outline" size={13} color="#8E8E93" /><Text style={s.metaText}>{item.location}</Text></View>
          <View style={s.metaItem}><Ionicons name="people-outline" size={13} color="#667EEA" /><Text style={[s.metaText, { color: '#667EEA', fontWeight: '600' }]}>{item.applicantsCount} applied</Text></View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}><Ionicons name="chevron-back" size={24} color="#1C1C1E" /></TouchableOpacity>
        <Text style={s.headerTitle}>Jobs & Internships</Text>
        <TouchableOpacity onPress={() => setShowCreate(true)}>
          <LinearGradient colors={['#43E97B', '#38F9D7']} style={s.addBtnGrad}><Ionicons name="add" size={22} color="#fff" /></LinearGradient>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterRow} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {JOB_TYPES.map(t => {
          const active = filter === t;
          return active ? (
            <TouchableOpacity key={t} onPress={() => setFilter(t)}>
              <LinearGradient colors={['#43E97B', '#38F9D7']} style={s.chip}><Text style={s.chipTextActive}>{t === 'All' ? 'All' : t === 'job' ? 'Jobs' : 'Internships'}</Text></LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity key={t} style={s.chipInactive} onPress={() => setFilter(t)}>
              <Text style={s.chipText}>{t === 'All' ? 'All' : t === 'job' ? 'Jobs' : 'Internships'}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <FlatList data={filtered} keyExtractor={i => i.id} renderItem={renderJob}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => fetchJobs()} tintColor="#43E97B" colors={['#43E97B']} />}
        ListEmptyComponent={<View style={s.empty}><Ionicons name="briefcase-outline" size={48} color="#C7C7CC" /><Text style={s.emptyText}>No jobs posted yet</Text></View>}
      />

      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={s.overlay}><ScrollView style={s.modal}>
          <View style={s.modalHandle} />
          <Text style={s.modalTitle}>Post a Job</Text>
          <TextInput style={s.input} placeholder="Job Title" placeholderTextColor="#C7C7CC" value={form.title} onChangeText={t => setForm(p => ({ ...p, title: t }))} />
          <TextInput style={s.input} placeholder="Company" placeholderTextColor="#C7C7CC" value={form.company} onChangeText={t => setForm(p => ({ ...p, company: t }))} />
          <TextInput style={[s.input, { height: 80 }]} placeholder="Description" placeholderTextColor="#C7C7CC" value={form.description} onChangeText={t => setForm(p => ({ ...p, description: t }))} multiline />
          <TextInput style={s.input} placeholder="Location" placeholderTextColor="#C7C7CC" value={form.location} onChangeText={t => setForm(p => ({ ...p, location: t }))} />
          <TextInput style={s.input} placeholder="Salary (optional)" placeholderTextColor="#C7C7CC" value={form.salary} onChangeText={t => setForm(p => ({ ...p, salary: t }))} />
          <View style={s.typeRow}>
            {['job', 'internship'].map(t => (
              <TouchableOpacity key={t} onPress={() => setForm(p => ({ ...p, type: t }))}>
                {form.type === t ? (
                  <LinearGradient colors={t === 'job' ? ['#43E97B', '#38F9D7'] : ['#4FACFE', '#00F2FE']} style={s.typeBtn}><Text style={s.typeBtnTextActive}>{t === 'job' ? 'Job' : 'Internship'}</Text></LinearGradient>
                ) : (
                  <View style={s.typeBtnInactive}><Text style={s.typeBtnText}>{t === 'job' ? 'Job' : 'Internship'}</Text></View>
                )}
              </TouchableOpacity>
            ))}
          </View>
          <View style={s.modalActions}>
            <TouchableOpacity style={s.cancelBtn} onPress={() => setShowCreate(false)}><Text style={s.cancelText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity onPress={handleCreate}><LinearGradient colors={['#43E97B', '#38F9D7']} style={s.createBtn}><Text style={s.createText}>Post</Text></LinearGradient></TouchableOpacity>
          </View>
        </ScrollView></View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 56 : 44, paddingBottom: 10, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(120,120,128,0.08)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1C1C1E' },
  addBtnGrad: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  filterRow: { flexGrow: 0, paddingVertical: 10, backgroundColor: '#FFF' },
  chip: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20 },
  chipInactive: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(120,120,128,0.08)' },
  chipText: { fontSize: 13, color: '#8E8E93', fontWeight: '500' },
  chipTextActive: { fontSize: 13, color: '#fff', fontWeight: '700' },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  jobTitle: { fontSize: 16, fontWeight: '700', color: '#1C1C1E', letterSpacing: -0.2 },
  company: { fontSize: 13, color: '#667EEA', fontWeight: '600', marginTop: 1 },
  salaryBadge: { backgroundColor: '#34C75918', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  salaryText: { fontSize: 12, fontWeight: '700', color: '#34C759' },
  desc: { fontSize: 13, color: '#8E8E93', lineHeight: 18, marginTop: 8 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F2F2F7' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#8E8E93' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, color: '#8E8E93' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, gap: 12, maxHeight: '80%' },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#D1D1D6', alignSelf: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1C1C1E', marginBottom: 4 },
  input: { backgroundColor: '#F2F2F7', borderRadius: 12, padding: 14, fontSize: 15, color: '#1C1C1E', marginBottom: 8 },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  typeBtn: { flex: 1, padding: 12, borderRadius: 20, alignItems: 'center', minWidth: 120 },
  typeBtnInactive: { flex: 1, padding: 12, borderRadius: 20, alignItems: 'center', backgroundColor: 'rgba(120,120,128,0.08)', minWidth: 120 },
  typeBtnText: { color: '#8E8E93', fontWeight: '600' },
  typeBtnTextActive: { color: '#fff', fontWeight: '700' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 24, backgroundColor: '#F2F2F7', alignItems: 'center' },
  cancelText: { color: '#8E8E93', fontWeight: '600', fontSize: 15 },
  createBtn: { flex: 1, padding: 14, borderRadius: 24, alignItems: 'center', minWidth: 140 },
  createText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
