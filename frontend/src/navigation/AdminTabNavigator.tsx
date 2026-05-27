import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize } from '../constants/theme';
import type { AdminTabParamList } from '../types/navigation.types';

// Screens
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import UserManagementScreen from '../screens/admin/UserManagementScreen';
import AdminScreen from '../screens/admin/AdminScreen'; // feed moderation
import AdminReportsScreen from '../screens/admin/AdminReportsScreen';
import MLAnalyticsScreen from '../screens/ml/MLAnalyticsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator<AdminTabParamList>();

const TAB_ICONS: Record<keyof AdminTabParamList, string> = {
  Dashboard: 'analytics',
  Users: 'people-circle',
  Moderation: 'shield-checkmark',
  Reports: 'flag',
  MLAnalytics: 'sparkles',
  AdminProfile: 'person-circle',
};

export default function AdminTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: Colors.bgDark },
        headerTintColor: Colors.textPrimary,
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: Colors.bgCard,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          paddingBottom: 6,
          paddingTop: 6,
          height: 60,
        },
        tabBarActiveTintColor: Colors.roleAdmin,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: { fontSize: FontSize.xs, fontWeight: '600' },
        tabBarIcon: ({ color, size }) => {
          const iconName = TAB_ICONS[route.name] || 'apps';
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={AdminDashboardScreen} options={{ title: '📊 Dashboard', headerShown: false }} />
      <Tab.Screen name="Users" component={UserManagementScreen} options={{ title: '👥 Users' }} />
      <Tab.Screen name="Moderation" component={AdminScreen} options={{ title: '🛡️ Feed' }} />
      <Tab.Screen name="Reports" component={AdminReportsScreen} options={{ title: '⚠️ Reports', headerShown: false }} />
      <Tab.Screen name="MLAnalytics" component={MLAnalyticsScreen} options={{ title: '🤖 ML', headerShown: false }} />
      <Tab.Screen name="AdminProfile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}
