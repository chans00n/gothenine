# 75 Hard Challenge Web App - PRD & Development Plan

## Product Overview

A private web application for couples to track and complete the 75 Hard Challenge together. Built with Next.js, TypeScript, Tailwind CSS, and Shadcn UI components with a minimal dark mode design.

## Core Features & Requirements

### Authentication & User Management
- **User Registration/Login**: Email/password authentication
- **Multi-user Support**: Handle two users (you and your wife)
- **Session Management**: Secure session handling with automatic logout
- **Profile Management**: Basic profile settings and preferences

### Onboarding Experience
- **Welcome Flow**: Introduction to the app and 75 Hard rules
- **Challenge Selection**: Choose from predefined challenges or create custom ones
- **Notification Setup**: Configure reminder preferences (time, frequency)
- **Goal Setting**: Personal motivation and commitment statements

### Daily Tracking Interface
- **Daily Checklist**: Interactive checklist for each challenge requirement
- **Progress Validation**: Photo uploads for progress tracking
- **Workout Timer**: Built-in timer for workout sessions
- **Walk Tracker**: Timer and distance tracking for outdoor walks
- **Water Intake**: Simple counter for daily water consumption
- **Reading Progress**: Page/chapter tracking for daily reading
- **Note Taking**: Daily reflection and progress notes

### Calendar & Progress View
- **75-Day Calendar**: Visual representation of completed days
- **Progress Indicators**: Color-coded completion status
- **Streak Tracking**: Current streak and longest streak
- **Milestone Celebrations**: Visual feedback for achievements

### Wellness Components
- **Breathing Exercises**: Guided breathing sessions with timer
- **Meditation Timer**: Configurable meditation sessions
- **Mood Tracking**: Simple mood logging

### PWA Features
- **App Installation**: Add to home screen on mobile devices
- **Offline Functionality**: Core features work without internet
- **Push Notifications**: Native mobile notifications
- **Background Sync**: Sync data when connection is restored
- **App-like Experience**: Full-screen, native-like interface

### Notifications & Reminders
- **Push Notifications**: Native mobile notifications via PWA
- **Daily Reminders**: Customizable notification times
- **Challenge Alerts**: Reminders for incomplete tasks
- **Motivational Messages**: Encouragement and progress updates
- **Background Notifications**: Notifications work even when app is closed
- **Notification Scheduling**: Smart scheduling based on user patterns

### Data Management
- **Progress Photos**: Supabase Storage with organized gallery
- **Real-time Sync**: Instant sync between devices
- **Cloud Backup**: Automatic cloud backup via Supabase
- **Export Data**: Download progress data and photos
- **Offline Storage**: Local caching for offline access

## Technical Requirements

### Technology Stack
- **Frontend**: Next.js 14+ with App Router (PWA)
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS with Shadcn UI components
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage for photos
- **Notifications**: Web Push API + PWA notifications
- **PWA Features**: Service Worker, offline support, app install

### Design Requirements
- **Theme**: Minimal dark mode design
- **Responsive**: Mobile-first responsive design
- **PWA Standards**: App-like experience on mobile
- **Accessibility**: WCAG 2.1 AA compliance
- **Performance**: Fast loading and smooth interactions
- **Offline Support**: Core functionality works offline
- **Native Feel**: Smooth animations and native-like interactions

## Development Phases

### Phase 1: Foundation & Authentication
**Duration**: 2-3 days
**Goal**: Basic app structure with PWA and Supabase authentication

#### Tasks:
1. **Project Setup**
   - Initialize Next.js project with TypeScript
   - Configure Tailwind CSS and Shadcn UI
   - Set up PWA configuration (manifest, service worker)
   - Configure project structure and routing
   - Configure ESLint and Prettier

2. **Supabase Integration**
   - Set up Supabase project and database
   - Configure Supabase client and environment variables
   - Create database schema (users, challenges, progress)
   - Set up Supabase Auth with email/password
   - Configure Row Level Security (RLS) policies

3. **PWA & Basic Layout**
   - Create PWA manifest and service worker
   - Implement app installation prompt
   - Create main layout component with navigation
   - Implement dark mode toggle
   - Set up protected routes and middleware

**Deliverables**: Working PWA with Supabase authentication and app installation capability

