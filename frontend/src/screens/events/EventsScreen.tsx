import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, TextInput, Alert, Modal, ScrollView, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { useEventStore, Event } from '../../store/eventStore';

const mm = Colors.mm;
const GLASS_BG = mm.glassBackground;
const CARD_BORDER = `${mm.outlineVariant}1A`;
const DIVIDER = `${mm.outlineVariant}0D`;

const EVENT_TYPES = ['All', 'meetup', 'webinar', 'workshop', 'social'];
const TYPE_ICONS: Record<string, string> = {
  meetup: 'people', webinar: 'videocam', workshop: 'construct', social: 'happy',
};
const TYPE_LABELS: Record<string, string> = {
  meetup: 'NETWORKING', webinar: 'WEBINAR', workshop: 'WORKSHOP', social: 'SOCIAL',
};
const TYPE_COLORS: Record<string, string> = {
  meetup: mm.primary, webinar: mm.secondary, workshop: mm.secondary, social: '#ffafd3',
};

const TABS = ['Upcoming', 'Past', 'My Events'];

// ─── Featured Event Hero ───────────────────────────────────────────────────────

function FeaturedEvent({ event }: { event: Event }) {
  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
        ' • ' + new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch { return d; }
  };

  return (
    <View style={styles.heroWrapper}>
      {/* Ambient glow */}
      <View style={styles.heroGlow} />

      <View style={styles.heroCard}>
        <LinearGradient
          colors={[mm.surfaceContainerLow, mm.surfaceDim, `${mm.secondaryContainer}33`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        />
        <View style={styles.heroContent}>
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredBadgeText}>FEATURED EVENT</Text>
          </View>

          <Text style={styles.heroTitle}>{event.title}</Text>

          <View style={styles.heroMeta}>
            <View style={styles.heroMetaItem}>
              <Ionicons name="calendar" size={16} color={mm.primary} />
              <Text style={styles.heroMetaText}>{formatDate(event.date)}</Text>
            </View>
            <View style={styles.heroMetaItem}>
              <Ionicons name="location" size={16} color={mm.primary} />
              <Text style={styles.heroMetaText}>{event.location || 'Online'}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.rsvpHeroBtnWrapper} activeOpacity={0.85}>
            <LinearGradient
              colors={[mm.gradientStart, mm.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.rsvpHeroBtn}
            >
              <Text style={styles.rsvpHeroBtnText}>RSVP Now</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Event Card ────────────────────────────────────────────────────────────────

function EventCard({ event }: { event: Event }) {
  const typeLabel = TYPE_LABELS[event.type] || 'EVENT';
  const typeColor = TYPE_COLORS[event.type] || mm.primary;

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
        ' • ' + new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch { return d; }
  };

  return (
    <View style={styles.eventCard}>
      {/* Type badge area (simulating image header) */}
      <View style={styles.eventCardImageArea}>
        <LinearGradient
          colors={[mm.surfaceContainerLow, mm.surfaceContainer]}
          style={styles.eventCardImageGradient}
        >
          <Ionicons name={(TYPE_ICONS[event.type] || 'calendar') as any} size={40} color={`${typeColor}66`} />
        </LinearGradient>
        <View style={[styles.eventTypeBadge, { backgroundColor: `${mm.surfaceDim}CC` }]}>
          <Text style={[styles.eventTypeBadgeText, { color: typeColor }]}>{typeLabel}</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.eventCardContent}>
        <Text style={styles.eventCardTitle} numberOfLines={2}>{event.title}</Text>

        <View style={styles.eventCardMeta}>
          <View style={styles.eventMetaItem}>
            <Ionicons name="time-outline" size={16} color={mm.primary} />
            <Text style={styles.eventMetaText}>{formatDate(event.date)}</Text>
          </View>
          <View style={styles.eventMetaItem}>
            <Ionicons name={event.type === 'webinar' ? 'videocam-outline' : 'location-outline'} size={16} color={mm.primary} />
            <Text style={styles.eventMetaText}>{event.location || 'Online'}</Text>
          </View>
        </View>

        {/* Attendees + RSVP */}
        <View style={styles.eventCardFooter}>
          <View style={styles.attendeesRow}>
            {[0, 1, 2].map(i => (
              <View key={i} style={[styles.attendeeAvatar, { marginLeft: i > 0 ? -10 : 0 }]}>
                <Ionicons name="person" size={12} color={mm.onSurfaceVariant} />
              </View>
            ))}
            <View style={[styles.attendeeMore, { marginLeft: -10 }]}>
              <Text style={styles.attendeeMoreText}>+{event.rsvpCount}</Text>
            </View>
          </View>
          <TouchableOpacity activeOpacity={0.85}>
            <LinearGradient
              colors={[mm.gradientStart, mm.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.rsvpBtn}
            >
              <Text style={styles.rsvpBtnText}>RSVP</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Events Screen ─────────────────────────────────────────────────────────────

export default function EventsScreen() {
  const { events, isLoading, fetchEvents, createEvent } = useEventStore();
  const [filter, setFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('Upcoming');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', date: '', location: '', type: 'meetup' });

  useEffect(() => { fetchEvents(); }, []);

  const filtered = filter === 'All' ? events : events.filter(e => e.type === filter);
  const featuredEvent = events.length > 0 ? events[0] : null;

  const handleCreate = async () => {
    if (!form.title) { Alert.alert('Error', 'Title is required'); return; }
    await createEvent({ ...form, date: form.date || new Date().toISOString() } as Partial<Event>);
    setShowCreate(false);
    setForm({ title: '', description: '', date: '', location: '', type: 'meetup' });
  };

  const renderHeader = () => (
    <View>
      {/* Featured Hero */}
      {featuredEvent && <FeaturedEvent event={featuredEvent} />}

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        renderItem={({ item }) => <EventCard event={item} />}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchEvents} tintColor={mm.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="calendar-outline" size={48} color={mm.outline} />
            </View>
            <Text style={styles.emptyText}>No events yet</Text>
            <Text style={styles.emptySubtext}>Create an event to get started</Text>
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
          <Ionicons name="add" size={28} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Create Modal */}
      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Event</Text>
              <TouchableOpacity onPress={() => setShowCreate(false)}>
                <Ionicons name="close" size={24} color={mm.outline} />
              </TouchableOpacity>
            </View>

            <TextInput style={styles.input} placeholder="Event Title" placeholderTextColor={mm.outline}
              value={form.title} onChangeText={t => setForm(p => ({ ...p, title: t }))} />
            <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} placeholder="Description" placeholderTextColor={mm.outline}
              value={form.description} onChangeText={t => setForm(p => ({ ...p, description: t }))} multiline />
            <TextInput style={styles.input} placeholder="Location" placeholderTextColor={mm.outline}
              value={form.location} onChangeText={t => setForm(p => ({ ...p, location: t }))} />

            {/* Type Selector */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}
              contentContainerStyle={{ gap: 8 }}>
              {EVENT_TYPES.filter(t => t !== 'All').map(t => (
                <TouchableOpacity key={t} style={[styles.typeChip, form.type === t && styles.typeChipActive]}
                  onPress={() => setForm(p => ({ ...p, type: t }))}>
                  <Ionicons name={(TYPE_ICONS[t] || 'calendar') as any} size={16}
                    color={form.type === t ? mm.primary : mm.outline} />
                  <Text style={[styles.typeChipText, form.type === t && styles.typeChipTextActive]}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCreate(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.createBtnWrapper} onPress={handleCreate} activeOpacity={0.85}>
                <LinearGradient
                  colors={[mm.gradientStart, mm.gradientEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.createBtn}
                >
                  <Text style={styles.createBtnText}>Create Event</Text>
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

  // ── Featured Event Hero ──────────────────────────────────────
  heroWrapper: { paddingHorizontal: 16, paddingTop: 8, marginBottom: 24, position: 'relative' },
  heroGlow: {
    position: 'absolute', top: -20, left: '20%', width: 200, height: 200,
    borderRadius: 100, backgroundColor: `${mm.primaryContainer}1A`,
  },
  heroCard: {
    borderRadius: 28, overflow: 'hidden', position: 'relative',
    minHeight: 260,
  },
  heroGradient: { ...StyleSheet.absoluteFillObject },
  heroContent: {
    flex: 1, justifyContent: 'flex-end', padding: 28,
  },
  featuredBadge: {
    backgroundColor: mm.primaryContainer, alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, marginBottom: 12,
  },
  featuredBadgeText: {
    fontSize: 9, fontWeight: '800', color: mm.onPrimaryContainer,
    letterSpacing: 1, textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 30, fontWeight: '800', color: mm.onSurface,
    letterSpacing: -1, lineHeight: 36, marginBottom: 14,
  },
  heroMeta: { gap: 8, marginBottom: 20 },
  heroMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroMetaText: { fontSize: 13, fontWeight: '500', color: mm.onSurfaceVariant },
  rsvpHeroBtnWrapper: {
    borderRadius: 12, overflow: 'hidden', alignSelf: 'flex-start',
    shadowColor: mm.primaryContainer,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 6,
  },
  rsvpHeroBtn: { paddingHorizontal: 36, paddingVertical: 14, borderRadius: 12 },
  rsvpHeroBtnText: { fontSize: 15, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },

  // ── Tab Bar ──────────────────────────────────────────────────
  tabBar: {
    flexDirection: 'row', gap: 4,
    backgroundColor: mm.surfaceContainerLow,
    borderRadius: 16, padding: 6,
    marginHorizontal: 16, marginBottom: 24,
    alignSelf: 'flex-start',
  },
  tab: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  tabActive: {
    backgroundColor: mm.surfaceContainerHigh,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  tabText: { fontSize: 13, fontWeight: '500', color: mm.outline },
  tabTextActive: { color: mm.primary, fontWeight: '600' },

  // ── Event Card ───────────────────────────────────────────────
  eventCard: {
    backgroundColor: GLASS_BG,
    borderRadius: 28,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginBottom: 20,
    borderWidth: 0.5,
    borderColor: CARD_BORDER,
  },
  eventCardImageArea: {
    height: 140, position: 'relative', overflow: 'hidden',
  },
  eventCardImageGradient: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
  },
  eventTypeBadge: {
    position: 'absolute', top: 12, left: 12,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  eventTypeBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },

  eventCardContent: { padding: 24 },
  eventCardTitle: {
    fontSize: 22, fontWeight: '700', color: mm.onSurface,
    letterSpacing: -0.3, marginBottom: 14,
  },
  eventCardMeta: { gap: 10, marginBottom: 20 },
  eventMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  eventMetaText: { fontSize: 13, fontWeight: '500', color: mm.onSurfaceVariant },

  eventCardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  attendeesRow: { flexDirection: 'row', alignItems: 'center' },
  attendeeAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: mm.surfaceContainerHigh,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: mm.surfaceContainer,
  },
  attendeeMore: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: mm.surfaceContainerHighest,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: mm.surfaceContainer,
  },
  attendeeMoreText: { fontSize: 9, fontWeight: '700', color: mm.onSurface },
  rsvpBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 },
  rsvpBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  // ── Empty ────────────────────────────────────────────────────
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
    borderRadius: 28, overflow: 'hidden',
    shadowColor: mm.primaryContainer,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 40,
    elevation: 12,
  },
  fab: {
    width: 60, height: 60, borderRadius: 30,
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
  typeScroll: { marginBottom: 16, maxHeight: 44 },
  typeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 999, backgroundColor: mm.surfaceContainerLow,
    borderWidth: 0.5, borderColor: CARD_BORDER,
  },
  typeChipActive: { borderColor: `${mm.primary}66`, backgroundColor: `${mm.primary}0D` },
  typeChipText: { fontSize: 13, color: mm.outline, fontWeight: '500' },
  typeChipTextActive: { color: mm.primary, fontWeight: '600' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    backgroundColor: mm.surfaceContainerLow, alignItems: 'center',
  },
  cancelText: { color: mm.onSurfaceVariant, fontWeight: '600', fontSize: 14 },
  createBtnWrapper: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  createBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
