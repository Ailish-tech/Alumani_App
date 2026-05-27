/**
 * Seed data for in-memory development mode.
 * 
 * Creates realistic sample data for all features so the app feels alive
 * on first launch without needing DynamoDB/Docker.
 */

import { seedItems } from './memoryStore';
import { TABLE_NAME, buildKey, generateId, isoNow } from '../utils/helpers';
import { Role, ConnectionStatus, MentorshipStatus, MentorshipChannel, NotificationType } from '../types/enums';

// ─── Fixed IDs for consistent references ────────────────────────────────────

const USER_IDS = {
  student1: 'mock-user-001',        // default dev user
  student2: 'student-sarah-002',
  alumni1: 'alumni-rahul-003',
  alumni2: 'alumni-priya-004',
  alumni3: 'alumni-amit-005',
  faculty1: 'faculty-dr-sharma-006',
  faculty2: 'faculty-prof-gupta-007',
  admin1: 'admin-system-008',
};

const POST_IDS = ['post-001', 'post-002', 'post-003', 'post-004', 'post-005', 'post-006'];
const EVENT_IDS = ['event-001', 'event-002', 'event-003', 'event-004'];
const JOB_IDS = ['job-001', 'job-002', 'job-003', 'job-004', 'job-005'];
const CHATROOM_IDS = ['chatroom-001', 'chatroom-002', 'chatroom-003'];
const GROUP_IDS = ['group-001', 'group-002', 'group-003'];
const MENTORSHIP_IDS = ['mentorship-001', 'mentorship-002'];

function pastDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

function futureDate(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString();
}

