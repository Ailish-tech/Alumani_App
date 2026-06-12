import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, TextInput, Alert, Modal, ScrollView, Platform, Animated,
} from 'react-native';
import { AppleAlert } from '../../components/AppleAlert';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useEventStore, Event } from '../../store/eventStore';

const TYPE_ICONS: Record<string, string> = { meetup: 'people', webinar: 'videocam', workshop: 'construct', social: 'happy' };
const TYPE_COLORS: Record<string, [string, string]> = {
  meetup: ['#667EEA', '#764BA2'], webinar: ['#4FACFE', '#00F2FE'],
  workshop: ['#FA709A', '#FEE140'], social: ['#43E97B', '#38F9D7'],
};
const EVENT_TYPES = ['All', 'meetup', 'webinar', 'workshop', 'social'];

export default function EventsScreen({ navigation }: any) {
  const { events, isLoading, fetchEvents, createEvent } = useEventStore();
  const [filter, setFilter] = useState('All');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', date: '', location: '', type: 'meetup' });

  useEffect(() => { fetchEvents(); }, []);
  const filtered = filter === 'All' ? events : events.filter(e => e.type === filter);

  const handleCreate = async () => {
    if (!form.title) { AppleAlert.alert('Error', 'Title is required'); return; }
    await createEvent({ ...form, date: form.date || new Date().toISOString() } as Partial<Event>);
    setShowCreate(false);
    setForm({ title: '', description: '', date: '', location: '', type: 'meetup' });
  };

  const formatDate = (d: string) => {
    try {
      const date = new Date(d);
      return { month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(), day: date.getDate().toString() };
    } catch { return { month: 'TBD', day: '-' }; }
  };

  const renderEvent = ({ item, index }: { item: Event; index: number }) => {
    const { month, day } = formatDate(item.date);
    const gradient = TYPE_COLORS[item.type] || ['#667EEA', '#764BA2'];
    return (
      <TouchableOpacity style={s.card} activeOpacity={0.8}>
        <View style={s.cardLeft}>
          <LinearGradient colors={gradient} style={s.dateCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={s.dateMonth}>{month}</Text>
            <Text style={s.dateDay}>{day}</Text>
          </LinearGradient>
        </View>
        <View style={s.cardContent}>
          <Text style={s.cardTitle}>{item.title}</Text>
          {item.description ? <Text style={s.cardDesc} numberOfLines={2}>{item.description}</Text> : null}
          <View style={s.cardMeta}>
            <View style={s.metaItem}>
              <Ionicons name="location-outline" size={13} color="#8E8E93" />
              <Text style={s.metaText}>{item.location || 'TBD'}</Text>
            </View>
            <View style={s.metaItem}>
              <Ionicons name="people-outline" size={13} color="#34C759" />
              <Text style={[s.metaText, { color: '#34C759', fontWeight: '600' }]}>{item.rsvpCount} going</Text>
            </View>
          </View>
        </View>
        <View style={[s.typePill, { backgroundColor: `${gradient[0]}14` }]}>
          <Ionicons name={(TYPE_ICONS[item.type] || 'calendar') as any} size={11} color={gradient[0]} />
          <Text style={[s.typePillText, { color: gradient[0] }]}>{item.type}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Events</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowCreate(true)}>
          <LinearGradient colors={['#667EEA', '#764BA2']} style={s.addBtnGrad}>
            <Ionicons name="add" size={22} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterRow}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {EVENT_TYPES.map(t => {
          const active = filter === t;
          return active ? (
            <TouchableOpacity key={t} onPress={() => setFilter(t)}>
              <LinearGradient colors={['#667EEA', '#764BA2']} style={s.chip}>
                <Text style={s.chipTextActive}>{t}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity key={t} style={s.chipInactive} onPress={() => setFilter(t)}>
              <Text style={s.chipText}>{t}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <FlatList data={filtered} keyExtractor={i => i.id} renderItem={renderEvent}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchEvents} tintColor="#667EEA" colors={['#667EEA']} />}
        ListEmptyComponent={
          <View style={s.empty}><Ionicons name="calendar-outline" size={48} color="#C7C7CC" /><Text style={s.emptyText}>No events yet</Text></View>
        }
      />

      {/* Create Modal */}
      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={s.overlay}>
          <View style={s.modal}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>Create Event</Text>
            <TextInput style={s.input} placeholder="Event Title" placeholderTextColor="#C7C7CC" value={form.title} onChangeText={t => setForm(p => ({ ...p, title: t }))} />
            <TextInput style={[s.input, { height: 80 }]} placeholder="Description" placeholderTextColor="#C7C7CC" value={form.description} onChangeText={t => setForm(p => ({ ...p, description: t }))} multiline />
            <TextInput style={s.input} placeholder="Location" placeholderTextColor="#C7C7CC" value={form.location} onChangeText={t => setForm(p => ({ ...p, location: t }))} />
            <View style={s.modalActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setShowCreate(false)}>
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreate}>
                <LinearGradient colors={['#667EEA', '#764BA2']} style={s.createBtn}>
                  <Text style={s.createText}>Create</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 56 : 44, paddingBottom: 10, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(120,120,128,0.08)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1C1C1E' },
  addBtn: {},
  addBtnGrad: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  filterRow: { flexGrow: 0, paddingVertical: 10, backgroundColor: '#FFF' },
  chip: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20 },
  chipInactive: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(120,120,128,0.08)' },
  chipText: { fontSize: 13, color: '#8E8E93', fontWeight: '500', textTransform: 'capitalize' },
  chipTextActive: { fontSize: 13, color: '#fff', fontWeight: '700', textTransform: 'capitalize' },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, flexDirection: 'row', gap: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, position: 'relative' },
  cardLeft: {},
  dateCard: { width: 52, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  dateMonth: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.8)' },
  dateDay: { fontSize: 22, fontWeight: '800', color: '#fff' },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1C1C1E', letterSpacing: -0.2 },
  cardDesc: { fontSize: 13, color: '#8E8E93', lineHeight: 18, marginTop: 2 },
  cardMeta: { flexDirection: 'row', gap: 16, marginTop: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#8E8E93' },
  typePill: { position: 'absolute', top: 14, right: 14, flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  typePillText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, color: '#8E8E93' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, gap: 14 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#D1D1D6', alignSelf: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1C1C1E' },
  input: { backgroundColor: '#F2F2F7', borderRadius: 12, padding: 14, fontSize: 15, color: '#1C1C1E' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 24, backgroundColor: '#F2F2F7', alignItems: 'center' },
  cancelText: { color: '#8E8E93', fontWeight: '600', fontSize: 15 },
  createBtn: { flex: 1, padding: 14, borderRadius: 24, alignItems: 'center', minWidth: 140 },
  createText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
