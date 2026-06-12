import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { Colors } from '../constants/theme';
import { useAuthStore } from '../store/authStore';
import { Role } from '../types';
import type { RootStackParamList, AuthStackParamList } from '../types/navigation.types';

// ── Auth Screens ──────────────────────────────────────────────────────────────
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';

// ── Tab Navigators ────────────────────────────────────────────────────────────
import MainTabNavigator from './MainTabNavigator';
import AlumniTabNavigator from './AlumniTabNavigator';
import AdminTabNavigator from './AdminTabNavigator';

// ── Shared Stack Screens ──────────────────────────────────────────────────────
import ChatScreen from '../screens/chat/ChatScreen';
import VideoCallScreen from '../screens/video/VideoCallScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import MyPostsScreen from '../screens/profile/MyPostsScreen';

// ── Phase 1: Core Features ────────────────────────────────────────────────────
import EventsScreen from '../screens/events/EventsScreen';
import JobBoardScreen from '../screens/jobs/JobBoardScreen';
import AlumniSearchScreen from '../screens/search/AlumniSearchScreen';

// ── Phase 2: Community ────────────────────────────────────────────────────────
import GroupsScreen from '../screens/community/GroupsScreen';
import PollsScreen from '../screens/community/PollsScreen';
import QAScreen from '../screens/community/QAScreen';

// ── Phase 3: Career Development ───────────────────────────────────────────────
import GoalsScreen from '../screens/career/GoalsScreen';
import CareerExplorerScreen from '../screens/career/CareerExplorerScreen';
import ResumeBuilderScreen from '../screens/career/ResumeBuilderScreen';
import EndorsementsScreen from '../screens/career/EndorsementsScreen';

// ── Phase 4: Booking ──────────────────────────────────────────────────────────
import BookingScreen from '../screens/booking/BookingScreen';

// ── Phase 5: Resources & Notifications ────────────────────────────────────────
import ResourcesScreen from '../screens/resources/ResourcesScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';

// ── Alumni-Exclusive ──────────────────────────────────────────────────────────
import ReferralsScreen from '../screens/alumni/ReferralsScreen';
import SuccessStoriesScreen from '../screens/alumni/SuccessStoriesScreen';
import CompanyDirectoryScreen from '../screens/alumni/CompanyDirectoryScreen';

// ── Admin-Exclusive ───────────────────────────────────────────────────────────
import AdminAnnouncementsScreen from '../screens/admin/AdminAnnouncementsScreen';
import AdminAuditLogScreen from '../screens/admin/AdminAuditLogScreen';
import AdminContentModerationScreen from '../screens/admin/AdminContentModerationScreen';
import AdminMasterListScreen from '../screens/admin/AdminMasterListScreen';

// ── ML / AI ───────────────────────────────────────────────────────────────────
import SmartInsightsScreen from '../screens/ml/SmartInsightsScreen';
import MLAnalyticsScreen from '../screens/ml/MLAnalyticsScreen';
import UserProfileScreen from '../screens/profile/UserProfileScreen';
import FollowListScreen from '../screens/profile/FollowListScreen';

// ─── Navigators ───────────────────────────────────────────────────────────────

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

const SCREEN_OPTIONS = {
  headerStyle: {
    backgroundColor: '#FFFFFF',
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#DCE6F1',
  },
  headerTintColor: '#191919',
  headerTitleStyle: { fontWeight: '700' as const, color: '#191919' },
  headerShadowVisible: false,
};

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ ...SCREEN_OPTIONS, headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
    </AuthStack.Navigator>
  );
}

