/**
 * AppleAlert — Premium Apple-inspired alert system
 * 
 * Drop-in replacement for React Native's Alert.alert().
 * Features frosted glass modals, iOS action sheets with gradient icons,
 * spring animations, and auto-dismiss toast notifications.
 *
 * Usage:
 *   AppleAlert.alert('Error', 'Something went wrong');
 *   AppleAlert.alert('Delete', 'Are you sure?', [
 *     { text: 'Cancel', style: 'cancel' },
 *     { text: 'Delete', style: 'destructive', onPress: () => {} },
 *   ]);
 *   AppleAlert.actionSheet('Add Photos', [
 *     { text: 'Take Photo', icon: 'camera', onPress: fn },
 *     { text: 'Choose from Gallery', icon: 'images', onPress: fn },
 *     { text: 'Cancel', style: 'cancel' },
 *   ]);
 *   AppleAlert.toast('Saved!', 'success');
 *
 * Wrap your app root with <AppleAlertProvider />
 */

import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, Animated, Dimensions, Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ALERT_WIDTH = Math.min(SCREEN_WIDTH - 48, 320);

// ─── Types ──────────────────────────────────────────────────────────────────
type AlertButton = {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
  icon?: string; // Ionicons name for action sheet buttons
};

type AlertConfig = {
  title: string;
  message?: string;
  buttons?: AlertButton[];
  type?: 'alert' | 'actionSheet';
};

type ToastConfig = {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
};

type AlertContextType = {
  showAlert: (config: AlertConfig) => void;
  showToast: (config: ToastConfig) => void;
};

const AlertContext = createContext<AlertContextType>({
  showAlert: () => {},
  showToast: () => {},
});

// ─── Singleton for static access ────────────────────────────────────────────
let _globalShowAlert: ((config: AlertConfig) => void) | null = null;
let _globalShowToast: ((config: ToastConfig) => void) | null = null;

// Strip emojis from text for clean display
function stripEmojis(text: string): string {
  return text.replace(/[\u{1F600}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}]/gu, '').trim();
}

// Auto-detect icon from button text
function detectIcon(text: string): string | undefined {
  const lower = text.toLowerCase();
  if (lower.includes('camera') || lower.includes('photo') || lower.includes('take')) return 'camera-outline';
  if (lower.includes('gallery') || lower.includes('choose') || lower.includes('library')) return 'images-outline';
  if (lower.includes('delete') || lower.includes('remove')) return 'trash-outline';
  if (lower.includes('report')) return 'flag-outline';
  if (lower.includes('copy')) return 'copy-outline';
  if (lower.includes('share')) return 'share-outline';
  if (lower.includes('edit') || lower.includes('modify')) return 'pencil-outline';
  if (lower.includes('block') || lower.includes('ban')) return 'ban-outline';
  if (lower.includes('mute') || lower.includes('disable')) return 'volume-mute-outline';
  if (lower.includes('comment')) return 'chatbubble-outline';
  if (lower.includes('save')) return 'bookmark-outline';
  return undefined;
}

// Auto-detect gradient from button context
function detectGradient(text: string, style?: string): [string, string] {
  if (style === 'destructive') return ['#FF3B30', '#FF6B6B'];
  const lower = text.toLowerCase();
  if (lower.includes('camera') || lower.includes('photo')) return ['#007AFF', '#5AC8FA'];
  if (lower.includes('gallery') || lower.includes('image') || lower.includes('choose')) return ['#34C759', '#30D158'];
  if (lower.includes('delete') || lower.includes('remove')) return ['#FF3B30', '#FF6B6B'];
  if (lower.includes('report') || lower.includes('flag')) return ['#FF9500', '#FFCC00'];
  if (lower.includes('edit')) return ['#5856D6', '#AF52DE'];
  if (lower.includes('share')) return ['#007AFF', '#5AC8FA'];
  return ['#007AFF', '#5AC8FA'];
}