export function seedAllData(): void {
  console.log('🌱 Seeding in-memory database with sample data...');

  // ═══════════════════════════════════════════════════════════════════════════
  // USERS
  // ═══════════════════════════════════════════════════════════════════════════

  const users = [
    {
      PK: buildKey('USER', USER_IDS.student1),
      SK: 'PROFILE',
      GSI1PK: buildKey('ROLE', Role.STUDENT),
      GSI1SK: buildKey('SCORE', '0'),
      entityType: 'USER',
      id: USER_IDS.student1,
      email: 'dev@alumniconnect.local',
      role: Role.STUDENT,
      fullName: 'Dev User',
      profilePicUrl: '',
      skills: ['JavaScript', 'React Native', 'Node.js'],
      domain: 'Computer Science',
      bio: 'CS student passionate about mobile development',
      workplace: '',
      reputationScore: 0,
      studentsGuided: 0,
      isBanned: false,
      createdAt: pastDate(30),
      updatedAt: isoNow(),
    },
    {
      PK: buildKey('USER', USER_IDS.student2),
      SK: 'PROFILE',
      GSI1PK: buildKey('ROLE', Role.STUDENT),
      GSI1SK: buildKey('SCORE', '0'),
      entityType: 'USER',
      id: USER_IDS.student2,
      email: 'sarah@alumniconnect.local',
      role: Role.STUDENT,
      fullName: 'Sarah Johnson',
      profilePicUrl: '',
      skills: ['Python', 'Machine Learning', 'Data Science'],
      domain: 'Data Science',
      bio: 'Data science enthusiast, love building ML models',
      workplace: '',
      reputationScore: 0,
      studentsGuided: 0,
      isBanned: false,
      createdAt: pastDate(25),
      updatedAt: pastDate(1),
    },
    {
      PK: buildKey('USER', USER_IDS.alumni1),
      SK: 'PROFILE',
      GSI1PK: buildKey('ROLE', Role.ALUMNI),
      GSI1SK: buildKey('SCORE', '85'),
      entityType: 'USER',
      id: USER_IDS.alumni1,
      email: 'rahul@google.com',
      role: Role.ALUMNI,
      fullName: 'Rahul Verma',
      profilePicUrl: '',
      skills: ['System Design', 'Go', 'Kubernetes', 'Cloud Architecture'],
      domain: 'Computer Science',
      bio: 'Batch of 2020 | SDE-3 at Google | Open to mentoring',
      workplace: 'Google',
      reputationScore: 85,
      studentsGuided: 12,
      isBanned: false,
      createdAt: pastDate(365),
      updatedAt: pastDate(2),
    },
    {
      PK: buildKey('USER', USER_IDS.alumni2),
      SK: 'PROFILE',
      GSI1PK: buildKey('ROLE', Role.ALUMNI),
      GSI1SK: buildKey('SCORE', '72'),
      entityType: 'USER',
      id: USER_IDS.alumni2,
      email: 'priya@microsoft.com',
      role: Role.ALUMNI,
      fullName: 'Priya Sharma',
      profilePicUrl: '',
      skills: ['Product Management', 'UX Design', 'Strategy', 'React'],
      domain: 'Product Management',
      bio: 'Batch of 2019 | PM at Microsoft | Love helping juniors',
      workplace: 'Microsoft',
      reputationScore: 72,
      studentsGuided: 8,
      isBanned: false,
      createdAt: pastDate(400),
      updatedAt: pastDate(5),
    },
    {
      PK: buildKey('USER', USER_IDS.alumni3),
      SK: 'PROFILE',
      GSI1PK: buildKey('ROLE', Role.ALUMNI),
      GSI1SK: buildKey('SCORE', '60'),
      entityType: 'USER',
      id: USER_IDS.alumni3,
      email: 'amit@startup.io',
      role: Role.ALUMNI,
      fullName: 'Amit Patel',
      profilePicUrl: '',
      skills: ['Entrepreneurship', 'Full Stack', 'Fundraising', 'AWS'],
      domain: 'Business',
      bio: 'Batch of 2018 | Founded TechBridge (YC S22) | $5M raised',
      workplace: 'TechBridge (Founder)',
      reputationScore: 60,
      studentsGuided: 5,
      isBanned: false,
      createdAt: pastDate(500),
      updatedAt: pastDate(3),
    },
    {
      PK: buildKey('USER', USER_IDS.faculty1),
      SK: 'PROFILE',
      GSI1PK: buildKey('ROLE', Role.FACULTY),
      GSI1SK: buildKey('SCORE', '95'),
      entityType: 'USER',
      id: USER_IDS.faculty1,
      email: 'dr.sharma@university.edu',
      role: Role.FACULTY,
      fullName: 'Dr. Anita Sharma',
      profilePicUrl: '',
      skills: ['Artificial Intelligence', 'Deep Learning', 'Research', 'NLP'],
      domain: 'Computer Science',
      bio: 'Professor of CS | AI Research Lab Head | PhD IIT Delhi',
      workplace: 'University CS Department',
      reputationScore: 95,
      studentsGuided: 30,
      isBanned: false,
      createdAt: pastDate(700),
      updatedAt: pastDate(1),
    },
    {
      PK: buildKey('USER', USER_IDS.faculty2),
      SK: 'PROFILE',
      GSI1PK: buildKey('ROLE', Role.FACULTY),
      GSI1SK: buildKey('SCORE', '80'),
      entityType: 'USER',
      id: USER_IDS.faculty2,
      email: 'prof.gupta@university.edu',
      role: Role.FACULTY,
      fullName: 'Prof. Rajesh Gupta',
      profilePicUrl: '',
      skills: ['Data Structures', 'Algorithms', 'Competitive Programming'],
      domain: 'Computer Science',
      bio: 'Associate Professor | DSA Expert | ICPC Coach',
      workplace: 'University CS Department',
      reputationScore: 80,
      studentsGuided: 45,
      isBanned: false,
      createdAt: pastDate(600),
      updatedAt: pastDate(2),
    },
    {
      PK: buildKey('USER', USER_IDS.admin1),
      SK: 'PROFILE',
      GSI1PK: buildKey('ROLE', Role.ADMIN),
      GSI1SK: buildKey('SCORE', '0'),
      entityType: 'USER',
      id: USER_IDS.admin1,
      email: 'admin@alumniconnect.local',
      role: Role.ADMIN,
      fullName: 'System Admin',
      profilePicUrl: '',
      skills: [],
      domain: 'Administration',
      bio: 'Platform Administrator',
      workplace: 'AlumniConnect',
      reputationScore: 0,
      studentsGuided: 0,
      isBanned: false,
      createdAt: pastDate(365),
      updatedAt: isoNow(),
    },
  ];

  seedItems(TABLE_NAME, users);

  // ═══════════════════════════════════════════════════════════════════════════
  // POSTS
  // ═══════════════════════════════════════════════════════════════════════════

  const posts = [
    {
      PK: buildKey('POST', POST_IDS[0]),
      SK: 'DETAILS',
      GSI1PK: buildKey('USER', USER_IDS.alumni1),
      GSI1SK: buildKey('POST', pastDate(0)),
      GSI2PK: 'GLOBAL#FEED',
      GSI2SK: buildKey('POST', pastDate(0)),
      entityType: 'POST',
      id: POST_IDS[0],
      authorId: USER_IDS.alumni1,
      textContent: '🎉 Excited to announce that our team at Google just shipped a major feature! Big thanks to the university community that helped me get here. The skills from Prof. Gupta\'s DSA class are still paying dividends. #GoogleLife #AlumniPride',
      mediaUrl: null,
      mediaUrls: [],
      likesCount: 24,
      commentsCount: 5,
      commentsDisabled: false,
      createdAt: pastDate(0),
    },
    {
      PK: buildKey('POST', POST_IDS[1]),
      SK: 'DETAILS',
      GSI1PK: buildKey('USER', USER_IDS.alumni2),
      GSI1SK: buildKey('POST', pastDate(1)),
      GSI2PK: 'GLOBAL#FEED',
      GSI2SK: buildKey('POST', pastDate(1)),
      entityType: 'POST',
      id: POST_IDS[1],
      authorId: USER_IDS.alumni2,
      textContent: '📢 Open mentorship slots for this month! If you\'re interested in Product Management, UX, or transitioning from engineering to PM — DM me or book a slot. Happy to help juniors navigate the career path. 💪',
      mediaUrl: null,
      mediaUrls: [],
      likesCount: 18,
      commentsCount: 8,
      commentsDisabled: false,
      createdAt: pastDate(1),
    },
    {
      PK: buildKey('POST', POST_IDS[2]),
      SK: 'DETAILS',
      GSI1PK: buildKey('USER', USER_IDS.faculty1),
      GSI1SK: buildKey('POST', pastDate(2)),
      GSI2PK: 'GLOBAL#FEED',
      GSI2SK: buildKey('POST', pastDate(2)),
      entityType: 'POST',
      id: POST_IDS[2],
      authorId: USER_IDS.faculty1,
      textContent: '🧠 Our AI Research Lab just published a new paper on transformer architectures for low-resource languages. Proud of our team of 4 students who contributed! Paper link in comments. #AcademicTwitter #NLP',
      mediaUrl: null,
      mediaUrls: [],
      likesCount: 42,
      commentsCount: 12,
      commentsDisabled: false,
      createdAt: pastDate(2),
    },
    {
      PK: buildKey('POST', POST_IDS[3]),
      SK: 'DETAILS',
      GSI1PK: buildKey('USER', USER_IDS.student2),
      GSI1SK: buildKey('POST', pastDate(3)),
      GSI2PK: 'GLOBAL#FEED',
      GSI2SK: buildKey('POST', pastDate(3)),
      entityType: 'POST',
      id: POST_IDS[3],
      authorId: USER_IDS.student2,
      textContent: 'Just completed my first ML project — a sentiment analysis model with 94% accuracy! 🎯 Thanks to Dr. Sharma for the guidance and Rahul for the code review. This community is amazing! ❤️',
      mediaUrl: null,
      mediaUrls: [],
      likesCount: 31,
      commentsCount: 6,
      commentsDisabled: false,
      createdAt: pastDate(3),
    },
    {
      PK: buildKey('POST', POST_IDS[4]),
      SK: 'DETAILS',
      GSI1PK: buildKey('USER', USER_IDS.alumni3),
      GSI1SK: buildKey('POST', pastDate(5)),
      GSI2PK: 'GLOBAL#FEED',
      GSI2SK: buildKey('POST', pastDate(5)),
      entityType: 'POST',
      id: POST_IDS[4],
      authorId: USER_IDS.alumni3,
      textContent: '🚀 TechBridge is hiring! We\'re looking for frontend (React/RN) and backend (Node.js) engineers. Referral bonus for alumni. Check the job board or DM me directly. Let\'s build the future together!',
      mediaUrl: null,
      mediaUrls: [],
      likesCount: 15,
      commentsCount: 3,
      commentsDisabled: false,
      createdAt: pastDate(5),
    },
    {
      PK: buildKey('POST', POST_IDS[5]),
      SK: 'DETAILS',
      GSI1PK: buildKey('USER', USER_IDS.student1),
      GSI1SK: buildKey('POST', pastDate(7)),
      GSI2PK: 'GLOBAL#FEED',
      GSI2SK: buildKey('POST', pastDate(7)),
      entityType: 'POST',
      id: POST_IDS[5],
      authorId: USER_IDS.student1,
      textContent: 'Started learning React Native today! Building the future one component at a time. Any tips from the alumni network? 🙏 #CodingJourney #ReactNative',
      mediaUrl: null,
      mediaUrls: [],
      likesCount: 9,
      commentsCount: 4,
      commentsDisabled: false,
      createdAt: pastDate(7),
    },
  ];

  seedItems(TABLE_NAME, posts);

  // Post comments
  const comments = [
    {
      PK: buildKey('POST', POST_IDS[0]),
      SK: buildKey('COMMENT', `${pastDate(0)}#cmt-001`),
      entityType: 'POST_COMMENT',
      id: 'cmt-001',
      postId: POST_IDS[0],
      authorId: USER_IDS.student1,
      authorName: 'Dev User',
      content: 'Congrats Rahul! This is so inspiring! 🎉',
      parentId: null,
      replyToAuthorId: null,
      createdAt: pastDate(0),
    },
    {
      PK: buildKey('POST', POST_IDS[0]),
      SK: buildKey('COMMENT', `${pastDate(0)}#cmt-002`),
      entityType: 'POST_COMMENT',
      id: 'cmt-002',
      postId: POST_IDS[0],
      authorId: USER_IDS.alumni2,
      authorName: 'Priya Sharma',
      content: 'Well deserved! Google is lucky to have you 💪',
      parentId: null,
      replyToAuthorId: null,
      createdAt: pastDate(0),
    },
    {
      PK: buildKey('POST', POST_IDS[5]),
      SK: buildKey('COMMENT', `${pastDate(6)}#cmt-003`),
      entityType: 'POST_COMMENT',
      id: 'cmt-003',
      postId: POST_IDS[5],
      authorId: USER_IDS.alumni1,
      authorName: 'Rahul Verma',
      content: 'Great start! Stick with the official docs and Expo. Happy to help if you get stuck.',
      parentId: null,
      replyToAuthorId: null,
      createdAt: pastDate(6),
    },
  ];

  seedItems(TABLE_NAME, comments);

  // Post likes (for isLikedByMe detection)
  const likes = [
    {
      PK: buildKey('POST', POST_IDS[0]),
      SK: buildKey('LIKE', USER_IDS.student1),
      entityType: 'POST_LIKE',
      postId: POST_IDS[0],
      userId: USER_IDS.student1,
      createdAt: pastDate(0),
    },
    {
      PK: buildKey('POST', POST_IDS[2]),
      SK: buildKey('LIKE', USER_IDS.student1),
      entityType: 'POST_LIKE',
      postId: POST_IDS[2],
      userId: USER_IDS.student1,
      createdAt: pastDate(2),
    },
  ];

  seedItems(TABLE_NAME, likes);

  // ═══════════════════════════════════════════════════════════════════════════
  // CHAT ROOMS & MESSAGES
  // ═══════════════════════════════════════════════════════════════════════════

  const chatRooms = [
    {
      PK: buildKey('CHATROOM', CHATROOM_IDS[0]),
      SK: 'META',
      GSI1PK: buildKey('USER', USER_IDS.student1),
      GSI1SK: buildKey('CHATROOM', USER_IDS.alumni1),
      GSI2PK: buildKey('USER', USER_IDS.alumni1),
      GSI2SK: buildKey('CHATROOM', USER_IDS.student1),
      entityType: 'CHAT_ROOM',
      id: CHATROOM_IDS[0],
      participantOneId: USER_IDS.student1,
      participantTwoId: USER_IDS.alumni1,
      lastMessagePreview: 'Thanks for the React Native tips!',
      updatedAt: pastDate(0),
      createdAt: pastDate(5),
    },
    {
      PK: buildKey('CHATROOM', CHATROOM_IDS[1]),
      SK: 'META',
      GSI1PK: buildKey('USER', USER_IDS.student1),
      GSI1SK: buildKey('CHATROOM', USER_IDS.alumni2),
      GSI2PK: buildKey('USER', USER_IDS.alumni2),
      GSI2SK: buildKey('CHATROOM', USER_IDS.student1),
      entityType: 'CHAT_ROOM',
      id: CHATROOM_IDS[1],
      participantOneId: USER_IDS.student1,
      participantTwoId: USER_IDS.alumni2,
      lastMessagePreview: 'I\'d love to learn more about PM!',
      updatedAt: pastDate(1),
      createdAt: pastDate(10),
    },
    {
      PK: buildKey('CHATROOM', CHATROOM_IDS[2]),
      SK: 'META',
      GSI1PK: buildKey('USER', USER_IDS.alumni1),
      GSI1SK: buildKey('CHATROOM', USER_IDS.alumni2),
      GSI2PK: buildKey('USER', USER_IDS.alumni2),
      GSI2SK: buildKey('CHATROOM', USER_IDS.alumni1),
      entityType: 'CHAT_ROOM',
      id: CHATROOM_IDS[2],
      participantOneId: USER_IDS.alumni1,
      participantTwoId: USER_IDS.alumni2,
      lastMessagePreview: 'See you at the alumni meetup!',
      updatedAt: pastDate(2),
      createdAt: pastDate(20),
    },
  ];

  seedItems(TABLE_NAME, chatRooms);

  const messages = [
    // Chat room 1: student1 <-> alumni1 (Rahul)
    {
      PK: buildKey('CHATROOM', CHATROOM_IDS[0]),
      SK: buildKey('MSG', `${pastDate(5)}#msg-001`),
      entityType: 'MESSAGE',
      id: 'msg-001',
      roomId: CHATROOM_IDS[0],
      senderId: USER_IDS.student1,
      content: 'Hi Rahul! I saw your post about life at Google. Could you share some tips on React Native?',
      timestamp: pastDate(5),
      isRead: true,
    },
    {
      PK: buildKey('CHATROOM', CHATROOM_IDS[0]),
      SK: buildKey('MSG', `${pastDate(4)}#msg-002`),
      entityType: 'MESSAGE',
      id: 'msg-002',
      roomId: CHATROOM_IDS[0],
      senderId: USER_IDS.alumni1,
      content: 'Hey! Sure thing. First tip — start with Expo. It makes life so much easier for beginners. What are you building?',
      timestamp: pastDate(4),
      isRead: true,
    },
    {
      PK: buildKey('CHATROOM', CHATROOM_IDS[0]),
      SK: buildKey('MSG', `${pastDate(3)}#msg-003`),
      entityType: 'MESSAGE',
      id: 'msg-003',
      roomId: CHATROOM_IDS[0],
      senderId: USER_IDS.student1,
      content: 'I\'m working on this alumni connect app actually! It\'s for our college network.',
      timestamp: pastDate(3),
      isRead: true,
    },
    {
      PK: buildKey('CHATROOM', CHATROOM_IDS[0]),
      SK: buildKey('MSG', `${pastDate(2)}#msg-004`),
      entityType: 'MESSAGE',
      id: 'msg-004',
      roomId: CHATROOM_IDS[0],
      senderId: USER_IDS.alumni1,
      content: 'That\'s awesome! Great idea. Make sure to use Zustand for state management — it\'s much simpler than Redux. Also, look into socket.io for real-time chat.',
      timestamp: pastDate(2),
      isRead: true,
    },
    {
      PK: buildKey('CHATROOM', CHATROOM_IDS[0]),
      SK: buildKey('MSG', `${pastDate(0)}#msg-005`),
      entityType: 'MESSAGE',
      id: 'msg-005',
      roomId: CHATROOM_IDS[0],
      senderId: USER_IDS.student1,
      content: 'Thanks for the React Native tips!',
      timestamp: pastDate(0),
      isRead: false,
    },

    // Chat room 2: student1 <-> alumni2 (Priya)
    {
      PK: buildKey('CHATROOM', CHATROOM_IDS[1]),
      SK: buildKey('MSG', `${pastDate(3)}#msg-006`),
      entityType: 'MESSAGE',
      id: 'msg-006',
      roomId: CHATROOM_IDS[1],
      senderId: USER_IDS.student1,
      content: 'Hi Priya! I\'m interested in transitioning to PM. Could you mentor me?',
      timestamp: pastDate(3),
      isRead: true,
    },
    {
      PK: buildKey('CHATROOM', CHATROOM_IDS[1]),
      SK: buildKey('MSG', `${pastDate(2)}#msg-007`),
      entityType: 'MESSAGE',
      id: 'msg-007',
      roomId: CHATROOM_IDS[1],
      senderId: USER_IDS.alumni2,
      content: 'Hi! Of course. Book a slot through the app and we can discuss your goals. I usually do 30-min calls.',
      timestamp: pastDate(2),
      isRead: true,
    },
    {
      PK: buildKey('CHATROOM', CHATROOM_IDS[1]),
      SK: buildKey('MSG', `${pastDate(1)}#msg-008`),
      entityType: 'MESSAGE',
      id: 'msg-008',
      roomId: CHATROOM_IDS[1],
      senderId: USER_IDS.student1,
      content: 'I\'d love to learn more about PM!',
      timestamp: pastDate(1),
      isRead: false,
    },
  ];

  seedItems(TABLE_NAME, messages);

  // ═══════════════════════════════════════════════════════════════════════════
  // EVENTS
  // ═══════════════════════════════════════════════════════════════════════════

  const events = [
    {
      PK: buildKey('EVENT', EVENT_IDS[0]),
      SK: 'META',
      GSI1PK: 'COLLECTION#EVENTS',
      GSI1SK: futureDate(3),
      entityType: 'EVENT',
      id: EVENT_IDS[0],
      title: '🎤 Annual Alumni Meetup 2026',
      description: 'Join us for the annual alumni meetup! Networking, talks from industry leaders, and a panel discussion on AI in 2026.',
      date: futureDate(3),
      location: 'University Main Auditorium',
      organizerId: USER_IDS.admin1,
      attendeeCount: 45,
      createdAt: pastDate(14),
    },
    {
      PK: buildKey('EVENT', EVENT_IDS[1]),
      SK: 'META',
      GSI1PK: 'COLLECTION#EVENTS',
      GSI1SK: futureDate(7),
      entityType: 'EVENT',
      id: EVENT_IDS[1],
      title: '💻 Web3 Workshop with Amit Patel',
      description: 'Hands-on workshop on blockchain development. Bring your laptop! Limited seats available.',
      date: futureDate(7),
      location: 'CS Lab 301 / Online (Zoom)',
      organizerId: USER_IDS.alumni3,
      attendeeCount: 28,
      createdAt: pastDate(7),
    },
    {
      PK: buildKey('EVENT', EVENT_IDS[2]),
      SK: 'META',
      GSI1PK: 'COLLECTION#EVENTS',
      GSI1SK: futureDate(14),
      entityType: 'EVENT',
      id: EVENT_IDS[2],
      title: '🧠 AI Research Symposium',
      description: 'Presenting latest research from our AI Lab. Student paper presentations and guest keynote by Dr. Sharma.',
      date: futureDate(14),
      location: 'Seminar Hall B',
      organizerId: USER_IDS.faculty1,
      attendeeCount: 62,
      createdAt: pastDate(21),
    },
    {
      PK: buildKey('EVENT', EVENT_IDS[3]),
      SK: 'META',
      GSI1PK: 'COLLECTION#EVENTS',
      GSI1SK: futureDate(21),
      entityType: 'EVENT',
      id: EVENT_IDS[3],
      title: '🏃 Alumni Sports Day',
      description: 'Cricket, basketball, and badminton tournament between current students and alumni. Team registrations open!',
      date: futureDate(21),
      location: 'University Sports Complex',
      organizerId: USER_IDS.admin1,
      attendeeCount: 80,
      createdAt: pastDate(10),
    },
  ];

  seedItems(TABLE_NAME, events);

  // ═══════════════════════════════════════════════════════════════════════════
  // JOBS
  // ═══════════════════════════════════════════════════════════════════════════

  const jobs = [
    {
      PK: buildKey('JOB', JOB_IDS[0]),
      SK: 'META',
      GSI1PK: 'COLLECTION#JOBS',
      GSI1SK: pastDate(1),
      entityType: 'JOB',
      id: JOB_IDS[0],
      title: 'Frontend Engineer (React Native)',
      company: 'TechBridge',
      location: 'Bangalore / Remote',
      type: 'Full-time',
      description: 'Build mobile apps with React Native. 0-2 years experience. Competitive salary + ESOP.',
      postedBy: USER_IDS.alumni3,
      salary: '₹8-15 LPA',
      applicantsCount: 12,
      createdAt: pastDate(1),
    },
    {
      PK: buildKey('JOB', JOB_IDS[1]),
      SK: 'META',
      GSI1PK: 'COLLECTION#JOBS',
      GSI1SK: pastDate(3),
      entityType: 'JOB',
      id: JOB_IDS[1],
      title: 'SDE Intern - Cloud Team',
      company: 'Google',
      location: 'Hyderabad',
      type: 'Internship',
      description: '6-month internship in the Cloud Infra team. Strong DSA skills required. Referral provided by Rahul Verma.',
      postedBy: USER_IDS.alumni1,
      salary: '₹1L/month stipend',
      applicantsCount: 38,
      createdAt: pastDate(3),
    },
    {
      PK: buildKey('JOB', JOB_IDS[2]),
      SK: 'META',
      GSI1PK: 'COLLECTION#JOBS',
      GSI1SK: pastDate(5),
      entityType: 'JOB',
      id: JOB_IDS[2],
      title: 'Product Manager - Azure AI',
      company: 'Microsoft',
      location: 'Noida',
      type: 'Full-time',
      description: 'Looking for PM with technical background. 2-4 years experience. Strong analytical and communication skills.',
      postedBy: USER_IDS.alumni2,
      salary: '₹25-35 LPA',
      applicantsCount: 22,
      createdAt: pastDate(5),
    },
    {
      PK: buildKey('JOB', JOB_IDS[3]),
      SK: 'META',
      GSI1PK: 'COLLECTION#JOBS',
      GSI1SK: pastDate(7),
      entityType: 'JOB',
      id: JOB_IDS[3],
      title: 'Research Assistant - NLP Lab',
      company: 'University AI Lab',
      location: 'On-campus',
      type: 'Part-time',
      description: 'Join Dr. Sharma\'s NLP research team. Must be 3rd year+ with Python and ML foundations.',
      postedBy: USER_IDS.faculty1,
      salary: '₹15K/month',
      applicantsCount: 8,
      createdAt: pastDate(7),
    },
    {
      PK: buildKey('JOB', JOB_IDS[4]),
      SK: 'META',
      GSI1PK: 'COLLECTION#JOBS',
      GSI1SK: pastDate(10),
      entityType: 'JOB',
      id: JOB_IDS[4],
      title: 'Backend Developer (Node.js)',
      company: 'TechBridge',
      location: 'Remote',
      type: 'Full-time',
      description: 'Build scalable APIs with Node.js, TypeScript, and AWS. 1-3 years experience.',
      postedBy: USER_IDS.alumni3,
      salary: '₹10-18 LPA',
      applicantsCount: 15,
      createdAt: pastDate(10),
    },
  ];

  seedItems(TABLE_NAME, jobs);

  // ═══════════════════════════════════════════════════════════════════════════
  // CONNECTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  const connections = [
    {
      PK: buildKey('CONN', `${USER_IDS.alumni1}#${USER_IDS.student1}`),
      SK: 'META',
      GSI1PK: buildKey('USER', USER_IDS.student1),
      GSI1SK: buildKey('CONN', USER_IDS.alumni1),
      GSI2PK: buildKey('USER', USER_IDS.alumni1),
      GSI2SK: buildKey('CONN', USER_IDS.student1),
      entityType: 'CONNECTION',
      userA: USER_IDS.student1,
      userB: USER_IDS.alumni1,
      status: ConnectionStatus.ACCEPTED,
      requesterId: USER_IDS.student1,
      createdAt: pastDate(15),
      updatedAt: pastDate(14),
    },
    {
      PK: buildKey('CONN', `${USER_IDS.alumni2}#${USER_IDS.student1}`),
      SK: 'META',
      GSI1PK: buildKey('USER', USER_IDS.student1),
      GSI1SK: buildKey('CONN', USER_IDS.alumni2),
      GSI2PK: buildKey('USER', USER_IDS.alumni2),
      GSI2SK: buildKey('CONN', USER_IDS.student1),
      entityType: 'CONNECTION',
      userA: USER_IDS.student1,
      userB: USER_IDS.alumni2,
      status: ConnectionStatus.ACCEPTED,
      requesterId: USER_IDS.student1,
      createdAt: pastDate(12),
      updatedAt: pastDate(11),
    },
    {
      PK: buildKey('CONN', `${USER_IDS.student2}#${USER_IDS.student1}`),
      SK: 'META',
      GSI1PK: buildKey('USER', USER_IDS.student1),
      GSI1SK: buildKey('CONN', USER_IDS.student2),
      GSI2PK: buildKey('USER', USER_IDS.student2),
      GSI2SK: buildKey('CONN', USER_IDS.student1),
      entityType: 'CONNECTION',
      userA: USER_IDS.student1,
      userB: USER_IDS.student2,
      status: ConnectionStatus.PENDING,
      requesterId: USER_IDS.student2,
      createdAt: pastDate(2),
      updatedAt: pastDate(2),
    },
  ];

  seedItems(TABLE_NAME, connections);

  // ═══════════════════════════════════════════════════════════════════════════
  // MENTORSHIP
  // ═══════════════════════════════════════════════════════════════════════════

  const mentorships = [
    {
      PK: buildKey('MENTORSHIP', MENTORSHIP_IDS[0]),
      SK: 'META',
      GSI1PK: buildKey('USER', USER_IDS.student1),
      GSI1SK: buildKey('MENTORSHIP', MENTORSHIP_IDS[0]),
      GSI2PK: buildKey('USER', USER_IDS.alumni1),
      GSI2SK: buildKey('MENTORSHIP', MENTORSHIP_IDS[0]),
      entityType: 'MENTORSHIP',
      id: MENTORSHIP_IDS[0],
      studentId: USER_IDS.student1,
      mentorId: USER_IDS.alumni1,
      topic: 'React Native & Mobile Development',
      status: MentorshipStatus.ACCEPTED,
      channel: MentorshipChannel.TEXT,
      scheduledTime: null,
      createdAt: pastDate(10),
      updatedAt: pastDate(8),
    },
    {
      PK: buildKey('MENTORSHIP', MENTORSHIP_IDS[1]),
      SK: 'META',
      GSI1PK: buildKey('USER', USER_IDS.student1),
      GSI1SK: buildKey('MENTORSHIP', MENTORSHIP_IDS[1]),
      GSI2PK: buildKey('USER', USER_IDS.alumni2),
      GSI2SK: buildKey('MENTORSHIP', MENTORSHIP_IDS[1]),
      entityType: 'MENTORSHIP',
      id: MENTORSHIP_IDS[1],
      studentId: USER_IDS.student1,
      mentorId: USER_IDS.alumni2,
      topic: 'Product Management Career Path',
      status: MentorshipStatus.PENDING,
      channel: null,
      scheduledTime: null,
      createdAt: pastDate(3),
      updatedAt: pastDate(3),
    },
  ];

  seedItems(TABLE_NAME, mentorships);

  // ═══════════════════════════════════════════════════════════════════════════
  // COMMUNITY (Groups, Polls, Q&A)
  // ═══════════════════════════════════════════════════════════════════════════

  const groups = [
    {
      PK: buildKey('GROUP', GROUP_IDS[0]),
      SK: 'META',
      GSI1PK: 'COLLECTION#GROUPS',
      GSI1SK: GROUP_IDS[0],
      entityType: 'GROUP',
      id: GROUP_IDS[0],
      name: 'React & React Native Devs',
      description: 'For all things React! Share projects, ask questions, and collaborate.',
      category: 'Coding',
      createdBy: USER_IDS.alumni1,
      memberCount: 34,
      createdAt: pastDate(30),
    },
    {
      PK: buildKey('GROUP', GROUP_IDS[1]),
      SK: 'META',
      GSI1PK: 'COLLECTION#GROUPS',
      GSI1SK: GROUP_IDS[1],
      entityType: 'GROUP',
      id: GROUP_IDS[1],
      name: 'Placement Preparation',
      description: 'DSA, system design, and mock interviews for campus placements.',
      category: 'Career',
      createdBy: USER_IDS.faculty2,
      memberCount: 128,
      createdAt: pastDate(60),
    },
    {
      PK: buildKey('GROUP', GROUP_IDS[2]),
      SK: 'META',
      GSI1PK: 'COLLECTION#GROUPS',
      GSI1SK: GROUP_IDS[2],
      entityType: 'GROUP',
      id: GROUP_IDS[2],
      name: 'Startup Founders Club',
      description: 'Alumni and students interested in entrepreneurship. Share ideas, find co-founders.',
      category: 'Business',
      createdBy: USER_IDS.alumni3,
      memberCount: 22,
      createdAt: pastDate(45),
    },
  ];

  seedItems(TABLE_NAME, groups);

  // Polls
  const polls = [
    {
      PK: buildKey('POLL', 'poll-001'),
      SK: 'META',
      GSI1PK: 'COLLECTION#POLLS',
      GSI1SK: pastDate(1),
      entityType: 'POLL',
      id: 'poll-001',
      question: 'Which tech stack should our next hackathon use?',
      options: [
        { id: 'opt-1', text: 'React Native + Node.js', votes: 42 },
        { id: 'opt-2', text: 'Flutter + Firebase', votes: 31 },
        { id: 'opt-3', text: 'Next.js + Supabase', votes: 25 },
      ],
      totalVotes: 98,
      createdBy: USER_IDS.faculty2,
      createdAt: pastDate(1),
    },
    {
      PK: buildKey('POLL', 'poll-002'),
      SK: 'META',
      GSI1PK: 'COLLECTION#POLLS',
      GSI1SK: pastDate(5),
      entityType: 'POLL',
      id: 'poll-002',
      question: 'Best time for the weekly alumni AMA session?',
      options: [
        { id: 'opt-1', text: 'Saturday 10am', votes: 35 },
        { id: 'opt-2', text: 'Saturday 6pm', votes: 48 },
        { id: 'opt-3', text: 'Sunday 11am', votes: 22 },
      ],
      totalVotes: 105,
      createdBy: USER_IDS.admin1,
      createdAt: pastDate(5),
    },
  ];

  seedItems(TABLE_NAME, polls);

  // Q&A
  const questions = [
    {
      PK: buildKey('QA', 'qa-001'),
      SK: 'META',
      GSI1PK: 'COLLECTION#QA',
      GSI1SK: pastDate(2),
      entityType: 'QUESTION',
      id: 'qa-001',
      content: 'What is the best way to prepare for Google interviews? Any alumni currently at Google who can share their experience?',
      authorId: USER_IDS.student2,
      isAnonymous: false,
      answerCount: 3,
      upvotes: 15,
      createdAt: pastDate(2),
    },
    {
      PK: buildKey('QA', 'qa-002'),
      SK: 'META',
      GSI1PK: 'COLLECTION#QA',
      GSI1SK: pastDate(4),
      entityType: 'QUESTION',
      id: 'qa-002',
      content: 'Should I pursue an MBA after B.Tech or get work experience first? Confused about the timing.',
      authorId: USER_IDS.student1,
      isAnonymous: true,
      answerCount: 5,
      upvotes: 22,
      createdAt: pastDate(4),
    },
  ];

  seedItems(TABLE_NAME, questions);

  // ═══════════════════════════════════════════════════════════════════════════
  // NOTIFICATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  const notifications = [
    {
      PK: buildKey('USER', USER_IDS.student1),
      SK: buildKey('NOTIF', `${pastDate(0)}#notif-001`),
      entityType: 'NOTIFICATION',
      id: 'notif-001',
      userId: USER_IDS.student1,
      triggeringUserId: USER_IDS.alumni1,
      type: NotificationType.LIKE,
      referenceId: POST_IDS[5],
      readStatus: false,
      createdAt: pastDate(0),
    },
    {
      PK: buildKey('USER', USER_IDS.student1),
      SK: buildKey('NOTIF', `${pastDate(0)}#notif-002`),
      entityType: 'NOTIFICATION',
      id: 'notif-002',
      userId: USER_IDS.student1,
      triggeringUserId: USER_IDS.alumni1,
      type: NotificationType.COMMENT,
      referenceId: POST_IDS[5],
      readStatus: false,
      createdAt: pastDate(0),
    },
    {
      PK: buildKey('USER', USER_IDS.student1),
      SK: buildKey('NOTIF', `${pastDate(1)}#notif-003`),
      entityType: 'NOTIFICATION',
      id: 'notif-003',
      userId: USER_IDS.student1,
      triggeringUserId: USER_IDS.alumni2,
      type: NotificationType.MENTOR_ACCEPT,
      referenceId: MENTORSHIP_IDS[0],
      readStatus: true,
      createdAt: pastDate(1),
    },
    {
      PK: buildKey('USER', USER_IDS.student1),
      SK: buildKey('NOTIF', `${pastDate(2)}#notif-004`),
      entityType: 'NOTIFICATION',
      id: 'notif-004',
      userId: USER_IDS.student1,
      triggeringUserId: USER_IDS.student2,
      type: NotificationType.CONNECTION_REQUEST,
      referenceId: `${USER_IDS.student2}#${USER_IDS.student1}`,
      readStatus: false,
      createdAt: pastDate(2),
    },
    {
      PK: buildKey('USER', USER_IDS.student1),
      SK: buildKey('NOTIF', `${pastDate(3)}#notif-005`),
      entityType: 'NOTIFICATION',
      id: 'notif-005',
      userId: USER_IDS.student1,
      triggeringUserId: USER_IDS.alumni1,
      type: NotificationType.MESSAGE,
      referenceId: CHATROOM_IDS[0],
      readStatus: true,
      createdAt: pastDate(3),
    },
  ];

  seedItems(TABLE_NAME, notifications);

  // ═══════════════════════════════════════════════════════════════════════════
  // GOALS
  // ═══════════════════════════════════════════════════════════════════════════

  const goals = [
    {
      PK: buildKey('USER', USER_IDS.student1),
      SK: 'GOAL#goal-001',
      entityType: 'GOAL',
      id: 'goal-001',
      userId: USER_IDS.student1,
      title: 'Complete React Native course',
      description: 'Finish the full RN course on Udemy and build 3 practice projects',
      status: 'in_progress',
      createdAt: pastDate(14),
    },
    {
      PK: buildKey('USER', USER_IDS.student1),
      SK: 'GOAL#goal-002',
      entityType: 'GOAL',
      id: 'goal-002',
      userId: USER_IDS.student1,
      title: 'Solve 200 LeetCode problems',
      description: 'Focus on medium difficulty, arrays, trees, and DP',
      status: 'in_progress',
      createdAt: pastDate(30),
    },
    {
      PK: buildKey('USER', USER_IDS.student1),
      SK: 'GOAL#goal-003',
      entityType: 'GOAL',
      id: 'goal-003',
      userId: USER_IDS.student1,
      title: 'Get a summer internship',
      description: 'Apply to at least 20 companies by March',
      status: 'completed',
      createdAt: pastDate(60),
    },
  ];

  seedItems(TABLE_NAME, goals);

  // ═══════════════════════════════════════════════════════════════════════════
  // RESOURCES
  // ═══════════════════════════════════════════════════════════════════════════

  const resources = [
    {
      PK: buildKey('RESOURCE', 'res-001'),
      SK: 'META',
      GSI1PK: 'COLLECTION#RESOURCES',
      GSI1SK: pastDate(5),
      entityType: 'RESOURCE',
      id: 'res-001',
      title: 'DSA Cheat Sheet',
      description: 'Complete data structures & algorithms reference with time complexities',
      category: 'Study Material',
      fileUrl: '#',
      uploadedBy: USER_IDS.faculty2,
      downloads: 245,
      createdAt: pastDate(5),
    },
    {
      PK: buildKey('RESOURCE', 'res-002'),
      SK: 'META',
      GSI1PK: 'COLLECTION#RESOURCES',
      GSI1SK: pastDate(10),
      entityType: 'RESOURCE',
      id: 'res-002',
      title: 'System Design Notes',
      description: 'Comprehensive system design notes covering load balancing, caching, DB design, etc.',
      category: 'Study Material',
      fileUrl: '#',
      uploadedBy: USER_IDS.alumni1,
      downloads: 180,
      createdAt: pastDate(10),
    },
    {
      PK: buildKey('RESOURCE', 'res-003'),
      SK: 'META',
      GSI1PK: 'COLLECTION#RESOURCES',
      GSI1SK: pastDate(15),
      entityType: 'RESOURCE',
      id: 'res-003',
      title: 'Interview Prep Guide',
      description: 'Step-by-step guide for tech interviews — from resume to offer negotiation',
      category: 'Career',
      fileUrl: '#',
      uploadedBy: USER_IDS.alumni2,
      downloads: 320,
      createdAt: pastDate(15),
    },
  ];

  seedItems(TABLE_NAME, resources);

  // ═══════════════════════════════════════════════════════════════════════════
  // FOLLOW (social graph)
  // ═══════════════════════════════════════════════════════════════════════════

  const follows = [
    {
      PK: buildKey('USER', USER_IDS.student1),
      SK: buildKey('FOLLOWING', USER_IDS.alumni1),
      GSI1PK: buildKey('USER', USER_IDS.alumni1),
      GSI1SK: buildKey('FOLLOWER', USER_IDS.student1),
      entityType: 'FOLLOW',
      followerId: USER_IDS.student1,
      followingId: USER_IDS.alumni1,
      createdAt: pastDate(15),
    },
    {
      PK: buildKey('USER', USER_IDS.student1),
      SK: buildKey('FOLLOWING', USER_IDS.alumni2),
      GSI1PK: buildKey('USER', USER_IDS.alumni2),
      GSI1SK: buildKey('FOLLOWER', USER_IDS.student1),
      entityType: 'FOLLOW',
      followerId: USER_IDS.student1,
      followingId: USER_IDS.alumni2,
      createdAt: pastDate(12),
    },
    {
      PK: buildKey('USER', USER_IDS.student1),
      SK: buildKey('FOLLOWING', USER_IDS.faculty1),
      GSI1PK: buildKey('USER', USER_IDS.faculty1),
      GSI1SK: buildKey('FOLLOWER', USER_IDS.student1),
      entityType: 'FOLLOW',
      followerId: USER_IDS.student1,
      followingId: USER_IDS.faculty1,
      createdAt: pastDate(20),
    },
  ];

  seedItems(TABLE_NAME, follows);

  // Follow counts
  const followCounts = [
    {
      PK: buildKey('USER', USER_IDS.student1),
      SK: 'FOLLOW_COUNTS',
      entityType: 'FOLLOW_COUNTS',
      followersCount: 1,
      followingCount: 3,
    },
    {
      PK: buildKey('USER', USER_IDS.alumni1),
      SK: 'FOLLOW_COUNTS',
      entityType: 'FOLLOW_COUNTS',
      followersCount: 85,
      followingCount: 12,
    },
    {
      PK: buildKey('USER', USER_IDS.alumni2),
      SK: 'FOLLOW_COUNTS',
      entityType: 'FOLLOW_COUNTS',
      followersCount: 72,
      followingCount: 15,
    },
  ];

  seedItems(TABLE_NAME, followCounts);

  console.log('✅ Seed data loaded successfully!');
  console.log(`   • ${users.length} users`);
  console.log(`   • ${posts.length} posts + ${comments.length} comments`);
  console.log(`   • ${chatRooms.length} chat rooms + ${messages.length} messages`);
  console.log(`   • ${events.length} events, ${jobs.length} jobs`);
  console.log(`   • ${groups.length} groups, ${polls.length} polls, ${questions.length} Q&A`);
  console.log(`   • ${notifications.length} notifications, ${goals.length} goals`);
  console.log(`   • ${resources.length} resources, ${follows.length} follows`);
}
