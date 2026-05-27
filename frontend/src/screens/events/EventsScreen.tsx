import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, TextInput, Alert, Modal, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { useEventStore, Event } from '../../store/eventStore';

const EVENT_TYPES = ['All', 'meetup', 'webinar', 'workshop', 'social'];
const TYPE_ICONS: Record<string, string> = {
  meetup: 'people', webinar: 'videocam', workshop: 'construct', social: 'happy',
};

export default function EventsScreen() {
  const { events, isLoading, fetchEvents, createEvent } = useEventStore();
  const [filter, setFilter] = useState('All');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', date: '', location: '', type: 'meetup' });

  useEffect(() => { fetchEvents(); }, []);

  const filtered = filter === 'All' ? events : events.filter(e => e.type === filter);

  const handleCreate = async () => {
    if (!form.title) { Alert.alert('Error', 'Title is required'); return; }
    await createEvent({ ...form, date: form.date || new Date().toISOString() } as Partial<Event>);
    setShowCreate(false);
    setForm({ title: '', description: '', date: '', location: '', type: 'meetup' });
  };

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
    catch { return d; }
  };

  const renderEvent = ({ item }: { item: Event }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.8}>
      <View style={styles.cardHeader}>
        <View style={[styles.typeBadge, { backgroundColor: Colors.primaryGlow }]}>
          <Ionicons name={(TYPE_ICONS[item.type] || 'calendar') as any} size={14} color={Colors.primary} />
          <Text style={styles.typeBadgeText}>{item.type}</Text>
        </View>
        <Text style={styles.dateText}>{formatDate(item.date)}</Text>
      </View>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
      <View style={styles.cardFooter}>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.locationText}>{item.location || 'TBD'}</Text>
        </View>
        <View style={styles.rsvpRow}>
          <Ionicons name="people-outline" size={14} color={Colors.accent} />
          <Text style={styles.rsvpText}>{item.rsvpCount} going</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.heroTitle}>Events</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreate(true)}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ gap: Spacing.sm, paddingHorizontal: Spacing.md }}>
        {EVENT_TYPES.map(t => (
          <TouchableOpacity key={t} style={[styles.chip, filter === t && styles.chipActive]} onPress={() => setFilter(t)}>
            <Text style={[styles.chipText, filter === t && styles.chipTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        renderItem={renderEvent}
        contentContainerStyle={{ padding: Spacing.md, gap: Spacing.md }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchEvents} tintColor={Colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No events yet</Text>
          </View>
        }
      />

      {/* Create Modal */}
      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Event</Text>
            <TextInput style={styles.input} placeholder="Event Title" placeholderTextColor={Colors.textMuted}
              value={form.title} onChangeText={t => setForm(p => ({ ...p, title: t }))} />
            <TextInput style={[styles.input, { height: 80 }]} placeholder="Description" placeholderTextColor={Colors.textMuted}
              value={form.description} onChangeText={t => setForm(p => ({ ...p, description: t }))} multiline />
            <TextInput style={styles.input} placeholder="Location" placeholderTextColor={Colors.textMuted}
              value={form.location} onChangeText={t => setForm(p => ({ ...p, location: t }))} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCreate(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.createBtn} onPress={handleCreate}>
                <Text style={styles.createText}>Create</Text>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, paddingTop: 56, paddingBottom: Spacing.sm },
  heroTitle: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  filterRow: { maxHeight: 44, marginBottom: Spacing.sm },
  chip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primaryGlow, borderColor: Colors.primary },
  chipText: { fontSize: FontSize.sm, color: Colors.textMuted, textTransform: 'capitalize' },
  chipTextActive: { color: Colors.primary, fontWeight: '600' },
  card: { backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full },
  typeBadgeText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '600', textTransform: 'capitalize' },
  dateText: { fontSize: FontSize.xs, color: Colors.textMuted },
  cardTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  cardDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 18 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.sm },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: FontSize.xs, color: Colors.textMuted },
  rsvpRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rsvpText: { fontSize: FontSize.xs, color: Colors.accent, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 80, gap: Spacing.md },
  emptyText: { fontSize: FontSize.md, color: Colors.textMuted },
  modalOverlay: { flex: 1, backgroundColor: Colors.bgOverlay, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.bgCard, borderTopLeftRadius: BorderRadius.lg, borderTopRightRadius: BorderRadius.lg, padding: Spacing.lg, gap: Spacing.md },
  modalTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary },
  input: { backgroundColor: Colors.bgInput, borderRadius: BorderRadius.sm, padding: Spacing.md, color: Colors.textPrimary, fontSize: FontSize.md, borderWidth: 1, borderColor: Colors.border },
  modalActions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm },
  cancelBtn: { flex: 1, padding: Spacing.md, borderRadius: BorderRadius.sm, backgroundColor: Colors.bgDark, alignItems: 'center' },
  cancelText: { color: Colors.textSecondary, fontWeight: '600' },
  createBtn: { flex: 1, padding: Spacing.md, borderRadius: BorderRadius.sm, backgroundColor: Colors.primary, alignItems: 'center' },
  createText: { color: '#fff', fontWeight: '700' },
});