export const AppleAlert = {
  alert: (
    title: string,
    message?: string,
    buttons?: AlertButton[],
    _options?: any
  ) => {
    if (_globalShowAlert) {
      _globalShowAlert({ title, message, buttons, type: 'alert' });
    }
  },
  actionSheet: (title: string, buttons: AlertButton[]) => {
    if (_globalShowAlert) {
      _globalShowAlert({ title, buttons, type: 'actionSheet' });
    }
  },
  toast: (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    if (_globalShowToast) {
      _globalShowToast({ message, type });
    }
  },
};

// ─── Toast Icons & Colors ───────────────────────────────────────────────────
const TOAST_CONFIG = {
  success: { icon: 'checkmark-circle', color: '#34C759', bg: 'rgba(52,199,89,0.12)' },
  error: { icon: 'close-circle', color: '#FF3B30', bg: 'rgba(255,59,48,0.12)' },
  info: { icon: 'information-circle', color: '#007AFF', bg: 'rgba(0,122,255,0.12)' },
  warning: { icon: 'warning', color: '#FF9500', bg: 'rgba(255,149,0,0.12)' },
};

// ─── Alert Modal Component ──────────────────────────────────────────────────
function AlertModal({ config, onDismiss }: { config: AlertConfig | null; onDismiss: () => void }) {
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (config) {
      if (config.type === 'actionSheet') {
        Animated.parallel([
          Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }),
        ]).start();
      } else {
        Animated.parallel([
          Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 65, friction: 8 }),
        ]).start();
      }
    }
  }, [config]);

  const dismiss = useCallback(() => {
    const isSheet = config?.type === 'actionSheet';
    Animated.parallel([
      Animated.timing(opacityAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      isSheet
        ? Animated.timing(slideAnim, { toValue: 300, duration: 200, useNativeDriver: true })
        : Animated.timing(scaleAnim, { toValue: 0.7, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      scaleAnim.setValue(0.7);
      slideAnim.setValue(300);
      onDismiss();
    });
  }, [config, onDismiss]);

  if (!config) return null;

  const buttons = config.buttons || [{ text: 'OK', style: 'default' as const }];
  const isSheet = config.type === 'actionSheet';
  const cleanTitle = stripEmojis(config.title);

  // Detect alert type for icon
  const isError = cleanTitle.toLowerCase().includes('error') || cleanTitle.toLowerCase().includes('failed');
  const isSuccess = config.title?.includes('✅') || cleanTitle.toLowerCase().includes('saved') || cleanTitle.toLowerCase().includes('done') || cleanTitle.toLowerCase().includes('sent') || cleanTitle.toLowerCase().includes('booked') || cleanTitle.toLowerCase().includes('connected');
  const isPermission = cleanTitle.toLowerCase().includes('permission') || cleanTitle.toLowerCase().includes('missing') || cleanTitle.toLowerCase().includes('required') || cleanTitle.toLowerCase().includes('validation') || cleanTitle.toLowerCase().includes('weak') || cleanTitle.toLowerCase().includes('mismatch');

  return (
    <Modal transparent visible={!!config} animationType="none" statusBarTranslucent>
      <Animated.View style={[st.backdrop, { opacity: opacityAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => {
          const cancelBtn = buttons.find(b => b.style === 'cancel');
          if (cancelBtn?.onPress) cancelBtn.onPress();
          dismiss();
        }} />

        {isSheet ? (
          /* ── Action Sheet with gradient icons ── */
          <Animated.View style={[st.sheetContainer, { transform: [{ translateY: slideAnim }] }]}>
            <BlurView intensity={85} tint="light" style={st.sheetBlur}>
              {/* Handle bar */}
              <View style={st.sheetHandle} />
              <Text style={st.sheetTitle}>{cleanTitle}</Text>
              {config.message ? <Text style={st.sheetMessage}>{config.message}</Text> : null}

              {buttons.filter(b => b.style !== 'cancel').map((btn, i) => {
                const btnText = stripEmojis(btn.text);
                const iconName = btn.icon || detectIcon(btnText);
                const gradient = detectGradient(btnText, btn.style);
                const isDestructive = btn.style === 'destructive';

                return (
                  <TouchableOpacity
                    key={i}
                    style={st.sheetButton}
                    onPress={() => { btn.onPress?.(); dismiss(); }}
                    activeOpacity={0.65}
                  >
                    {iconName && (
                      <LinearGradient colors={gradient} style={st.sheetBtnIcon}>
                        <Ionicons name={iconName as any} size={18} color="#fff" />
                      </LinearGradient>
                    )}
                    <Text style={[
                      st.sheetButtonText,
                      isDestructive && { color: '#FF3B30' },
                    ]}>
                      {btnText}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
                  </TouchableOpacity>
                );
              })}
            </BlurView>

            {/* Separated Cancel Button */}
            {buttons.find(b => b.style === 'cancel') && (
              <TouchableOpacity
                style={st.sheetCancelBtn}
                onPress={() => { buttons.find(b => b.style === 'cancel')?.onPress?.(); dismiss(); }}
                activeOpacity={0.65}
              >
                <Text style={st.sheetCancelText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        ) : (
          /* ── Alert Dialog ── */
          <Animated.View style={[st.alertCard, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
            <BlurView intensity={90} tint="light" style={st.alertBlur}>
              <View style={st.alertContent}>
                {/* Auto-detected icon */}
                {isError && (
                  <LinearGradient colors={['#FF3B30', '#FF6B6B']} style={st.alertIconBg}>
                    <Ionicons name="close" size={22} color="#fff" />
                  </LinearGradient>
                )}
                {isSuccess && (
                  <LinearGradient colors={['#34C759', '#30D158']} style={st.alertIconBg}>
                    <Ionicons name="checkmark" size={22} color="#fff" />
                  </LinearGradient>
                )}
                {isPermission && !isError && !isSuccess && (
                  <LinearGradient colors={['#FF9500', '#FFCC00']} style={st.alertIconBg}>
                    <Ionicons name="alert" size={22} color="#fff" />
                  </LinearGradient>
                )}
                {!isError && !isSuccess && !isPermission && config.buttons && config.buttons.some(b => b.style === 'destructive') && (
                  <LinearGradient colors={['#FF9500', '#FFCC00']} style={st.alertIconBg}>
                    <Ionicons name="warning" size={22} color="#fff" />
                  </LinearGradient>
                )}

                <Text style={st.alertTitle}>{cleanTitle}</Text>
                {config.message ? <Text style={st.alertMessage}>{config.message}</Text> : null}
              </View>

              {/* Buttons */}
              <View style={[st.alertButtonRow, buttons.length > 2 && { flexDirection: 'column' }]}>
                {buttons.map((btn, i) => {
                  const isCancel = btn.style === 'cancel';
                  const isDestructive = btn.style === 'destructive';
                  return (
                    <TouchableOpacity
                      key={i}
                      style={[
                        st.alertButton,
                        buttons.length <= 2 && i > 0 && { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: '#E5E5EA' },
                        buttons.length > 2 && i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E5E5EA' },
                      ]}
                      onPress={() => { btn.onPress?.(); dismiss(); }}
                      activeOpacity={0.65}
                    >
                      <Text style={[
                        st.alertButtonText,
                        isCancel && { fontWeight: '400', color: '#8E8E93' },
                        isDestructive && { color: '#FF3B30', fontWeight: '600' },
                        !isCancel && !isDestructive && { color: '#007AFF', fontWeight: '600' },
                      ]}>
                        {stripEmojis(btn.text)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </BlurView>
          </Animated.View>
        )}
      </Animated.View>
    </Modal>
  );
}

// ─── Toast Component ────────────────────────────────────────────────────────
function ToastNotification({ config, onDismiss }: { config: ToastConfig | null; onDismiss: () => void }) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (config) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 60, friction: 10 }),
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, { toValue: -100, duration: 250, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start(() => {
          translateY.setValue(-100);
          onDismiss();
        });
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [config]);

  if (!config) return null;
  const tc = TOAST_CONFIG[config.type];

  return (
    <Animated.View style={[st.toastContainer, { transform: [{ translateY }], opacity }]}>
      <BlurView intensity={80} tint="light" style={st.toastBlur}>
        <LinearGradient colors={[tc.color, tc.color]} style={st.toastIconBg}>
          <Ionicons name={tc.icon as any} size={16} color="#fff" />
        </LinearGradient>
        <Text style={st.toastText} numberOfLines={2}>{stripEmojis(config.message)}</Text>
      </BlurView>
      <View style={st.toastBorder} />
    </Animated.View>
  );
}

// ─── Provider ───────────────────────────────────────────────────────────────
export function AppleAlertProvider({ children }: { children: React.ReactNode }) {
  const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(null);
  const [toastConfig, setToastConfig] = useState<ToastConfig | null>(null);

  const showAlert = useCallback((config: AlertConfig) => {
    setAlertConfig(config);
  }, []);

  const showToast = useCallback((config: ToastConfig) => {
    setToastConfig(config);
  }, []);

  useEffect(() => {
    _globalShowAlert = showAlert;
    _globalShowToast = showToast;
    return () => { _globalShowAlert = null; _globalShowToast = null; };
  }, [showAlert, showToast]);

  return (
    <AlertContext.Provider value={{ showAlert, showToast }}>
      {children}
      <AlertModal config={alertConfig} onDismiss={() => setAlertConfig(null)} />
      <ToastNotification config={toastConfig} onDismiss={() => setToastConfig(null)} />
    </AlertContext.Provider>
  );
}

export const useAppleAlert = () => useContext(AlertContext);

// ─── Styles ─────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  // Backdrop
  backdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center', alignItems: 'center',
  },

  // ── Alert Dialog ──
  alertCard: {
    width: ALERT_WIDTH, borderRadius: 20, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.25, shadowRadius: 30, elevation: 12,
  },
  alertBlur: { overflow: 'hidden', borderRadius: 20 },
  alertContent: { paddingTop: 28, paddingHorizontal: 24, paddingBottom: 20, alignItems: 'center' },
  alertIconBg: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  alertTitle: {
    fontSize: 17, fontWeight: '600', color: '#1C1C1E', textAlign: 'center', letterSpacing: -0.2,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : undefined,
  },
  alertMessage: {
    fontSize: 13, color: '#8E8E93', textAlign: 'center', marginTop: 6, lineHeight: 18,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : undefined,
  },
  alertButtonRow: {
    flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(60,60,67,0.12)',
  },
  alertButton: { flex: 1, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  alertButtonText: {
    fontSize: 17, color: '#007AFF',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : undefined,
  },

  // ── Action Sheet ──
  sheetContainer: {
    position: 'absolute', bottom: Platform.OS === 'ios' ? 34 : 16,
    left: 10, right: 10,
  },
  sheetBlur: {
    borderRadius: 20, overflow: 'hidden',
    paddingBottom: 6,
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(60,60,67,0.15)',
    alignSelf: 'center', marginTop: 10,
  },
  sheetTitle: {
    fontSize: 13, fontWeight: '600', color: '#8E8E93', textAlign: 'center',
    paddingTop: 12, paddingBottom: 4, textTransform: 'uppercase', letterSpacing: 0.8,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : undefined,
  },
  sheetMessage: {
    fontSize: 13, color: '#8E8E93', textAlign: 'center', paddingBottom: 6, paddingHorizontal: 16,
  },
  sheetButton: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 16,
    marginHorizontal: 8, marginVertical: 2,
    borderRadius: 12, gap: 12,
  },
  sheetBtnIcon: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  sheetButtonText: {
    flex: 1, fontSize: 16, color: '#1C1C1E', fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : undefined,
  },
  sheetCancelBtn: {
    backgroundColor: '#fff', borderRadius: 16, marginTop: 8,
    paddingVertical: 16, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  sheetCancelText: {
    fontSize: 17, fontWeight: '600', color: '#007AFF',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : undefined,
  },

  // ── Toast ──
  toastContainer: {
    position: 'absolute', top: Platform.OS === 'ios' ? 56 : 40,
    left: 16, right: 16, zIndex: 9999,
  },
  toastBlur: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16, overflow: 'hidden',
  },
  toastBorder: {
    ...StyleSheet.absoluteFillObject, borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', pointerEvents: 'none',
  },
  toastIconBg: {
    width: 28, height: 28, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  toastText: {
    flex: 1, fontSize: 14, fontWeight: '600', color: '#1C1C1E', letterSpacing: -0.1,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : undefined,
  },
});
