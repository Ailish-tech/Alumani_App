import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, TextInput, Alert, Modal } from 'react-native';
import { AppleAlert } from '../../components/AppleAlert';
import { Ionicons } from '@expo/vector-icons';

import api from '../../services/api';


// LinkedIn-Inspired Colors
const LI = {
  blue: '#0A66C2', white: '#FFF', bgLight: '#F2F2F7',
  border: '#E5E5EA', textDark: '#1C1C1E', textSecondary: '#8E8E93',
  green: '#057642',
};export default function BookingScreen() {
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
    AppleAlert.alert('Booked', 'Your slot has been booked.');
    loadSlots(mentorId);
  };

  return (
    <View style={s.container}>
      <View style={s.header}><Text style={s.title}>Office Hours</Text></View>
      <View style={s.info}>
        <Ionicons name="information-circle" size={20} color={'#0A66C2'} />
        <Text style={s.infoText}>Book 1-on-1 sessions with mentors and faculty</Text>
      </View>
      {slots.length > 0 ? (
        <FlatList data={slots} keyExtractor={(_, i) => String(i)} contentContainerStyle={{ padding: 16, gap: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={[s.slotCard, item.isBooked && s.slotBooked]}
              onPress={() => !item.isBooked && bookSlot(item.mentorId, item.dateTime)} disabled={item.isBooked}>
              <Ionicons name="time-outline" size={20} color={item.isBooked ? '#C7C7CC' : '#0A66C2'} />
              <View style={{ flex: 1 }}>
                <Text style={s.slotTime}>{new Date(item.dateTime).toLocaleString()}</Text>
                <Text style={s.slotDur}>{item.duration || 30} min</Text>
              </View>
              <Text style={[s.slotStatus, { color: item.isBooked ? '#CC1016' : '#057642' }]}>
                {item.isBooked ? 'Booked' : 'Available'}
              </Text>
            </TouchableOpacity>
          )}
        />
      ) : (
        <View style={s.empty}>
          <Ionicons name="calendar-outline" size={48} color={'#C7C7CC'} />
          <Text style={s.emptyText}>No slots available</Text>
          <Text style={s.emptySubText}>Ask your mentor to set up office hours</Text>
        </View>
      )}
    </View>
  );
}
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { paddingHorizontal: 16, paddingTop: 56, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: '#1C1C1E' },
  info: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFF', marginHorizontal: 16, padding: 16, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  infoText: { fontSize: 13, color: '#8E8E93', flex: 1 },
  slotCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 16, padding: 16, gap: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  slotBooked: { opacity: 0.5 },
  slotTime: { fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
  slotDur: { fontSize: 11, color: '#C7C7CC' },
  slotStatus: { fontSize: 13, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 16 },
  emptyText: { fontSize: 15, color: '#C7C7CC' },
  emptySubText: { fontSize: 13, color: '#C7C7CC' },
});
