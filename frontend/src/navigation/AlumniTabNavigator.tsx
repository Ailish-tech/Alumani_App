import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize } from '../constants/theme';

// Screens
import FeedScreen from '../screens/feed/FeedScreen';
import AlumniDashboardScreen from '../screens/alumni/AlumniDashboardScreen';
import AlumniExploreScreen from '../screens/explore/AlumniExploreScreen';
import ChatListScreen from '../screens/chat/ChatListScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

export type AlumniTabParamList = {
  Home: undefined;
  Dashboard: undefined;
  AlumniExplore: undefined;
  Messages: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<AlumniTabParamList>();

const TAB_ICONS: Record<keyof AlumniTabParamList, string> = {
  Home: 'newspaper',
  Dashboard: 'stats-chart',
  AlumniExplore: 'ribbon',
  Messages: 'chatbubbles',
  Profile: 'person-circle',
};

export default function AlumniTabNavigator() {
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
        tabBarActiveTintColor: Colors.roleAlumni,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: { fontSize: FontSize.xs, fontWeight: '600' },
        tabBarIcon: ({ color, size }) => {
          const iconName = TAB_ICONS[route.name] || 'apps';
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={FeedScreen} options={{ title: '🎓 Feed' }} />
      <Tab.Screen name="Dashboard" component={AlumniDashboardScreen} options={{ title: '📊 Impact', headerShown: false }} />
      <Tab.Screen name="AlumniExplore" component={AlumniExploreScreen} options={{ title: '🏅 Hub' }} />
      <Tab.Screen name="Messages" component={ChatListScreen} options={{ title: 'Chat' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
