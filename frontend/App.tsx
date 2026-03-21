import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import RootNavigator from './src/navigation/RootNavigator';
import { Colors, Spacing, FontSize } from './src/constants/theme';
import { useAuthStore } from './src/store/authStore';
import ErrorBoundary from './src/components/ErrorBoundary';

function AppContent() {
  const { hydrate, isHydrated } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, []);

  if (!isHydrated) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.splashText}>AlumniConnect</Text>
      </View>
    );
  }

  return <RootNavigator />;
}

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgDark },
  splash: { flex: 1, backgroundColor: Colors.bgDark, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  splashText: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5 },
});
