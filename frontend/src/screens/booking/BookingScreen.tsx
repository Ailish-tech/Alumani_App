import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, TextInput, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import api from '../../services/api';

export default function BookingScreen() {
  const [mentors, setMentors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<any>(null);
  const [slots, setSlots] = useState<any[]>([]);

  // Note: in production, this would fetch mentors/faculty from a search endpoint
  useEffect(() => { setMentors([]); }, []);

  const loadSlots = async (mentorId: string) => {
    try { const r = await api.get(`/features/booking/slots/${mentorId}`); setSlots(r.data.data || []); } catch {}
  };

  const bookSlot = async (mentorId: string, dateTime: string) => {
    await api.post(`/features/booking/slots/${mentorId}/book`, { dateTime });
    Alert.alert('Booked!', 'Your slot has been booked.');
    loadSlots(mentorId);
  };

  return (
    <View style={s.container}>
      <View style={s.header}><Text style={s.title}>Office Hours</Text></View>
      <View style={s.info}>
        <Ionicons name="information-circle" size={20} color={Colors.accent} />
        <Text style={s.infoText}>Book 1-on-1 sessions with mentors and faculty</Text>
      </View>
      {slots.length > 0 ? (
        <FlatList data={slots} keyExtractor={(_, i) => String(i)} contentContainerStyle={{ padding: Spacing.md, gap: Spacing.sm }}
          renderItem={({ item }) => (
            <TouchableOpacity style={[s.slotCard, item.isBooked && s.slotBooked]}
              onPress={() => !item.isBooked && bookSlot(item.mentorId, item.dateTime)} disabled={item.isBooked}>
              <Ionicons name="time-outline" size={20} color={item.isBooked ? Colors.textMuted : Colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={s.slotTime}>{new Date(item.dateTime).toLocaleString()}</Text>
                <Text style={s.slotDur}>{item.duration || 30} min</Text>
              </View>
              <Text style={[s.slotStatus, { color: item.isBooked ? Colors.error : Colors.success }]}>
                {item.isBooked ? 'Booked' : 'Available'}
              </Text>
            </TouchableOpacity>
          )}
        />
      ) : (
        <View style={s.empty}>
          <Ionicons name="calendar-outline" size={48} color={Colors.textMuted} />
          <Text style={s.emptyText}>No slots available</Text>
          <Text style={s.emptySubText}>Ask your mentor to set up office hours</Text>
        </View>
      )}
    </View>
  );
}
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDark },
  header: { paddingHorizontal: Spacing.md, paddingTop: 56, paddingBottom: Spacing.sm },
  title: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary },
  info: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.bgCard, marginHorizontal: Spacing.md, padding: Spacing.md, borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: Colors.border },
  infoText: { fontSize: FontSize.sm, color: Colors.textSecondary, flex: 1 },
  slotCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgCard, borderRadius: BorderRadius.sm, padding: Spacing.md, gap: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  slotBooked: { opacity: 0.5 },
  slotTime: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
  slotDur: { fontSize: FontSize.xs, color: Colors.textMuted },
  slotStatus: { fontSize: FontSize.sm, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 80, gap: Spacing.md },
  emptyText: { fontSize: FontSize.md, color: Colors.textMuted },
  emptySubText: { fontSize: FontSize.sm, color: Colors.textMuted },
});
