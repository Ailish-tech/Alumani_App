import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, TextInput, Alert, Modal, Linking } from 'react-native';
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
    if (!form.companyName) { Alert.alert('Error', 'Company name required'); return; }
    await api.post('/alumni/companies', form); setShowCreate(false); setForm({ companyName: '', role: '', industry: '', location: '', hiringStatus: 'hiring', website: '' }); fetch();
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Company Directory</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowCreate(true)}><Ionicons name="add" size={24} color="#fff" /></TouchableOpacity>
      </View>
      <Text style={s.subtitle}>Where our alumni work</Text>

      <FlatList data={companies} keyExtractor={i => i.id} contentContainerStyle={{ padding: Spacing.md, gap: Spacing.md }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetch} tintColor={Colors.roleAlumni} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.card} activeOpacity={0.8}
            onPress={() => item.website && Linking.openURL(item.website.startsWith('http') ? item.website : `https://${item.website}`)}>
            <View style={s.cardHeader}>
              <View style={s.companyIcon}><Ionicons name="business" size={24} color={Colors.accent} /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.companyName}>{item.companyName}</Text>
                {item.role ? <Text style={s.alumniRole}>{item.role}</Text> : null}
              </View>
              <View style={[s.hiringBadge, { backgroundColor: `${HIRING_COLORS[item.hiringStatus] || Colors.textMuted}20` }]}>
                <Text style={[s.hiringText, { color: HIRING_COLORS[item.hiringStatus] || Colors.textMuted }]}>
                  {HIRING_LABELS[item.hiringStatus] || item.hiringStatus}
                </Text>
              </View>
            </View>
            <View style={s.metaRow}>
              {item.industry ? <View style={s.metaChip}><Ionicons name="layers" size={12} color={Colors.textMuted} /><Text style={s.metaText}>{item.industry}</Text></View> : null}
              {item.location ? <View style={s.metaChip}><Ionicons name="location" size={12} color={Colors.textMuted} /><Text style={s.metaText}>{item.location}</Text></View> : null}
              {item.website ? <View style={s.metaChip}><Ionicons name="globe" size={12} color={Colors.accent} /><Text style={[s.metaText, { color: Colors.accent }]}>Website</Text></View> : null}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<View style={s.empty}><Ionicons name="business-outline" size={48} color={Colors.textMuted} /><Text style={s.emptyText}>No companies listed yet</Text><Text style={s.emptySub}>Register your company!</Text></View>}
      />

      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={s.overlay}><View style={s.modal}>
          <Text style={s.modalTitle}>Register Company</Text>
          <TextInput style={s.input} placeholder="Company Name" placeholderTextColor={Colors.textMuted} value={form.companyName} onChangeText={t => setForm(p => ({ ...p, companyName: t }))} />
          <TextInput style={s.input} placeholder="Your Role" placeholderTextColor={Colors.textMuted} value={form.role} onChangeText={t => setForm(p => ({ ...p, role: t }))} />
          <TextInput style={s.input} placeholder="Industry" placeholderTextColor={Colors.textMuted} value={form.industry} onChangeText={t => setForm(p => ({ ...p, industry: t }))} />
          <TextInput style={s.input} placeholder="Location" placeholderTextColor={Colors.textMuted} value={form.location} onChangeText={t => setForm(p => ({ ...p, location: t }))} />
          <TextInput style={s.input} placeholder="Website" placeholderTextColor={Colors.textMuted} value={form.website} onChangeText={t => setForm(p => ({ ...p, website: t }))} />
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
  container: { flex: 1, backgroundColor: Colors.bgDark },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, paddingTop: 56, paddingBottom: 4 },
  title: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { paddingHorizontal: Spacing.md, fontSize: FontSize.sm, color: Colors.textMuted, marginBottom: Spacing.sm },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#00BCD4', alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  companyIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: `${Colors.accent}15`, alignItems: 'center', justifyContent: 'center' },
  companyName: { fontSize: FontSize.md, fontWeight: '800', color: Colors.textPrimary },
  alumniRole: { fontSize: FontSize.sm, color: Colors.textSecondary },
  hiringBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full },
  hiringText: { fontSize: FontSize.xs, fontWeight: '700' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: FontSize.xs, color: Colors.textMuted },
  empty: { alignItems: 'center', paddingTop: 80, gap: Spacing.sm },
  emptyText: { fontSize: FontSize.md, color: Colors.textMuted },
  emptySub: { fontSize: FontSize.sm, color: Colors.textMuted },
  overlay: { flex: 1, backgroundColor: Colors.bgOverlay, justifyContent: 'flex-end' },
  modal: { backgroundColor: Colors.bgCard, borderTopLeftRadius: BorderRadius.lg, borderTopRightRadius: BorderRadius.lg, padding: Spacing.lg, gap: Spacing.md },
  modalTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary },
  input: { backgroundColor: Colors.bgInput, borderRadius: BorderRadius.sm, padding: Spacing.md, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border },
  hiringRow: { gap: Spacing.xs },
  hiringOption: { padding: Spacing.sm, borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  hiringOptionText: { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: '600' },
  formActions: { flexDirection: 'row', gap: Spacing.md },
  cancelBtn: { flex: 1, padding: Spacing.md, borderRadius: BorderRadius.sm, backgroundColor: Colors.bgDark, alignItems: 'center' },
  cancelText: { color: Colors.textSecondary, fontWeight: '600' },
  createBtn: { flex: 1, padding: Spacing.md, borderRadius: BorderRadius.sm, backgroundColor: '#00BCD4', alignItems: 'center' },
  createText: { color: '#fff', fontWeight: '700' },
});
