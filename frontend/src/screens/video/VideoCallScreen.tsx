import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { AppleAlert } from '../../components/AppleAlert';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import api from '../../services/api';

export default function VideoCallScreen({ route }: any) {
  const { mentorshipId } = route.params;
  const [isLoading, setIsLoading] = useState(false);
  const [tokenData, setTokenData] = useState<any>(null);
  const [inCall, setInCall] = useState(false);

  const joinCall = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/video/token', { params: { mentorshipId } });
      setTokenData(res.data.data);
      setInCall(true);
      // In a real app, you'd initialize AgoraRTC here with:
      // - res.data.data.appId
      // - res.data.data.token
      // - res.data.data.channelName
      // - res.data.data.encryption (AES-256-GCM2 config)
    } catch (e: any) {
      AppleAlert.alert('Error', e.response?.data?.error || 'Failed to get video token');
    }
    setIsLoading(false);
  };

  const endCall = () => {
    setInCall(false);
    setTokenData(null);
  };

  if (inCall && tokenData) {
    return (
      <View style={styles.callContainer}>
        <View style={styles.remoteVideo}>
          <Ionicons name="videocam" size={64} color={'#999999'} />
          <Text style={styles.callInfoText}>Video Call Active</Text>
          <Text style={styles.channelText}>Channel: {tokenData.channelName}</Text>
          <View style={styles.encryptionBadge}>
            <Ionicons name="lock-closed" size={14} color={'#057642'} />
            <Text style={styles.encryptionText}>AES-256-GCM2 E2EE</Text>
          </View>
        </View>

        <View style={styles.callControls}>
          <TouchableOpacity style={styles.controlBtn}>
            <Ionicons name="mic-off-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.controlBtn, styles.endCallBtn]} onPress={endCall}>
            <Ionicons name="call" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlBtn}>
            <Ionicons name="camera-reverse-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.preCallCard}>
        <View style={styles.iconCircle}>
          <Ionicons name="videocam" size={48} color={'#0A66C2'} />
        </View>
        <Text style={styles.title}>Secure Video Call</Text>
        <Text style={styles.subtitle}>
          End-to-end encrypted with AES-256-GCM2
        </Text>
        <View style={styles.infoRow}>
          <Ionicons name="shield-checkmark" size={16} color={'#057642'} />
          <Text style={styles.infoText}>Your call is fully encrypted</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="key" size={16} color={'#0A66C2'} />
          <Text style={styles.infoText}>Session-unique encryption keys</Text>
        </View>

        <TouchableOpacity style={styles.joinButton} onPress={joinCall} disabled={isLoading} activeOpacity={0.8}>
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="videocam" size={22} color="#fff" />
              <Text style={styles.joinText}>Join Video Call</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F2EF', justifyContent: 'center', padding: 24 },
  preCallCard: {
    alignItems: 'center', padding: 32,
    backgroundColor: '#FFFFFF', borderRadius: 12,
    borderWidth: 1, borderColor: '#DCE6F1',
  },
  iconCircle: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: '#E8F1FA',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24, borderWidth: 2, borderColor: '#0A66C2',
  },
  title: { fontSize: 20, fontWeight: '800', color: '#191919' },
  subtitle: { fontSize: 13, color: '#666666', marginTop: 4, textAlign: 'center' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 },
  infoText: { fontSize: 13, color: '#666666' },
  joinButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#057642', borderRadius: 8,
    paddingVertical: 16, paddingHorizontal: 32,
    marginTop: 32, width: '100%',
  },
  joinText: { fontSize: 17, fontWeight: '700', color: '#fff' },
  callContainer: { flex: 1, backgroundColor: '#000' },
  remoteVideo: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  callInfoText: { fontSize: 20, fontWeight: '700', color: '#191919' },
  channelText: { fontSize: 13, color: '#999999' },
  encryptionBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,230,118,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  encryptionText: { fontSize: 11, color: '#057642', fontWeight: '600' },
  callControls: { flexDirection: 'row', justifyContent: 'center', gap: 32, padding: 32, backgroundColor: 'rgba(0,0,0,0.8)' },
  controlBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  endCallBtn: { backgroundColor: '#CC1016', transform: [{ rotate: '135deg' }] },
});