function SharedScreens() {
  return (
    <>
      <RootStack.Screen name="Chat" component={ChatScreen}
        options={({ route }) => ({ title: route.params?.otherUserName?.substring(0, 16) || 'Chat' })} />
      <RootStack.Screen name="VideoCall" component={VideoCallScreen} options={{ title: 'Video Call' }} />
      <RootStack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profile' }} />
      <RootStack.Screen name="MyPosts" component={MyPostsScreen} options={{ title: 'My Posts' }} />
      {/* Phase 1 */}
      <RootStack.Screen name="Events" component={EventsScreen} options={{ headerShown: false }} />
      <RootStack.Screen name="JobBoard" component={JobBoardScreen} options={{ headerShown: false }} />
      <RootStack.Screen name="AlumniSearch" component={AlumniSearchScreen} options={{ headerShown: false }} />
      {/* Phase 2 */}
      <RootStack.Screen name="Groups" component={GroupsScreen} options={{ headerShown: false }} />
      <RootStack.Screen name="Polls" component={PollsScreen} options={{ headerShown: false }} />
      <RootStack.Screen name="QA" component={QAScreen} options={{ headerShown: false }} />
      {/* Phase 3 */}
      <RootStack.Screen name="Goals" component={GoalsScreen} options={{ headerShown: false }} />
      <RootStack.Screen name="CareerExplorer" component={CareerExplorerScreen} options={{ headerShown: false }} />
      <RootStack.Screen name="ResumeBuilder" component={ResumeBuilderScreen} options={{ headerShown: false }} />
      <RootStack.Screen name="Endorsements" component={EndorsementsScreen} options={{ title: 'Endorsements' }} />
      {/* Phase 4 */}
      <RootStack.Screen name="Booking" component={BookingScreen} options={{ headerShown: false }} />
      {/* Phase 5 */}
      <RootStack.Screen name="Resources" component={ResourcesScreen} options={{ headerShown: false }} />
      <RootStack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: false }} />
      {/* Alumni-exclusive */}
      <RootStack.Screen name="Referrals" component={ReferralsScreen} options={{ headerShown: false }} />
      <RootStack.Screen name="Stories" component={SuccessStoriesScreen} options={{ headerShown: false }} />
      <RootStack.Screen name="CompanyDirectory" component={CompanyDirectoryScreen} options={{ headerShown: false }} />
      {/* Admin-exclusive */}
      <RootStack.Screen name="AdminAnnouncements" component={AdminAnnouncementsScreen} options={{ headerShown: false }} />
      <RootStack.Screen name="AdminAuditLog" component={AdminAuditLogScreen} options={{ headerShown: false }} />
      <RootStack.Screen name="AdminContentModeration" component={AdminContentModerationScreen} options={{ headerShown: false }} />
      <RootStack.Screen name="AdminMasterList" component={AdminMasterListScreen} options={{ headerShown: false }} />
      {/* ML / AI */}
      <RootStack.Screen name="SmartInsights" component={SmartInsightsScreen} options={{ headerShown: false }} />
      <RootStack.Screen name="MLAnalytics" component={MLAnalyticsScreen} options={{ headerShown: false }} />
      {/* Profile */}
      <RootStack.Screen name="UserProfile" component={UserProfileScreen} options={{ title: 'Profile' }} />
      <RootStack.Screen name="FollowList" component={FollowListScreen} />
    </>
  );
}

export default function RootNavigator() {
  const { isAuthenticated, user } = useAuthStore();
  const isAdmin = user?.role === Role.ADMIN;
  const isAlumni = user?.role === Role.ALUMNI;

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={SCREEN_OPTIONS}>
        {!isAuthenticated ? (
          <RootStack.Screen name="AuthStack" component={AuthNavigator} options={{ headerShown: false }} />
        ) : isAdmin ? (
          <>
            <RootStack.Screen name="AdminTabs" component={AdminTabNavigator} options={{ headerShown: false }} />
            {SharedScreens()}
          </>
        ) : isAlumni ? (
          <>
            <RootStack.Screen name="AlumniTabs" component={AlumniTabNavigator} options={{ headerShown: false }} />
            {SharedScreens()}
          </>
        ) : (
          <>
            <RootStack.Screen name="MainTabs" component={MainTabNavigator} options={{ headerShown: false }} />
            {SharedScreens()}
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
