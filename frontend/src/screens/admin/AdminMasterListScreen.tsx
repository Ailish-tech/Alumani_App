import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ActivityIndicator, ScrollView,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import api from '../../services/api';

export default function AdminMasterListScreen() {
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const pickFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'application/vnd.ms-excel'],
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets?.length > 0) {
        const file = res.assets[0];
        setSelectedFile(file);
        setResult(null);
      }
    } catch {
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  const uploadFile = async () => {
    if (!selectedFile) {
      Alert.alert('No File', 'Please select a CSV file first.');
      return;
    }

    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', {
        uri: selectedFile.uri,
        name: selectedFile.name || 'master-list.csv',
        type: 'text/csv',
      } as any);

      const response = await api.post('/admin/upload-master-list', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setResult(response.data.data);
      Alert.alert('✅ Success', response.data.message);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Upload failed';
      Alert.alert('❌ Error', msg);
      setResult({ error: msg });
    }

    setUploading(false);
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: Spacing.md, paddingBottom: 100 }}>
      {/* Header */}
      <View style={s.hero}>
        <View style={s.heroIcon}>
          <Ionicons name="cloud-upload" size={32} color={Colors.primary} />
        </View>
        <Text style={s.heroTitle}>Upload Master List</Text>
        <Text style={s.heroSub}>
          Upload a CSV file with pre-approved students, alumni, and faculty.
          Only people in this list can create accounts.
        </Text>
      </View>

      {/* CSV Format Guide */}
      <View style={s.formatCard}>
        <Text style={s.formatTitle}>📋 Required CSV Format</Text>
        <View style={s.codeBlock}>
          <Text style={s.codeLine}>CollegeId, Name, GradYear, BaseRole</Text>
          <Text style={s.codeLineData}>CS001, Rahul Sharma, 2026, STUDENT</Text>
          <Text style={s.codeLineData}>CS002, Priya Singh, 2020, ALUMNI</Text>
          <Text style={s.codeLineData}>FAC01, Dr. Verma, 0, FACULTY</Text>
        </View>
        <Text style={s.formatHint}>
          💡 Headers are flexible — "Roll No", "Passout Year", "Batch" etc. all work!
        </Text>
      </View>

      {/* File Picker */}
      <TouchableOpacity style={s.pickBtn} onPress={pickFile} activeOpacity={0.8}>
        <Ionicons name="document-attach" size={24} color={Colors.primary} />
        <Text style={s.pickBtnText}>
          {selectedFile ? '📄 Change File' : '📂 Select CSV File'}
        </Text>
      </TouchableOpacity>

      {/* Selected File Info */}
      {selectedFile && (
        <View style={s.fileCard}>
          <Ionicons name="document-text" size={28} color={Colors.accent} />
          <View style={{ flex: 1 }}>
            <Text style={s.fileName}>{selectedFile.name}</Text>
            <Text style={s.fileSize}>
              {selectedFile.size ? `${(selectedFile.size / 1024).toFixed(1)} KB` : 'Unknown size'}
            </Text>
          </View>
          <TouchableOpacity onPress={() => { setSelectedFile(null); setResult(null); }}>
            <Ionicons name="close-circle" size={24} color={Colors.error} />
          </TouchableOpacity>
        </View>
      )}

      {/* Upload Button */}
      <TouchableOpacity
        style={[s.uploadBtn, (!selectedFile || uploading) && s.uploadBtnDisabled]}
        onPress={uploadFile}
        disabled={!selectedFile || uploading}
        activeOpacity={0.8}
      >
        {uploading ? (
          <>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={s.uploadBtnText}>Uploading...</Text>
          </>
        ) : (
          <>
            <Ionicons name="cloud-upload" size={20} color="#fff" />
            <Text style={s.uploadBtnText}>Upload Master List</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Results */}
      {result && !result.error && (
        <View style={s.resultCard}>
          <Text style={s.resultTitle}>✅ Upload Results</Text>
          <View style={s.resultGrid}>
            <View style={s.resultItem}>
              <Text style={s.resultNum}>{result.totalRows}</Text>
              <Text style={s.resultLabel}>Total Rows</Text>
            </View>
            <View style={s.resultItem}>
              <Text style={[s.resultNum, { color: '#4CAF50' }]}>{result.inserted}</Text>
              <Text style={s.resultLabel}>Inserted</Text>
            </View>
            <View style={s.resultItem}>
              <Text style={[s.resultNum, { color: Colors.warning }]}>{result.skipped}</Text>
              <Text style={s.resultLabel}>Skipped</Text>
            </View>
          </View>
          {result.errors?.length > 0 && (
            <View style={s.errorList}>
              <Text style={s.errorTitle}>⚠️ Issues:</Text>
              {result.errors.map((e: string, i: number) => (
                <Text key={i} style={s.errorItem}>• {e}</Text>
              ))}
            </View>
          )}
        </View>
      )}

      {result?.error && (
        <View style={[s.resultCard, { borderColor: Colors.error }]}>
          <Text style={[s.resultTitle, { color: Colors.error }]}>❌ Upload Failed</Text>
          <Text style={s.errorItem}>{result.error}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDark },

  hero: { alignItems: 'center', paddingVertical: Spacing.lg, gap: Spacing.sm },
  heroIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: `${Colors.primary}20`,
    alignItems: 'center', justifyContent: 'center',
  },
  heroTitle: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  heroSub: {
    fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center',
    lineHeight: 20, paddingHorizontal: Spacing.lg,
  },

  formatCard: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  formatTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm },
  codeBlock: {
    backgroundColor: Colors.bgDark, borderRadius: BorderRadius.md,
    padding: Spacing.sm, marginBottom: Spacing.sm,
  },
  codeLine: { fontSize: 12, color: Colors.accent, fontFamily: 'monospace', fontWeight: '700' },
  codeLineData: { fontSize: 12, color: Colors.textSecondary, fontFamily: 'monospace' },
  formatHint: { fontSize: FontSize.xs, color: Colors.textMuted, fontStyle: 'italic' },

  pickBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.md,
    borderWidth: 2, borderColor: Colors.primary, borderStyle: 'dashed',
  },
  pickBtnText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.primary },

  fileCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.accent,
  },
  fileName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  fileSize: { fontSize: FontSize.xs, color: Colors.textMuted },

  uploadBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    backgroundColor: Colors.primary, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.lg,
  },
  uploadBtnDisabled: { opacity: 0.4 },
  uploadBtnText: { fontSize: FontSize.md, fontWeight: '700', color: '#fff' },

  resultCard: {
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.accent,
  },
  resultTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm },
  resultGrid: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: Spacing.sm },
  resultItem: { alignItems: 'center' },
  resultNum: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.primary },
  resultLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  errorList: { marginTop: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
  errorTitle: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.warning, marginBottom: 4 },
  errorItem: { fontSize: FontSize.xs, color: Colors.textMuted, lineHeight: 16 },
});
