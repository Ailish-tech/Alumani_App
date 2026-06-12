import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Screens
import FeedScreen from '../screens/feed/FeedScreen';
import AlumniDashboardScreen from '../screens/alumni/AlumniDashboardScreen';
import AlumniExploreScreen from '../screens/explore/AlumniExploreScreen';
import ChatListScreen from '../screens/chat/ChatListScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

// Custom floating tab bar (same as student)
import FloatingTabBar from './FloatingTabBar';

export type AlumniTabParamList = {
  Home: undefined;
  Dashboard: undefined;
  AlumniExplore: undefined;
  Messages: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<AlumniTabParamList>();

export default function AlumniTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        // Hide default headers — each screen renders PremiumHeader
        headerShown: false,
        tabBarStyle: { display: 'none' as any },
      }}
    >
      <Tab.Screen name="Home" component={FeedScreen} />
      <Tab.Screen name="Dashboard" component={AlumniDashboardScreen} />
      <Tab.Screen name="AlumniExplore" component={AlumniExploreScreen} />
      <Tab.Screen name="Messages" component={ChatListScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
