import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, TextInput, Alert, Modal, Linking } from 'react-native';
import { AppleAlert } from '../../components/AppleAlert';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import api from '../../services/api';

const HIRING_COLORS: Record<string, string> = { hiring: '#00E676', not_hiring: '#FF5252', open_to_referrals: '#FFD600' };
const HIRING_LABELS: Record<string, string> = { hiring: '🟢 Hiring', not_hiring: '🔴 Not Hiring', open_to_referrals: '🟡 Referrals Only' };

export default function CompanyDirectoryScreen() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ companyName: '', role: '', industry: '', location: '', hiringStatus: 'hiring', website: '' });

  const fetch = async () => { setLoading(true); try { const r = await api.get('/alumni/companies'); setCompanies(r.data.data || []); } catch {} setLoading(false); };
  useEffect(() => { fetch(); }, []);

  const handleCreate = async () => {
    if (!form.companyName) { AppleAlert.alert('Error', 'Company name required'); return; }
    await api.post('/alumni/companies', form); setShowCreate(false); setForm({ companyName: '', role: '', industry: '', location: '', hiringStatus: 'hiring', website: '' }); fetch();
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Company Directory</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowCreate(true)}><Ionicons name="add" size={24} color="#fff" /></TouchableOpacity>
      </View>
      <Text style={s.subtitle}>Where our alumni work</Text>

      <FlatList data={companies} keyExtractor={i => i.id} contentContainerStyle={{ padding: 16, gap: 16 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetch} tintColor={'#057642'} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.card} activeOpacity={0.8}
            onPress={() => item.website && Linking.openURL(item.website.startsWith('http') ? item.website : `https://${item.website}`)}>
            <View style={s.cardHeader}>
              <View style={s.companyIcon}><Ionicons name="business" size={24} color={'#0A66C2'} /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.companyName}>{item.companyName}</Text>
                {item.role ? <Text style={s.alumniRole}>{item.role}</Text> : null}
              </View>
              <View style={[s.hiringBadge, { backgroundColor: `${HIRING_COLORS[item.hiringStatus] || '#999999'}20` }]}>
                <Text style={[s.hiringText, { color: HIRING_COLORS[item.hiringStatus] || '#999999' }]}>
                  {HIRING_LABELS[item.hiringStatus] || item.hiringStatus}
                </Text>
              </View>
            </View>
            <View style={s.metaRow}>
              {item.industry ? <View style={s.metaChip}><Ionicons name="layers" size={12} color={'#999999'} /><Text style={s.metaText}>{item.industry}</Text></View> : null}
              {item.location ? <View style={s.metaChip}><Ionicons name="location" size={12} color={'#999999'} /><Text style={s.metaText}>{item.location}</Text></View> : null}
              {item.website ? <View style={s.metaChip}><Ionicons name="globe" size={12} color={'#0A66C2'} /><Text style={[s.metaText, { color: '#0A66C2' }]}>Website</Text></View> : null}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<View style={s.empty}><Ionicons name="business-outline" size={48} color={'#999999'} /><Text style={s.emptyText}>No companies listed yet</Text><Text style={s.emptySub}>Register your company!</Text></View>}
      />

      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={s.overlay}><View style={s.modal}>
          <Text style={s.modalTitle}>Register Company</Text>
          <TextInput style={s.input} placeholder="Company Name" placeholderTextColor={'#999999'} value={form.companyName} onChangeText={t => setForm(p => ({ ...p, companyName: t }))} />
          <TextInput style={s.input} placeholder="Your Role" placeholderTextColor={'#999999'} value={form.role} onChangeText={t => setForm(p => ({ ...p, role: t }))} />
          <TextInput style={s.input} placeholder="Industry" placeholderTextColor={'#999999'} value={form.industry} onChangeText={t => setForm(p => ({ ...p, industry: t }))} />
          <TextInput style={s.input} placeholder="Location" placeholderTextColor={'#999999'} value={form.location} onChangeText={t => setForm(p => ({ ...p, location: t }))} />
          <TextInput style={s.input} placeholder="Website" placeholderTextColor={'#999999'} value={form.website} onChangeText={t => setForm(p => ({ ...p, website: t }))} />
          <View style={s.hiringRow}>
            {['hiring', 'open_to_referrals', 'not_hiring'].map(st => (
              <TouchableOpacity key={st} style={[s.hiringOption, form.hiringStatus === st && { borderColor: HIRING_COLORS[st], backgroundColor: `${HIRING_COLORS[st]}15` }]}
                onPress={() => setForm(p => ({ ...p, hiringStatus: st }))}>
                <Text style={[s.hiringOptionText, form.hiringStatus === st && { color: HIRING_COLORS[st] }]}>{HIRING_LABELS[st]}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={s.formActions}>
            <TouchableOpacity style={s.cancelBtn} onPress={() => setShowCreate(false)}><Text style={s.cancelText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={s.createBtn} onPress={handleCreate}><Text style={s.createText}>Register</Text></TouchableOpacity>
          </View>
        </View></View>
      </Modal>
    </View>
  );
}
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F2EF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 4 },
  title: { fontSize: 24, fontWeight: '800', color: '#191919' },
  subtitle: { paddingHorizontal: 16, fontSize: 13, color: '#999999', marginBottom: 8 },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#00BCD4', alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 8, padding: 16, borderWidth: 1, borderColor: '#DCE6F1', gap: 8 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  companyIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: `${'#0A66C2'}15`, alignItems: 'center', justifyContent: 'center' },
  companyName: { fontSize: 15, fontWeight: '800', color: '#191919' },
  alumniRole: { fontSize: 13, color: '#666666' },
  hiringBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  hiringText: { fontSize: 11, fontWeight: '700' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: '#999999' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyText: { fontSize: 15, color: '#999999' },
  emptySub: { fontSize: 13, color: '#999999' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 12, borderTopRightRadius: 12, padding: 24, gap: 16 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#191919' },
  input: { backgroundColor: '#F3F2EF', borderRadius: 4, padding: 16, color: '#191919', borderWidth: 1, borderColor: '#DCE6F1' },
  hiringRow: { gap: 4 },
  hiringOption: { padding: 8, borderRadius: 4, borderWidth: 1, borderColor: '#DCE6F1', alignItems: 'center' },
  hiringOptionText: { fontSize: 13, color: '#999999', fontWeight: '600' },
  formActions: { flexDirection: 'row', gap: 16 },
  cancelBtn: { flex: 1, padding: 16, borderRadius: 4, backgroundColor: '#F3F2EF', alignItems: 'center' },
  cancelText: { color: '#666666', fontWeight: '600' },
  createBtn: { flex: 1, padding: 16, borderRadius: 4, backgroundColor: '#00BCD4', alignItems: 'center' },
  createText: { color: '#fff', fontWeight: '700' },
});
