// ─── React Navigation Param Lists ──────────────────────────────────────────────

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Explore: undefined;
  Mentorship: undefined;
  Messages: undefined;
  Profile: undefined;
};

export type AdminTabParamList = {
  Dashboard: undefined;
  Users: undefined;
  Moderation: undefined;
  Reports: undefined;
  MLAnalytics: undefined;
  AdminProfile: undefined;
};

export type RootStackParamList = {
  // Auth flow
  AuthStack: undefined;
  // Tab navigators
  MainTabs: undefined;
  AlumniTabs: undefined;
  AdminTabs: undefined;
  // Shared stack screens
  Chat: { roomId: string; otherUserName?: string };
  VideoCall: { mentorshipId: string };
  EditProfile: undefined;
  MyPosts: undefined;
  // Phase 1: Core features
  Events: undefined;
  EventDetail: { eventId: string };
  JobBoard: undefined;
  JobDetail: { jobId: string };
  AlumniSearch: undefined;
  // Phase 2: Community
  Groups: undefined;
  GroupDetail: { groupId: string };
  Polls: undefined;
  CreatePoll: undefined;
  QA: undefined;
  QADetail: { questionId: string };
  // Phase 3: Career
  Endorsements: { userId: string };
  ResumeBuilder: undefined;
  CareerExplorer: undefined;
  Goals: undefined;
  // Phase 4: Engagement
  Booking: undefined;
  SlotPicker: { mentorId: string; mentorName: string };
  // Phase 5: Resources & Notifications
  Resources: undefined;
  Notifications: undefined;
  // Alumni-exclusive
  AlumniDashboard: undefined;
  Referrals: undefined;
  Stories: undefined;
  CompanyDirectory: undefined;
  // Admin-exclusive
  AdminReports: undefined;
  AdminAnnouncements: undefined;
  AdminAuditLog: undefined;
  AdminContentModeration: undefined;
  AdminMasterList: undefined;
  // ML / AI
  SmartInsights: undefined;
  MLAnalytics: undefined;
  // Profile
  UserProfile: { userId: string };
  FollowList: { userId: string; type: 'followers' | 'following' };
};

// ─── Helper types for useNavigation ────────────────────────────────────────────

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