### Phase 2: Core UI Components
**Duration**: 2-3 days
**Goal**: Essential UI components and basic navigation

#### Tasks:
1. **Core Components**
   - Build reusable UI components (buttons, forms, cards)
   - Create navigation components (sidebar, header)
   - Implement responsive layout system

2. **Dashboard Structure**
   - Create main dashboard layout
   - Build daily checklist component structure
   - Implement basic routing between pages

3. **Calendar Component**
   - Build 75-day calendar grid
   - Add basic day status indicators
   - Implement date navigation

**Deliverables**: Complete UI component library and basic navigation

### Phase 3: Daily Tracking Core
**Duration**: 3-4 days
**Goal**: Complete daily tracking functionality with cloud sync

#### Tasks:
1. **Daily Checklist**
   - Create interactive checklist component
   - Implement task completion logic with Supabase
   - Add real-time sync for progress updates
   - Handle offline data caching

2. **Progress Photo System**
   - Build photo upload component with Supabase Storage
   - Implement image optimization and resizing
   - Create photo gallery view with cloud sync
   - Add offline photo queue for later upload

3. **Timers & Trackers**
   - Build workout timer component
   - Create walk tracking with distance input
   - Implement water intake counter
   - Add background timer support via service worker

4. **Note Taking**
   - Create daily notes component
   - Add rich text editing capabilities
   - Implement note storage with Supabase
   - Add offline note caching

**Deliverables**: Fully functional daily tracking system with cloud sync and offline support

### Phase 4: Calendar & Progress Visualization
**Duration**: 2-3 days
**Goal**: Complete calendar and progress tracking

#### Tasks:
1. **Calendar Functionality**
   - Connect calendar to daily progress data
   - Implement visual progress indicators
   - Add calendar navigation and date selection

2. **Progress Analytics**
   - Create streak tracking logic
   - Build progress statistics dashboard
   - Implement milestone tracking

3. **Data Visualization**
   - Add progress charts and graphs
   - Create visual progress indicators
   - Implement completion percentage tracking

**Deliverables**: Complete calendar and progress visualization

### Phase 5: Wellness & Advanced Features
**Duration**: 2-3 days
**Goal**: Breathing exercises, meditation, and advanced tracking

#### Tasks:
1. **Breathing Components**
   - Build guided breathing exercise component
   - Implement breathing patterns and timers
   - Add breathing session tracking

2. **Meditation Timer**
   - Create configurable meditation timer
   - Add ambient sounds or silence options
   - Implement meditation session logging

3. **Advanced Tracking**
   - Add mood tracking component
   - Create habit streak visualization
   - Implement custom challenge creation

**Deliverables**: Complete wellness features and advanced tracking

### Phase 6: PWA Notifications & Onboarding
**Duration**: 3-4 days
**Goal**: Complete PWA notifications and onboarding experience

#### Tasks:
1. **PWA Notifications**
   - Set up push notification service
   - Request notification permissions
   - Implement notification scheduling
   - Create notification management system
   - Add background sync for notifications

2. **Onboarding Flow**
   - Create welcome and tutorial screens
   - Build challenge selection interface
   - Implement initial setup wizard
   - Add PWA installation guide

3. **Advanced PWA Features**
   - Implement background sync
   - Add offline data management
   - Create app update notification system
   - Add share functionality

4. **Settings & Profile**
   - Build user profile management
   - Create notification preferences
   - Add data export functionality
   - Implement account management

**Deliverables**: Complete PWA with native notifications and onboarding

### Phase 7: Polish & Optimization
**Duration**: 2-3 days
**Goal**: Final polish, testing, and optimization

#### Tasks:
1. **Performance Optimization**
   - Optimize image loading and storage
   - Implement caching strategies
   - Add loading states and error handling

2. **Testing & Bug Fixes**
   - Comprehensive testing across all features
   - Fix identified bugs and issues
   - Optimize mobile responsiveness

3. **Final Polish**
   - Refine UI/UX based on testing
   - Add micro-interactions and animations
   - Complete accessibility audit

**Deliverables**: Production-ready application

## Claude Code Prompts

