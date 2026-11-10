import {
  BadgeCheck,
  Bell,
  Building2,
  CalendarCheck,
  ClipboardList,
  FileWarning,
  Gavel,
  GraduationCap,
  Handshake,
  Heart,
  LayoutDashboard,
  LogOut,
  MapPin,
  Search,
  ShieldAlert,
  Star,
  UserCircle,
  UserMinus,
  Wrench,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { UserRole } from '@/types';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Original React Native screen this route replaces (kept for traceability). */
  rnScreen: string;
}

/**
 * Every RN stack screen is represented here. Route names changed from
 * `WorkerDashboardScreen` to real URLs, but the flow, guards and destinations
 * are identical - see ROUTE_MAP.md in the project root for the 1:1 table.
 */
export const NAV: Record<UserRole, NavItem[]> = {
  Client: [
    { label: 'Find Services', href: '/client/find-service', icon: Search, rnScreen: 'FindServiceScreen' },
    { label: 'My Dashboard', href: '/client/dashboard', icon: LayoutDashboard, rnScreen: 'UserDashboardScreen' },
    { label: 'Interview Requests', href: '/client/requests', icon: ClipboardList, rnScreen: 'ActiveRequestScreen' },
    { label: 'Worker Decisions', href: '/client/decisions', icon: Handshake, rnScreen: 'WorkerDecisionScreen' },
    { label: 'Resignations', href: '/client/resignations', icon: UserMinus, rnScreen: 'ResignationsScreen' },
    { label: 'My Location', href: '/map', icon: MapPin, rnScreen: 'MapScreen' },
    { label: 'My Profile', href: '/client/profile', icon: UserCircle, rnScreen: 'ClientProfileScreen' },
  ],
  Worker: [
    { label: 'Dashboard', href: '/worker/dashboard', icon: LayoutDashboard, rnScreen: 'WorkerDashboardScreen' },
    { label: 'Notifications', href: '/worker/notifications', icon: Bell, rnScreen: 'WorkerNotificationsScreen' },
    { label: 'Interview Requests', href: '/worker/requests', icon: ClipboardList, rnScreen: 'ActiveRequestsScreen' },
    { label: 'Accepted Requests', href: '/worker/accepted', icon: CalendarCheck, rnScreen: 'AcceptedRequestScreen' },
    { label: 'Job Offers', href: '/worker/job-confirmations', icon: Handshake, rnScreen: 'JobConfirmationScreen' },
    { label: 'My Skills', href: '/worker/skills', icon: Wrench, rnScreen: 'AddSkills' },
    { label: 'My Habits', href: '/worker/habits', icon: Heart, rnScreen: 'MyHabitsScreen' },
    { label: 'My Reviews', href: '/worker/reviews', icon: Star, rnScreen: 'WorkerRatingAndReviewsScreen' },
    { label: 'Resign from Job', href: '/worker/leave-job', icon: UserMinus, rnScreen: 'LeaveJobScreen' },
    { label: 'Termination Notice', href: '/worker/termination', icon: FileWarning, rnScreen: 'WorkerTerminationScreen' },
    { label: 'Contract Ended', href: '/worker/terminated', icon: ShieldAlert, rnScreen: 'WorkerTerminatedScreen' },
    { label: 'Service Location', href: '/map', icon: MapPin, rnScreen: 'MapScreen' },
  ],
  Company: [
    // RN has no sidebar at all: the company lands on `CompanyCourseDashboardScreen`
    // and the worker directory is reached from that screen's header icon
    // (`CompanyCourseDashboardScreen.js:131`), never from a menu entry. The route
    // still exists at /company/directory for that header button and the back
    // links from /company/workers/[id].
    { label: 'Course Management', href: '/company/courses', icon: GraduationCap, rnScreen: 'CompanyCourseDashboardScreen' },
    { label: 'Company Profile', href: '/company/profile', icon: UserCircle, rnScreen: 'CompanyProfileScreen' },
  ],
  Police: [
    { label: 'Verification Portal', href: '/police/portal', icon: BadgeCheck, rnScreen: 'PoliceVerificationPortal' },
  ],
};

export const ROLE_HOME: Record<UserRole, string> = {
  Client: '/client/find-service',
  Worker: '/worker/dashboard',
  Company: '/company/courses',
  Police: '/police/portal',
};

export const ROLE_META: Record<UserRole, { label: string; icon: LucideIcon }> = {
  Client: { label: 'Client', icon: UserCircle },
  Worker: { label: 'Worker', icon: Wrench },
  Company: { label: 'Agency', icon: Building2 },
  Police: { label: 'Law Enforcement', icon: Gavel },
};

export const LOGOUT_ICON = LogOut;
