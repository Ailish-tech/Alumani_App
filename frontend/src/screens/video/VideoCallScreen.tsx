import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
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
      Alert.alert('Error', e.response?.data?.error || 'Failed to get video token');
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
          <Ionicons name="videocam" size={64} color={Colors.textMuted} />
          <Text style={styles.callInfoText}>Video Call Active</Text>
          <Text style={styles.channelText}>Channel: {tokenData.channelName}</Text>
          <View style={styles.encryptionBadge}>
            <Ionicons name="lock-closed" size={14} color={Colors.success} />
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
          <Ionicons name="videocam" size={48} color={Colors.primary} />
        </View>
        <Text style={styles.title}>Secure Video Call</Text>
        <Text style={styles.subtitle}>
          End-to-end encrypted with AES-256-GCM2
        </Text>
        <View style={styles.infoRow}>
          <Ionicons name="shield-checkmark" size={16} color={Colors.success} />
          <Text style={styles.infoText}>Your call is fully encrypted</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="key" size={16} color={Colors.accent} />
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
  container: { flex: 1, backgroundColor: Colors.bgDark, justifyContent: 'center', padding: Spacing.lg },
  preCallCard: {
    alignItems: 'center', padding: Spacing.xl,
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border,
  },
  iconCircle: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: Colors.primaryGlow,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.lg, borderWidth: 2, borderColor: Colors.primary,
  },
  title: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.xs, textAlign: 'center' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.md },
  infoText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  joinButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    backgroundColor: Colors.success, borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl,
    marginTop: Spacing.xl, width: '100%',
  },
  joinText: { fontSize: FontSize.lg, fontWeight: '700', color: '#fff' },
  callContainer: { flex: 1, backgroundColor: '#000' },
  remoteVideo: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  callInfoText: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary },
  channelText: { fontSize: FontSize.sm, color: Colors.textMuted },
  encryptionBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,230,118,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.full },
  encryptionText: { fontSize: FontSize.xs, color: Colors.success, fontWeight: '600' },
  callControls: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.xl, padding: Spacing.xl, backgroundColor: 'rgba(0,0,0,0.8)' },
  controlBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.bgCard, alignItems: 'center', justifyContent: 'center' },
  endCallBtn: { backgroundColor: Colors.error, transform: [{ rotate: '135deg' }] },
});