### Phase 1 Prompt:
```
Create a new Next.js 14 PWA project with TypeScript for a 75 Hard Challenge tracking app. Set up:
1. Project structure with app router
2. Tailwind CSS and Shadcn UI configuration
3. PWA configuration (manifest.json, service worker)
4. Supabase project setup and client configuration
5. Supabase Auth for user registration/login
6. Database schema for users, challenges, and progress
7. Protected route middleware with Supabase Auth
8. Dark mode theme setup with PWA app shell

Focus on PWA best practices, offline-first approach, and proper TypeScript types throughout.
```

### Phase 2 Prompt:
```
Build the core UI components for the 75 Hard PWA:
1. Reusable component library with Shadcn UI
2. PWA-optimized main dashboard layout
3. Bottom navigation for mobile-first experience
4. Daily checklist component structure
5. 75-day calendar grid component
6. Responsive design optimized for mobile PWA
7. Dark mode styling with PWA theme colors
8. Loading states and skeleton components

Ensure components work well in PWA context with proper touch interactions and native-like feel.
```

### Phase 3 Prompt:
```
Implement the daily tracking functionality with Supabase integration:
1. Interactive daily checklist with real-time Supabase sync
2. Progress photo upload using Supabase Storage
3. Workout timer with background operation via service worker
4. Walk tracking with time and distance input
5. Water intake counter with cloud sync
6. Daily notes with Supabase database integration
7. Offline data caching and background sync
8. Error handling for network issues

Ensure all components work offline and sync when connection is restored.
```

### Phase 6 Prompt:
```
Implement PWA notifications and advanced features:
1. Push notification service setup
2. Notification permission handling
3. Scheduled notification system
4. Background sync for data and notifications
5. PWA installation prompt and onboarding
6. Notification preferences and management
7. Offline data synchronization
8. App update notification system

Focus on native-like notification experience and proper PWA lifecycle management.
```

### Subsequent Phase Prompts:
Continue with similar detailed prompts for each phase, focusing on specific deliverables and maintaining consistency with the overall architecture.

## Additional PWA & Supabase Considerations

### PWA Best Practices
- **App Shell Architecture**: Core UI loads instantly from cache
- **Service Worker Strategy**: Cache-first for static assets, network-first for dynamic content
- **Background Sync**: Queue actions when offline, sync when online
- **Push Notifications**: Native mobile notifications with proper permission handling
- **Installation Prompt**: Smart app installation suggestions
- **Offline Indicators**: Clear feedback when app is offline

### Supabase Schema Design
```sql
-- Users table (handled by Supabase Auth)
-- Additional user preferences
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  display_name TEXT,
  notification_preferences JSONB,
  timezone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Challenge definitions
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  rules JSONB,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily progress tracking
CREATE TABLE daily_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  challenge_id UUID REFERENCES challenges(id),
  date DATE NOT NULL,
  tasks_completed JSONB,
  notes TEXT,
  photos TEXT[],
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification logs
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL,
  title TEXT,
  body TEXT,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### PWA Notification Strategy
- **Permission Flow**: Request permissions during onboarding
- **Notification Types**: Daily reminders, task deadlines, motivational messages
- **Scheduling**: Use service worker for reliable scheduling
- **Personalization**: Customizable notification times and content
- **Badges**: App icon badges to show pending tasks

### Offline Strategy
- **Critical Path**: Authentication, daily checklist, basic tracking
- **Background Sync**: Photos, notes, progress updates
- **Cache Strategy**: App shell, static assets, and recent data
- **Sync Indicators**: Clear UI feedback for sync status

## Success Metrics

- **User Engagement**: Daily active usage by both users
- **Feature Adoption**: Regular use of all core tracking features
- **Challenge Completion**: Successful completion of the 75-day challenge
- **Data Integrity**: Accurate tracking and storage of all progress data
- **Performance**: Fast loading times and smooth interactions
- **Reliability**: Minimal bugs and consistent functionality
- **PWA Adoption**: Successfully installed as PWA on both devices
- **Notification Effectiveness**: High engagement with push notifications
- **Offline Usage**: Smooth offline experience with reliable sync

## Future Enhancements

- **Social Features**: Share progress with friends and family
- **Advanced Analytics**: Detailed progress reports and insights
- **Custom Challenges**: Create and share custom challenge variations
- **Wearable Integration**: Connect with fitness apps and devices
- **Gamification**: Achievement badges and progress rewards
- **Couple Features**: Partner challenges and shared milestones
- **Advanced Notifications**: Smart notification timing based on usage patterns