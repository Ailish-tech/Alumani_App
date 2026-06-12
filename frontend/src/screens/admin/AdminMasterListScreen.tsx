import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { AppleAlert } from '../../components/AppleAlert';
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
      AppleAlert.alert('Error', 'Failed to pick file');
    }
  };

  const uploadFile = async () => {
    if (!selectedFile) {
      AppleAlert.alert('No File', 'Please select a CSV file first.');
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
      AppleAlert.alert('✅ Success', response.data.message);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Upload failed';
      AppleAlert.alert('❌ Error', msg);
      setResult({ error: msg });
    }

    setUploading(false);
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
      {/* Header */}
      <View style={s.hero}>
        <View style={s.heroIcon}>
          <Ionicons name="cloud-upload" size={32} color={'#0A66C2'} />
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
        <Ionicons name="document-attach" size={24} color={'#0A66C2'} />
        <Text style={s.pickBtnText}>
          {selectedFile ? '📄 Change File' : '📂 Select CSV File'}
        </Text>
      </TouchableOpacity>

      {/* Selected File Info */}
      {selectedFile && (
        <View style={s.fileCard}>
          <Ionicons name="document-text" size={28} color={'#0A66C2'} />
          <View style={{ flex: 1 }}>
            <Text style={s.fileName}>{selectedFile.name}</Text>
            <Text style={s.fileSize}>
              {selectedFile.size ? `${(selectedFile.size / 1024).toFixed(1)} KB` : 'Unknown size'}
            </Text>
          </View>
          <TouchableOpacity onPress={() => { setSelectedFile(null); setResult(null); }}>
            <Ionicons name="close-circle" size={24} color={'#CC1016'} />
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
              <Text style={[s.resultNum, { color: '#E16745' }]}>{result.skipped}</Text>
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
        <View style={[s.resultCard, { borderColor: '#CC1016' }]}>
          <Text style={[s.resultTitle, { color: '#CC1016' }]}>❌ Upload Failed</Text>
          <Text style={s.errorItem}>{result.error}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F2EF' },

  hero: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  heroIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: `${'#0A66C2'}20`,
    alignItems: 'center', justifyContent: 'center',
  },
  heroTitle: { fontSize: 20, fontWeight: '800', color: '#191919' },
  heroSub: {
    fontSize: 13, color: '#999999', textAlign: 'center',
    lineHeight: 20, paddingHorizontal: 24,
  },

  formatCard: {
    backgroundColor: '#FFFFFF', borderRadius: 12,
    padding: 16, borderWidth: 1, borderColor: '#DCE6F1',
    marginBottom: 16,
  },
  formatTitle: { fontSize: 15, fontWeight: '700', color: '#191919', marginBottom: 8 },
  codeBlock: {
    backgroundColor: '#F3F2EF', borderRadius: 8,
    padding: 8, marginBottom: 8,
  },
  codeLine: { fontSize: 12, color: '#0A66C2', fontFamily: 'monospace', fontWeight: '700' },
  codeLineData: { fontSize: 12, color: '#666666', fontFamily: 'monospace' },
  formatHint: { fontSize: 11, color: '#999999', fontStyle: 'italic' },

  pickBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#FFFFFF', borderRadius: 12,
    padding: 16, marginBottom: 16,
    borderWidth: 2, borderColor: '#0A66C2', borderStyle: 'dashed',
  },
  pickBtnText: { fontSize: 15, fontWeight: '700', color: '#0A66C2' },

  fileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: '#FFFFFF', borderRadius: 12,
    padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: '#0A66C2',
  },
  fileName: { fontSize: 15, fontWeight: '700', color: '#191919' },
  fileSize: { fontSize: 11, color: '#999999' },

  uploadBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#0A66C2', borderRadius: 12,
    padding: 16, marginBottom: 24,
  },
  uploadBtnDisabled: { opacity: 0.4 },
  uploadBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  resultCard: {
    backgroundColor: '#FFFFFF', borderRadius: 12,
    padding: 16, borderWidth: 1, borderColor: '#0A66C2',
  },
  resultTitle: { fontSize: 15, fontWeight: '700', color: '#191919', marginBottom: 8 },
  resultGrid: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
  resultItem: { alignItems: 'center' },
  resultNum: { fontSize: 24, fontWeight: '800', color: '#0A66C2' },
  resultLabel: { fontSize: 11, color: '#999999' },
  errorList: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#DCE6F1' },
  errorTitle: { fontSize: 13, fontWeight: '700', color: '#E16745', marginBottom: 4 },
  errorItem: { fontSize: 11, color: '#999999', lineHeight: 16 },
});
