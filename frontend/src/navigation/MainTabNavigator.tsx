import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '../types/navigation.types';

// Screens
import FeedScreen from '../screens/feed/FeedScreen';
import ExploreScreen from '../screens/explore/ExploreScreen';
import MentorshipScreen from '../screens/mentorship/MentorshipScreen';
import ChatListScreen from '../screens/chat/ChatListScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

// Custom floating tab bar
import FloatingTabBar from './FloatingTabBar';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
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
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="Mentorship" component={MentorshipScreen} />
      <Tab.Screen name="Messages" component={ChatListScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
